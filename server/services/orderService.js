const Order = require('../models/orderSchema');
const Voucher = require('../models/voucherSchema');
const Payment = require('../models/paymentSchema');
const Product = require('../models/productSchema');
const logger = require('./loggerService').getLogger('OrderService');
const { PAGINATION, ORDER_STATUS } = require('../config/constants');
const mongoose = require('mongoose');

/**
 * Service xử lý logic liên quan đến đơn hàng
 */
class OrderService {
  /**
   * Tạo đơn hàng mới
   * @param {Object} orderData - Thông tin đơn hàng
   * @param {Object} user - Thông tin người dùng
   * @returns {Promise<Object>} Đơn hàng đã được tạo
   */
  async createOrder(orderData, user) {
    try {
      const { items, shippingAddress, payment, paymentMethod, voucherCode, shippingFee } = orderData;
      const userId = user._id;

      // Validate dữ liệu đầu vào
      this.validateOrderData(orderData);

      // Tính tổng ban đầu
      const originalTotal = this.calculateOriginalTotal(items);
      
      // Xử lý voucher nếu có
      const { discountAmount, appliedVoucher } = await this.processVoucher(voucherCode, originalTotal);
      
      // Tính phí vận chuyển
      const shippingFeeValue = this.calculateShippingFee(shippingAddress, shippingFee);
      
      // Tính tổng cuối cùng
      const finalTotal = originalTotal - discountAmount + shippingFeeValue;

      // Tạo đơn hàng mới
      const newOrder = new Order({
        user: userId,
        items,
        shippingAddress,
        total: originalTotal,
        discountAmount,
        voucher: appliedVoucher ? appliedVoucher._id : null,
        payment,
        paymentMethod,
        status: ORDER_STATUS.PENDING,
        shippingFee: shippingFeeValue,
        shippingMethod: 'standard',
        note: orderData.note || '',
        finalTotal,
        paymentStatus: 'unpaid'
      });

      // Lưu đơn hàng
      const savedOrder = await newOrder.save();
      logger.info('Đơn hàng được tạo thành công', { orderId: savedOrder._id });
      
      return savedOrder;
    } catch (error) {
      logger.error('Lỗi khi tạo đơn hàng', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Validate dữ liệu đơn hàng đầu vào
   * @param {Object} orderData - Dữ liệu đơn hàng
   */
  validateOrderData(orderData) {
    const { items, shippingAddress, paymentMethod } = orderData;
    const validPaymentMethods = ['COD', 'CreditCard', 'BankTransfer', 'Momo', 'ZaloPay', 'VNPay'];
    
    if (!validPaymentMethods.includes(paymentMethod)) {
      const error = new Error('Phương thức thanh toán không hợp lệ');
      error.name = 'ValidationError';
      throw error;
    }
    
    if (!items || items.length === 0) {
      const error = new Error('Danh sách sản phẩm không được để trống');
      error.name = 'ValidationError';
      throw error;
    }

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.address || !shippingAddress.city) {
      const error = new Error('Địa chỉ vận chuyển không hợp lệ');
      error.name = 'ValidationError';
      throw error;
    }
  }

  /**
   * Tính tổng giá trị ban đầu của đơn hàng
   * @param {Array} items - Danh sách sản phẩm
   * @returns {Number} Tổng giá trị
   */
  calculateOriginalTotal(items) {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  /**
   * Xử lý voucher
   * @param {String} voucherCode - Mã voucher
   * @param {Number} originalTotal - Tổng giá trị ban đầu
   * @returns {Object} Thông tin voucher và giảm giá
   */
  async processVoucher(voucherCode, originalTotal) {
    let discountAmount = 0;
    let appliedVoucher = null;

    if (voucherCode) {
      const voucher = await Voucher.findOne({
        code: voucherCode,
        status: 'active',
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() },
        quantity: { $gt: 0 }
      });

      if (!voucher) {
        const error = new Error('Voucher không hợp lệ hoặc đã hết hạn');
        error.name = 'ValidationError';
        throw error;
      }

      if (voucher.type === 'percentage') {
        discountAmount = (originalTotal * voucher.value) / 100;
        if (voucher.maxDiscount && discountAmount > voucher.maxDiscount) {
          discountAmount = voucher.maxDiscount;
        }
      } else if (voucher.type === 'fixed') {
        discountAmount = voucher.value;
      }

      if (discountAmount > originalTotal) discountAmount = originalTotal;

      // Giảm số lượng voucher
      voucher.quantity -= 1;
      await voucher.save();

      appliedVoucher = voucher;
    }

    return { discountAmount, appliedVoucher };
  }

  /**
   * Tính phí vận chuyển
   * @param {Object} shippingAddress - Địa chỉ vận chuyển
   * @param {Number} shippingFeeProvided - Phí vận chuyển được cung cấp
   * @returns {Number} Phí vận chuyển cuối cùng
   */
  calculateShippingFee(shippingAddress, shippingFeeProvided) {
    let shippingFeeDefault = 60000; // mặc định
    
    if (shippingAddress && shippingAddress.city) {
      const cityNormalized = shippingAddress.city.trim().toLowerCase();
      if (cityNormalized === 'hcm' || cityNormalized === 'tp.hcm' || cityNormalized === 'thành phố hồ chí minh') {
        shippingFeeDefault = 30000;
      }
    }

    return typeof shippingFeeProvided === 'number' ? shippingFeeProvided : shippingFeeDefault;
  }

  /**
   * Lấy danh sách đơn hàng (phân trang, có thể lọc)
   * @param {Object} filter - Điều kiện lọc
   * @param {Object} options - Tùy chọn phân trang và sắp xếp
   * @returns {Promise<Object>} Danh sách đơn hàng và thông tin phân trang
   */
  async getOrders(filter = {}, options = {}) {
    try {
      const page = parseInt(options.page) || PAGINATION.DEFAULT_PAGE;
      const limit = parseInt(options.limit) || PAGINATION.DEFAULT_LIMIT;
      const skip = (page - 1) * limit;
      const sort = options.sort || { createdAt: -1 };

      // Đếm tổng số đơn hàng theo điều kiện filter
      const total = await Order.countDocuments(filter);
      
      // Lấy danh sách đơn hàng với populate
      const orders = await Order.find(filter)
        .populate('user', 'name email')
        .populate('payment')
        .populate('voucher', 'code value type')
        .sort(sort)
        .skip(skip)
        .limit(limit);

      // Tính toán thông tin phân trang
      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;
      
      return {
        data: orders,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext,
          hasPrev
        }
      };
    } catch (error) {
      logger.error('Lỗi khi lấy danh sách đơn hàng', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Lấy thông tin chi tiết đơn hàng theo ID
   * @param {String} orderId - ID của đơn hàng
   * @returns {Promise<Object>} Thông tin chi tiết đơn hàng
   */
  async getOrderById(orderId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        const error = new Error('ID đơn hàng không hợp lệ');
        error.name = 'ValidationError';
        throw error;
      }

      const order = await Order.findById(orderId)
        .populate('user', 'name email phone')
        .populate('payment')
        .populate('voucher', 'code value type');

      if (!order) {
        const error = new Error('Không tìm thấy đơn hàng');
        error.name = 'NotFoundError';
        throw error;
      }

      return order;
    } catch (error) {
      logger.error('Lỗi khi lấy thông tin đơn hàng', { orderId, error: error.message });
      throw error;
    }
  }

  /**
   * Lấy danh sách đơn hàng của một người dùng
   * @param {String} userId - ID người dùng
   * @param {Object} options - Tùy chọn phân trang và sắp xếp
   * @returns {Promise<Object>} Danh sách đơn hàng và thông tin phân trang
   */
  async getUserOrders(userId, options = {}) {
    try {
      return await this.getOrders({ user: userId }, options);
    } catch (error) {
      logger.error('Lỗi khi lấy đơn hàng của người dùng', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Cập nhật trạng thái đơn hàng
   * @param {String} orderId - ID đơn hàng
   * @param {Object} updateData - Dữ liệu cập nhật
   * @returns {Promise<Object>} Đơn hàng đã được cập nhật
   */
  async updateOrderStatus(orderId, updateData) {
    try {
      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        const error = new Error('ID đơn hàng không hợp lệ');
        error.name = 'ValidationError';
        throw error;
      }

      const order = await Order.findById(orderId);
      if (!order) {
        const error = new Error('Không tìm thấy đơn hàng');
        error.name = 'NotFoundError';
        throw error;
      }

      // Cập nhật trạng thái đơn hàng
      if (updateData.status) {
        // Kiểm tra trạng thái hợp lệ
        const validStatuses = Object.values(ORDER_STATUS);
        if (!validStatuses.includes(updateData.status)) {
          const error = new Error('Trạng thái đơn hàng không hợp lệ');
          error.name = 'ValidationError';
          throw error;
        }
        order.status = updateData.status;
      }

      // Cập nhật trạng thái thanh toán
      if (updateData.paymentStatus) {
        if (!['paid', 'unpaid'].includes(updateData.paymentStatus)) {
          const error = new Error('Trạng thái thanh toán không hợp lệ');
          error.name = 'ValidationError';
          throw error;
        }
        order.paymentStatus = updateData.paymentStatus;
      }

      // Có thể mở rộng để cập nhật các trường khác

      const updatedOrder = await order.save();
      logger.info('Cập nhật trạng thái đơn hàng thành công', { orderId, newStatus: order.status });
      
      return updatedOrder;
    } catch (error) {
      logger.error('Lỗi khi cập nhật trạng thái đơn hàng', { orderId, error: error.message });
      throw error;
    }
  }

  /**
   * Xóa đơn hàng (chỉ dành cho admin và trong trường hợp cần thiết)
   * @param {String} orderId - ID đơn hàng
   * @returns {Promise<Boolean>} Kết quả xóa
   */
  async deleteOrder(orderId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        const error = new Error('ID đơn hàng không hợp lệ');
        error.name = 'ValidationError';
        throw error;
      }

      const result = await Order.findByIdAndDelete(orderId);
      
      if (!result) {
        const error = new Error('Không tìm thấy đơn hàng');
        error.name = 'NotFoundError';
        throw error;
      }

      logger.info('Đã xóa đơn hàng', { orderId });
      return true;
    } catch (error) {
      logger.error('Lỗi khi xóa đơn hàng', { orderId, error: error.message });
      throw error;
    }
  }
}

module.exports = new OrderService();
