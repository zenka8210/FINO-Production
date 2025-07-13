/**
 * @fileoverview Query Configuration
 * @description Centralized configuration for query middleware
 * @author DATN Project
 * @version 1.0.0
 */

/**
 * Default query configuration
 */
const DEFAULT_CONFIG = {
    pagination: {
        defaultPage: 1,
        defaultLimit: 10,
        maxLimit: 100,
        enableMetadata: true
    },
    sorting: {
        defaultSort: { createdAt: -1 },
        allowedSortFields: [], // Empty array means all fields allowed
        enableMultipleSort: true
    },
    filtering: {
        enableCaseSensitive: false,
        enableRegexSearch: true,
        enableDateFiltering: true,
        enableRangeFiltering: true,
        enableArrayFiltering: true
    },
    search: {
        defaultSearchOperator: '$or', // or '$and'
        enableFullTextSearch: false, // Requires text indexes
        searchOptions: 'i' // MongoDB regex options
    },
    performance: {
        enableQueryLogging: false,
        enablePerformanceMetrics: false,
        slowQueryThreshold: 1000, // ms
        cacheEnabled: false
    },
    security: {
        enableFieldWhitelist: false,
        allowedFields: [],
        enableSanitization: true,
        maxQueryDepth: 5
    }
};

/**
 * Model-specific configurations
 */
const MODEL_CONFIGS = {
    Product: {
        searchFields: ['name', 'description', 'brand', 'tags'],
        defaultPopulate: 'category colors sizes',
        defaultSelect: 'name price description category isActive createdAt',
        sortableFields: ['name', 'price', 'createdAt', 'updatedAt', 'rating'],
        filterableFields: {
            category: { type: 'objectId', required: false },
            brand: { type: 'regex', required: false },
            minPrice: { type: 'range', field: 'price', min: 0 },
            maxPrice: { type: 'range', field: 'price', max: 1000000 },
            colors: { type: 'array', maxItems: 10 },
            sizes: { type: 'array', maxItems: 10 },
            isActive: { type: 'boolean' },
            isFeatured: { type: 'boolean' },
            tags: { type: 'array', maxItems: 20 },
            rating: { type: 'range', field: 'averageRating', min: 1, max: 5 }
        },
        pagination: {
            defaultLimit: 12,
            maxLimit: 50
        }
    },
    
    User: {
        searchFields: ['name', 'email'],
        defaultSelect: '-password -refreshToken',
        sortableFields: ['name', 'email', 'createdAt', 'lastLogin'],
        filterableFields: {
            role: { type: 'regex', values: ['admin', 'customer'] },
            isActive: { type: 'boolean' },
            isVerified: { type: 'boolean' },
            createdFrom: { type: 'date', field: 'createdAt' },
            createdTo: { type: 'date', field: 'createdAt' },
            lastLoginFrom: { type: 'date', field: 'lastLogin' },
            lastLoginTo: { type: 'date', field: 'lastLogin' }
        },
        security: {
            enableFieldWhitelist: true,
            allowedFields: ['name', 'email', 'role', 'isActive', 'createdAt']
        }
    },
    
    Order: {
        searchFields: ['orderCode'],
        defaultPopulate: 'user paymentMethod address',
        sortableFields: ['orderCode', 'total', 'createdAt', 'status'],
        filterableFields: {
            status: { type: 'array', values: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] },
            user: { type: 'objectId' },
            paymentMethod: { type: 'objectId' },
            minTotal: { type: 'range', field: 'total', min: 0 },
            maxTotal: { type: 'range', field: 'total', max: 10000000 },
            orderDateFrom: { type: 'date', field: 'createdAt' },
            orderDateTo: { type: 'date', field: 'createdAt' }
        },
        pagination: {
            defaultLimit: 20,
            maxLimit: 100
        }
    },
    
    Category: {
        searchFields: ['name', 'description'],
        defaultPopulate: 'parent children',
        sortableFields: ['name', 'order', 'createdAt'],
        filterableFields: {
            parent: { type: 'objectId' },
            isActive: { type: 'boolean' },
            level: { type: 'range', min: 0, max: 5 }
        }
    },
    
    Review: {
        searchFields: ['comment'],
        defaultPopulate: 'user product',
        sortableFields: ['rating', 'createdAt', 'helpfulCount'],
        filterableFields: {
            product: { type: 'objectId', required: true },
            user: { type: 'objectId' },
            rating: { type: 'array', values: [1, 2, 3, 4, 5] },
            minRating: { type: 'range', field: 'rating', min: 1, max: 5 },
            maxRating: { type: 'range', field: 'rating', min: 1, max: 5 },
            verified: { type: 'boolean' }
        }
    },
    
    Post: {
        searchFields: ['title', 'content', 'excerpt'],
        defaultPopulate: 'author category',
        sortableFields: ['title', 'publishedAt', 'createdAt', 'viewCount'],
        filterableFields: {
            author: { type: 'objectId' },
            category: { type: 'objectId' },
            isPublished: { type: 'boolean' },
            isFeatured: { type: 'boolean' },
            tags: { type: 'array', maxItems: 20 },
            publishedFrom: { type: 'date', field: 'publishedAt' },
            publishedTo: { type: 'date', field: 'publishedAt' }
        }
    },
    
    Banner: {
        searchFields: ['title', 'description'],
        sortableFields: ['title', 'order', 'startDate', 'endDate'],
        filterableFields: {
            isActive: { type: 'boolean' },
            type: { type: 'regex', values: ['hero', 'sidebar', 'popup'] },
            startDateFrom: { type: 'date', field: 'startDate' },
            startDateTo: { type: 'date', field: 'startDate' },
            endDateFrom: { type: 'date', field: 'endDate' },
            endDateTo: { type: 'date', field: 'endDate' }
        }
    },
    
    ProductVariant: {
        defaultPopulate: 'product color size',
        sortableFields: ['price', 'stock', 'createdAt'],
        filterableFields: {
            product: { type: 'objectId', required: true },
            color: { type: 'objectId' },
            size: { type: 'objectId' },
            minPrice: { type: 'range', field: 'price', min: 0 },
            maxPrice: { type: 'range', field: 'price', max: 1000000 },
            minStock: { type: 'range', field: 'stock', min: 0 },
            maxStock: { type: 'range', field: 'stock', max: 10000 },
            isActive: { type: 'boolean' }
        }
    }
};

/**
 * Environment-specific configurations
 */
const ENVIRONMENT_CONFIGS = {
    development: {
        performance: {
            enableQueryLogging: true,
            enablePerformanceMetrics: true,
            slowQueryThreshold: 500
        },
        pagination: {
            maxLimit: 1000 // Higher limit for development
        }
    },
    
    production: {
        performance: {
            enableQueryLogging: false,
            enablePerformanceMetrics: true,
            slowQueryThreshold: 1000,
            cacheEnabled: true
        },
        pagination: {
            maxLimit: 100
        },
        security: {
            enableFieldWhitelist: true,
            enableSanitization: true
        }
    },
    
    test: {
        pagination: {
            defaultLimit: 5,
            maxLimit: 20
        },
        performance: {
            enableQueryLogging: false,
            enablePerformanceMetrics: false
        }
    }
};

/**
 * Custom validator functions
 */
const VALIDATORS = {
    objectId: (value) => {
        const mongoose = require('mongoose');
        return mongoose.Types.ObjectId.isValid(value);
    },
    
    email: (value) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
    },
    
    price: (value) => {
        const price = parseFloat(value);
        return !isNaN(price) && price >= 0 && price <= 1000000;
    },
    
    rating: (value) => {
        const rating = parseInt(value);
        return Number.isInteger(rating) && rating >= 1 && rating <= 5;
    },
    
    date: (value) => {
        const date = new Date(value);
        return !isNaN(date.getTime());
    }
};

/**
 * Get configuration for specific model
 */
function getModelConfig(modelName, environment = 'development') {
    const defaultConfig = DEFAULT_CONFIG;
    const modelConfig = MODEL_CONFIGS[modelName] || {};
    const envConfig = ENVIRONMENT_CONFIGS[environment] || {};
    
    // Merge configurations
    return {
        ...defaultConfig,
        ...envConfig,
        ...modelConfig,
        // Merge nested objects
        pagination: {
            ...defaultConfig.pagination,
            ...envConfig.pagination,
            ...modelConfig.pagination
        },
        sorting: {
            ...defaultConfig.sorting,
            ...envConfig.sorting,
            ...modelConfig.sorting
        },
        filtering: {
            ...defaultConfig.filtering,
            ...envConfig.filtering,
            ...modelConfig.filtering
        },
        performance: {
            ...defaultConfig.performance,
            ...envConfig.performance,
            ...modelConfig.performance
        },
        security: {
            ...defaultConfig.security,
            ...envConfig.security,
            ...modelConfig.security
        }
    };
}

/**
 * Validate filter value
 */
function validateFilterValue(field, value, config, validators = VALIDATORS) {
    const fieldConfig = config.filterableFields?.[field];
    if (!fieldConfig) return true;
    
    // Check required fields
    if (fieldConfig.required && (value === undefined || value === null || value === '')) {
        return false;
    }
    
    // Check allowed values
    if (fieldConfig.values && !fieldConfig.values.includes(value)) {
        return false;
    }
    
    // Check min/max for range filters
    if (fieldConfig.type === 'range') {
        const numValue = parseFloat(value);
        if (isNaN(numValue)) return false;
        if (fieldConfig.min !== undefined && numValue < fieldConfig.min) return false;
        if (fieldConfig.max !== undefined && numValue > fieldConfig.max) return false;
    }
    
    // Check array limits
    if (fieldConfig.type === 'array' && Array.isArray(value)) {
        if (fieldConfig.maxItems && value.length > fieldConfig.maxItems) return false;
    }
    
    // Use custom validators
    const validatorName = fieldConfig.validator || fieldConfig.type;
    if (validators[validatorName]) {
        return validators[validatorName](value);
    }
    
    return true;
}

module.exports = {
    DEFAULT_CONFIG,
    MODEL_CONFIGS,
    ENVIRONMENT_CONFIGS,
    VALIDATORS,
    getModelConfig,
    validateFilterValue
};
