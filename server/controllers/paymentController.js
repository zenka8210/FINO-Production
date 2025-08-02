const BaseController = require('./baseController');
const { AppError } = require('../middlewares/errorHandler');
const ResponseHandler = require('../services/responseHandler');
const { ERROR_CODES } = require('../config/constants');

class PaymentController extends BaseController {
  constructor() {
    super();
    
    // Initialize services
    const VNPayService = require('../services/vnpayService');
    const VNPayCheckoutService = require('../services/vnpayCheckoutService');
    const OrderService = require('../services/orderService');
    
    this.vnpayService = new VNPayService();
    this.vnpayCheckoutService = new VNPayCheckoutService();
    this.orderService = new OrderService();
  }

  // POST /api/payment/vnpay/checkout - Create VNPay session and payment URL (New proper flow)
  createVNPayCheckout = async (req, res, next) => {
    try {
      console.log('🛒 Creating VNPay checkout session for user:', req.user._id);

      const checkoutData = req.body;
      const user = req.user;

      // Validate required fields
      if (!checkoutData.addressId || !checkoutData.paymentMethodId) {
        throw new AppError('Missing required checkout information', ERROR_CODES.BAD_REQUEST);
      }

      // Update client IP for VNPay
      const clientIp = this.vnpayService.getClientIp(req);

      // Create VNPay session and payment URL
      const result = await this.vnpayCheckoutService.createVNPaySession(checkoutData, user, clientIp);
      
      console.log('✅ VNPay checkout session created:', {
        orderCode: result.order.orderCode,
        amount: result.orderCalculation.finalTotal,
        clientIp: clientIp
      });

      ResponseHandler.success(res, 'VNPay checkout session created', {
        paymentUrl: result.paymentUrl,
        orderCode: result.order.orderCode,
        orderId: result.order._id,
        amount: result.orderCalculation.finalTotal,
        status: result.order.status
      });

    } catch (error) {
      console.error('❌ Create VNPay checkout error:', error);
      next(error);
    }
  };

  // POST /api/payment/vnpay/create - Create VNPay payment URL (Original endpoint - kept for compatibility)
  createVNPayPayment = async (req, res, next) => {
    try {
      const { orderId, amount, orderDescription } = req.body;

      console.log('💳 Creating VNPay payment:', {
        orderId,
        amount,
        orderDescription,
        userId: req.user?._id
      });

      // Validate required fields
      if (!orderId || !amount || !orderDescription) {
        throw new AppError('Missing required payment information', ERROR_CODES.BAD_REQUEST);
      }

      // Get client IP
      const clientIp = this.vnpayService.getClientIp(req);

      console.log('🔧 PaymentController - Creating payment with:', {
        orderId,
        amount: parseFloat(amount),
        orderDescription,
        clientIp
      });

      // Create payment URL
      const paymentUrl = await this.vnpayService.createPaymentUrl({
        orderId,
        amount: parseFloat(amount),
        orderDescription,
        clientIp
      });

      console.log('🔧 PaymentController - Payment URL result:', {
        type: typeof paymentUrl,
        length: paymentUrl?.length,
        isString: typeof paymentUrl === 'string',
        preview: typeof paymentUrl === 'string' ? paymentUrl.substring(0, 100) : paymentUrl
      });

      console.log('✅ VNPay payment URL created successfully:', orderId);

      ResponseHandler.success(res, 'Payment URL created successfully', {
        paymentUrl,
        orderId,
        amount
      });
    } catch (error) {
      console.error('❌ Create VNPay payment error:', error);
      next(error);
    }
  };

  // GET /api/payment/vnpay/callback - Handle VNPay callback (Enhanced)
  handleVNPayCallback = async (req, res, next) => {
    try {
      console.log('📨 VNPay callback received:', req.query);

      // Process VNPay callback and create order if payment successful
      const result = await this.vnpayCheckoutService.processVNPayCallback(req.query);

      console.log('✅ VNPay callback processed successfully:', {
        success: result.success,
        orderCode: result.order?.orderCode,
        transactionId: result.vnpayData?.vnp_TransactionNo
      });

      // Redirect to success or error page based on payment result
      if (result.success) {
        const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3002'}/checkout/success?orderCode=${result.order.orderCode}&transactionId=${result.vnpayData.vnp_TransactionNo}&paymentMethod=vnpay&amount=${result.order.finalTotal}`;
        return res.redirect(redirectUrl);
      } else {
        const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3002'}/checkout/error?message=${encodeURIComponent(result.message)}`;
        return res.redirect(redirectUrl);
      }

    } catch (error) {
      console.error('❌ VNPay callback error:', error);
      const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3002'}/checkout/error?message=${encodeURIComponent('Payment processing failed')}`;
      return res.redirect(redirectUrl);
    }
  };

  // POST /api/payment/vnpay/callback - Process VNPay callback from frontend
  processVNPayCallback = async (req, res, next) => {
    try {
      console.log('📨 Frontend VNPay callback processing:', req.body);

      // Process VNPay callback data (same as GET but return JSON)
      const callbackData = req.body;
      const result = await this.vnpayCheckoutService.processVNPayCallback(callbackData);

      console.log('✅ Frontend VNPay callback processed:', {
        success: result.success,
        orderCode: result.order?.orderCode,
        transactionId: result.vnpayData?.vnp_TransactionNo
      });

      // Return JSON response instead of redirect
      return ResponseHandler.success(res, 'VNPay callback processed successfully', {
        success: result.success,
        order: result.order,
        message: result.message,
        transactionId: result.vnpayData?.vnp_TransactionNo
      });

    } catch (error) {
      console.error('❌ Frontend VNPay callback error:', error);
      return ResponseHandler.error(res, 'Failed to process VNPay callback', error);
    }
  };

  // POST /api/payment/vnpay/ipn - Handle VNPay IPN (Instant Payment Notification)
  handleVNPayIPN = async (req, res, next) => {
    try {
      console.log('🔔 VNPay IPN received:', req.body);

      // Process IPN with VNPayCheckoutService
      const ipnResult = await this.vnpayCheckoutService.processVNPayIPN(req.body);

      // Return IPN response
      return res.json(ipnResult);

    } catch (error) {
      console.error('❌ VNPay IPN error:', error);
      return res.json({ RspCode: '99', Message: 'Unknown error' });
    }
  };

  // GET /api/payment/:orderId/status - Get payment status of an order
  getPaymentStatus = async (req, res, next) => {
    try {
      const { orderId } = req.params;

      console.log('📊 Getting payment status for order:', orderId);

      // Get order details
      const order = await this.orderService.getOrderById(orderId);
      
      if (!order) {
        throw new AppError('Order not found', ERROR_CODES.NOT_FOUND);
      }

      // Check if user has permission to view this order
      if (req.user.role !== 'admin' && order.user.toString() !== req.user._id.toString()) {
        throw new AppError('Unauthorized to view this order', ERROR_CODES.FORBIDDEN);
      }

      ResponseHandler.success(res, 'Payment status retrieved', {
        orderId,
        paymentStatus: order.paymentStatus,
        status: order.status,
        paymentDetails: order.paymentDetails
      });
    } catch (error) {
      next(error);
    }
  };

  // GET /api/payment/test - Test endpoint for VNPay integration
  testVNPayIntegration = async (req, res, next) => {
    try {
      const testOrder = {
        orderId: `TEST_${Date.now()}`,
        amount: 100000, // 100,000 VND
        orderDescription: 'Test VNPay Integration',
        clientIp: this.vnpayService.getClientIp(req)
      };

      const paymentUrl = await this.vnpayService.createPaymentUrl(testOrder);

      ResponseHandler.success(res, 'Test payment URL created', {
        ...testOrder,
        paymentUrl,
        note: 'This is a test payment URL for VNPay integration'
      });
    } catch (error) {
      next(error);
    }
  };

  // GET /api/payment/vnpay/methods - Get VNPay payment methods
  getVNPayMethods = async (req, res, next) => {
    try {
      // Return available VNPay payment methods
      const methods = [
        { code: 'VNPAYQR', name: 'VNPay QR Code' },
        { code: 'VNBANK', name: 'Ngân hàng nội địa' },
        { code: 'INTCARD', name: 'Thẻ quốc tế' }
      ];

      ResponseHandler.success(res, 'VNPay payment methods retrieved', methods);
    } catch (error) {
      next(error);
    }
  };

  // POST /api/payment/vnpay/verify - Verify payment status
  verifyVNPayPayment = async (req, res, next) => {
    try {
      const { orderId } = req.body;

      if (!orderId) {
        throw new AppError('Order ID is required', ERROR_CODES.BAD_REQUEST);
      }

      // Get order details
      const order = await this.orderService.getOrderById(orderId);
      
      if (!order) {
        throw new AppError('Order not found', ERROR_CODES.NOT_FOUND);
      }

      // Check if user has permission to view this order
      if (req.user.role !== 'admin' && order.user.toString() !== req.user._id.toString()) {
        throw new AppError('Unauthorized to view this order', ERROR_CODES.FORBIDDEN);
      }

      ResponseHandler.success(res, 'Payment verification completed', {
        orderId,
        paymentStatus: order.paymentStatus,
        status: order.status,
        paymentDetails: order.paymentDetails
      });
    } catch (error) {
      next(error);
    }
  };

  // POST /api/payment/test-email - Test order confirmation email
  testOrderEmail = async (req, res, next) => {
    try {
      const { orderCode } = req.body;
      
      if (!orderCode) {
        return ResponseHandler.error(res, 'Order code is required', null, 400);
      }

      console.log('🧪 Testing email for order:', orderCode);

      // Find the order
      const Order = require('../models/OrderSchema');
      const order = await Order.findOne({ orderCode: orderCode })
        .populate('user')
        .populate('address')
        .populate('paymentMethod')
        .populate('voucher')
        .populate({
          path: 'items.productVariant',
          populate: [
            { path: 'product' },
            { path: 'color' },
            { path: 'size' }
          ]
        });

      if (!order) {
        return ResponseHandler.error(res, 'Order not found', null, 404);
      }

      console.log('📧 Found order, sending test email...');

      // Prepare order data for email
      const orderDataForEmail = {
        _id: order._id,
        orderCode: order.orderCode,
        items: order.items,
        total: order.total,
        discountAmount: order.discountAmount || 0,
        shippingFee: order.shippingFee || 0,
        finalTotal: order.finalTotal,
        address: order.address,
        createdAt: order.createdAt,
        paymentMethod: order.paymentMethod,
        voucher: order.voucher
      };

      // Send email
      const EmailService = require('../services/emailService');
      const emailService = new EmailService();
      await emailService.sendOrderConfirmationEmail(
        order.user.email,
        order.user.name || order.address.fullName,
        orderDataForEmail
      );

      console.log('✅ Test email sent successfully');

      return ResponseHandler.success(res, 'Test email sent successfully', {
        orderCode: order.orderCode,
        email: order.user.email,
        recipient: order.user.name || order.address.fullName
      });

    } catch (error) {
      console.error('❌ Test email failed:', error);
      return ResponseHandler.error(res, 'Failed to send test email', error);
    }
  };
}

module.exports = PaymentController;
