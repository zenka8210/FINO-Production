const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/orderController');
const orderController = new OrderController();
const authenticateToken = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const validateObjectId = require('../middlewares/validateObjectId');
const { queryParserMiddleware } = require('../middlewares/queryMiddleware');
const { adminSortForModel } = require('../middlewares/adminSortMiddleware');

// Apply authentication to all routes
router.use(authenticateToken);

// ========== USER ROUTES ==========

// GET /api/orders - Get current user's orders
router.get('/', orderController.getUserOrders);

// POST /api/orders - Create new order
router.post('/', orderController.createOrder);

// POST /api/orders/calculate-total - Calculate order total
router.post('/calculate-total', orderController.calculateOrderTotal);

// GET /api/orders/shipping-fee/:addressId - Calculate shipping fee for address
router.get('/shipping-fee/:addressId', validateObjectId('addressId'), orderController.calculateShippingFee);

// GET /api/orders/:id - Get order by ID (user can only see their own orders)
router.get('/:id', validateObjectId('id'), orderController.getOrderById);

// GET /api/orders/code/:orderCode - Get order by orderCode (for VNPay callbacks)
router.get('/code/:orderCode', orderController.getOrderByCode);

// PUT /api/orders/:id/cancel - Cancel order (user can only cancel their own orders)
router.put('/:id/cancel', validateObjectId('id'), orderController.cancelOrder);

// GET /api/orders/:productId/can-review - Check if user can review product
router.get('/:productId/can-review', validateObjectId('productId'), orderController.canReviewProduct);

// ========== ADMIN ROUTES ==========
// GET /api/orders/admin/all - Get all orders with filters (admin) - Custom search logic
router.get('/admin/all', authenticateToken, adminMiddleware, orderController.getAllOrders);

// GET /api/orders/admin/stats - Get order statistics (admin)
router.get('/admin/stats', authenticateToken, adminMiddleware, orderController.getOrderStats);

/**
 * @route GET /api/orders/admin/statistics
 * @description Get comprehensive order statistics for admin dashboard
 * @access Private (Admin only)
 */
router.get('/admin/statistics', authenticateToken, adminMiddleware, orderController.getOrderStatistics);

/**
 * @route GET /api/orders/admin/trends
 * @description Get order trends by date range
 * @access Private (Admin only)
 * @query {Number} [days=30] - Number of days for trend analysis
 */
router.get('/admin/trends', authenticateToken, adminMiddleware, orderController.getOrderTrends);

/**
 * @route GET /api/orders/admin/all-with-query
 * @description Get all orders with Query Middleware (pagination, search, sort, filter)
 * @access Private (Admin only)
 */
router.get('/admin/all-with-query', authenticateToken, adminMiddleware, adminSortForModel('Order'), queryParserMiddleware(), orderController.getAllOrders);

// GET /api/orders/admin/search - Search orders (admin)
router.get('/admin/search', authenticateToken, adminMiddleware, adminSortForModel('Order'), orderController.searchOrders);

// GET /api/orders/admin/top-products - Get top selling products (admin)
router.get('/admin/top-products', authenticateToken, adminMiddleware, orderController.getTopSellingProducts);

// GET /api/orders/admin/payment-method/:paymentMethod - Get orders by payment method (admin)
router.get('/admin/payment-method/:paymentMethod', authenticateToken, adminMiddleware, adminSortForModel('Order'), validateObjectId('paymentMethod'), orderController.getOrdersByPaymentMethod);

// GET /api/orders/admin/user/:userId - Get orders by user ID (admin)
router.get('/admin/user/:userId', authenticateToken, adminMiddleware, adminSortForModel('Order'), validateObjectId('userId'), orderController.getOrdersByUserId);

// GET /api/orders/admin/:id - Get order by ID (admin) - Must be AFTER specific routes to avoid conflicts
router.get('/admin/:id', authenticateToken, adminMiddleware, validateObjectId('id'), orderController.getOrderByIdAdmin);

// PUT /api/orders/admin/:id/status - Update order status ONLY (admin restriction)
router.put('/admin/:id/status', authenticateToken, adminMiddleware, validateObjectId('id'), orderController.updateOrderStatus);

// PUT /api/orders/admin/:id/payment-status - Update payment status (admin only)
router.put('/admin/:id/payment-status', authenticateToken, adminMiddleware, validateObjectId('id'), orderController.updatePaymentStatus);

// GET /api/orders/admin/:id/validate - Validate order consistency (admin only)
router.get('/admin/:id/validate', authenticateToken, adminMiddleware, validateObjectId('id'), orderController.validateOrderConsistency);

// PUT /api/orders/admin/:id/auto-fix - Auto-fix order inconsistencies (admin only)
router.put('/admin/:id/auto-fix', authenticateToken, adminMiddleware, validateObjectId('id'), orderController.autoFixOrderInconsistencies);

// PUT /api/orders/admin/:id/cancel - Admin cancel order (restricted to pending/processing)
router.put('/admin/:id/cancel', authenticateToken, adminMiddleware, validateObjectId('id'), orderController.cancelOrder);

// DELETE /api/orders/admin/:id - Delete order (admin only, only cancelled orders)
router.delete('/admin/:id', authenticateToken, adminMiddleware, validateObjectId('id'), orderController.deleteOrder);

// PUT /api/orders/admin/update-shipping-fees - Update shipping fees for existing orders (admin migration)
router.put('/admin/update-shipping-fees', authenticateToken, adminMiddleware, orderController.updateExistingOrdersShippingFees);

module.exports = router;
