const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/orderController');
const orderController = new OrderController();
const authenticateToken = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const validateObjectId = require('../middlewares/validateObjectId');

// User routes - require authentication
router.use(authenticateToken);

// GET /api/orders - Get current user's orders
router.get('/', orderController.getUserOrders);

// POST /api/orders - Create new order
router.post('/', orderController.createOrder);

// POST /api/orders/calculate-total - Calculate order total with voucher and shipping
router.post('/calculate-total', orderController.calculateOrderTotal);

// GET /api/orders/shipping-fee/:addressId - Calculate shipping fee for address
router.get('/shipping-fee/:addressId', validateObjectId('addressId'), orderController.calculateShippingFee);

// GET /api/orders/:id - Get order by ID
router.get('/:id', validateObjectId, orderController.getOrderById);

// PUT /api/orders/:id/cancel - Cancel order
router.put('/:id/cancel', validateObjectId, orderController.cancelOrder);

// Admin routes
router.use(adminMiddleware);

// GET /api/orders/admin/all - Get all orders (admin)
router.get('/admin/all', orderController.getOrders);

// PUT /api/orders/admin/:id/status - Update order status
router.put('/admin/:id/status', validateObjectId, orderController.updateOrderStatus);

// DELETE /api/orders/admin/:id - Delete order (admin only)
router.delete('/admin/:id', validateObjectId, orderController.deleteOrder);

// GET /api/orders/admin/stats - Get order statistics (admin)
router.get('/admin/stats', orderController.getOrderStats);

// GET /api/orders/admin/search - Search orders (admin)
router.get('/admin/search', orderController.searchOrders);

// GET /api/orders/admin/top-products - Get top selling products (admin)
router.get('/admin/top-products', orderController.getTopSellingProducts);

// GET /api/orders/admin/payment-method/:paymentMethod - Get orders by payment method (admin)
router.get('/admin/payment-method/:paymentMethod', validateObjectId('paymentMethod'), orderController.getOrdersByPaymentMethod);

// GET /api/orders/admin/user/:userId - Get orders by user ID (admin)
router.get('/admin/user/:userId', validateObjectId('userId'), orderController.getOrdersByUserId);

// PUT /api/orders/admin/update-shipping-fees - Update shipping fees for existing orders (admin migration)
router.put('/admin/update-shipping-fees', orderController.updateExistingOrdersShippingFees);

// GET /api/orders/:productId/can-review - Check if user can review product
router.get('/:productId/can-review', validateObjectId('productId'), orderController.canReviewProduct);

module.exports = router;
