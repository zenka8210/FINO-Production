const express = require('express');
const router = express.Router();
const CartController = require('../controllers/cartController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const { queryParserMiddleware } = require('../middlewares/queryMiddleware');
const validateObjectId = require('../middlewares/validateObjectId');

const cartController = new CartController();

// All cart routes require authentication
router.use(authMiddleware);

/**
 * @route GET /api/cart
 * @description Get user's cart (legacy endpoint)
 * @access Private
 */
router.get('/', cartController.getCart);

/**
 * @route GET /api/cart/optimized
 * @description Get user's cart with optimized loading for better performance
 * @access Private
 */
router.get('/optimized', cartController.getCartOptimized);

/**
 * @route GET /api/cart/paginated
 * @description Get user's cart with pagination for cart page
 * @access Private
 */
router.get('/paginated', cartController.getCartPaginated);

/**
 * @route GET /api/cart/count
 * @description Get cart items count only (lightweight)
 * @access Private
 */
router.get('/count', cartController.getCartCount);

/**
 * @route GET /api/cart/basic-info
 * @description Get cart basic info (count + total) for header display
 * @access Private
 */
router.get('/basic-info', cartController.getCartBasicInfo);

/**
 * @route GET /api/cart/debug
 * @description Debug cart data - temporary route
 * @access Private
 */
router.get('/debug', cartController.debugCart);

/**
 * @route GET /api/cart/count
 * @description Get cart items count
 * @access Private
 */
router.get('/count', cartController.getCartCount);

/**
 * @route POST /api/cart/items
 * @description Add item to cart
 * @access Private
 * @body {String} productVariant - Product variant ID
 * @body {Number} quantity - Quantity to add
 */
router.post('/items', cartController.addItem);

/**
 * @route POST /api/cart/batch-add
 * @description Add multiple items to cart in one operation (for wishlist "buy all")
 * @access Private
 * @body {Array} items - Array of {productVariant, quantity} objects
 */
router.post('/batch-add', cartController.batchAddItems);

/**
 * @route PUT /api/cart/items/:productVariantId
 * @description Update cart item quantity
 * @access Private
 * @param {String} productVariantId - Product variant ID
 * @body {Number} quantity - New quantity
 */
router.put('/items/:productVariantId', 
  validateObjectId('productVariantId'), 
  cartController.updateItem
);

/**
 * @route DELETE /api/cart/items/:productVariantId
 * @description Remove item from cart
 * @access Private
 * @param {String} productVariantId - Product variant ID
 */
router.delete('/items/:productVariantId', 
  validateObjectId('productVariantId'), 
  cartController.removeItem
);

/**
 * @route DELETE /api/cart
 * @description Clear entire cart
 * @access Private
 */
router.delete('/', cartController.clearCart);

/**
 * @route POST /api/cart/sync
 * @description Sync client cart with server cart
 * @access Private
 * @body {Array} items - Array of {productVariant, quantity}
 */
router.post('/sync', cartController.syncCart);

/**
 * @route POST /api/cart/validate
 * @description Validate cart items (stock, prices, etc.)
 * @access Private
 */
router.post('/validate', cartController.validateCart);

/**
 * @route POST /api/cart/calculate-total
 * @description Calculate cart total with voucher and shipping
 * @access Private
 * @body {String} [address] - Address ID for shipping calculation
 * @body {String} [voucher] - Voucher ID for discount calculation
 */
router.post('/calculate-total', cartController.calculateTotal);

/**
 * @route POST /api/cart/checkout
 * @description Convert cart to order (checkout)
 * @access Private
 * @body {String} address - Address ID for delivery
 * @body {String} paymentMethod - Payment method ID
 * @body {String} [voucher] - Voucher ID for discount
 */
router.post('/checkout', cartController.checkout);

// ============= ADMIN ROUTES WITH QUERY MIDDLEWARE =============

/**
 * @route GET /api/cart/admin/all
 * @description Get all carts (both cart and order types) with pagination, search, sort, filter
 * @access Private (Admin only)
 * @query {Number} [page=1] - Page number
 * @query {Number} [limit=10] - Items per page
 * @query {String} [search] - Search in orderCode, user email, user name
 * @query {String} [sort] - Sort field
 * @query {String} [order=desc] - Sort order (asc/desc)
 * @query {String} [filter[type]] - Filter by type (cart/order)
 * @query {String} [filter[status]] - Filter by status
 * @query {String} [filter[paymentStatus]] - Filter by payment status
 * @query {String} [filter[user]] - Filter by user ID
 * @query {Number} [filter[finalTotal][min]] - Min final total
 * @query {Number} [filter[finalTotal][max]] - Max final total
 */
router.get('/admin/all', 
  authMiddleware, 
  adminMiddleware, 
  queryParserMiddleware(), 
  cartController.getAllCarts
);

/**
 * @route GET /api/cart/admin/orders
 * @description Get all orders (type='order') with pagination, search, sort, filter
 * @access Private (Admin only)
 */
router.get('/admin/orders', 
  authMiddleware, 
  adminMiddleware, 
  queryParserMiddleware(), 
  cartController.getAllOrders
);

/**
 * @route GET /api/cart/admin/active-carts
 * @description Get all active carts (type='cart') with pagination, search, sort, filter
 * @access Private (Admin only)
 */
router.get('/admin/active-carts', 
  authMiddleware, 
  adminMiddleware, 
  queryParserMiddleware(), 
  cartController.getAllActiveCarts
);

/**
 * @route GET /api/cart/admin/statistics
 * @description Get cart statistics for admin dashboard
 * @access Private (Admin only)
 */
router.get('/admin/statistics', 
  authMiddleware, 
  adminMiddleware, 
  cartController.getCartStatistics
);

/**
 * @route GET /api/cart/admin/trends
 * @description Get cart activity trends
 * @access Private (Admin only)
 * @query {Number} [days=30] - Number of days for trend analysis
 */
router.get('/admin/trends', 
  authMiddleware, 
  adminMiddleware, 
  cartController.getCartTrends
);

module.exports = router;