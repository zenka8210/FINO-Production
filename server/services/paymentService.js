const Order = require('../models/orderSchema');
const Payment = require('../models/paymentSchema');
const { MESSAGES, ERROR_CODES, PAYMENT_METHODS, ORDER_STATUS } = require('../config/constants');
const { AppError } = require('../middlewares/errorHandler');
const LoggerService = require('./loggerService');
const crypto = require('crypto');

class PaymentService {
  constructor() {
    this.logger = LoggerService;
  }

  /**
   * Xử lý thanh toán cho đơn hàng
   * @param {Object} orderData - Thông tin đơn hàng
   * @param {string} paymentMethod - Phương thức thanh toán
   * @param {Object} paymentDetails - Chi tiết thanh toán
   * @returns {Promise<Object>} - Kết quả xử lý thanh toán
   */
  async processPayment(orderData, paymentMethod, paymentDetails = {}) {
    try {
      this.logger.info('Processing payment', { 
        orderId: orderData._id, 
        method: paymentMethod,
        amount: orderData.finalTotal 
      });

      // Validate payment method
      const validMethods = ['COD', 'CreditCard', 'BankTransfer', 'Momo', 'ZaloPay', 'VNPay'];
      if (!validMethods.includes(paymentMethod)) {
        throw new AppError(MESSAGES.ERROR.PAYMENT.INVALID_METHOD, 400, ERROR_CODES.PAYMENT.INVALID_METHOD);
      }

      // Create payment record
      const paymentData = {
        order: orderData._id,
        amount: orderData.finalTotal,
        method: paymentMethod,
        status: 'Pending',
        transactionId: this.generateTransactionId(),
        paymentDetails: paymentDetails
      };

      // Process based on payment method
      let paymentResult;
      switch (paymentMethod) {
        case 'COD':
          paymentResult = await this.processCODPayment(paymentData);
          break;
        case 'VNPay':
          paymentResult = await this.processVNPayPayment(paymentData, paymentDetails);
          break;
        case 'Momo':
          paymentResult = await this.processMomoPayment(paymentData, paymentDetails);
          break;
        case 'ZaloPay':
          paymentResult = await this.processZaloPayPayment(paymentData, paymentDetails);
          break;
        case 'BankTransfer':
          paymentResult = await this.processBankTransferPayment(paymentData, paymentDetails);
          break;
        default:
          paymentResult = await this.processOnlinePayment(paymentData, paymentDetails);
      }

      // Update order payment status
      await this.updateOrderPaymentStatus(orderData._id, paymentResult.status);

      this.logger.info('Payment processed successfully', { 
        paymentId: paymentResult._id,
        status: paymentResult.status 
      });

      return {
        message: MESSAGES.SUCCESS.PAYMENT.PROCESSED,
        payment: paymentResult
      };

    } catch (error) {
      this.logger.error('Payment processing failed', { 
        error: error.message,
        orderId: orderData._id 
      });
      throw error;
    }
  }

  /**
   * Xử lý thanh toán COD
   */
  async processCODPayment(paymentData) {
    try {
      paymentData.status = 'Pending';
      const payment = new Payment(paymentData);
      return await payment.save();
    } catch (error) {
      throw new AppError(MESSAGES.ERROR.PAYMENT.COD_FAILED, 400, ERROR_CODES.PAYMENT.PROCESSING_FAILED);
    }
  }

  /**
   * Xử lý thanh toán VNPay
   */
  async processVNPayPayment(paymentData, paymentDetails) {
    try {
      // Simulate VNPay API integration
      // In production, integrate with actual VNPay API
      const vnpayUrl = this.generateVNPayUrl(paymentData, paymentDetails);
      
      paymentData.status = 'Pending';
      paymentData.gatewayUrl = vnpayUrl;
      paymentData.gatewayResponse = { redirectUrl: vnpayUrl };
      
      const payment = new Payment(paymentData);
      return await payment.save();
    } catch (error) {
      throw new AppError(MESSAGES.ERROR.PAYMENT.VNPAY_FAILED, 400, ERROR_CODES.PAYMENT.GATEWAY_ERROR);
    }
  }

  /**
   * Xử lý thanh toán Momo
   */
  async processMomoPayment(paymentData, paymentDetails) {
    try {
      // Simulate Momo API integration
      const momoResponse = await this.callMomoAPI(paymentData, paymentDetails);
      
      paymentData.status = 'Pending';
      paymentData.gatewayResponse = momoResponse;
      
      const payment = new Payment(paymentData);
      return await payment.save();
    } catch (error) {
      throw new AppError(MESSAGES.ERROR.PAYMENT.MOMO_FAILED, 400, ERROR_CODES.PAYMENT.GATEWAY_ERROR);
    }
  }

  /**
   * Xử lý thanh toán ZaloPay
   */
  async processZaloPayPayment(paymentData, paymentDetails) {
    try {
      // Simulate ZaloPay API integration
      const zaloResponse = await this.callZaloPayAPI(paymentData, paymentDetails);
      
      paymentData.status = 'Pending';
      paymentData.gatewayResponse = zaloResponse;
      
      const payment = new Payment(paymentData);
      return await payment.save();
    } catch (error) {
      throw new AppError(MESSAGES.ERROR.PAYMENT.ZALOPAY_FAILED, 400, ERROR_CODES.PAYMENT.GATEWAY_ERROR);
    }
  }

  /**
   * Xử lý chuyển khoản ngân hàng
   */
  async processBankTransferPayment(paymentData, paymentDetails) {
    try {
      paymentData.status = 'Pending';
      paymentData.bankInfo = {
        bankName: paymentDetails.bankName || 'Vietcombank',
        accountNumber: paymentDetails.accountNumber || '1234567890',
        accountHolder: paymentDetails.accountHolder || 'Cửa hàng ABC',
        transferNote: `DH${paymentData.transactionId}`
      };
      
      const payment = new Payment(paymentData);
      return await payment.save();
    } catch (error) {
      throw new AppError(MESSAGES.ERROR.PAYMENT.BANK_TRANSFER_FAILED, 400, ERROR_CODES.PAYMENT.PROCESSING_FAILED);
    }
  }

  /**
   * Xử lý thanh toán online khác
   */
  async processOnlinePayment(paymentData, paymentDetails) {
    try {
      paymentData.status = 'Pending';
      const payment = new Payment(paymentData);
      return await payment.save();
    } catch (error) {
      throw new AppError(MESSAGES.ERROR.PAYMENT.ONLINE_FAILED, 400, ERROR_CODES.PAYMENT.PROCESSING_FAILED);
    }
  }

  /**
   * Cập nhật trạng thái thanh toán
   */
  async updatePaymentStatus(paymentId, status, gatewayResponse = {}) {
    try {
      const payment = await Payment.findById(paymentId);
      if (!payment) {
        throw new AppError(MESSAGES.ERROR.PAYMENT.NOT_FOUND, 404, ERROR_CODES.PAYMENT.NOT_FOUND);
      }

      payment.status = status;
      payment.gatewayResponse = { ...payment.gatewayResponse, ...gatewayResponse };
      
      if (status === 'Completed') {
        payment.paymentDate = new Date();
      }

      await payment.save();

      // Update order status
      await this.updateOrderPaymentStatus(payment.order, status);

      this.logger.info('Payment status updated', { 
        paymentId,
        status,
        orderId: payment.order 
      });

      return {
        message: MESSAGES.SUCCESS.PAYMENT.STATUS_UPDATED,
        payment
      };

    } catch (error) {
      this.logger.error('Payment status update failed', { 
        error: error.message,
        paymentId 
      });
      throw error;
    }
  }

  /**
   * Lấy thông tin thanh toán theo đơn hàng
   */
  async getPaymentByOrderId(orderId) {
    try {
      const payment = await Payment.findOne({ order: orderId }).populate('order');
      
      if (!payment) {
        throw new AppError(MESSAGES.ERROR.PAYMENT.NOT_FOUND, 404, ERROR_CODES.PAYMENT.NOT_FOUND);
      }

      return {
        message: MESSAGES.SUCCESS.DATA_RETRIEVED,
        payment
      };

    } catch (error) {
      this.logger.error('Get payment by order failed', { 
        error: error.message,
        orderId 
      });
      throw error;
    }
  }

  /**
   * Lấy lịch sử thanh toán
   */
  async getPaymentHistory(query = {}) {
    try {
      const { page = 1, limit = 10, status, method, startDate, endDate } = query;
      const skip = (page - 1) * limit;

      // Build filter
      const filter = {};
      if (status) filter.status = status;
      if (method) filter.method = method;
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
      }

      const payments = await Payment.find(filter)
        .populate('order', 'orderNumber customer')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Payment.countDocuments(filter);

      return {
        message: MESSAGES.SUCCESS.DATA_RETRIEVED,
        payments,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      };

    } catch (error) {
      this.logger.error('Get payment history failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Xử lý webhook từ cổng thanh toán
   */
  async handlePaymentWebhook(provider, webhookData) {
    try {
      this.logger.info('Processing payment webhook', { provider, data: webhookData });

      let paymentResult;
      switch (provider) {
        case 'vnpay':
          paymentResult = await this.handleVNPayWebhook(webhookData);
          break;
        case 'momo':
          paymentResult = await this.handleMomoWebhook(webhookData);
          break;
        case 'zalopay':
          paymentResult = await this.handleZaloPayWebhook(webhookData);
          break;
        default:
          throw new AppError('Nhà cung cấp thanh toán không được hỗ trợ', 400);
      }

      return paymentResult;

    } catch (error) {
      this.logger.error('Webhook processing failed', { 
        error: error.message,
        provider,
        data: webhookData 
      });
      throw error;
    }
  }

  // Private helper methods
  generateTransactionId() {
    return `TXN${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  }

  generateVNPayUrl(paymentData, paymentDetails) {
    // Simulate VNPay URL generation
    const baseUrl = process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    return `${baseUrl}?vnp_TxnRef=${paymentData.transactionId}&vnp_Amount=${paymentData.amount * 100}`;
  }

  async callMomoAPI(paymentData, paymentDetails) {
    // Simulate Momo API call
    return {
      payUrl: `https://test-payment.momo.vn/pay/${paymentData.transactionId}`,
      deeplink: `momo://payment/${paymentData.transactionId}`,
      qrCodeUrl: `https://test-payment.momo.vn/qr/${paymentData.transactionId}`
    };
  }

  async callZaloPayAPI(paymentData, paymentDetails) {
    // Simulate ZaloPay API call
    return {
      orderUrl: `https://sb-openapi.zalopay.vn/v2/create/${paymentData.transactionId}`,
      zpTransToken: `${paymentData.transactionId}_token`,
      qrCode: `https://sb-openapi.zalopay.vn/qr/${paymentData.transactionId}`
    };
  }

  async updateOrderPaymentStatus(orderId, paymentStatus) {
    try {
      const order = await Order.findById(orderId);
      if (order) {
        order.paymentStatus = paymentStatus === 'Completed' ? 'paid' : 'unpaid';
        if (paymentStatus === 'Completed' && order.status === 'pending') {
          order.status = 'confirmed';
        }
        await order.save();
      }
    } catch (error) {
      this.logger.error('Update order payment status failed', { 
        error: error.message,
        orderId 
      });
    }
  }

  async handleVNPayWebhook(webhookData) {
    // Process VNPay webhook
    const payment = await Payment.findOne({ transactionId: webhookData.vnp_TxnRef });
    if (payment) {
      const status = webhookData.vnp_ResponseCode === '00' ? 'Completed' : 'Failed';
      await this.updatePaymentStatus(payment._id, status, webhookData);
    }
    return { success: true };
  }

  async handleMomoWebhook(webhookData) {
    // Process Momo webhook
    const payment = await Payment.findOne({ transactionId: webhookData.orderId });
    if (payment) {
      const status = webhookData.resultCode === 0 ? 'Completed' : 'Failed';
      await this.updatePaymentStatus(payment._id, status, webhookData);
    }
    return { success: true };
  }

  async handleZaloPayWebhook(webhookData) {
    // Process ZaloPay webhook
    const payment = await Payment.findOne({ transactionId: webhookData.apptransid });
    if (payment) {
      const status = webhookData.status === 1 ? 'Completed' : 'Failed';  
      await this.updatePaymentStatus(payment._id, status, webhookData);
    }
    return { success: true };
  }
}

module.exports = PaymentService;
