const express = require('express');
const router = express.Router();
const CartController = require('../controllers/cartController');
const authMiddleware = require('../middlewares/authMiddleware');
const validateObjectId = require('../middlewares/validateObjectId');

const cartController = new CartController();

// All cart routes require authentication
router.use(authMiddleware);

/**
 * @route GET /api/cart
 * @description Get user's cart
 * @access Private
 */
router.get('/', cartController.getCart);

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

module.exports = router;