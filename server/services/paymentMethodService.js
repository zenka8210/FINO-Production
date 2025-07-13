const BaseService = require('./baseService');
const PaymentMethod = require('../models/PaymentMethodSchema');
const { AppError } = require('../middlewares/errorHandler');
const { MESSAGES, ERROR_CODES } = require('../config/constants');
const { QueryBuilder } = require('../middlewares/queryMiddleware');

class PaymentMethodService extends BaseService {
    constructor() {
        super(PaymentMethod, 'PaymentMethod');
    }

    // Get active payment methods
    async getActivePaymentMethods() {
        return await this.Model.find({ 
            isActive: true 
        }).sort({ order: 1, name: 1 });
    }

    // Get payment methods by type
    async getPaymentMethodsByType(type) {
        return await this.Model.find({ 
            type: type,
            isActive: true 
        }).sort({ order: 1, name: 1 });
    }

    // Get payment methods with filters
    async getPaymentMethodsWithFilters(options) {
        const { page = 1, limit = 10, isActive, type, sortBy = 'order', sortOrder = 'asc' } = options;
        const skip = (page - 1) * limit;
        const filter = {};

        if (isActive !== undefined) filter.isActive = isActive;
        if (type) filter.type = type;

        const paymentMethods = await this.Model.find(filter)
            .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await this.Model.countDocuments(filter);

        return {
            data: paymentMethods,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / parseInt(limit))
        };
    }

    // Get payment method statistics
    async getPaymentMethodStats() {
        const [totalMethods, activeMethods, inactiveMethods] = await Promise.all([
            this.Model.countDocuments(),
            this.Model.countDocuments({ isActive: true }),
            this.Model.countDocuments({ isActive: false })
        ]);

        return {
            total: totalMethods,
            active: activeMethods,
            inactive: inactiveMethods
        };
    }

    // Create payment method
    async createPaymentMethod(paymentMethodData) {
        return await this.create(paymentMethodData);
    }

    // Update payment method
    async updatePaymentMethod(id, updateData) {
        return await this.updateById(id, updateData);
    }

    // Delete payment method
    async deletePaymentMethod(id) {
        return await this.deleteById(id);
    }

    // Toggle payment method status
    async togglePaymentMethodStatus(id) {
        const paymentMethod = await this.getById(id);
        if (!paymentMethod) {
            throw new AppError('Payment method not found', 404);
        }
        
        paymentMethod.isActive = !paymentMethod.isActive;
        return await paymentMethod.save();
    }

    // Update payment method order
    async updatePaymentMethodOrder(id, order) {
        return await this.updateById(id, { order });
    }

    // Update payment method configuration
    async updatePaymentMethodConfig(id, config) {
        return await this.updateById(id, { config });
    }

    // New method with Query Middleware
    async getPaymentMethodsWithQuery(queryParams) {
        try {
            // Sử dụng QueryUtils với pre-configured setup cho PaymentMethod
            const result = await QueryUtils.getPaymentMethods(PaymentMethod, queryParams);
            
            return result;
        } catch (error) {
            throw new AppError(`Failed to get payment methods: ${error.message}`, ERROR_CODES.INTERNAL_ERROR);
        }
    }

    // New method for getAllPaymentMethods with Query Middleware
    async getAllPaymentMethodsWithQuery(queryParams) {
        try {
            // Sử dụng QueryUtils với pre-configured setup cho PaymentMethod
            const result = await QueryUtils.getPaymentMethods(PaymentMethod, queryParams);
            
            return result;
        } catch (error) {
            throw new AppError(`Failed to get all payment methods: ${error.message}`, ERROR_CODES.INTERNAL_ERROR);
        }
    }

    // Get all payment methods with pagination - stable version
    async getAllPaymentMethods(options = {}) {
        const { page = 1, limit = 10, isActive, type, sortBy = 'order', sortOrder = 'asc' } = options;
        const skip = (page - 1) * limit;

        // Build filter
        const filter = {};
        if (isActive !== undefined) filter.isActive = isActive;
        if (type) filter.type = type;

        // Build sort
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const [data, total] = await Promise.all([
            this.Model.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(limit),
            this.Model.countDocuments(filter)
        ]);

        return {
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNextPage: page < Math.ceil(total / limit),
                hasPrevPage: page > 1
            }
        };
    }
}

module.exports = PaymentMethodService;
