const BaseController = require('./baseController');
const PaymentMethodService = require('../services/paymentMethodService');
const ResponseHandler = require('../services/responseHandler');

class PaymentMethodController extends BaseController {
    constructor() {
        super(new PaymentMethodService(), 'PaymentMethod');
    }

    // Get active payment methods
    getActivePaymentMethods = async (req, res, next) => {
        try {
            const paymentMethods = await this.service.getActivePaymentMethods();
            
            ResponseHandler.success(res, paymentMethods, 'Active payment methods retrieved successfully');
        } catch (error) {
            next(error);
        }
    };

    // Toggle payment method status
    togglePaymentMethodStatus = async (req, res, next) => {
        try {
            const { id } = req.params;
            const paymentMethod = await this.service.togglePaymentMethodStatus(id);
            
            ResponseHandler.success(res, paymentMethod, 'Payment method status toggled successfully');
        } catch (error) {
            next(error);
        }
    };

    // Update payment method order
    updatePaymentMethodOrder = async (req, res, next) => {
        try {
            const { id } = req.params;
            const { order } = req.body;
            const paymentMethod = await this.service.updatePaymentMethodOrder(id, order);
            
            ResponseHandler.success(res, paymentMethod, 'Payment method order updated successfully');
        } catch (error) {
            next(error);
        }
    };

    // Get payment methods with filters
    getPaymentMethodsWithFilters = async (req, res, next) => {
        try {
            const options = {
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 10,
                isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
                type: req.query.type,
                sortBy: req.query.sortBy || 'order',
                sortOrder: req.query.sortOrder || 'asc'
            };

            const result = await this.service.getPaymentMethodsWithFilters(options);
            
            ResponseHandler.success(res, result, 'Payment methods retrieved successfully');
        } catch (error) {
            next(error);
        }
    };

    // Get payment method statistics
    getPaymentMethodStats = async (req, res, next) => {
        try {
            const stats = await this.service.getPaymentMethodStats();
            
            ResponseHandler.success(res, stats, 'Payment method statistics retrieved successfully');
        } catch (error) {
            next(error);
        }
    };

    // Create payment method
    createPaymentMethod = async (req, res, next) => {
        try {
            const paymentMethod = await this.service.createPaymentMethod(req.body);
            
            ResponseHandler.success(res, paymentMethod, 'Payment method created successfully', 201);
        } catch (error) {
            next(error);
        }
    };

    // Update payment method
    updatePaymentMethod = async (req, res, next) => {
        try {
            const { id } = req.params;
            const paymentMethod = await this.service.updatePaymentMethod(id, req.body);
            
            ResponseHandler.success(res, paymentMethod, 'Payment method updated successfully');
        } catch (error) {
            next(error);
        }
    };

    // Delete payment method
    deletePaymentMethod = async (req, res, next) => {
        try {
            const { id } = req.params;
            await this.service.deletePaymentMethod(id);
            
            ResponseHandler.success(res, null, 'Payment method deleted successfully');
        } catch (error) {
            next(error);
        }
    };

    // Get all payment methods (admin)
    getAllPaymentMethods = async (req, res, next) => {
        try {
            const options = {
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 10,
                sortBy: req.query.sortBy || 'createdAt',
                sortOrder: req.query.sortOrder || 'desc'
            };

            const result = await this.service.getAll(options);
            
            ResponseHandler.success(res, result, 'All payment methods retrieved successfully');
        } catch (error) {
            next(error);
        }
    };

    // Get payment method by ID
    getPaymentMethodById = async (req, res, next) => {
        try {
            const { id } = req.params;
            const paymentMethod = await this.service.getById(id);
            
            ResponseHandler.success(res, paymentMethod, 'Payment method retrieved successfully');
        } catch (error) {
            next(error);
        }
    };

    // Get payment methods by type
    getPaymentMethodsByType = async (req, res, next) => {
        try {
            const { type } = req.params;
            const paymentMethods = await this.service.getPaymentMethodsByType(type);
            
            ResponseHandler.success(res, paymentMethods, `Payment methods for type ${type} retrieved successfully`);
        } catch (error) {
            next(error);
        }
    };

    // Update payment method configuration
    updatePaymentMethodConfig = async (req, res, next) => {
        try {
            const { id } = req.params;
            const { config } = req.body;
            const paymentMethod = await this.service.updatePaymentMethodConfig(id, config);
            
            ResponseHandler.success(res, paymentMethod, 'Payment method configuration updated successfully');
        } catch (error) {
            next(error);
        }
    };

    // Bulk operations
    bulkToggleStatus = async (req, res, next) => {
        try {
            const { paymentMethodIds } = req.body;
            const results = [];
            
            for (const id of paymentMethodIds) {
                const paymentMethod = await this.service.togglePaymentMethodStatus(id);
                results.push(paymentMethod);
            }
            
            ResponseHandler.success(res, results, 'Payment method statuses toggled successfully');
        } catch (error) {
            next(error);
        }
    };

    // Bulk delete
    bulkDelete = async (req, res, next) => {
        try {
            const { paymentMethodIds } = req.body;
            
            for (const id of paymentMethodIds) {
                await this.service.deletePaymentMethod(id);
            }
            
            ResponseHandler.success(res, null, 'Payment methods deleted successfully');
        } catch (error) {
            next(error);
        }
    };
}

module.exports = PaymentMethodController;
