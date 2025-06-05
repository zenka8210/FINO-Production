const BaseController = require('./baseController');
const CartService = require('../services/cartService');

/**
 * Cart Controller - Quản lý giỏ hàng
 * Extends BaseController để sử dụng các phương thức chung
 */
class CartController extends BaseController {
  constructor() {
    super();
    this.cartService = new CartService();
  }

  /**
   * Lấy giỏ hàng của người dùng hiện tại
   * GET /api/cart
   */
  getCart = async (req, res, next) => {
    try {
      const userId = req.user.id;
      const result = await this.cartService.getCart(userId);
      
      this.sendResponse(res, 200, result.message, result.cart);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Thêm sản phẩm vào giỏ hàng
   * POST /api/cart/items
   */
  addToCart = async (req, res, next) => {
    try {
      const userId = req.user.id;
      const itemData = req.body;
      
      const result = await this.cartService.addToCart(userId, itemData);
      
      this.sendResponse(res, 201, result.message, result.cart);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Cập nhật số lượng sản phẩm trong giỏ hàng
   * PUT /api/cart/items/:productId
   */
  updateCartItem = async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { productId } = req.params;
      const { variant, quantity } = req.body;
      
      const result = await this.cartService.updateCartItem(userId, productId, variant, quantity);
      
      this.sendResponse(res, 200, result.message, result.cart);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Xóa sản phẩm khỏi giỏ hàng
   * DELETE /api/cart/items/:productId
   */
  removeFromCart = async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { productId } = req.params;
      const { variant } = req.body;
      
      const result = await this.cartService.removeFromCart(userId, productId, variant);
      
      this.sendResponse(res, 200, result.message, result.cart);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Xóa toàn bộ giỏ hàng
   * DELETE /api/cart
   */
  clearCart = async (req, res, next) => {
    try {
      const userId = req.user.id;
      
      const result = await this.cartService.clearCart(userId);
      
      this.sendResponse(res, 200, result.message, result.cart);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Đồng bộ giỏ hàng với tồn kho
   * PUT /api/cart/sync
   */
  syncCart = async (req, res, next) => {
    try {
      const userId = req.user.id;
      
      const result = await this.cartService.syncCart(userId);
      
      this.sendResponse(res, 200, result.message, {
        cart: result.cart,
        hasChanges: result.hasChanges
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Lấy giỏ hàng để tạo đơn hàng
   * GET /api/cart/for-order
   */
  getCartForOrder = async (req, res, next) => {
    try {
      const userId = req.user.id;
      
      const result = await this.cartService.getCartForOrder(userId);
      
      this.sendResponse(res, 200, result.message, {
        items: result.items,
        totalAmount: result.totalAmount
      });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new CartController();