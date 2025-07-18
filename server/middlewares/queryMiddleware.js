/**
 * @fileoverview Query Middleware for Pagination, Filtering, and Sorting
 * @description Reusable middleware for handling common query operations
 * @author DATN Project
 * @version 1.0.0
 */

const { PAGINATION } = require('../config/constants');
const { getModelConfig, validateFilterValue } = require('../config/queryConfig');
const AdminSortUtils = require('../utils/adminSortUtils');

/**
 * @class QueryBuilder
 * @description Universal query builder for Mongoose models with pagination, filtering, sorting, and searching
 */
class QueryBuilder {
    constructor(model, queryParams, options = {}) {
        this.model = model;
        this.queryParams = queryParams;
        this.mongooseQuery = null;
        this.filter = {};
        this.sort = {};
        this.select = '';
        this.populate = '';
        
        // Get model configuration
        this.config = getModelConfig(model.modelName, process.env.NODE_ENV || 'development');
        
        // Merge with provided options
        this.options = { ...this.config, ...options };
        
        // Initialize with config defaults
        this.page = parseInt(this.queryParams.page) || this.options.pagination.defaultPage;
        this.limit = Math.min(
            parseInt(this.queryParams.limit) || this.options.pagination.defaultLimit,
            this.options.pagination.maxLimit
        );
        this.searchFields = this.options.searchFields || [];
    }

    /**
     * Set base filter conditions
     * @param {Object} baseFilter - Base filter object
     * @returns {QueryBuilder}
     */
    setBaseFilter(baseFilter = {}) {
        this.filter = { ...this.filter, ...baseFilter };
        return this;
    }

    /**
     * Parse pagination parameters
     * @returns {QueryBuilder}
     */
    paginate() {
        // Already initialized in constructor with config values
        return this;
    }

    /**
     * Parse sort parameters
     * @returns {QueryBuilder}
     */
    sortBy() {
        if (this.queryParams.sort) {
            // Handle different sort formats
            const sortString = this.queryParams.sort;
            
            // Support multiple formats:
            // 1. "field1:asc,field2:desc" 
            // 2. "field1,-field2"
            // 3. "field" with separate order parameter
            if (sortString.includes(',') || sortString.includes(':') || sortString.startsWith('-')) {
                const sortFields = sortString.split(',');
                
                sortFields.forEach(field => {
                    if (field.includes(':')) {
                        const [fieldName, order] = field.split(':');
                        this.sort[fieldName.trim()] = order.toLowerCase() === 'desc' ? -1 : 1;
                    } else if (field.startsWith('-')) {
                        this.sort[field.substring(1)] = -1;
                    } else {
                        this.sort[field] = 1;
                    }
                });
            } else {
                // Single field with separate order parameter (e.g., sort=name&order=asc)
                const order = this.queryParams.order || this.queryParams.sortOrder || 'asc';
                this.sort[sortString] = order.toLowerCase() === 'desc' ? -1 : 1;
            }
        } else {
            // Default sort by creation date (admin-friendly)
            const sortBy = this.queryParams.sortBy || 'createdAt';
            const sortOrder = this.queryParams.sortOrder === 'asc' ? 1 : -1;
            this.sort[sortBy] = sortOrder;
        }
        
        // Ensure admin sort is applied if this is an admin request
        if (this.queryParams.isAdmin || this.queryParams.adminSort) {
            this.sort = AdminSortUtils.parseAdminSort(this.queryParams, this.model.modelName);
        }
        
        return this;
    }

    /**
     * Parse select fields
     * @returns {QueryBuilder}
     */
    selectFields() {
        if (this.queryParams.select) {
            this.select = this.queryParams.select.split(',').join(' ');
        }
        return this;
    }

    /**
     * Parse populate fields
     * @returns {QueryBuilder}
     */
    populateFields() {
        if (this.queryParams.populate) {
            this.populate = this.queryParams.populate;
        }
        return this;
    }

    /**
     * Parse nested filter syntax like filter[isActive]=true or filter[rating][min]=4
     * Converts to flat queryParams for easier processing
     */
    parseNestedFilters() {
        const originalParams = { ...this.queryParams };
        
        Object.keys(originalParams).forEach(key => {
            // Handle filter[field]=value syntax
            if (key.startsWith('filter[') && key.endsWith(']')) {
                const fieldName = key.slice(7, -1); // Remove 'filter[' and ']'
                this.queryParams[fieldName] = originalParams[key];
                delete this.queryParams[key];
            }
            
            // Handle filter[field][operator]=value syntax (e.g., filter[rating][min]=4)
            const nestedMatch = key.match(/^filter\[([^\]]+)\]\[([^\]]+)\]$/);
            if (nestedMatch) {
                const [, fieldName, operator] = nestedMatch;
                const newKey = `${operator}${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}`; // minRating, maxPrice, etc.
                this.queryParams[newKey] = originalParams[key];
                delete this.queryParams[key];
            }
        });
    }

    /**
     * Handle text search across multiple fields
     * @param {Array<string>} fields - Fields to search in
     * @returns {QueryBuilder}
     */
    search(fields = []) {
        this.searchFields = fields;
        if (this.queryParams.search && fields.length > 0) {
            const searchRegex = { $regex: this.queryParams.search, $options: 'i' };
            this.filter.$or = fields.map(field => ({ [field]: searchRegex }));
        }
        return this;
    }

    /**
     * Handle dynamic filtering - SAFER VERSION with nested filter support
     * @param {Object} filterConfig - Configuration for field filtering
     * @returns {QueryBuilder}
     */
    applyFilters(filterConfig = {}) {
        try {
            const excludedParams = ['page', 'limit', 'sort', 'sortBy', 'sortOrder', 'order', 'select', 'populate', 'search'];
            
            // Parse nested filter syntax like filter[isActive]=true
            this.parseNestedFilters();
            
            Object.keys(this.queryParams).forEach(key => {
                if (!excludedParams.includes(key) && this.queryParams[key] !== undefined && this.queryParams[key] !== '') {
                    const value = this.queryParams[key];
                    const config = filterConfig[key] || {};

                    // Handle different filter types with safety checks
                    switch (config.type) {
                        case 'range':
                            this.handleRangeFilter(key, value, config);
                            break;
                        case 'array':
                            this.handleArrayFilter(key, value, config);
                            break;
                        case 'boolean':
                            this.handleBooleanFilter(key, value);
                            break;
                        case 'regex':
                            this.handleRegexFilter(key, value, config);
                            break;
                        case 'objectId':
                            this.handleObjectIdFilter(key, value);
                            break;
                        case 'date':
                            this.handleDateFilter(key, value, config);
                            break;
                        default:
                            // Exact match by default - with safety check
                            if (value !== null && value !== undefined) {
                                this.filter[config.field || key] = value;
                            }
                    }
                }
            });
        } catch (error) {
            console.error('❌ ApplyFilters error:', error.message);
            // Don't break the chain - just log error
        }
        return this;
    }

    /**
     * Handle range filtering (min/max values)
     */
    handleRangeFilter(key, value, config) {
        const field = config.field || key.replace(/^(min|max)/, '').toLowerCase();
        
        if (!this.filter[field]) this.filter[field] = {};
        
        if (key.startsWith('min')) {
            this.filter[field].$gte = parseFloat(value);
        } else if (key.startsWith('max')) {
            this.filter[field].$lte = parseFloat(value);
        }
    }

    /**
     * Handle array filtering (comma-separated values)
     */
    handleArrayFilter(key, value, config) {
        const field = config.field || key;
        const values = value.split(',').map(v => v.trim());
        this.filter[field] = { $in: values };
    }

    /**
     * Handle boolean filtering
     */
    handleBooleanFilter(key, value) {
        if (value === 'true' || value === 'false') {
            this.filter[key] = value === 'true';
        }
    }

    /**
     * Handle regex filtering
     */
    handleRegexFilter(key, value, config) {
        const field = config.field || key;
        this.filter[field] = { 
            $regex: value, 
            $options: config.options || 'i' 
        };
    }

    /**
     * Handle ObjectId filtering
     */
    handleObjectIdFilter(key, value) {
        const mongoose = require('mongoose');
        if (mongoose.Types.ObjectId.isValid(value)) {
            this.filter[key] = value;
        }
    }

    /**
     * Handle date filtering
     */
    handleDateFilter(key, value, config) {
        const field = config.field || key;
        const date = new Date(value);
        
        if (!isNaN(date.getTime())) {
            if (key.includes('From') || key.includes('Start')) {
                if (!this.filter[field]) this.filter[field] = {};
                this.filter[field].$gte = date;
            } else if (key.includes('To') || key.includes('End')) {
                if (!this.filter[field]) this.filter[field] = {};
                this.filter[field].$lte = date;
            } else {
                this.filter[field] = date;
            }
        }
    }

    /**
     * Build and execute the query - IMPROVED VERSION
     * @returns {Promise<Object>} Query results with pagination info
     */
    async execute() {
        try {
            // Auto-process sort and other parameters if not explicitly called
            this.sortBy();
            this.selectFields();
            this.populateFields();
            
            const skip = (this.page - 1) * this.limit;

            // Build the main query
            this.mongooseQuery = this.model.find(this.filter);

            // Apply select, populate, sort, skip, limit with safety checks
            if (this.select && typeof this.select === 'string') {
                this.mongooseQuery.select(this.select);
            }
            
            if (this.populate && typeof this.populate === 'string') {
                this.mongooseQuery.populate(this.populate);
            }
            
            this.mongooseQuery
                .sort(this.sort)
                .skip(skip)
                .limit(this.limit);

            // Execute query and count in parallel with timeout protection
            const queryPromise = this.mongooseQuery.exec();
            const countPromise = this.model.countDocuments(this.filter);

            // Add timeout protection (10 seconds)
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Query timeout after 10s')), 10000)
            );

            const [data, total] = await Promise.race([
                Promise.all([queryPromise, countPromise]),
                timeoutPromise
            ]);

            return {
                data,
                pagination: {
                    page: this.page,
                    limit: this.limit,
                    total,
                    totalPages: Math.ceil(total / this.limit),
                    hasNextPage: this.page < Math.ceil(total / this.limit),
                    hasPrevPage: this.page > 1,
                    nextPage: this.page < Math.ceil(total / this.limit) ? this.page + 1 : null,
                    prevPage: this.page > 1 ? this.page - 1 : null
                },
                filter: this.filter,
                sort: this.sort
            };
        } catch (error) {
            console.error('❌ QueryBuilder execute error:', error.message);
            throw error;
        }
    }
}

/**
 * Express middleware for parsing query parameters - SIMPLIFIED VERSION
 * @param {Object} options - Configuration options
 * @returns {Function} Express middleware function
 */
const queryParserMiddleware = (options = {}) => {
    return (req, res, next) => {
        try {
            // Simply create factory function for QueryBuilder - MUCH FASTER
            req.createQueryBuilder = (model) => new QueryBuilder(model, req.query);
            next();
        } catch (error) {
            console.error('❌ QueryParserMiddleware ERROR:', error.message);
            next(error);
        }
    };
};

/**
 * Helper function to create a QueryBuilder instance
 * @param {mongoose.Model} model - Mongoose model
 * @param {Object} queryParams - Query parameters from request
 * @returns {QueryBuilder}
 */
const createQueryBuilder = (model, queryParams) => {
    return new QueryBuilder(model, queryParams);
};

module.exports = {
    QueryBuilder,
    queryParserMiddleware,
    createQueryBuilder
};
