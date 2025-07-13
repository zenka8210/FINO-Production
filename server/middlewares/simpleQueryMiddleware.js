/**
 * Simple Query Middleware
 * Creates req.queryBuilder instance for use in controllers
 */

const { QueryBuilder } = require('./queryMiddleware');

/**
 * Create middleware that provides QueryBuilder instance
 * @param {mongoose.Model} model - Mongoose model for QueryBuilder
 * @returns {Function} Express middleware
 */
const createQueryMiddleware = (model) => {
    return (req, res, next) => {
        req.queryBuilder = new QueryBuilder(model, req.query);
        next();
    };
};

/**
 * Generic query middleware factory
 * Creates QueryBuilder instance when model is available
 */
const queryMiddleware = (req, res, next) => {
    req.createQueryBuilder = (model) => new QueryBuilder(model, req.query);
    next();
};

module.exports = {
    createQueryMiddleware,
    queryMiddleware
};
