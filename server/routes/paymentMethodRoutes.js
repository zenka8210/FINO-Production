const express = require('express');
const router = express.Router();
const PaymentMethodController = require('../controllers/paymentMethodController');
const authenticateToken = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const validateObjectId = require('../middlewares/validateObjectId');
const { queryParserMiddleware } = require('../middlewares/queryMiddleware');

const paymentMethodController = new PaymentMethodController();

// Public routes
// GET /api/payment-methods/active - Get all active payment methods
router.get('/active', paymentMethodController.getActivePaymentMethods);

// GET /api/payment-methods/type/:type - Get payment methods by type
router.get('/type/:type', paymentMethodController.getPaymentMethodsByType);

// Admin routes - require authentication and admin role
router.use(authenticateToken, adminMiddleware);

// GET /api/payment-methods - Get all payment methods with filters
router.get('/', paymentMethodController.getPaymentMethodsWithFilters);

// GET /api/payment-methods/stats - Get payment method statistics
router.get('/stats', paymentMethodController.getPaymentMethodStats);

// POST /api/payment-methods - Create new payment method
router.post('/', paymentMethodController.createPaymentMethod);

// GET /api/payment-methods/:id - Get payment method by ID
router.get('/:id', validateObjectId('id'), paymentMethodController.getPaymentMethodById);

// PUT /api/payment-methods/:id - Update payment method
router.put('/:id', validateObjectId('id'), paymentMethodController.updatePaymentMethod);

// DELETE /api/payment-methods/:id - Delete payment method
router.delete('/:id', validateObjectId('id'), paymentMethodController.deletePaymentMethod);

// PUT /api/payment-methods/:id/toggle-status - Toggle payment method status
router.put('/:id/toggle-status', validateObjectId('id'), paymentMethodController.togglePaymentMethodStatus);

// PUT /api/payment-methods/:id/order - Update payment method order
router.put('/:id/order', validateObjectId, paymentMethodController.updatePaymentMethodOrder);

// PUT /api/payment-methods/:id/config - Update payment method configuration
router.put('/:id/config', validateObjectId, paymentMethodController.updatePaymentMethodConfig);

// Bulk operations
// PUT /api/payment-methods/bulk/toggle-status - Bulk toggle status
router.put('/bulk/toggle-status', paymentMethodController.bulkToggleStatus);

// DELETE /api/payment-methods/bulk/delete - Bulk delete
router.delete('/bulk/delete', paymentMethodController.bulkDelete);

module.exports = router;
