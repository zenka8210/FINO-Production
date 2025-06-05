const Cart = require('../models/cartSchema');
const Product = require('../models/productSchema');
const { MESSAGES, ERROR_CODES } = require('../config/constants');
const { AppError } = require('../middlewares/errorHandler');
const LoggerService = require('./loggerService');

class CartService {
  constructor() {
    this.logger = LoggerService;
  }

  /**
   * Lấy giỏ hàng của người dùng
   * @param {string} userId - ID người dùng
   * @returns {Promise<Object>} - Giỏ hàng
   */
  async getCart(userId) {
    try {
      let cart = await Cart.findOne({ user: userId })
        .populate({
          path: 'items.product',
          select: 'name images variants status'
        });

      if (!cart) {
        // Tạo giỏ hàng mới nếu chưa có
        cart = new Cart({ user: userId, items: [] });
        await cart.save();
      }

      // Loại bỏ các sản phẩm không còn hoạt động
      const activeItems = cart.items.filter(item => 
        item.product && item.product.status === 'active'
      );

      if (activeItems.length !== cart.items.length) {
        cart.items = activeItems;
        await cart.save();
      }

      return {
        message: MESSAGES.SUCCESS.DATA_RETRIEVED,
        cart
      };
    } catch (error) {
      this.logger.error(`Lỗi khi lấy giỏ hàng người dùng ${userId}:`, error);
      throw new AppError(MESSAGES.ERROR.DATA_RETRIEVE_FAILED, 500, ERROR_CODES.INTERNAL_ERROR);
    }
  }

  /**
   * Thêm sản phẩm vào giỏ hàng
   * @param {string} userId - ID người dùng
   * @param {Object} itemData - Dữ liệu sản phẩm
   * @returns {Promise<Object>} - Giỏ hàng được cập nhật
   */
  async addToCart(userId, itemData) {
    try {
      const { productId, variant, quantity = 1 } = itemData;

      // Kiểm tra sản phẩm tồn tại
      const product = await Product.findById(productId);
      if (!product) {
        throw new AppError(MESSAGES.ERROR.PRODUCT_NOT_FOUND, 404, ERROR_CODES.NOT_FOUND);
      }

      if (product.status !== 'active') {
        throw new AppError(
          'Sản phẩm không còn hoạt động', 
          400, 
          ERROR_CODES.INVALID_INPUT
        );
      }

      // Tìm variant phù hợp
      const productVariant = product.variants.find(v => 
        v.color === variant.color && v.size === variant.size
      );

      if (!productVariant) {
        throw new AppError(
          'Không tìm thấy phiên bản sản phẩm này', 
          404, 
          ERROR_CODES.NOT_FOUND
        );
      }

      // Kiểm tra tồn kho
      if (productVariant.stock < quantity) {
        throw new AppError(
          `Chỉ còn ${productVariant.stock} sản phẩm trong kho`, 
          400, 
          ERROR_CODES.INSUFFICIENT_STOCK
        );
      }

      // Lấy hoặc tạo giỏ hàng
      let cart = await Cart.findOne({ user: userId });
      if (!cart) {
        cart = new Cart({ user: userId, items: [] });
      }

      // Kiểm tra sản phẩm đã có trong giỏ chưa
      const existingItemIndex = cart.items.findIndex(item => 
        item.product.toString() === productId &&
        item.variant.color === variant.color &&
        item.variant.size === variant.size
      );

      if (existingItemIndex >= 0) {
        // Cập nhật số lượng
        const newQuantity = cart.items[existingItemIndex].quantity + quantity;
        
        if (newQuantity > productVariant.stock) {
          throw new AppError(
            `Chỉ còn ${productVariant.stock} sản phẩm trong kho`, 
            400, 
            ERROR_CODES.INSUFFICIENT_STOCK
          );
        }

        cart.items[existingItemIndex].quantity = newQuantity;
        cart.items[existingItemIndex].price = productVariant.price; // Cập nhật giá mới nhất
        cart.items[existingItemIndex].addedAt = new Date();
      } else {
        // Thêm sản phẩm mới
        cart.items.push({
          product: productId,
          variant: {
            color: variant.color,
            size: variant.size,
            weight: productVariant.weight
          },
          quantity,
          price: productVariant.price
        });
      }

      const savedCart = await cart.save();
      await savedCart.populate({
        path: 'items.product',
        select: 'name images variants status'
      });

      this.logger.info(`Thêm sản phẩm vào giỏ hàng thành công`, {
        userId,
        productId,
        variant,
        quantity
      });

      return {
        message: MESSAGES.SUCCESS.CART_ITEM_ADDED,
        cart: savedCart
      };
    } catch (error) {
      this.logger.error('Lỗi khi thêm sản phẩm vào giỏ hàng:', error);
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError(MESSAGES.ERROR.CART_ADD_FAILED, 500, ERROR_CODES.INTERNAL_ERROR);
    }
  }

  /**
   * Cập nhật số lượng sản phẩm trong giỏ hàng
   * @param {string} userId - ID người dùng
   * @param {string} productId - ID sản phẩm
   * @param {Object} variant - Thông tin variant
   * @param {number} quantity - Số lượng mới
   * @returns {Promise<Object>} - Giỏ hàng được cập nhật
   */
  async updateCartItem(userId, productId, variant, quantity) {
    try {
      const cart = await Cart.findOne({ user: userId });
      if (!cart) {
        throw new AppError(MESSAGES.ERROR.CART_NOT_FOUND, 404, ERROR_CODES.NOT_FOUND);
      }

      const itemIndex = cart.items.findIndex(item => 
        item.product.toString() === productId &&
        item.variant.color === variant.color &&
        item.variant.size === variant.size
      );

      if (itemIndex === -1) {
        throw new AppError(
          'Không tìm thấy sản phẩm trong giỏ hàng', 
          404, 
          ERROR_CODES.NOT_FOUND
        );
      }

      if (quantity <= 0) {
        // Xóa sản phẩm khỏi giỏ hàng
        cart.items.splice(itemIndex, 1);
      } else {
        // Kiểm tra tồn kho
        const product = await Product.findById(productId);
        const productVariant = product.variants.find(v => 
          v.color === variant.color && v.size === variant.size
        );

        if (quantity > productVariant.stock) {
          throw new AppError(
            `Chỉ còn ${productVariant.stock} sản phẩm trong kho`, 
            400, 
            ERROR_CODES.INSUFFICIENT_STOCK
          );
        }

        // Cập nhật số lượng
        cart.items[itemIndex].quantity = quantity;
        cart.items[itemIndex].price = productVariant.price; // Cập nhật giá mới nhất
      }

      const savedCart = await cart.save();
      await savedCart.populate({
        path: 'items.product',
        select: 'name images variants status'
      });

      this.logger.info(`Cập nhật giỏ hàng thành công`, {
        userId,
        productId,
        variant,
        quantity
      });

      return {
        message: MESSAGES.SUCCESS.CART_UPDATED,
        cart: savedCart
      };
    } catch (error) {
      this.logger.error('Lỗi khi cập nhật giỏ hàng:', error);
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError(MESSAGES.ERROR.CART_UPDATE_FAILED, 500, ERROR_CODES.INTERNAL_ERROR);
    }
  }

  /**
   * Xóa sản phẩm khỏi giỏ hàng
   * @param {string} userId - ID người dùng
   * @param {string} productId - ID sản phẩm
   * @param {Object} variant - Thông tin variant
   * @returns {Promise<Object>} - Giỏ hàng được cập nhật
   */
  async removeFromCart(userId, productId, variant) {
    try {
      const cart = await Cart.findOne({ user: userId });
      if (!cart) {
        throw new AppError(MESSAGES.ERROR.CART_NOT_FOUND, 404, ERROR_CODES.NOT_FOUND);
      }

      const initialLength = cart.items.length;
      cart.items = cart.items.filter(item => 
        !(item.product.toString() === productId &&
          item.variant.color === variant.color &&
          item.variant.size === variant.size)
      );

      if (cart.items.length === initialLength) {
        throw new AppError(
          'Không tìm thấy sản phẩm trong giỏ hàng', 
          404, 
          ERROR_CODES.NOT_FOUND
        );
      }

      const savedCart = await cart.save();
      await savedCart.populate({
        path: 'items.product',
        select: 'name images variants status'
      });

      this.logger.info(`Xóa sản phẩm khỏi giỏ hàng thành công`, {
        userId,
        productId,
        variant
      });

      return {
        message: MESSAGES.SUCCESS.CART_ITEM_REMOVED,
        cart: savedCart
      };
    } catch (error) {
      this.logger.error('Lỗi khi xóa sản phẩm khỏi giỏ hàng:', error);
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError(MESSAGES.ERROR.CART_REMOVE_FAILED, 500, ERROR_CODES.INTERNAL_ERROR);
    }
  }

  /**
   * Xóa toàn bộ giỏ hàng
   * @param {string} userId - ID người dùng
   * @returns {Promise<Object>} - Kết quả xóa
   */
  async clearCart(userId) {
    try {
      const cart = await Cart.findOne({ user: userId });
      if (!cart) {
        return {
          message: MESSAGES.SUCCESS.CART_CLEARED,
          cart: { user: userId, items: [], totalAmount: 0, totalItems: 0 }
        };
      }

      cart.items = [];
      const clearedCart = await cart.save();

      this.logger.info(`Xóa toàn bộ giỏ hàng thành công`, { userId });

      return {
        message: MESSAGES.SUCCESS.CART_CLEARED,
        cart: clearedCart
      };
    } catch (error) {
      this.logger.error('Lỗi khi xóa toàn bộ giỏ hàng:', error);
      throw new AppError(MESSAGES.ERROR.CART_CLEAR_FAILED, 500, ERROR_CODES.INTERNAL_ERROR);
    }
  }

  /**
   * Đồng bộ giỏ hàng với tồn kho
   * @param {string} userId - ID người dùng
   * @returns {Promise<Object>} - Giỏ hàng đã đồng bộ
   */
  async syncCart(userId) {
    try {
      const cart = await Cart.findOne({ user: userId })
        .populate('items.product');

      if (!cart || cart.items.length === 0) {
        return this.getCart(userId);
      }

      let hasChanges = false;
      const updatedItems = [];

      for (const item of cart.items) {
        if (!item.product || item.product.status !== 'active') {
          // Loại bỏ sản phẩm không hoạt động
          hasChanges = true;
          continue;
        }

        const productVariant = item.product.variants.find(v => 
          v.color === item.variant.color && v.size === item.variant.size
        );

        if (!productVariant) {
          // Loại bỏ variant không tồn tại
          hasChanges = true;
          continue;
        }

        // Cập nhật số lượng nếu vượt quá tồn kho
        let quantity = item.quantity;
        if (quantity > productVariant.stock) {
          quantity = productVariant.stock;
          hasChanges = true;
        }

        // Cập nhật giá nếu có thay đổi
        let price = item.price;
        if (price !== productVariant.price) {
          price = productVariant.price;
          hasChanges = true;
        }

        if (quantity > 0) {
          updatedItems.push({
            ...item.toObject(),
            quantity,
            price
          });
        } else {
          hasChanges = true;
        }
      }

      if (hasChanges) {
        cart.items = updatedItems;
        await cart.save();
        
        this.logger.info(`Đồng bộ giỏ hàng thành công`, { 
          userId, 
          changes: hasChanges 
        });
      }

      await cart.populate({
        path: 'items.product',
        select: 'name images variants status'
      });

      return {
        message: hasChanges ? MESSAGES.SUCCESS.CART_SYNCED : MESSAGES.SUCCESS.DATA_RETRIEVED,
        cart,
        hasChanges
      };
    } catch (error) {
      this.logger.error('Lỗi khi đồng bộ giỏ hàng:', error);
      throw new AppError(MESSAGES.ERROR.CART_SYNC_FAILED, 500, ERROR_CODES.INTERNAL_ERROR);
    }
  }

  /**
   * Chuyển đổi giỏ hàng thành đơn hàng
   * @param {string} userId - ID người dùng
   * @returns {Promise<Array>} - Danh sách items cho đơn hàng
   */
  async getCartForOrder(userId) {
    try {
      const result = await this.syncCart(userId);
      const cart = result.cart;

      if (!cart.items || cart.items.length === 0) {
        throw new AppError(
          'Giỏ hàng trống', 
          400, 
          ERROR_CODES.INVALID_INPUT
        );
      }

      // Chuyển đổi định dạng cho đơn hàng
      const orderItems = cart.items.map(item => ({
        product: item.product._id,
        variant: item.variant,
        name: item.product.name,
        quantity: item.quantity,
        price: item.price,
        images: item.product.images[0] || ''
      }));

      return {
        message: MESSAGES.SUCCESS.DATA_RETRIEVED,
        items: orderItems,
        totalAmount: cart.totalAmount
      };
    } catch (error) {
      this.logger.error('Lỗi khi chuyển đổi giỏ hàng thành đơn hàng:', error);
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError(MESSAGES.ERROR.DATA_RETRIEVE_FAILED, 500, ERROR_CODES.INTERNAL_ERROR);
    }  }

  /**
   * Xóa toàn bộ giỏ hàng
   * @param {string} userId - ID người dùng
   * @returns {Promise<Object>} - Giỏ hàng trống
   */
  async clearCart(userId) {
    try {
      let cart = await Cart.findOne({ user: userId });
      
      if (!cart) {
        cart = new Cart({ user: userId, items: [] });
      } else {
        cart.items = [];
      }
      
      const savedCart = await cart.save();
      
      this.logger.info(`Xóa toàn bộ giỏ hàng thành công`, { userId });
      
      return {
        message: MESSAGES.SUCCESS.CART_CLEARED,
        cart: savedCart
      };
    } catch (error) {
      this.logger.error('Lỗi khi xóa giỏ hàng:', error);
      throw new AppError(MESSAGES.ERROR.DATA_RETRIEVE_FAILED, 500, ERROR_CODES.INTERNAL_ERROR);
    }
  }
}

module.exports = CartService;
