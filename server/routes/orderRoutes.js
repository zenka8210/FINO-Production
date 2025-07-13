const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/orderController');
const orderController = new OrderController();
const authenticateToken = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const validateObjectId = require('../middlewares/validateObjectId');
const { queryParserMiddleware } = require('../middlewares/queryMiddleware');

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

// PUT /api/orders/:id/cancel - Cancel order (user can only cancel their own orders)
router.put('/:id/cancel', validateObjectId('id'), orderController.cancelOrder);

// GET /api/orders/:productId/can-review - Check if user can review product
router.get('/:productId/can-review', validateObjectId('productId'), orderController.canReviewProduct);

// ========== ADMIN ROUTES ==========
// GET /api/orders/admin/all - Get all orders with filters (admin)
router.get('/admin/all', authenticateToken, adminMiddleware, queryParserMiddleware, orderController.getOrders);

// GET /api/orders/admin/stats - Get order statistics (admin)
router.get('/admin/stats', authenticateToken, adminMiddleware, orderController.getOrderStats);

// GET /api/orders/admin/search - Search orders (admin)
router.get('/admin/search', authenticateToken, adminMiddleware, orderController.searchOrders);

// GET /api/orders/admin/top-products - Get top selling products (admin)
router.get('/admin/top-products', authenticateToken, adminMiddleware, orderController.getTopSellingProducts);

// GET /api/orders/admin/payment-method/:paymentMethod - Get orders by payment method (admin)
router.get('/admin/payment-method/:paymentMethod', authenticateToken, adminMiddleware, validateObjectId('paymentMethod'), orderController.getOrdersByPaymentMethod);

// GET /api/orders/admin/user/:userId - Get orders by user ID (admin)
router.get('/admin/user/:userId', authenticateToken, adminMiddleware, validateObjectId('userId'), orderController.getOrdersByUserId);

// PUT /api/orders/admin/:id/status - Update order status ONLY (admin restriction)
router.put('/admin/:id/status', authenticateToken, adminMiddleware, validateObjectId('id'), orderController.updateOrderStatus);

// PUT /api/orders/admin/:id/cancel - Admin cancel order (restricted to pending/processing)
router.put('/admin/:id/cancel', authenticateToken, adminMiddleware, validateObjectId('id'), orderController.cancelOrder);

// DELETE /api/orders/admin/:id - Delete order (admin only, only cancelled orders)
router.delete('/admin/:id', authenticateToken, adminMiddleware, validateObjectId('id'), orderController.deleteOrder);

// PUT /api/orders/admin/update-shipping-fees - Update shipping fees for existing orders (admin migration)
router.put('/admin/update-shipping-fees', authenticateToken, adminMiddleware, orderController.updateExistingOrdersShippingFees);

module.exports = router;
