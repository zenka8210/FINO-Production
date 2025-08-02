/**
 * VNPay Checkout Service
 * Xử lý logic đặt hàng với VNPay
 */

const VNPayService = require('./vnpayService');
const OrderService = require('./orderService');
const CartService = require('./cartService');
const { AppError } = require('../middlewares/errorHandler');
const { ERROR_CODES } = require('../config/constants');

class VNPayCheckoutService {
  constructor() {
    this.vnpayService = new VNPayService();
    this.orderService = new OrderService();
    this.cartService = new CartService();
  }

  /**
   * Tạo real order với status "pending" và VNPay payment URL
   * @param {Object} checkoutData - Dữ liệu checkout
   * @param {Object} user - User information
   * @param {string} clientIp - Client IP address
   * @returns {Object} VNPay payment URL và order data
   */
  async createVNPaySession(checkoutData, user, clientIp = '127.0.0.1') {
    try {
      console.log('🔄 Creating VNPay session for user:', user._id);
      
      // Validate checkout data
      const { addressId, paymentMethodId, voucherId } = checkoutData;
      
      console.log('🔍 VNPay checkout data received:', { addressId, paymentMethodId, voucherId });
      
      if (!addressId || !paymentMethodId) {
        throw new AppError('Missing required checkout information', ERROR_CODES.BAD_REQUEST);
      }

      // Create real order with status "pending" first
      console.log('🛒 Creating pending order before VNPay redirect...');
      const orderData = {
        address: addressId,        // OrderSchema expects 'address' field
        paymentMethod: paymentMethodId, // OrderSchema expects 'paymentMethod' field  
        voucher: voucherId         // OrderSchema expects 'voucher' field
      };

      // Create order using cart checkout
      const order = await this.cartService.checkoutCart(user._id, orderData);
      
      // Set order status to pending payment
      order.status = 'pending';
      order.paymentStatus = 'pending';
      order.paymentDetails = {
        paymentMethod: 'VNPay',
        source: 'redirect',
        createdAt: new Date()
      };
      
      await order.save();
      console.log('✅ Pending order created:', order.orderCode);

      // Create proper order description with real order details
      const orderDescription = `Thanh toan don hang ${order.orderCode} - FINO STORE - ${user.email} - Tong tien: ${order.finalTotal.toLocaleString('vi-VN')}VND`;

      // Create VNPay payment URL using real order code
      const paymentUrl = await this.vnpayService.createPaymentUrl({
        orderId: order.orderCode, // Use real order code instead of temp ID
        amount: order.finalTotal,
        orderDescription: orderDescription,
        clientIp: clientIp
      });

      console.log('✅ VNPay session created with real order:', {
        orderCode: order.orderCode,
        amount: order.finalTotal,
        paymentUrlLength: paymentUrl.length
      });

      return {
        paymentUrl,
        order: order,
        orderCalculation: {
          total: order.total,
          discountAmount: order.discountAmount || 0,
          shippingFee: order.shippingFee || 0,
          finalTotal: order.finalTotal
        }
      };

    } catch (error) {
      console.error('❌ Error creating VNPay session:', error);
      throw error;
    }
  }

  /**
   * Xử lý VNPay callback và update order status 
   * @param {Object} vnpParams - VNPay callback parameters
   * @returns {Object} Order update result
   */
  async processVNPayCallback(vnpParams) {
    try {
      console.log('🔔 Processing VNPay callback:', vnpParams.vnp_TxnRef);

      // Verify VNPay signature
      const verification = this.vnpayService.verifyReturnUrl(vnpParams);
      
      if (!verification.isVerified || !verification.isSuccess) {
        console.error('❌ VNPay verification failed:', verification);
        return {
          success: false,
          message: verification.responseMessage || 'Payment verification failed',
          vnpayData: vnpParams
        };
      }

      console.log('✅ VNPay payment verified successfully');

      // Get real order code from VNPay response
      const orderCode = vnpParams.vnp_TxnRef;
      console.log('📋 Looking for order with code:', orderCode);

      // Find the pending order by order code
      const Order = require('../models/OrderSchema');
      const order = await Order.findOne({ orderCode: orderCode });
      
      if (!order) {
        throw new AppError(`Order not found with code: ${orderCode}`, ERROR_CODES.NOT_FOUND);
      }

      if (order.paymentStatus === 'paid') {
        console.log('⚠️ Order already paid:', orderCode);
        return {
          success: true,
          message: 'Order already processed',
          order: order,
          vnpayData: verification
        };
      }

      // Update order with successful payment
      order.status = 'processing'; // Change from pending to processing
      order.paymentStatus = 'paid';
      order.paymentDetails = {
        transactionNo: verification.transactionNo,
        bankCode: verification.bankCode,
        payDate: verification.payDate,
        responseCode: verification.responseCode,
        paymentMethod: 'VNPay',
        source: 'callback',
        paidAt: new Date()
      };
      
      await order.save();
      
      // Send order confirmation email after successful VNPay payment
      console.log('📧 Sending order confirmation email after VNPay payment...');
      await order.populate([
        'user',
        'address', 
        'voucher', 
        'paymentMethod',
        {
          path: 'items.productVariant',
          populate: [
            { 
              path: 'product', 
              select: 'name description images category price salePrice isActive'
            },
            { path: 'color', select: 'name isActive' },
            { path: 'size', select: 'name' }
          ]
        }
      ]);
      
      if (order.user && order.user.email && order.address) {
        try {
          const EmailService = require('./emailService');
          const emailService = new EmailService();
          
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
          
          await emailService.sendOrderConfirmationEmail(
            order.user.email,
            order.user.name || order.address.fullName,
            orderDataForEmail
          );
          
          console.log('✅ Order confirmation email sent after VNPay payment');
        } catch (emailError) {
          console.error('❌ Failed to send order confirmation email after VNPay payment:', emailError.message);
          // Don't fail the payment process if email fails
        }
      }
      
      // Clear user's cart after successful payment
      console.log('🧹 Clearing cart after successful payment...');
      await this.cartService.clearUserCart(order.user);
      console.log('✅ Cart cleared after successful payment');
      
      console.log('✅ Order payment completed successfully:', order.orderCode);

      return {
        success: true,
        message: 'Payment completed successfully',
        order: order,
        vnpayData: verification
      };

    } catch (error) {
      console.error('❌ Error processing VNPay callback:', error);
      return {
        success: false,
        message: error.message || 'Internal server error',
        vnpayData: vnpParams
      };
    }
  }

  /**
   * Process VNPay IPN (Instant Payment Notification)
   * @param {Object} ipnData - IPN data from VNPay
   * @returns {Object} IPN response
   */
  async processVNPayIPN(ipnData) {
    try {
      console.log('🔔 Processing VNPay IPN:', ipnData.vnp_TxnRef);

      // Verify IPN signature
      const verification = this.vnpayService.verifyReturnUrl(ipnData);
      
      if (!verification.isVerified) {
        return { RspCode: '97', Message: 'Invalid signature' };
      }

      if (!verification.isSuccess) {
        return { RspCode: '00', Message: 'Confirm Received - Payment Failed' };
      }

      // Payment successful - you can update order status here if needed
      console.log('✅ VNPay IPN processed successfully');
      
      return { RspCode: '00', Message: 'Confirm Received' };

    } catch (error) {
      console.error('❌ Error processing VNPay IPN:', error);
      return { RspCode: '99', Message: 'Unknown error' };
    }
  }
}

module.exports = VNPayCheckoutService;
