const BaseController = require('./baseController');
const CartService = require('../services/cartService');
const ResponseHandler = require('../services/responseHandler');
const { MESSAGES, ERROR_CODES } = require('../config/constants');
const { AppError } = require('../middlewares/errorHandler');

class CartController extends BaseController {
  constructor() {
    super(new CartService());
  }

  // GET /api/cart - Get user's cart
  getCart = async (req, res, next) => {
    try {
      const cart = await this.service.getUserCart(req.user._id);
      ResponseHandler.success(res, MESSAGES.CART_SYNCED, cart);
    } catch (error) {
      next(error);
    }
  };

  // POST /api/cart/items - Add item to cart
  addItem = async (req, res, next) => {
    try {
      const { productVariant, quantity } = req.body;
      
      if (!productVariant || !quantity) {
        throw new AppError('Product variant and quantity are required', ERROR_CODES.BAD_REQUEST);
      }
      
      if (quantity <= 0) {
        throw new AppError('Quantity must be greater than 0', ERROR_CODES.BAD_REQUEST);
      }

      const cart = await this.service.addItemToCart(req.user._id, productVariant, quantity);
      ResponseHandler.success(res, MESSAGES.CART_ITEM_ADDED, cart);
    } catch (error) {
      next(error);
    }
  };

  // PUT /api/cart/items/:productVariantId - Update item quantity
  updateItem = async (req, res, next) => {
    try {
      const { productVariantId } = req.params;
      const { quantity } = req.body;
      
      if (!quantity || quantity < 0) {
        throw new AppError('Valid quantity is required', ERROR_CODES.BAD_REQUEST);
      }

      const cart = await this.service.updateCartItemQuantity(
        req.user._id, 
        productVariantId, 
        quantity
      );
      ResponseHandler.success(res, MESSAGES.CART_ITEM_UPDATED, cart);
    } catch (error) {
      next(error);
    }
  };

  // DELETE /api/cart/items/:productVariantId - Remove item from cart
  removeItem = async (req, res, next) => {
    try {
      const { productVariantId } = req.params;
      const cart = await this.service.removeItemFromCart(req.user._id, productVariantId);
      ResponseHandler.success(res, MESSAGES.CART_ITEM_REMOVED, cart);
    } catch (error) {
      next(error);
    }
  };

  // DELETE /api/cart - Clear entire cart
  clearCart = async (req, res, next) => {
    try {
      const cart = await this.service.clearUserCart(req.user._id);
      ResponseHandler.success(res, MESSAGES.CART_CLEARED, cart);
    } catch (error) {
      next(error);
    }
  };

  // POST /api/cart/sync - Sync client cart with server cart
  syncCart = async (req, res, next) => {
    try {
      const { items } = req.body; // Array of {productVariant, quantity}
      
      if (!Array.isArray(items)) {
        throw new AppError('Items must be an array', ERROR_CODES.BAD_REQUEST);
      }

      const cart = await this.service.syncCart(req.user._id, items);
      ResponseHandler.success(res, MESSAGES.CART_SYNCED, cart);
    } catch (error) {
      next(error);
    }
  };

  // POST /api/cart/validate - Validate cart items (stock, prices, etc.)
  validateCart = async (req, res, next) => {
    try {
      const validation = await this.service.validateUserCart(req.user._id);
      ResponseHandler.success(res, 'Cart validation completed', validation);
    } catch (error) {
      next(error);
    }
  };

  // POST /api/cart/checkout - Convert cart to order
  checkout = async (req, res, next) => {
    try {
      const { address, paymentMethod, voucher } = req.body;
      
      if (!address || !paymentMethod) {
        throw new AppError('Address and payment method are required', ERROR_CODES.BAD_REQUEST);
      }

      const order = await this.service.checkoutCart(req.user._id, {
        address,
        paymentMethod,
        voucher
      });
      
      ResponseHandler.created(res, 'Order created successfully', order);
    } catch (error) {
      next(error);
    }
  };

  // GET /api/cart/count - Get cart items count
  getCartCount = async (req, res, next) => {
    try {
      const count = await this.service.getCartItemsCount(req.user._id);
      ResponseHandler.success(res, 'Cart count retrieved', { count });
    } catch (error) {
      next(error);
    }
  };

  // POST /api/cart/calculate-total - Calculate cart total with voucher/shipping
  calculateTotal = async (req, res, next) => {
    try {
      const { address, voucher } = req.body;
      const calculation = await this.service.calculateCartTotal(req.user._id, { address, voucher });
      ResponseHandler.success(res, 'Cart total calculated', calculation);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = CartController;
