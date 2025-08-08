/**
 * MoMo Checkout Service
 * Xử lý logic đặt hàng với MoMo
 */

const MoMoService = require('./momoService');
const OrderService = require('./orderService');
const CartService = require('./cartService');
const { AppError } = require('../middlewares/errorHandler');
const { ERROR_CODES } = require('../config/constants');

class MoMoCheckoutService {
  constructor() {
    this.momoService = new MoMoService();
    this.orderService = new OrderService();
    this.cartService = new CartService();
  }

  /**
   * Tạo real order với status "pending" và MoMo payment URL
   * @param {Object} checkoutData - Dữ liệu checkout
   * @param {Object} user - User information
   * @param {string} clientIp - Client IP address
   * @returns {Object} MoMo payment URL và order data
   */
  async createMoMoSession(checkoutData, user, clientIp = '127.0.0.1') {
    try {
      console.log('🔄 Creating MoMo session for user:', user._id);
      
      // Validate checkout data
      const { addressId, paymentMethodId, voucherId } = checkoutData;
      
      console.log('🔍 MoMo checkout data received:', { addressId, paymentMethodId, voucherId });
      
      if (!addressId || !paymentMethodId) {
        throw new AppError('Missing required checkout information', ERROR_CODES.BAD_REQUEST);
      }

      // Create real order with status "pending" first
      console.log('🛒 Creating pending order before MoMo redirect...');
      const orderData = {
        address: addressId,        // OrderSchema expects 'address' field
        paymentMethod: paymentMethodId, // OrderSchema expects 'paymentMethod' field  
        voucher: voucherId         // OrderSchema expects 'voucher' field
      };

      // Create order using cart checkout
      const order = await this.cartService.checkoutCart(user._id, orderData);
      
      // Set order status to pending payment
      await this.orderService.updateOrderStatus(order._id, 'pending', {
        note: 'Waiting for MoMo payment confirmation'
      });

      console.log('✅ Order created successfully with ID:', order._id);
      console.log('💰 Order details:', {
        orderCode: order.orderCode,
        total: order.total,
        finalTotal: order.finalTotal,
        status: order.status
      });

      // Create MoMo payment URL with unique requestId
      const uniqueRequestId = `${order.orderCode}_${Date.now()}`; // Add timestamp to ensure uniqueness
      
      const orderInfo = {
        orderId: order.orderCode,  // Use orderCode as orderId for MoMo
        amount: order.finalTotal,  // Use finalTotal (includes shipping, discounts)
        orderDescription: `Thanh toán đơn hàng ${order.orderCode} - FINO Store`,
        clientIp: clientIp,
        requestId: uniqueRequestId // Add unique requestId to avoid conflicts
      };

      console.log('📤 Creating MoMo payment URL with info:', orderInfo);
      
      const momoPaymentUrl = await this.momoService.createPaymentUrl(orderInfo);
      
      console.log('✅ MoMo payment URL created successfully:', momoPaymentUrl);
      
      // Return complete data for frontend
      return {
        success: true,
        message: 'MoMo session created successfully',
        order: {
          _id: order._id,
          orderCode: order.orderCode,
          total: order.total,
          finalTotal: order.finalTotal,
          status: order.status,
          user: order.user,
          address: order.address,
          items: order.items,
          voucher: order.voucher,
          createdAt: order.createdAt
        },
        payment: {
          paymentUrl: momoPaymentUrl, // Use the payment URL string directly
          momoOrderId: order.orderCode, // Use orderCode as momoOrderId
          requestId: uniqueRequestId, // Use unique requestId
          amount: order.finalTotal,
          paymentMethod: 'momo'
        }
      };

    } catch (error) {
      console.error('❌ Error creating MoMo session:', error);
      throw new AppError(`Failed to create MoMo session: ${error.message}`, ERROR_CODES.PAYMENT_ERROR);
    }
  }

  /**
   * Xử lý MoMo callback sau khi thanh toán
   * @param {Object} momoData - MoMo callback data
   * @returns {Object} Processing result
   */
  async handleMoMoCallback(momoData) {
    try {
      console.log('📨 Processing MoMo callback:', momoData);

      // Verify MoMo signature
      const isValidSignature = await this.momoService.verifyCallback(momoData);
      
      if (!isValidSignature) {
        console.error('❌ Invalid MoMo signature');
        throw new AppError('Invalid MoMo signature', ERROR_CODES.PAYMENT_ERROR);
      }

      // Extract order information
      const { orderId, resultCode, message, transId } = momoData;
      const isSuccess = resultCode === 0 || resultCode === '0'; // MoMo returns 0 for success (can be string or number)

      console.log('🔍 MoMo callback details:', {
        orderId,
        resultCode,
        message,
        transId,
        isSuccess
      });

      // Find order by orderCode
      const order = await this.orderService.getOrderByCode(orderId);
      
      if (!order) {
        console.error('❌ Order not found:', orderId);
        throw new AppError('Order not found', ERROR_CODES.NOT_FOUND);
      }

      // Update order status based on payment result
      if (isSuccess) {
        // Update order directly like VNPay (avoid OrderService validation)
        order.status = 'processing'; // Change from pending to processing
        order.paymentStatus = 'paid';
        order.paymentDetails = {
          transactionId: transId,
          paymentMethod: 'momo',
          source: 'momo_callback',
          paidAt: new Date(),
          updatedAt: new Date()
        };
        
        await order.save();

        console.log('✅ Order confirmed successfully:', order.orderCode);
      } else {
        // Update order for failed payment
        order.paymentStatus = 'failed';
        order.paymentDetails = {
          transactionId: transId,
          paymentMethod: 'momo',
          source: 'momo_callback',
          failedAt: new Date(),
          updatedAt: new Date(),
          note: `MoMo payment failed - ${message}`
        };
        
        await order.save();

        console.log('❌ Order payment failed:', order.orderCode);
      }

      return {
        success: true,
        isSuccess: isSuccess,
        message: message || (isSuccess ? 'Payment successful' : 'Payment failed'),
        order: order,
        payment: {
          transactionId: transId,
          amount: order.finalTotal,
          paymentMethod: 'momo',
          status: isSuccess ? 'completed' : 'failed'
        }
      };

    } catch (error) {
      console.error('❌ Error processing MoMo callback:', error);
      return {
        success: false,
        isSuccess: false,
        message: error.message || 'Callback processing failed',
        order: null,
        payment: null
      };
    }
  }

  /**
   * Xử lý MoMo IPN (Instant Payment Notification)
   * @param {Object} ipnData - MoMo IPN data
   * @returns {Object} IPN processing result
   */
  async handleMoMoIPN(ipnData) {
    try {
      console.log('📢 Processing MoMo IPN:', ipnData);

      // Verify MoMo IPN signature
      const isValidSignature = await this.momoService.verifyCallback(ipnData);
      
      if (!isValidSignature) {
        console.error('❌ Invalid MoMo IPN signature');
        return {
          success: false,
          message: 'Invalid signature'
        };
      }

      // Extract IPN information
      const { orderId, resultCode, message, transId } = ipnData;
      const isSuccess = resultCode === 0 || resultCode === '0';

      console.log('🔍 MoMo IPN details:', {
        orderId,
        resultCode,
        message,
        transId,
        isSuccess
      });

      // Find order by orderCode
      const order = await this.orderService.getOrderByCode(orderId);
      
      if (!order) {
        console.error('❌ Order not found in IPN:', orderId);
        return {
          success: false,
          message: 'Order not found'
        };
      }

      // Update order based on IPN result
      if (isSuccess && order.status === 'pending') {
        // Update order directly like VNPay (avoid OrderService validation)
        order.status = 'processing';
        order.paymentStatus = 'paid';
        order.paymentDetails = {
          transactionId: transId,
          paymentMethod: 'momo',
          source: 'momo_ipn',
          paidAt: new Date(),
          updatedAt: new Date()
        };
        
        await order.save();

        console.log('✅ Order confirmed via IPN:', order.orderCode);
      }

      return {
        success: true,
        message: 'IPN processed successfully',
        order: order
      };

    } catch (error) {
      console.error('❌ Error processing MoMo IPN:', error);
      return {
        success: false,
        message: error.message || 'IPN processing failed'
      };
    }
  }

  /**
   * Validate checkout data
   * @param {Object} checkoutData - Data to validate
   */
  validateCheckoutData(checkoutData) {
    const { addressId, paymentMethodId } = checkoutData;
    
    if (!addressId) {
      throw new AppError('Address ID is required', ERROR_CODES.BAD_REQUEST);
    }
    
    if (!paymentMethodId) {
      throw new AppError('Payment method ID is required', ERROR_CODES.BAD_REQUEST);
    }
  }
}

module.exports = MoMoCheckoutService;
