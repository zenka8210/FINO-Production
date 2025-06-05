const Order = require('../models/orderSchema');
const BaseController = require('./baseController');
const orderService = require('../services/orderService');
const ResponseHandler = require('../services/responseHandler');
const logger = require('../services/loggerService').getLogger('OrderController');
const { PAGINATION, MESSAGES } = require('../config/constants');

/**
 * Controller xử lý các request liên quan đến đơn hàng
 * Kế thừa từ BaseController
 */
class OrderController extends BaseController {
  constructor() {
    super(Order);
  }

  /**
   * Tạo đơn hàng mới
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async createOrder(req, res, next) {
    try {
      const orderData = req.body;
      const savedOrder = await orderService.createOrder(orderData, req.user);
      return ResponseHandler.created(res, MESSAGES.ORDER_PLACED, savedOrder);
    } catch (error) {
      logger.error('Lỗi khi tạo đơn hàng', { error: error.message });
      next(error);
    }
  }

  /**
   * [Admin] Lấy danh sách tất cả đơn hàng (có phân trang và lọc)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getOrders(req, res, next) {
    try {
      // Xử lý các tham số query
      const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
      const limit = parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT;
      const status = req.query.status;
      const paymentStatus = req.query.paymentStatus;
      const sortBy = req.query.sortBy || 'createdAt';
      const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
      
      // Xây dựng filter
      const filter = {};
      if (status) filter.status = status;
      if (paymentStatus) filter.paymentStatus = paymentStatus;
      
      // Xây dựng options
      const options = {
        page,
        limit,
        sort: { [sortBy]: sortOrder }
      };
      
      // Lấy danh sách đơn hàng từ service
      const result = await orderService.getOrders(filter, options);
      
      return ResponseHandler.success(res, result, 'Lấy danh sách đơn hàng thành công');
    } catch (error) {
      logger.error('Lỗi khi lấy danh sách đơn hàng', { error: error.message });
      next(error);
    }
  }

  /**
   * [Auth] Lấy đơn hàng theo ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getOrderById(req, res, next) {
    try {
      const orderId = req.params.id;
      const order = await orderService.getOrderById(orderId);
      
      // Kiểm tra quyền truy cập
      if (req.user.role !== 'admin' && order.user._id.toString() !== req.user._id.toString()) {
        return ResponseHandler.forbidden(res, 'Bạn không có quyền truy cập đơn hàng này');
      }

      return ResponseHandler.success(res, order, 'Lấy đơn hàng thành công');
    } catch (error) {
      logger.error('Lỗi khi lấy đơn hàng', { orderId: req.params.id, error: error.message });
      next(error);
    }
  }

  /**
   * [User] Lấy đơn hàng của người dùng hiện tại
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getUserOrders(req, res, next) {
    try {
      const userId = req.params.userId || req.user._id;
      
      // Kiểm tra quyền truy cập
      if (req.user.role !== 'admin' && req.user._id.toString() !== userId.toString()) {
        return ResponseHandler.forbidden(res, 'Bạn không có quyền truy cập đơn hàng của người khác');
      }

      const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
      const limit = parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT;
      
      const options = { page, limit };
      const result = await orderService.getUserOrders(userId, options);
      
      return ResponseHandler.success(res, result, 'Lấy đơn hàng của user thành công');
    } catch (error) {
      logger.error('Lỗi khi lấy đơn hàng của user', { userId: req.params.userId, error: error.message });
      next(error);
    }
  }

  /**
   * [Admin] Cập nhật trạng thái đơn hàng
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateOrderStatus(req, res, next) {
    try {
      const orderId = req.params.id;
      const updateData = req.body;
      
      const updatedOrder = await orderService.updateOrderStatus(orderId, updateData);
      
      return ResponseHandler.success(res, updatedOrder, 'Cập nhật trạng thái đơn hàng thành công');
    } catch (error) {
      logger.error('Lỗi khi cập nhật trạng thái đơn hàng', { orderId: req.params.id, error: error.message });
      next(error);
    }
  }

  /**
   * [Admin] Xóa đơn hàng
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async deleteOrder(req, res, next) {
    try {
      const orderId = req.params.id;
      await orderService.deleteOrder(orderId);
      
      return ResponseHandler.success(res, null, 'Xóa đơn hàng thành công');
    } catch (error) {
      logger.error('Lỗi khi xóa đơn hàng', { orderId: req.params.id, error: error.message });
      next(error);
    }
  }

  /**
   * [User] Kiểm tra xem user có thể đánh giá sản phẩm không
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async canReviewProduct(req, res, next) {
    try {
      const { productId } = req.params;
      const userId = req.user._id;

      const order = await Order.findOne({
        user: userId,
        status: 'delivered',
        'items.product': productId
      });

      if (!order) {
        return ResponseHandler.forbidden(res, 'Bạn chưa mua sản phẩm này hoặc đơn chưa được giao');
      }

      return ResponseHandler.success(res, { canReview: true }, 'Bạn có thể đánh giá sản phẩm');
    } catch (error) {
      logger.error('Lỗi khi kiểm tra quyền đánh giá', { productId: req.params.productId, error: error.message });
      next(error);
    }
  }
}

// Tạo instance của OrderController
const orderController = new OrderController();

// Export các methods với cú pháp tương thích
module.exports = {
  createOrder: orderController.createOrder.bind(orderController),
  getOrders: orderController.getOrders.bind(orderController),
  getOrderById: orderController.getOrderById.bind(orderController),
  getUserOrders: orderController.getUserOrders.bind(orderController),
  getOrdersByUser: orderController.getUserOrders.bind(orderController), // Alias cho tương thích
  updateOrderStatus: orderController.updateOrderStatus.bind(orderController),
  deleteOrder: orderController.deleteOrder.bind(orderController),
  canReviewProduct: orderController.canReviewProduct.bind(orderController),
  
  // Các methods từ BaseController
  getAll: orderController.getAll.bind(orderController),
  getById: orderController.getById.bind(orderController),
  create: orderController.create.bind(orderController),
  update: orderController.update.bind(orderController),
  delete: orderController.delete.bind(orderController)
};
