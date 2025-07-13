/**
 * @fileoverview Query Middleware for Pagination, Filtering, and Sorting
 * @description Reusable middleware for handling common query operations
 * @author DATN Project
 * @version 1.0.0
 */

const { PAGINATION } = require('../config/constants');
const { getModelConfig, validateFilterValue } = require('../config/queryConfig');

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
            // Format: "field1:asc,field2:desc" or "field1,-field2"
            const sortString = this.queryParams.sort;
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
            // Default sort by creation date
            const sortBy = this.queryParams.sortBy || 'createdAt';
            const sortOrder = this.queryParams.sortOrder === 'asc' ? 1 : -1;
            this.sort[sortBy] = sortOrder;
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
     * Handle dynamic filtering
     * @param {Object} filterConfig - Configuration for field filtering
     * @returns {QueryBuilder}
     */
    applyFilters(filterConfig = {}) {
        const excludedParams = ['page', 'limit', 'sort', 'sortBy', 'sortOrder', 'select', 'populate', 'search'];
        
        Object.keys(this.queryParams).forEach(key => {
            if (!excludedParams.includes(key) && this.queryParams[key] !== undefined) {
                const value = this.queryParams[key];
                const config = filterConfig[key] || {};

                // Handle different filter types
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
                        // Exact match by default
                        this.filter[config.field || key] = value;
                }
            }
        });
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
     * Build and execute the query
     * @returns {Promise<Object>} Query results with pagination info
     */
    async execute() {
        const skip = (this.page - 1) * this.limit;

        // Build the main query
        this.mongooseQuery = this.model.find(this.filter);

        // Apply select, populate, sort, skip, limit
        if (this.select) this.mongooseQuery.select(this.select);
        if (this.populate) this.mongooseQuery.populate(this.populate);
        
        this.mongooseQuery
            .sort(this.sort)
            .skip(skip)
            .limit(this.limit);

        // Execute query and count in parallel
        const [data, total] = await Promise.all([
            this.mongooseQuery.exec(),
            this.model.countDocuments(this.filter)
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
    }
}

/**
 * Express middleware for parsing query parameters
 * @param {Object} options - Configuration options
 * @returns {Function} Express middleware function
 */
const queryParserMiddleware = (options = {}) => {
    return (req, res, next) => {
        console.log('🔍 QueryParserMiddleware START for:', req.url);
        
        try {
            // Attach parsed query options to request
            req.queryOptions = {
                page: parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE,
                limit: Math.min(
                    parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT,
                    PAGINATION.MAX_LIMIT
                ),
                sort: req.query.sort,
                sortBy: req.query.sortBy,
                sortOrder: req.query.sortOrder,
                select: req.query.select,
                populate: req.query.populate,
                search: req.query.search,
                filters: { ...req.query }
            };

            // Remove pagination/sorting params from filters
            delete req.queryOptions.filters.page;
            delete req.queryOptions.filters.limit;
            delete req.queryOptions.filters.sort;
            delete req.queryOptions.filters.sortBy;
            delete req.queryOptions.filters.sortOrder;
            delete req.queryOptions.filters.select;
            delete req.queryOptions.filters.populate;
            delete req.queryOptions.filters.search;

            // Create factory function for QueryBuilder
            req.createQueryBuilder = (model) => new QueryBuilder(model, req.query);

            console.log('✅ QueryParserMiddleware COMPLETED for:', req.url);
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
