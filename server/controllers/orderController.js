const BaseController = require('./baseController');
const OrderService = require('../services/orderService');
const ResponseHandler = require('../services/responseHandler');
const { orderMessages, PAGINATION, ERROR_CODES } = require('../config/constants');
const { AppError } = require('../middlewares/errorHandler');
const { QueryUtils } = require('../utils/queryUtils');

class OrderController extends BaseController {
  constructor() {
    super(new OrderService());
  }

  // Tạo đơn hàng mới
  createOrder = async (req, res, next) => {
    try {
      console.log('🔍 Order controller received:', req.body);
      console.log('🔍 PaymentMethod from body:', req.body.paymentMethod);
      console.log('🔍 Type of paymentMethod:', typeof req.body.paymentMethod);
      
      // Basic validation (more can be added with a validation middleware)
      if (!req.body.items || req.body.items.length === 0) {
        throw new AppError(orderMessages.ORDER_ITEMS_EMPTY, ERROR_CODES.BAD_REQUEST);
      }
      if (!req.body.address) {
        throw new AppError(orderMessages.ORDER_ADDRESS_REQUIRED, ERROR_CODES.BAD_REQUEST);
      }
      if (!req.body.paymentMethod) {
        console.log('❌ PaymentMethod validation failed - value is:', req.body.paymentMethod);
        throw new AppError(orderMessages.ORDER_PAYMENT_METHOD_REQUIRED, ERROR_CODES.BAD_REQUEST);
      }

      const order = await this.service.createOrder(req.user._id, req.body);
      ResponseHandler.created(res, orderMessages.ORDER_CREATED_SUCCESSFULLY, order);
    } catch (error) {
      next(error);
    }
  };

  // Lấy đơn hàng với thông tin đầy đủ
  getOrderById = async (req, res, next) => {
    try {
      const order = await this.service.getOrderWithDetails(req.params.id); // Assuming getOrderWithDetails exists and handles not found
      
      if (!order) {
        // This check might be redundant if getOrderWithDetails throws AppError for not found
        return ResponseHandler.notFound(res, orderMessages.ORDER_NOT_FOUND);
      }

      ResponseHandler.success(res, orderMessages.ORDER_DETAIL_FETCHED_SUCCESSFULLY, order);
    } catch (error) {
      // If service throws AppError, it will be caught here and passed to global error handler
      next(error);
    }
  };

  // Lấy đơn hàng của user hiện tại
  getUserOrders = async (req, res, next) => {
    try {
      const { page, limit, status } = req.query;
      const options = {
        page: parseInt(page) || PAGINATION.DEFAULT_PAGE,
        limit: parseInt(limit) || PAGINATION.DEFAULT_LIMIT,
        status
      };

      const result = await this.service.getUserOrders(req.user._id, options);
      ResponseHandler.success(res, orderMessages.ORDERS_FETCHED_SUCCESSFULLY, result);
    } catch (error) {
      next(error);
    }
  };

  // Admin: Lấy tất cả đơn hàng
  getOrders = async (req, res, next) => {
    try {
      // Sử dụng method cũ stable
      const queryOptions = {
        page: req.query.page || PAGINATION.DEFAULT_PAGE,
        limit: req.query.limit || PAGINATION.DEFAULT_LIMIT,
        status: req.query.status,
        sortBy: req.query.sortBy || 'createdAt',
        sortOrder: req.query.sortOrder || 'desc'
      };
      const result = await this.service.getAllOrders(queryOptions);
      ResponseHandler.success(res, orderMessages.ORDERS_FETCHED_SUCCESSFULLY, result);
    } catch (error) {
      next(error);
    }
  };

  // Giữ lại method cũ để backward compatibility
  getOrdersLegacy = async (req, res, next) => {
    try {
      const { page, limit, status, paymentMethod, userId, startDate, endDate } = req.query;
      
      const filter = {};
      if (status) filter.status = status;
      if (paymentMethod) filter.paymentMethod = paymentMethod;
      if (userId) filter.user = userId;
      
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
      }

      const options = {
        page: parseInt(page) || PAGINATION.DEFAULT_PAGE,
        limit: parseInt(limit) || PAGINATION.DEFAULT_LIMIT, // Consider a different default for admin, e.g., 20
        filter,
        populate: 'user address voucher', // Ensure these paths are correct for your OrderSchema
        sort: { createdAt: -1 }
      };

      const result = await this.service.getAll(options);
      ResponseHandler.success(res, orderMessages.ORDERS_FETCHED_SUCCESSFULLY, result);
    } catch (error) {
      next(error);
    }
  };

  // Cập nhật trạng thái đơn hàng (Admin)
  updateOrderStatus = async (req, res, next) => {
    try {
      const { status } = req.body;
      if (!status) {
        throw new AppError(orderMessages.ORDER_STATUS_REQUIRED, ERROR_CODES.BAD_REQUEST);
      }
      // Further validation for valid status values can be added here
      const order = await this.service.updateOrderStatus(req.params.id, status, req.user._id);
      ResponseHandler.success(res, orderMessages.ORDER_STATUS_UPDATED_SUCCESSFULLY, order);
    } catch (error) {
      next(error);
    }
  };

  // Hủy đơn hàng
  cancelOrder = async (req, res, next) => {
    try {
      const { reason } = req.body; // Reason might be useful for logging or display
      const userId = req.user.role === 'admin' ? null : req.user._id;
      
      const order = await this.service.cancelOrder(req.params.id, userId, reason);
      ResponseHandler.success(res, orderMessages.ORDER_CANCELLED_SUCCESSFULLY, order);
    } catch (error) {
      next(error);
    }
  };

  // Xóa đơn hàng (Admin only)
  deleteOrder = async (req, res, next) => {
    try {
      const order = await this.service.getById(req.params.id);
      
      if (!order) {
        throw new AppError(orderMessages.ORDER_NOT_FOUND, ERROR_CODES.ORDER.NOT_FOUND);
      }      // Consider using constants for 'cancelled' status
      if (order.status !== 'cancelled') {
        return ResponseHandler.badRequest(res, orderMessages.ORDER_CANCELLATION_NOT_ALLOWED); // Or a more specific message like 'ORDER_MUST_BE_CANCELLED_TO_DELETE'
      }

      await this.service.deleteOrder(req.params.id);
      ResponseHandler.success(res, orderMessages.RESOURCE_DELETED); // Using generic delete message
    } catch (error) {
      next(error);
    }
  };

  // Lấy thống kê đơn hàng
  getOrderStats = async (req, res, next) => {
    try {
      const { startDate, endDate } = req.query;
      const dateRange = {};
      
      if (startDate) dateRange.startDate = startDate;
      if (endDate) dateRange.endDate = endDate;

      const stats = await this.service.getOrderStats(dateRange);
      ResponseHandler.success(res, orderMessages.STATS_RETRIEVED, stats); // Assuming STATS_RETRIEVED is suitable
    } catch (error) {
      next(error);
    }
  };

  // Kiểm tra user có thể review sản phẩm không
  canReviewProduct = async (req, res, next) => {
    try {
      const { productId } = req.params;
      const canReview = await this.service.canUserReviewProduct(req.user._id, productId);
      // Consider creating specific messages for this in constants.js
      ResponseHandler.success(res, 'Kiểm tra quyền review thành công', { canReview });
    } catch (error) {
      next(error);
    }
  };

  // Lấy đơn hàng theo payment method
  getOrdersByPaymentMethod = async (req, res, next) => {
    try {
      const { paymentMethod } = req.params;
      const { page, limit } = req.query;

      const options = {
        page: parseInt(page) || PAGINATION.DEFAULT_PAGE,
        limit: parseInt(limit) || PAGINATION.DEFAULT_LIMIT
      };

      const result = await this.service.getOrdersByPaymentMethod(paymentMethod, options);
      ResponseHandler.success(res, orderMessages.ORDERS_FETCHED_SUCCESSFULLY, result);
    } catch (error) {
      next(error);
    }
  };

  // Tìm kiếm đơn hàng
  searchOrders = async (req, res, next) => {
    try {
      const { q, limit } = req.query;
      
      if (!q) {
        // Consider a specific message for missing search query from constants
        return ResponseHandler.badRequest(res, 'Thiếu từ khóa tìm kiếm');
      }

      const options = { limit: parseInt(limit) || PAGINATION.DEFAULT_LIMIT }; // Using default limit
      const orders = await this.service.searchOrders(q, options);
      // Consider a specific message for search success from constants
      ResponseHandler.success(res, 'Tìm kiếm đơn hàng thành công', orders);
    } catch (error) {
      next(error);
    }
  };

  // Lấy top sản phẩm bán chạy
  getTopSellingProducts = async (req, res, next) => {
    try {
      const { limit } = req.query;
      const products = await this.service.getTopSellingProducts(parseInt(limit) || PAGINATION.DEFAULT_LIMIT);
      // Consider a specific message for top selling products success from constants
      ResponseHandler.success(res, 'Lấy top sản phẩm bán chạy thành công', products);
    } catch (error) {
      next(error);
    }
  };

  // Lấy đơn hàng theo user ID (Admin)
  getOrdersByUserId = async (req, res, next) => {
    try {
      const { userId } = req.params;
      const { page, limit, status } = req.query;

      const options = {
        page: parseInt(page) || PAGINATION.DEFAULT_PAGE,
        limit: parseInt(limit) || PAGINATION.DEFAULT_LIMIT,
        status
      };

      const result = await this.service.getOrdersByUserId(userId, options); // Assuming this method exists in service
      ResponseHandler.success(res, orderMessages.ORDERS_FETCHED_SUCCESSFULLY, result);
    } catch (error) {
      next(error);
    }
  };

  // Tính phí ship dựa trên địa chỉ
  calculateShippingFee = async (req, res, next) => {
    try {
      const { addressId } = req.params;
      if (!addressId) {
        throw new AppError('ID địa chỉ là bắt buộc', ERROR_CODES.BAD_REQUEST);
      }

      const shippingInfo = await this.service.calculateShippingFee(addressId);
      ResponseHandler.success(res, 'Tính phí ship thành công', shippingInfo);
    } catch (error) {
      next(error);
    }
  };

  // Migration: Update shipping fees for existing orders (Admin only)
  updateExistingOrdersShippingFees = async (req, res, next) => {
    try {
      const result = await this.service.updateExistingOrdersShippingFees();
      ResponseHandler.success(res, 'Cập nhật phí ship thành công', result);
    } catch (error) {
      next(error);
    }
  };
  // Calculate order total (preview before placing order)
  calculateOrderTotal = async (req, res, next) => {
    try {
      // Validation
      if (!req.body.items || req.body.items.length === 0) {
        throw new AppError(orderMessages.ORDER_ITEMS_EMPTY, ERROR_CODES.BAD_REQUEST);
      }
      if (!req.body.address) {
        throw new AppError(orderMessages.ORDER_ADDRESS_REQUIRED, ERROR_CODES.BAD_REQUEST);
      }

      // Pass userId to check voucher usage
      const orderTotal = await this.service.calculateOrderTotal(req.body, req.user._id);
      ResponseHandler.success(res, 'Tính tổng tiền đơn hàng thành công', orderTotal);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = OrderController;
