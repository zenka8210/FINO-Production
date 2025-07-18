/**
 * @fileoverview Admin Sort Utilities
 * @description Utilities for ensuring admin endpoints sort by createdAt DESC by default
 * @author DATN Project
 * @version 1.0.0
 */

const { AppError } = require('../middlewares/errorHandler');

/**
 * Default sort configuration for admin endpoints
 */
const DEFAULT_ADMIN_SORT = {
    createdAt: -1, // DESC order by creation date
    updatedAt: -1  // Secondary sort by update date
};

/**
 * Allowed sortable fields for each model
 */
const SORTABLE_FIELDS = {
    User: ['name', 'email', 'createdAt', 'updatedAt', 'lastLogin'],
    Order: ['orderCode', 'total', 'finalTotal', 'createdAt', 'updatedAt', 'status'],
    Product: ['name', 'price', 'createdAt', 'updatedAt', 'rating'],
    Category: ['name', 'createdAt', 'updatedAt', 'order'],
    Review: ['rating', 'createdAt', 'updatedAt', 'helpfulCount'],
    Post: ['title', 'createdAt', 'updatedAt', 'publishedAt', 'viewCount'],
    Banner: ['title', 'order', 'startDate', 'endDate', 'createdAt', 'updatedAt'],
    ProductVariant: ['price', 'stock', 'createdAt', 'updatedAt'],
    Address: ['createdAt', 'updatedAt', 'isDefault'],
    Cart: ['createdAt', 'updatedAt', 'type'],
    Color: ['name', 'code', 'createdAt', 'updatedAt'],
    Size: ['name', 'code', 'createdAt', 'updatedAt'],
    Voucher: ['code', 'discountValue', 'startDate', 'endDate', 'createdAt', 'updatedAt'],
    PaymentMethod: ['name', 'createdAt', 'updatedAt'],
    WishList: ['createdAt', 'updatedAt']
};

/**
 * AdminSortUtils class for handling sorting in admin endpoints
 */
class AdminSortUtils {
    /**
     * Get default sort configuration for admin endpoints
     * @returns {Object} Default sort object
     */
    static getDefaultSort() {
        return DEFAULT_ADMIN_SORT;
    }

    /**
     * Parse and validate sort parameters for admin endpoints
     * @param {Object} queryParams - Query parameters from request
     * @param {string} modelName - Name of the model being queried
     * @returns {Object} Validated sort object
     */
    static parseAdminSort(queryParams, modelName) {
        const { sort, sortBy, sortOrder, order } = queryParams;
        
        // If no sort parameters provided, use default
        if (!sort && !sortBy) {
            return DEFAULT_ADMIN_SORT;
        }

        let sortObj = {};

        // Handle different sort formats
        if (sort) {
            // Handle JSON string format: {"createdAt": -1}
            if (typeof sort === 'string') {
                try {
                    sortObj = JSON.parse(sort);
                } catch (error) {
                    // Handle comma-separated format: "createdAt:desc,name:asc"
                    if (sort.includes(',') || sort.includes(':')) {
                        const sortFields = sort.split(',');
                        sortFields.forEach(field => {
                            if (field.includes(':')) {
                                const [fieldName, direction] = field.split(':');
                                sortObj[fieldName.trim()] = direction.toLowerCase() === 'desc' ? -1 : 1;
                            } else if (field.startsWith('-')) {
                                sortObj[field.substring(1)] = -1;
                            } else {
                                sortObj[field] = 1;
                            }
                        });
                    } else {
                        // Single field with order parameter
                        const direction = sortOrder || order || 'desc';
                        sortObj[sort] = direction.toLowerCase() === 'desc' ? -1 : 1;
                    }
                }
            } else if (typeof sort === 'object') {
                sortObj = sort;
            }
        } else if (sortBy) {
            // Handle sortBy with sortOrder parameters
            const direction = sortOrder || order || 'desc';
            sortObj[sortBy] = direction.toLowerCase() === 'desc' ? -1 : 1;
        }

        // Validate sort fields against model's sortable fields
        const allowedFields = SORTABLE_FIELDS[modelName] || [];
        const validatedSort = {};

        Object.keys(sortObj).forEach(field => {
            if (allowedFields.includes(field)) {
                validatedSort[field] = sortObj[field];
            } else {
                console.warn(`⚠️ AdminSortUtils: Field '${field}' is not sortable for model '${modelName}'`);
            }
        });

        // If no valid sort fields found, use default
        if (Object.keys(validatedSort).length === 0) {
            return DEFAULT_ADMIN_SORT;
        }

        // Always ensure createdAt is included as secondary sort if not already present
        if (!validatedSort.createdAt) {
            validatedSort.createdAt = -1;
        }

        return validatedSort;
    }

    /**
     * Apply default admin sort to query options
     * @param {Object} queryOptions - Query options object
     * @param {string} modelName - Name of the model being queried
     * @returns {Object} Updated query options with proper sort
     */
    static applyDefaultAdminSort(queryOptions, modelName) {
        if (!queryOptions.sort) {
            queryOptions.sort = DEFAULT_ADMIN_SORT;
        } else {
            // Parse and validate existing sort
            queryOptions.sort = this.parseAdminSort({ sort: queryOptions.sort }, modelName);
        }

        return queryOptions;
    }

    /**
     * Create sort configuration for QueryBuilder
     * @param {Object} queryParams - Query parameters from request
     * @param {string} modelName - Name of the model being queried
     * @returns {Object} Sort configuration for QueryBuilder
     */
    static buildQueryBuilderSort(queryParams, modelName) {
        const sort = this.parseAdminSort(queryParams, modelName);
        
        // Convert to QueryBuilder format
        const sortConfig = {};
        Object.keys(sort).forEach(field => {
            const direction = sort[field] === -1 ? 'desc' : 'asc';
            sortConfig[field] = direction;
        });

        return sortConfig;
    }

    /**
     * Get sortable fields for a specific model
     * @param {string} modelName - Name of the model
     * @returns {Array} Array of sortable field names
     */
    static getSortableFields(modelName) {
        return SORTABLE_FIELDS[modelName] || [];
    }

    /**
     * Add sortable field to a model's configuration
     * @param {string} modelName - Name of the model
     * @param {string|Array} fields - Field name(s) to add
     */
    static addSortableFields(modelName, fields) {
        if (!SORTABLE_FIELDS[modelName]) {
            SORTABLE_FIELDS[modelName] = [];
        }

        const fieldsArray = Array.isArray(fields) ? fields : [fields];
        fieldsArray.forEach(field => {
            if (!SORTABLE_FIELDS[modelName].includes(field)) {
                SORTABLE_FIELDS[modelName].push(field);
            }
        });
    }

    /**
     * Create middleware for automatic admin sorting
     * @param {string} modelName - Name of the model
     * @returns {Function} Express middleware function
     */
    static createAdminSortMiddleware(modelName) {
        return (req, res, next) => {
            // Only apply to admin routes
            if (req.path.includes('/admin/') || req.user?.role === 'admin') {
                // Apply default sort if no sort parameters provided
                if (!req.query.sort && !req.query.sortBy) {
                    req.query.sortBy = 'createdAt';
                    req.query.sortOrder = 'desc';
                }

                // Validate and parse sort parameters
                const sortConfig = AdminSortUtils.parseAdminSort(req.query, modelName);
                
                // Store parsed sort for use in controller
                req.adminSort = sortConfig;
                
                console.log(`📊 AdminSortUtils: Applied sort for ${modelName}:`, sortConfig);
            }

            next();
        };
    }

    /**
     * Ensure admin endpoints always sort by createdAt DESC by default
     * @param {Object} req - Express request object
     * @param {string} modelName - Name of the model
     * @returns {Object} Sort configuration
     */
    static ensureAdminSort(req, modelName) {
        // Check if this is an admin request
        const isAdminRequest = req.path.includes('/admin/') || req.user?.role === 'admin';
        
        if (isAdminRequest) {
            return this.parseAdminSort(req.query, modelName);
        }

        // For non-admin requests, use standard sorting
        return req.query.sort ? this.parseAdminSort(req.query, modelName) : { createdAt: -1 };
    }
}

module.exports = AdminSortUtils;
