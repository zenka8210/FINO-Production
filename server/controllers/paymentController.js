const BaseController = require('./baseController');
const PaymentService = require('../services/paymentService');
const ResponseHandler = require('../services/responseHandler');

class PaymentController extends BaseController {
  constructor() {
    super();
    this.paymentService = new PaymentService();
  }

  /**
   * Xử lý thanh toán cho đơn hàng
   */
  processPayment = async (req, res, next) => {
    try {
      const { orderId, paymentMethod, paymentDetails } = req.body;
      
      // Get order information (this would typically come from OrderService)
      const Order = require('../models/orderSchema');
      const order = await Order.findById(orderId);
      
      if (!order) {
        return ResponseHandler.notFound(res, 'Không tìm thấy đơn hàng');
      }

      const result = await this.paymentService.processPayment(order, paymentMethod, paymentDetails);
      
      ResponseHandler.success(res, result.message, {
        payment: result.payment
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Cập nhật trạng thái thanh toán
   */
  updatePaymentStatus = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status, gatewayResponse } = req.body;
      
      const result = await this.paymentService.updatePaymentStatus(id, status, gatewayResponse);
      
      ResponseHandler.success(res, result.message, {
        payment: result.payment
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Lấy thông tin thanh toán theo đơn hàng
   */
  getPaymentByOrderId = async (req, res, next) => {
    try {
      const { orderId } = req.params;
      
      const result = await this.paymentService.getPaymentByOrderId(orderId);
      
      ResponseHandler.success(res, result.message, {
        payment: result.payment
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Lấy lịch sử thanh toán với phân trang
   */
  getPaymentHistory = async (req, res, next) => {
    try {
      const query = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        status: req.query.status,
        method: req.query.method,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };

      const result = await this.paymentService.getPaymentHistory(query);
      
      ResponseHandler.success(res, result.message, {
        payments: result.payments,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Xử lý webhook từ VNPay
   */
  handleVNPayWebhook = async (req, res, next) => {
    try {
      const webhookData = req.body;
      
      const result = await this.paymentService.handlePaymentWebhook('vnpay', webhookData);
      
      ResponseHandler.success(res, 'Webhook xử lý thành công', result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Xử lý webhook từ Momo
   */
  handleMomoWebhook = async (req, res, next) => {
    try {
      const webhookData = req.body;
      
      const result = await this.paymentService.handlePaymentWebhook('momo', webhookData);
      
      ResponseHandler.success(res, 'Webhook xử lý thành công', result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Xử lý webhook từ ZaloPay
   */
  handleZaloPayWebhook = async (req, res, next) => {
    try {
      const webhookData = req.body;
      
      const result = await this.paymentService.handlePaymentWebhook('zalopay', webhookData);
      
      ResponseHandler.success(res, 'Webhook xử lý thành công', result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Lấy các phương thức thanh toán khả dụng
   */
  getPaymentMethods = async (req, res, next) => {
    try {
      const paymentMethods = [
        {
          code: 'COD',
          name: 'Thanh toán khi nhận hàng',
          description: 'Thanh toán bằng tiền mặt khi nhận hàng',
          isActive: true,
          icon: 'cod-icon.png'
        },
        {
          code: 'VNPay',
          name: 'VNPay',
          description: 'Thanh toán qua cổng VNPay',
          isActive: true,
          icon: 'vnpay-icon.png'
        },
        {
          code: 'Momo',
          name: 'Ví MoMo',
          description: 'Thanh toán qua ví điện tử MoMo',
          isActive: true,
          icon: 'momo-icon.png'
        },
        {
          code: 'ZaloPay',
          name: 'ZaloPay',
          description: 'Thanh toán qua ví ZaloPay',
          isActive: true,
          icon: 'zalopay-icon.png'
        },
        {
          code: 'BankTransfer',
          name: 'Chuyển khoản ngân hàng',
          description: 'Chuyển khoản trực tiếp qua ngân hàng',
          isActive: true,
          icon: 'bank-icon.png'
        }
      ];

      ResponseHandler.success(res, 'Lấy danh sách phương thức thanh toán thành công', {
        paymentMethods
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Lấy thống kê thanh toán (admin only)
   */
  getPaymentStatistics = async (req, res, next) => {
    try {
      const { startDate, endDate, groupBy = 'day' } = req.query;
      
      // Build match condition
      const matchCondition = {};
      if (startDate || endDate) {
        matchCondition.createdAt = {};
        if (startDate) matchCondition.createdAt.$gte = new Date(startDate);
        if (endDate) matchCondition.createdAt.$lte = new Date(endDate);
      }

      const Payment = require('../models/paymentSchema');
      
      // Get payment statistics
      const totalStats = await Payment.aggregate([
        { $match: matchCondition },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' },
            totalCount: { $sum: 1 },
            completedAmount: {
              $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, '$amount', 0] }
            },
            completedCount: {
              $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
            },
            pendingCount: {
              $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] }
            },
            failedCount: {
              $sum: { $cond: [{ $eq: ['$status', 'Failed'] }, 1, 0] }
            }
          }
        }
      ]);

      // Get payment method statistics
      const methodStats = await Payment.aggregate([
        { $match: matchCondition },
        {
          $group: {
            _id: '$method',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            completedAmount: {
              $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, '$amount', 0] }
            }
          }
        },
        { $sort: { totalAmount: -1 } }
      ]);

      ResponseHandler.success(res, 'Lấy thống kê thanh toán thành công', {
        totalStats: totalStats[0] || {},
        methodStats
      });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new PaymentController();