const BaseController = require('./baseController');
const CartService = require('../services/cartService');
const ResponseHandler = require('../services/responseHandler');
const Cart = require('../models/CartSchema'); // Updated to use new CartSchema
const { QueryBuilder } = require('../middlewares/queryMiddleware');
const { MESSAGES, ERROR_CODES } = require('../config/constants');
const { AppError } = require('../middlewares/errorHandler');
const AdminSortUtils = require('../utils/adminSortUtils');

class CartController extends BaseController {
  constructor() {
    super(new CartService());
  }

  // GET /api/cart - Get user's cart (legacy endpoint)
  getCart = async (req, res, next) => {
    try {
      const cart = await this.service.getUserCart(req.user._id);
      ResponseHandler.success(res, MESSAGES.CART_SYNCED, cart);
    } catch (error) {
      next(error);
    }
  };

  // GET /api/cart/optimized - Get user's cart with optimized loading
  getCartOptimized = async (req, res, next) => {
    try {
      const cart = await this.service.getUserCartOptimized(req.user._id);
      ResponseHandler.success(res, MESSAGES.CART_SYNCED, cart);
    } catch (error) {
      next(error);
    }
  };

  // GET /api/cart/paginated - Get user's cart with pagination for cart page
  getCartPaginated = async (req, res, next) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const filters = {
        search: req.query.search,
        category: req.query.category,
        minPrice: req.query.minPrice,
        maxPrice: req.query.maxPrice
      };

      const result = await this.service.getCartWithPagination(req.user._id, page, limit, filters);
      ResponseHandler.success(res, MESSAGES.CART_SYNCED, result);
    } catch (error) {
      next(error);
    }
  };

  // GET /api/cart/count - Get cart items count only (lightweight)
  getCartCount = async (req, res, next) => {
    try {
      const cart = await Cart.findOne({ user: req.user._id }).select('items');
      const count = cart ? cart.items.length : 0;
      ResponseHandler.success(res, 'Cart count retrieved', { count });
    } catch (error) {
      next(error);
    }
  };

  // GET /api/cart/basic-info - Get cart basic info (count + total) for header
  getCartBasicInfo = async (req, res, next) => {
    try {
      const cart = await Cart.findOne({ user: req.user._id }).select('items');
      const count = cart ? cart.items.length : 0;
      
      // Calculate basic total without populating (use saved price in items)
      let total = 0;
      if (cart && cart.items) {
        total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      }
      
      ResponseHandler.success(res, 'Cart basic info retrieved', { count, total });
    } catch (error) {
      next(error);
    }
  };

  // DEBUG: Get raw cart data from database
  debugCart = async (req, res, next) => {
    try {
      console.log('🔍 DEBUG: Getting raw cart for user:', req.user._id);
      
      // Get raw cart from database without any processing
      const rawCart = await Cart.findOne({ user: req.user._id });
      console.log('🔍 Raw cart found:', rawCart ? 'YES' : 'NO');
      
      if (rawCart) {
        console.log('🔍 Raw cart keys:', Object.keys(rawCart.toObject()));
        console.log('🔍 Raw cart items:', rawCart.items ? rawCart.items.length : 'undefined');
        console.log('🔍 Raw cart type field:', rawCart.type);
        console.log('🔍 Full raw cart:', JSON.stringify(rawCart.toObject(), null, 2));
      }
      
      // Also check with old structure
      const oldStyleCart = await Cart.findOne({ user: req.user._id, type: 'cart' });
      console.log('🔍 Old style cart found:', oldStyleCart ? 'YES' : 'NO');
      
      ResponseHandler.success(res, 'Debug info logged', {
        rawCart: rawCart,
        hasOldStyle: !!oldStyleCart,
        cartKeys: rawCart ? Object.keys(rawCart.toObject()) : []
      });
    } catch (error) {
      // console.error('🔍 DEBUG error:', error);
      next(error);
    }
  };

  // POST /api/cart/items - Add item to cart
  addItem = async (req, res, next) => {
    try {
      const { productVariant, quantity } = req.body;
      
      console.log('📝 ADD ITEM REQUEST:', { productVariant, quantity });
      
      if (!productVariant) {
        throw new AppError('Product variant is required', ERROR_CODES.BAD_REQUEST);
      }
      
      if (!quantity) {
        throw new AppError('Quantity is required', ERROR_CODES.BAD_REQUEST);
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

  // POST /api/cart/batch-add - Add multiple items to cart in one operation
  batchAddItems = async (req, res, next) => {
    try {
      const { items } = req.body;
      
      console.log('📦 BATCH ADD REQUEST:', { itemsCount: items?.length });
      
      if (!items || !Array.isArray(items) || items.length === 0) {
        throw new AppError('Items array is required and cannot be empty', ERROR_CODES.BAD_REQUEST);
      }
      
      // Validate each item
      for (const item of items) {
        if (!item.productVariant || !item.quantity) {
          throw new AppError('Each item must have productVariant and quantity', ERROR_CODES.BAD_REQUEST);
        }
        
        if (item.quantity <= 0) {
          throw new AppError('Quantity must be greater than 0', ERROR_CODES.BAD_REQUEST);
        }
      }
      
      const result = await this.service.batchAddItemsToCart(req.user._id, items);
      
      console.log('✅ BATCH ADD SUCCESS:', { 
        successCount: result.successCount,
        errorCount: result.errorCount,
        totalCartItems: result.cart.items.length
      });
      
      ResponseHandler.success(res, `Added ${result.successCount} items to cart`, result);
    } catch (error) {
      next(error);
    }
  };

  // PUT /api/cart/items/:productVariantId - Update item quantity
  updateItem = async (req, res, next) => {
    try {
      console.log('🔄 UPDATE CART ITEM REQUEST:', {
        productVariantId: req.params.productVariantId,
        quantity: req.body.quantity,
        userId: req.user._id
      });
      
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
      
      console.log('✅ UPDATE CART ITEM SUCCESS:', {
        cartItemsCount: cart.items.length,
        updatedItem: cart.items.find(item => item.productVariant._id.toString() === productVariantId)?.quantity
      });
      
      ResponseHandler.success(res, MESSAGES.CART_ITEM_UPDATED, cart);
    } catch (error) {
      console.error('❌ UPDATE CART ITEM ERROR:', error.message);
      next(error);
    }
  };

  // PUT /api/cart/items/:productVariantId/variant - Change item variant
  changeItemVariant = async (req, res, next) => {
    try {
      console.log('🔄 CHANGE CART ITEM VARIANT REQUEST:', {
        oldProductVariantId: req.params.productVariantId,
        newProductVariantId: req.body.newProductVariantId,
        quantity: req.body.quantity,
        userId: req.user._id
      });
      
      const { productVariantId: oldProductVariantId } = req.params;
      const { newProductVariantId, quantity } = req.body;
      
      if (!newProductVariantId) {
        throw new AppError('New product variant ID is required', ERROR_CODES.BAD_REQUEST);
      }
      
      if (!quantity || quantity < 1) {
        throw new AppError('Valid quantity is required', ERROR_CODES.BAD_REQUEST);
      }

      const cart = await this.service.changeCartItemVariant(
        req.user._id, 
        oldProductVariantId, 
        newProductVariantId, 
        quantity
      );
      
      console.log('✅ CHANGE CART ITEM VARIANT SUCCESS:', {
        cartItemsCount: cart.items.length
      });
      
      ResponseHandler.success(res, 'Cart item variant changed successfully', cart);
    } catch (error) {
      console.error('❌ CHANGE CART ITEM VARIANT ERROR:', error.message);
      next(error);
    }
  };

  // DELETE /api/cart/items/:productVariantId - Remove item from cart
  removeItem = async (req, res, next) => {
    try {
      console.log('🗑️ REMOVE CART ITEM REQUEST:', {
        productVariantId: req.params.productVariantId,
        userId: req.user._id
      });
      
      const { productVariantId } = req.params;
      const cart = await this.service.removeItemFromCart(req.user._id, productVariantId);
      
      console.log('✅ REMOVE CART ITEM SUCCESS:', {
        cartItemsCount: cart.items.length,
        remainingItems: cart.items.map(item => item.productVariant._id)
      });
      
      ResponseHandler.success(res, MESSAGES.CART_ITEM_REMOVED, cart);
    } catch (error) {
      console.error('❌ REMOVE CART ITEM ERROR:', error.message);
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
      
      // Debug payment method for email processing
      console.log('🔍 Payment method debug:', {
        paymentMethod: paymentMethod,
        paymentMethodType: typeof paymentMethod,
        isObject: typeof paymentMethod === 'object',
        orderPaymentMethod: order.paymentMethod
      });
      
      // Check payment method from the created order (which is populated)
      const isCodeOnDelivery = order.paymentMethod && order.paymentMethod.method === 'COD';
      
      if (isCodeOnDelivery) {
        console.log('📧 COD order created - queuing email for background processing');
        
        // Use background job service for better performance and reliability
        const backgroundJobService = require('../services/backgroundJobService');
        backgroundJobService.queueOrderEmail(req.user.email, req.user.name, order);
        
        console.log(`✅ Email job queued for order: ${order.orderCode}`);
      } else {
        console.log('💳 VNPay order created - email will be sent after payment confirmation');
      }
      
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

  // ============= ADMIN METHODS WITH QUERY MIDDLEWARE =============

  // GET /api/cart/admin/all - Get all carts with Query Middleware
  getAllCarts = async (req, res, next) => {
    try {
      // Use QueryBuilder if available
      if (req.createQueryBuilder) {
        const result = await req.createQueryBuilder(Cart)
          .search(['orderCode', 'user.email', 'user.name'])
          .applyFilters({
            type: { type: 'string' },
            status: { type: 'string' },
            paymentStatus: { type: 'string' },
            user: { type: 'objectId' },
            'finalTotal[min]': { type: 'number' },
            'finalTotal[max]': { type: 'number' },
            'total[min]': { type: 'number' }, 
            'total[max]': { type: 'number' }
          })
          .execute();
        
        ResponseHandler.success(res, 'Carts retrieved successfully', result);
      } else {
        // Fallback to legacy method
        const sortConfig = AdminSortUtils.ensureAdminSort(req, 'Cart');
        const carts = await Cart.find()
          .populate(['user', 'address', 'voucher', 'paymentMethod', 'items.productVariant'])
          .sort(sortConfig);
        ResponseHandler.success(res, 'Carts retrieved successfully', carts);
      }
    } catch (error) {
      next(error);
    }
  };

  // GET /api/cart/admin/orders - Get all orders from Order collection
  getAllOrders = async (req, res, next) => {
    try {
      // This method should use OrderService instead of CartService
      // Redirect to order controller or import OrderService
      const OrderService = require('../services/orderService');
      const orderService = new OrderService();
      
      if (req.createQueryBuilder) {
        const Order = require('../models/OrderSchema');
        const result = await req.createQueryBuilder(Order)
          .search(['orderCode', 'user.email', 'user.name'])
          .applyFilters({
            status: { type: 'string' },
            paymentStatus: { type: 'string' },
            user: { type: 'objectId' },
            'finalTotal[min]': { type: 'number' },
            'finalTotal[max]': { type: 'number' }
          })
          .execute();
        
        ResponseHandler.success(res, 'Orders retrieved successfully', result);
      } else {
        // Fallback to legacy method using Order model
        const Order = require('../models/OrderSchema');
        const sortConfig = AdminSortUtils.ensureAdminSort(req, 'Order');
        const orders = await Order.find({})
          .populate(['user', 'address', 'voucher', 'paymentMethod', 'items.productVariant'])
          .sort(sortConfig);
        ResponseHandler.success(res, 'Orders retrieved successfully', orders);
      }
    } catch (error) {
      next(error);
    }
  };

  // GET /api/cart/admin/active-carts - Get all active carts with Query Middleware
  getAllActiveCarts = async (req, res, next) => {
    try {
      if (req.createQueryBuilder) {
        const result = await req.createQueryBuilder(Cart)
          .search(['user.email', 'user.name'])
          .applyFilters({
            user: { type: 'objectId' },
            'total[min]': { type: 'number' },
            'total[max]': { type: 'number' }
          })
          .execute();
        
        ResponseHandler.success(res, 'Active carts retrieved successfully', result);
      } else {
        // Fallback to legacy method - all carts are active carts now
        const sortConfig = AdminSortUtils.ensureAdminSort(req, 'Cart');
        const carts = await Cart.find({})
          .populate(['user', 'items.productVariant'])
          .sort(sortConfig);
        ResponseHandler.success(res, 'Active carts retrieved successfully', carts);
      }
    } catch (error) {
      next(error);
    }
  };

  // ============= CART STATISTICS METHODS =============

  // GET /api/cart/admin/statistics - Get cart statistics for admin dashboard
  getCartStatistics = async (req, res, next) => {
    try {
      const statistics = await this.service.getCartStatistics();
      ResponseHandler.success(res, 'Cart statistics retrieved successfully', statistics);
    } catch (error) {
      next(error);
    }
  };

  // GET /api/cart/admin/trends - Get cart activity trends
  getCartTrends = async (req, res, next) => {
    try {
      const days = parseInt(req.query.days) || 30;
      const trends = await this.service.getCartActivityTrends(days);
      ResponseHandler.success(res, 'Cart trends retrieved successfully', trends);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = CartController;
