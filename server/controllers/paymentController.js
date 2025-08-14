const BaseController = require('./baseController');
const { AppError } = require('../middlewares/errorHandler');
const ResponseHandler = require('../services/responseHandler');
const { ERROR_CODES } = require('../config/constants');

// Payment services
const VnPayService = require('../services/vnpayService');
const VnPayCheckoutService = require('../services/vnpayCheckoutService');
const MomoService = require('../services/momoService');
const MomoCheckoutService = require('../services/momoCheckoutService');

class PaymentController extends BaseController {
  constructor() {
    super();
    
    // Initialize payment services
    this.vnpayService = new VnPayService();
    this.vnpayCheckoutService = new VnPayCheckoutService();
    this.momoService = new MomoService();
    this.momoCheckoutService = new MomoCheckoutService();
  }

  // ============= VNPAY PAYMENT METHODS =============

  // POST /api/payment/vnpay/checkout - Create VNPay session and payment URL
  createVNPayCheckout = async (req, res, next) => {
    try {
      console.log('🛒 Creating VNPay checkout session for user:', req.user._id);

      const checkoutData = req.body;
      const user = req.user;

      // Validate required fields
      if (!checkoutData.addressId || !checkoutData.paymentMethodId) {
        throw new AppError('Missing required checkout information', ERROR_CODES.BAD_REQUEST);
      }

      // Get client IP for VNPay
      const clientIp = this.vnpayService.getClientIp(req);

      // Create VNPay session and payment URL
      const result = await this.vnpayCheckoutService.createVNPaySession(checkoutData, user, clientIp);
      
      console.log('✅ VNPay checkout session created:', {
        orderCode: result.order.orderCode,
        amount: result.order.finalTotal,
        clientIp: clientIp
      });

      ResponseHandler.success(res, 'VNPay checkout session created', {
        paymentUrl: result.paymentUrl, // Fix: Use result.paymentUrl instead of result.payment.paymentUrl
        orderCode: result.order.orderCode,
        orderId: result.order._id,
        amount: result.order.finalTotal,
        status: result.order.status,
        // Remove undefined vnpTxnRef and vnpOrderInfo for now
        temporaryOrderId: result.order._id.toString(),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes
      });

    } catch (error) {
      console.error('❌ Create VNPay checkout error:', error);
      next(error);
    }
  };

  // POST /api/payment/vnpay/create - Create VNPay payment URL (Legacy endpoint)
  createVNPayPayment = async (req, res, next) => {
    try {
      console.log('🔄 Legacy VNPay payment creation for user:', req.user._id);

      const checkoutData = req.body;
      const user = req.user;

      // Get client IP for VNPay
      const clientIp = this.vnpayService.getClientIp(req);

      // Create VNPay payment URL using legacy method
      const result = await this.vnpayService.createPaymentUrl(checkoutData, user, clientIp);
      
      console.log('✅ Legacy VNPay payment URL created');

      ResponseHandler.success(res, 'VNPay payment URL created', result);

    } catch (error) {
      console.error('❌ Create VNPay payment error:', error);
      next(error);
    }
  };

  // GET /api/payment/vnpay/callback - Handle VNPay callback
  handleVNPayCallback = async (req, res, next) => {
    try {
      console.log('📨 VNPay callback received:', req.query);

      // Process VNPay callback - use correct method name
      const result = await this.vnpayCheckoutService.processVNPayCallback(req.query);

      console.log('✅ VNPay callback processed:', {
        success: result.success,
        orderCode: result.order?.orderCode,
        message: result.message
      });

      // Redirect to success or error page based on payment result
      if (result.success) {
        const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3002'}/checkout/success?orderCode=${result.order.orderCode}&transactionId=${result.vnpayData?.transactionNo || ''}&paymentMethod=vnpay&amount=${result.order.finalTotal}`;
        return res.redirect(redirectUrl);
      } else {
        const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3002'}/checkout/error?message=${encodeURIComponent(result.message || 'Payment failed')}`;
        return res.redirect(redirectUrl);
      }

    } catch (error) {
      console.error('❌ VNPay callback error:', error);
      const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3002'}/checkout/error?message=${encodeURIComponent('Callback processing failed')}`;
      return res.redirect(redirectUrl);
    }
  };

  // POST /api/payment/vnpay/callback - Process VNPay callback from frontend
  processVNPayCallback = async (req, res, next) => {
    try {
      console.log('📨 VNPay frontend callback received:', req.body);

      // Process VNPay callback data from frontend - use correct method name
      const result = await this.vnpayCheckoutService.processVNPayCallback(req.body);

      console.log('✅ VNPay frontend callback processed:', {
        success: result.success,
        orderCode: result.order?.orderCode
      });

      ResponseHandler.success(res, 'VNPay callback processed', result);

    } catch (error) {
      console.error('❌ VNPay frontend callback error:', error);
      next(error);
    }
  };

  // POST /api/payment/vnpay/ipn - Handle VNPay IPN (Instant Payment Notification)
  handleVNPayIPN = async (req, res, next) => {
    try {
      console.log('📢 VNPay IPN received:', req.body);

      // Process VNPay IPN
      const result = await this.vnpayCheckoutService.handleVNPayIPN(req.body);

      console.log('✅ VNPay IPN processed:', {
        success: result.success,
        orderCode: result.order?.orderCode
      });

      // VNPay expects specific response format
      if (result.success) {
        return res.json({ RspCode: '00', Message: 'Success' });
      } else {
        return res.json({ RspCode: '01', Message: result.message || 'Failed' });
      }

    } catch (error) {
      console.error('❌ VNPay IPN error:', error);
      return res.json({ RspCode: '99', Message: 'Unknown error' });
    }
  };

  // GET /api/payment/vnpay/methods - Get VNPay payment methods
  getVNPayMethods = async (req, res, next) => {
    try {
      console.log('📋 Getting VNPay payment methods');

      // Get available VNPay payment methods
      const methods = await this.vnpayService.getPaymentMethods();

      console.log('✅ VNPay payment methods retrieved');

      ResponseHandler.success(res, 'VNPay payment methods retrieved', methods);

    } catch (error) {
      console.error('❌ Get VNPay methods error:', error);
      next(error);
    }
  };

  // POST /api/payment/vnpay/verify - Verify payment status
  verifyVNPayPayment = async (req, res, next) => {
    try {
      console.log('🔍 Verifying VNPay payment:', req.body);

      const verificationData = req.body;

      // Verify VNPay payment status
      const result = await this.vnpayService.verifyPayment(verificationData);

      console.log('✅ VNPay payment verification completed');

      ResponseHandler.success(res, 'VNPay payment verified', result);

    } catch (error) {
      console.error('❌ VNPay payment verification error:', error);
      next(error);
    }
  };

  // ============= MOMO PAYMENT METHODS =============

  // POST /api/payment/momo/checkout - Create MoMo session and payment URL
  createMoMoCheckout = async (req, res, next) => {
    try {
      console.log('🛒 Creating MoMo checkout session...');
      console.log('🔍 req.user:', req.user);
      console.log('🔍 req.headers.authorization:', req.headers.authorization);
      
      if (!req.user) {
        console.error('❌ No user found in request - authentication failed');
        throw new AppError('Người dùng chưa đăng nhập', ERROR_CODES.UNAUTHORIZED);
      }

      console.log('✅ User found:', req.user._id);
      console.log('🛒 Creating MoMo checkout session for user:', req.user._id);

      const checkoutData = req.body;
      const user = req.user;

      // Validate required fields
      if (!checkoutData.addressId || !checkoutData.paymentMethodId) {
        throw new AppError('Missing required checkout information', ERROR_CODES.BAD_REQUEST);
      }

      // Get client IP for MoMo
      const clientIp = this.momoService.getClientIp(req);

      // Create MoMo session and payment URL
      const result = await this.momoCheckoutService.createMoMoSession(checkoutData, user, clientIp);
      
      console.log('✅ MoMo checkout session created:', {
        orderCode: result.order.orderCode,
        amount: result.order.finalTotal,
        clientIp: clientIp
      });

      ResponseHandler.success(res, 'MoMo checkout session created', {
        paymentUrl: result.payment.paymentUrl,
        orderCode: result.order.orderCode,
        orderId: result.order._id,
        amount: result.order.finalTotal,
        status: result.order.status,
        momoOrderId: result.payment.momoOrderId,
        requestId: result.payment.requestId
      });

    } catch (error) {
      console.error('❌ Create MoMo checkout error:', error);
      next(error);
    }
  };

  // GET /api/payment/momo/callback - Handle MoMo callback
  handleMoMoCallback = async (req, res, next) => {
    try {
      console.log('📨 MoMo callback received:', req.query);

      // Process MoMo callback
      const result = await this.momoCheckoutService.handleMoMoCallback(req.query);

      console.log('✅ MoMo callback processed:', {
        success: result.success,
        isSuccess: result.isSuccess,
        orderCode: result.order?.orderCode
      });

      // Redirect to success or error page based on payment result
      if (result.success && result.isSuccess) {
        const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3002'}/checkout/success?orderCode=${result.order.orderCode}&transactionId=${result.payment.transactionId}&paymentMethod=momo&amount=${result.payment.amount}`;
        return res.redirect(redirectUrl);
      } else {
        const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3002'}/checkout/error?message=${encodeURIComponent(result.message || 'Payment failed')}`;
        return res.redirect(redirectUrl);
      }

    } catch (error) {
      console.error('❌ MoMo callback error:', error);
      const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3002'}/checkout/error?message=${encodeURIComponent('Callback processing failed')}`;
      return res.redirect(redirectUrl);
    }
  };

  // POST /api/payment/momo/ipn - Handle MoMo IPN (Instant Payment Notification)
  handleMoMoIPN = async (req, res, next) => {
    try {
      console.log('📢 MoMo IPN received:', req.body);

      // Process MoMo IPN
      const result = await this.momoCheckoutService.handleMoMoIPN(req.body);

      console.log('✅ MoMo IPN processed:', {
        success: result.success,
        orderCode: result.order?.orderCode
      });

      // MoMo expects specific response format
      if (result.success) {
        return res.json({ resultCode: 0, message: 'Success' });
      } else {
        return res.json({ resultCode: 1, message: result.message || 'Failed' });
      }

    } catch (error) {
      console.error('❌ MoMo IPN error:', error);
      return res.json({ resultCode: 99, message: 'Unknown error' });
    }
  };

  // ============= TEST METHODS =============

  // GET /api/payment/test - Test VNPay integration
  testVNPayIntegration = async (req, res, next) => {
    try {
      console.log('🧪 Testing VNPay integration');

      // Test VNPay configuration and connectivity
      const testResult = await this.vnpayService.testConnection();

      console.log('✅ VNPay integration test completed');

      ResponseHandler.success(res, 'VNPay integration test completed', testResult);

    } catch (error) {
      console.error('❌ VNPay integration test failed:', error);
      next(error);
    }
  };

  // POST /api/payment/test-email - Test email sending with order code
  testOrderEmail = async (req, res, next) => {
    try {
      console.log('📧 Testing order email functionality');
      
      const { orderCode } = req.body;

      // Test email sending functionality
      const result = await this.vnpayService.testEmail(orderCode);
      
      console.log('✅ Order email test successful');
      return ResponseHandler.success(res, 'Order email test successful', result);
      
    } catch (error) {
      console.error('❌ Order email test failed:', error);
      return ResponseHandler.error(res, 'Failed to send test email', error);
    }
  };
}

module.exports = PaymentController;
