/**
 * @fileoverview Query Utilities and Common Filter Configurations
 * @description Pre-configured filter setups for common use cases
 * @author DATN Project
 * @version 1.0.0
 */

const { QueryBuilder } = require('../middlewares/queryMiddleware');

/**
 * Common filter configurations for different models
 */
const FILTER_CONFIGS = {
    // Product filtering
    product: {
        category: { type: 'objectId' },
        colors: { type: 'array' },
        sizes: { type: 'array' },
        minPrice: { type: 'range', field: 'price' },
        maxPrice: { type: 'range', field: 'price' },
        isActive: { type: 'boolean' },
        name: { type: 'regex' },
        brand: { type: 'regex' },
        tags: { type: 'array' }
    },

    // User filtering
    user: {
        role: { type: 'regex' },
        isActive: { type: 'boolean' },
        email: { type: 'regex' },
        phone: { type: 'regex' },
        createdFrom: { type: 'date', field: 'createdAt' },
        createdTo: { type: 'date', field: 'createdAt' }
    },

    // Order filtering
    order: {
        status: { type: 'array' },
        user: { type: 'objectId' },
        paymentMethod: { type: 'objectId' },
        minTotal: { type: 'range', field: 'total' },
        maxTotal: { type: 'range', field: 'total' },
        orderDateFrom: { type: 'date', field: 'createdAt' },
        orderDateTo: { type: 'date', field: 'createdAt' },
        orderCode: { type: 'regex' }
    },

    // Category filtering
    category: {
        parent: { type: 'objectId' },
        isActive: { type: 'boolean' },
        name: { type: 'regex' },
        level: { type: 'range' }
    },

    // Review filtering
    review: {
        product: { type: 'objectId' },
        user: { type: 'objectId' },
        rating: { type: 'array' },
        minRating: { type: 'range', field: 'rating' },
        maxRating: { type: 'range', field: 'rating' }
    },

    // Post filtering
    post: {
        author: { type: 'objectId' },
        isPublished: { type: 'boolean' },
        title: { type: 'regex' },
        content: { type: 'regex' },
        tags: { type: 'array' },
        publishedFrom: { type: 'date', field: 'publishedAt' },
        publishedTo: { type: 'date', field: 'publishedAt' }
    },

    // Banner filtering
    banner: {
        isActive: { type: 'boolean' },
        title: { type: 'regex' },
        startDateFrom: { type: 'date', field: 'startDate' },
        startDateTo: { type: 'date', field: 'startDate' },
        endDateFrom: { type: 'date', field: 'endDate' },
        endDateTo: { type: 'date', field: 'endDate' }
    },

    // ProductVariant filtering
    productVariant: {
        product: { type: 'objectId' },
        color: { type: 'objectId' },
        size: { type: 'objectId' },
        minPrice: { type: 'range', field: 'price' },
        maxPrice: { type: 'range', field: 'price' },
        minStock: { type: 'range', field: 'stock' },
        maxStock: { type: 'range', field: 'stock' },
        isActive: { type: 'boolean' }
    }
};

/**
 * Common search field configurations
 */
const SEARCH_CONFIGS = {
    product: ['name', 'description', 'brand'],
    user: ['name', 'email', 'phone'],
    category: ['name', 'description'],
    order: ['orderCode'],
    review: ['comment'],
    post: ['title', 'content', 'excerpt'],
    banner: ['title', 'description'],
    color: ['name', 'hexCode'],
    size: ['name'],
    voucher: ['code', 'name', 'description']
};

/**
 * Common populate configurations
 */
const POPULATE_CONFIGS = {
    product: 'category',
    productVariant: 'product color size',
    order: 'user items.productVariant paymentMethod address',
    review: 'user product order',
    post: { path: 'author', select: 'name email' },
    wishList: 'user items.productVariant',
    cart: 'user items.productVariant'
};

/**
 * Helper functions for specific query operations
 */
class QueryUtils {
    /**
     * Create a standard paginated query for any model
     * @param {mongoose.Model} model - Mongoose model
     * @param {Object} queryParams - Query parameters from request
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} Query results
     */
    static async paginatedQuery(model, queryParams, options = {}) {
        const {
            searchFields = [],
            filterConfig = {},
            defaultSort = { createdAt: -1 },
            defaultPopulate = ''
        } = options;

        const builder = new QueryBuilder(model, queryParams)
            .paginate()
            .sortBy()
            .selectFields()
            .populateFields()
            .search(searchFields)
            .applyFilters(filterConfig);

        // Apply default sort if no sort specified
        if (!queryParams.sort && !queryParams.sortBy && defaultSort) {
            builder.sort = defaultSort;
        }

        // Apply default populate if none specified
        if (!queryParams.populate && defaultPopulate) {
            builder.populate = defaultPopulate;
        }

        return await builder.execute();
    }

    /**
     * Get pre-configured query for products
     */
    static async getProducts(model, queryParams) {
        return await this.paginatedQuery(model, queryParams, {
            searchFields: SEARCH_CONFIGS.product,
            filterConfig: FILTER_CONFIGS.product,
            defaultPopulate: POPULATE_CONFIGS.product
        });
    }

    /**
     * Get pre-configured query for users
     */
    static async getUsers(model, queryParams) {
        return await this.paginatedQuery(model, queryParams, {
            searchFields: SEARCH_CONFIGS.user,
            filterConfig: FILTER_CONFIGS.user
        });
    }

    /**
     * Get pre-configured query for orders
     */
    static async getOrders(model, queryParams) {
        return await this.paginatedQuery(model, queryParams, {
            searchFields: SEARCH_CONFIGS.order,
            filterConfig: FILTER_CONFIGS.order,
            defaultPopulate: POPULATE_CONFIGS.order
        });
    }

    /**
     * Get pre-configured query for categories
     */
    static async getCategories(model, queryParams) {
        return await this.paginatedQuery(model, queryParams, {
            searchFields: SEARCH_CONFIGS.category,
            filterConfig: FILTER_CONFIGS.category
        });
    }

    /**
     * Get pre-configured query for reviews
     */
    static async getReviews(model, queryParams) {
        return await this.paginatedQuery(model, queryParams, {
            searchFields: SEARCH_CONFIGS.review,
            filterConfig: FILTER_CONFIGS.review,
            defaultPopulate: POPULATE_CONFIGS.review
        });
    }

    /**
     * Get pre-configured query for posts
     */
    static async getPosts(model, queryParams) {
        return await this.paginatedQuery(model, queryParams, {
            searchFields: SEARCH_CONFIGS.post,
            filterConfig: FILTER_CONFIGS.post,
            defaultPopulate: POPULATE_CONFIGS.post
        });
    }

    /**
     * Get pre-configured query for product variants
     */
    static async getProductVariants(model, queryParams) {
        return await this.paginatedQuery(model, queryParams, {
            searchFields: [],
            filterConfig: FILTER_CONFIGS.productVariant,
            defaultPopulate: POPULATE_CONFIGS.productVariant
        });
    }

    /**
     * Get pre-configured query for banners
     */
    static async getBanners(model, queryParams) {
        return await this.paginatedQuery(model, queryParams, {
            searchFields: SEARCH_CONFIGS.banner,
            filterConfig: FILTER_CONFIGS.banner
        });
    }

    /**
     * Create aggregation pipeline with common operations
     * @param {Object} options - Aggregation options
     * @returns {Array} Aggregation pipeline
     */
    static createAggregationPipeline(options = {}) {
        const {
            match = {},
            lookup = [],
            sort = { createdAt: -1 },
            page = 1,
            limit = 10
        } = options;

        const pipeline = [];

        // Match stage
        if (Object.keys(match).length > 0) {
            pipeline.push({ $match: match });
        }

        // Lookup stages
        lookup.forEach(lookupConfig => {
            pipeline.push({ $lookup: lookupConfig });
        });

        // Sort stage
        pipeline.push({ $sort: sort });

        // Pagination stages
        const skip = (page - 1) * limit;
        pipeline.push({ $skip: skip });
        pipeline.push({ $limit: limit });

        return pipeline;
    }

    /**
     * Create a search aggregation pipeline
     * @param {Object} options - Search options
     * @returns {Array} Aggregation pipeline
     */
    static createSearchPipeline(options = {}) {
        const {
            searchTerm,
            searchFields = [],
            match = {},
            sort = { score: { $meta: 'textScore' } },
            page = 1,
            limit = 10
        } = options;

        const pipeline = [];

        // Text search stage
        if (searchTerm && searchFields.length > 0) {
            const searchConditions = searchFields.map(field => ({
                [field]: { $regex: searchTerm, $options: 'i' }
            }));
            
            pipeline.push({
                $match: {
                    $and: [
                        match,
                        { $or: searchConditions }
                    ]
                }
            });
        } else if (Object.keys(match).length > 0) {
            pipeline.push({ $match: match });
        }

        // Sort stage
        pipeline.push({ $sort: sort });

        // Pagination
        const skip = (page - 1) * limit;
        pipeline.push({ $skip: skip });
        pipeline.push({ $limit: limit });

        return pipeline;
    }
}

module.exports = {
    QueryUtils,
    FILTER_CONFIGS,
    SEARCH_CONFIGS,
    POPULATE_CONFIGS
};
