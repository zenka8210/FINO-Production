const ReturnRequest = require('../models/returnRequestSchema');
const Order = require('../models/orderSchema');
const Product = require('../models/productSchema');
const User = require('../models/userSchema');
const { MESSAGES, ERROR_CODES } = require('../config/constants');
const { AppError } = require('../middlewares/errorHandler');
const LoggerService = require('./loggerService');

class ReturnRequestService {
  constructor() {
    this.logger = LoggerService;
  }

  /**
   * Lấy tất cả yêu cầu trả hàng với phân trang
   * @param {Object} query - Query parameters
   * @returns {Promise<Object>} - Danh sách yêu cầu trả hàng
   */
  async getAllReturnRequests(query = {}) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        search = '',
        status,
        refundStatus,
        userId,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = query;
      
      const skip = (page - 1) * limit;

      // Tạo filter
      const filter = {};
      if (search) {
        // Tìm kiếm theo mã đơn hàng hoặc tên người dùng
        const orders = await Order.find({
          $or: [
            { orderNumber: { $regex: search, $options: 'i' } }
          ]
        }).select('_id');
        
        const users = await User.find({
          $or: [
            { full_name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
          ]
        }).select('_id');

        filter.$or = [
          { order: { $in: orders.map(o => o._id) } },
          { user: { $in: users.map(u => u._id) } }
        ];
      }
      
      if (status) filter.status = status;
      if (refundStatus) filter.refundStatus = refundStatus;
      if (userId) filter.user = userId;

      // Tạo sort object
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const returnRequests = await ReturnRequest.find(filter)
        .populate('user', 'full_name email phone')
        .populate('order', 'orderNumber totalAmount createdAt')
        .populate('items.product', 'name images price')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));

      const total = await ReturnRequest.countDocuments(filter);

      return {
        message: MESSAGES.SUCCESS.DATA_RETRIEVED,
        returnRequests,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      };

    } catch (error) {
      this.logger.error('Get all return requests failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Lấy yêu cầu trả hàng theo ID
   * @param {string} returnRequestId - ID của yêu cầu trả hàng
   * @returns {Promise<Object>} - Thông tin yêu cầu trả hàng
   */
  async getReturnRequestById(returnRequestId) {
    try {
      const returnRequest = await ReturnRequest.findById(returnRequestId)
        .populate('user', 'full_name email phone address')
        .populate('order', 'orderNumber totalAmount items createdAt shippingAddress')
        .populate('items.product', 'name images price description category')
        .populate('voucherApplied', 'code name discountValue');
      
      if (!returnRequest) {
        throw new AppError('Không tìm thấy yêu cầu trả hàng', 404, ERROR_CODES.RETURN_REQUEST?.NOT_FOUND || 'RETURN_REQUEST_NOT_FOUND');
      }

      return {
        message: MESSAGES.SUCCESS.DATA_RETRIEVED,
        returnRequest
      };

    } catch (error) {
      this.logger.error('Get return request by ID failed', { 
        error: error.message,
        returnRequestId 
      });
      throw error;
    }
  }

  /**
   * Tạo yêu cầu trả hàng mới  
   * @param {string} userId - ID người dùng
   * @param {Object} returnData - Dữ liệu yêu cầu trả hàng
   * @returns {Promise<Object>} - Yêu cầu trả hàng được tạo
   */
  async createReturnRequest(userId, returnData) {
    try {
      const { orderId, items, reasonGeneral, restockingFee = 0 } = returnData;

      // Kiểm tra đơn hàng tồn tại và thuộc về user
      const order = await Order.findOne({ _id: orderId, user: userId })
        .populate('items.product');
      
      if (!order) {
        throw new AppError('Không tìm thấy đơn hàng hoặc bạn không có quyền truy cập', 404, ERROR_CODES.ORDER?.NOT_FOUND || 'ORDER_NOT_FOUND');
      }

      // Kiểm tra đơn hàng đã hoàn thành
      if (order.status !== 'delivered') {
        throw new AppError('Chỉ có thể tạo yêu cầu trả hàng cho đơn hàng đã giao', 400, ERROR_CODES.RETURN_REQUEST?.INVALID_ORDER_STATUS || 'INVALID_ORDER_STATUS');
      }

      // Kiểm tra thời hạn trả hàng (30 ngày)
      const deliveryDate = order.updatedAt; // hoặc delivery date riêng nếu có
      const returnDeadline = new Date(deliveryDate);
      returnDeadline.setDate(returnDeadline.getDate() + 30);
      
      if (new Date() > returnDeadline) {
        throw new AppError('Đã quá thời hạn trả hàng (30 ngày)', 400, ERROR_CODES.RETURN_REQUEST?.EXPIRED || 'RETURN_REQUEST_EXPIRED');
      }

      // Kiểm tra đã có yêu cầu trả hàng chưa
      const existingReturn = await ReturnRequest.findOne({ 
        order: orderId, 
        status: { $in: ['pending', 'approved', 'processing'] } 
      });
      
      if (existingReturn) {
        throw new AppError('Đơn hàng này đã có yêu cầu trả hàng đang xử lý', 400, ERROR_CODES.RETURN_REQUEST?.ALREADY_EXISTS || 'RETURN_REQUEST_EXISTS');
      }

      // Validate items và tính toán refund amount
      let totalRefundAmount = 0;
      const validatedItems = [];

      for (const item of items) {
        const orderItem = order.items.find(oi => 
          oi.product._id.toString() === item.productId && 
          oi.variant === item.variant
        );

        if (!orderItem) {
          throw new AppError(`Sản phẩm không tồn tại trong đơn hàng`, 400, ERROR_CODES.RETURN_REQUEST?.INVALID_ITEM || 'INVALID_RETURN_ITEM');
        }

        if (item.quantity > orderItem.quantity) {
          throw new AppError(`Số lượng trả vượt quá số lượng đã mua`, 400, ERROR_CODES.RETURN_REQUEST?.INVALID_QUANTITY || 'INVALID_RETURN_QUANTITY');
        }

        const itemRefund = orderItem.price * item.quantity;
        totalRefundAmount += itemRefund;

        validatedItems.push({
          product: item.productId,
          variant: item.variant,
          quantity: item.quantity,
          priceAtPurchase: orderItem.price,
          reason: item.reason
        });
      }

      // Trừ phí xử lý
      totalRefundAmount = Math.max(0, totalRefundAmount - restockingFee);

      // Tạo return request
      const returnRequest = new ReturnRequest({
        user: userId,
        order: orderId,
        items: validatedItems,
        reasonGeneral,
        refundAmount: totalRefundAmount,
        restockingFee,
        returnDeadline,
        voucherApplied: order.voucher || null,
        voucherDiscount: order.voucherDiscount || 0
      });

      await returnRequest.save();

      // Populate data before return
      await returnRequest.populate([
        { path: 'user', select: 'full_name email' },
        { path: 'order', select: 'orderNumber totalAmount' },
        { path: 'items.product', select: 'name images price' }
      ]);

      this.logger.info('Return request created successfully', { 
        returnRequestId: returnRequest._id,
        userId,
        orderId 
      });

      return {
        message: 'Tạo yêu cầu trả hàng thành công',
        returnRequest
      };

    } catch (error) {
      this.logger.error('Create return request failed', { 
        error: error.message,
        userId,
        returnData 
      });
      throw error;
    }
  }

  /**
   * Cập nhật trạng thái yêu cầu trả hàng
   * @param {string} returnRequestId - ID yêu cầu trả hàng
   * @param {Object} updateData - Dữ liệu cập nhật
   * @returns {Promise<Object>} - Yêu cầu trả hàng đã cập nhật
   */
  async updateReturnRequestStatus(returnRequestId, updateData) {
    try {
      const { status, refundStatus, adminNotes } = updateData;

      const returnRequest = await ReturnRequest.findById(returnRequestId);
      
      if (!returnRequest) {
        throw new AppError('Không tìm thấy yêu cầu trả hàng', 404, ERROR_CODES.RETURN_REQUEST?.NOT_FOUND || 'RETURN_REQUEST_NOT_FOUND');
      }

      // Validate status transitions
      const validTransitions = {
        'pending': ['approved', 'rejected'],
        'approved': ['processing', 'cancelled'],
        'processing': ['completed', 'cancelled'],
        'rejected': [],
        'completed': [],
        'cancelled': []
      };

      if (status && !validTransitions[returnRequest.status]?.includes(status)) {
        throw new AppError(`Không thể chuyển từ trạng thái ${returnRequest.status} sang ${status}`, 400, ERROR_CODES.RETURN_REQUEST?.INVALID_STATUS_TRANSITION || 'INVALID_STATUS_TRANSITION');
      }

      // Update fields
      if (status) returnRequest.status = status;
      if (refundStatus) returnRequest.refundStatus = refundStatus;
      if (adminNotes) returnRequest.adminNotes = adminNotes;

      await returnRequest.save();

      await returnRequest.populate([
        { path: 'user', select: 'full_name email' },
        { path: 'order', select: 'orderNumber totalAmount' },
        { path: 'items.product', select: 'name images price' }
      ]);

      this.logger.info('Return request status updated', { 
        returnRequestId,
        status,
        refundStatus 
      });

      return {
        message: 'Cập nhật trạng thái thành công',
        returnRequest
      };

    } catch (error) {
      this.logger.error('Update return request status failed', { 
        error: error.message,
        returnRequestId,
        updateData 
      });
      throw error;
    }
  }

  /**
   * Xóa yêu cầu trả hàng (chỉ với trạng thái pending)
   * @param {string} returnRequestId - ID yêu cầu trả hàng
   * @param {string} userId - ID người dùng (để kiểm tra quyền)
   * @returns {Promise<Object>} - Kết quả xóa
   */
  async deleteReturnRequest(returnRequestId, userId) {
    try {
      const returnRequest = await ReturnRequest.findOne({ 
        _id: returnRequestId, 
        user: userId 
      });
      
      if (!returnRequest) {
        throw new AppError('Không tìm thấy yêu cầu trả hàng hoặc bạn không có quyền truy cập', 404, ERROR_CODES.RETURN_REQUEST?.NOT_FOUND || 'RETURN_REQUEST_NOT_FOUND');
      }

      if (returnRequest.status !== 'pending') {
        throw new AppError('Chỉ có thể xóa yêu cầu trả hàng ở trạng thái chờ xử lý', 400, ERROR_CODES.RETURN_REQUEST?.CANNOT_DELETE || 'CANNOT_DELETE_RETURN_REQUEST');
      }

      await ReturnRequest.findByIdAndDelete(returnRequestId);

      this.logger.info('Return request deleted successfully', { 
        returnRequestId,
        userId 
      });

      return {
        message: 'Xóa yêu cầu trả hàng thành công'
      };

    } catch (error) {
      this.logger.error('Delete return request failed', { 
        error: error.message,
        returnRequestId,
        userId 
      });
      throw error;
    }
  }

  /**
   * Lấy yêu cầu trả hàng của người dùng
   * @param {string} userId - ID người dùng
   * @param {Object} query - Query parameters
   * @returns {Promise<Object>} - Danh sách yêu cầu trả hàng của user
   */
  async getUserReturnRequests(userId, query = {}) {
    try {
      const { page = 1, limit = 10, status } = query;
      const skip = (page - 1) * limit;

      const filter = { user: userId };
      if (status) filter.status = status;

      const returnRequests = await ReturnRequest.find(filter)
        .populate('order', 'orderNumber totalAmount createdAt')
        .populate('items.product', 'name images price')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await ReturnRequest.countDocuments(filter);

      return {
        message: MESSAGES.SUCCESS.DATA_RETRIEVED,
        returnRequests,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      };

    } catch (error) {
      this.logger.error('Get user return requests failed', { 
        error: error.message,
        userId 
      });
      throw error;
    }
  }

  /**
   * Lấy thống kê yêu cầu trả hàng
   * @returns {Promise<Object>} - Thống kê yêu cầu trả hàng
   */
  async getReturnRequestStatistics() {
    try {
      const stats = await ReturnRequest.aggregate([
        {
          $facet: {
            total: [{ $count: "count" }],
            byStatus: [
              {
                $group: {
                  _id: "$status",
                  count: { $sum: 1 },
                  totalRefundAmount: { $sum: "$refundAmount" }
                }
              }
            ],
            byRefundStatus: [
              {
                $group: {
                  _id: "$refundStatus",
                  count: { $sum: 1 },
                  totalAmount: { $sum: "$refundAmount" }
                }
              }
            ],
            monthlyStats: [
              {
                $group: {
                  _id: {
                    year: { $year: "$createdAt" },
                    month: { $month: "$createdAt" }
                  },
                  count: { $sum: 1 },
                  totalRefundAmount: { $sum: "$refundAmount" }
                }
              },
              { $sort: { "_id.year": -1, "_id.month": -1 } },
              { $limit: 12 }
            ]
          }
        }
      ]);

      const statistics = {
        total: stats[0].total[0]?.count || 0,
        byStatus: stats[0].byStatus || [],
        byRefundStatus: stats[0].byRefundStatus || [],
        monthlyStats: stats[0].monthlyStats || []
      };

      return {
        message: MESSAGES.SUCCESS.DATA_RETRIEVED,
        statistics
      };

    } catch (error) {
      this.logger.error('Get return request statistics failed', { error: error.message });
      throw error;
    }
  }
}

module.exports = ReturnRequestService;
