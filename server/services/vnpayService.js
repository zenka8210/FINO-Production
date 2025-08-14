const { VNPay, ignoreLogger, ProductCode, VnpLocale, dateFormat } = require('vnpay');
const { AppError } = require('../middlewares/errorHandler');
const { ERROR_CODES } = require('../config/constants');

/**
 * VNPay Service - Using Official vnpay Library
 * Using user's official VNPay credentials for sandbox testing
 * 
 * Credentials:
 * - Terminal ID: G7KZK936
 * - Hash Secret: VBBL670O4MVQ7KLK1KD9R62IA19BFT67
 * - Environment: Sandbox
 */
class VNPayService {
  constructor() {
    // VNPay configuration - Use environment variables with fallbacks
    this.vnpay = new VNPay({
      tmnCode: process.env.VNPAY_TMN_CODE || 'G7KZK936',
      secureSecret: process.env.VNPAY_SECRET_KEY || 'VBBL670O4MVQ7KLK1KD9R62IA19BFT67',
      vnpayHost: process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn',
      testMode: process.env.NODE_ENV !== 'production', // sử dụng sandbox cho development
      hashAlgorithm: 'SHA512', // thuật toán hash
      loggerFn: ignoreLogger, // tắt log nếu cần
    });
    
    // Store callback URLs - FIX: Point return URL to backend for proper signature verification
    this.returnUrl = process.env.VNPAY_RETURN_URL || `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/payment/vnpay/callback`;
    this.ipnUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/payment/vnpay/ipn`;

    console.log('🔧 VNPay Service initialized:', {
      tmnCode: process.env.VNPAY_TMN_CODE || 'G7KZK936',
      returnUrl: this.returnUrl,
      ipnUrl: this.ipnUrl,
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox'
    });
  }

  /**
   * Create VNPay payment URL using official library
   * @param {Object} orderInfo - Order information
   * @param {string} orderInfo.orderId - Order ID
   * @param {number} orderInfo.amount - Amount in VND
   * @param {string} orderInfo.orderDescription - Order description
   * @param {string} orderInfo.clientIp - Client IP address
   * @param {string} orderInfo.bankCode - Bank code (optional)
   * @returns {string} Payment URL
   */
  async createPaymentUrl(orderInfo) {
    try {
      const { orderId, amount, orderDescription, clientIp, bankCode } = orderInfo;

      // Validate input
      if (!orderId || !amount || !orderDescription || !clientIp) {
        throw new AppError('Missing required payment information', ERROR_CODES.BAD_REQUEST);
      }

      if (amount <= 0) {
        throw new AppError('Amount must be greater than 0', ERROR_CODES.BAD_REQUEST);
      }

      // Prepare payment parameters theo cấu trúc trong ảnh demo
      const vnpayResponse = await this.vnpay.buildPaymentUrl({
        vnp_Amount: Math.round(amount), // VND đã đúng, VNPay API sẽ tự nhân 100
        vnp_IpAddr: clientIp, // Client IP từ request
        vnp_TxnRef: orderId, // Order ID từ tham số
        vnp_OrderInfo: orderDescription, // Mô tả đơn hàng
        vnp_OrderType: ProductCode.Other, // Loại sản phẩm theo enum
        vnp_ReturnUrl: this.returnUrl, // URL callback
        vnp_Locale: VnpLocale.VN, // Locale tiếng Việt
        vnp_CreateDate: dateFormat(new Date()), // Ngày tạo hiện tại
        vnp_ExpireDate: dateFormat(new Date(Date.now() + 15 * 60 * 1000)), // Hết hạn sau 15 phút
      });

      console.log('🎯 VNPay response theo demo code:', vnpayResponse);

      // Trả về URL payment
      const paymentUrl = vnpayResponse;
      
      console.log('✅ VNPay payment URL created successfully');
      console.log('📏 URL length:', paymentUrl.length);
      
      return paymentUrl;
    } catch (error) {
      console.error('❌ Error creating VNPay payment URL:', error);
      throw new AppError(`Payment URL creation failed: ${error.message}`, ERROR_CODES.PAYMENT_ERROR);
    }
  }

  /**
   * Verify return URL from VNPay after payment using official library
   * @param {Object} vnp_Params - VNPay return parameters
   * @returns {Object} Verification result
   */
  verifyReturnUrl(vnp_Params) {
    try {
      console.log('🔍 Verifying VNPay return URL with official library');

      // Use official library to verify return data
      const verify = this.vnpay.verifyReturnUrl(vnp_Params);
      
      if (!verify.isVerified) {
        console.error('❌ VNPay return URL verification failed');
        throw new AppError('Payment verification failed - Invalid signature', ERROR_CODES.PAYMENT_VERIFICATION_FAILED);
      }

      console.log('✅ VNPay return URL verified successfully');

      // Extract payment information
      const result = {
        isVerified: verify.isVerified,
        isSuccess: verify.isSuccess,
        orderId: vnp_Params.vnp_TxnRef,
        amount: parseInt(vnp_Params.vnp_Amount) / 100, // Convert from cents back to VND
        orderInfo: vnp_Params.vnp_OrderInfo,
        responseCode: vnp_Params.vnp_ResponseCode,
        responseMessage: this.getResponseMessage(vnp_Params.vnp_ResponseCode),
        transactionNo: vnp_Params.vnp_TransactionNo,
        bankCode: vnp_Params.vnp_BankCode,
        payDate: vnp_Params.vnp_PayDate,
        transactionStatus: vnp_Params.vnp_TransactionStatus,
      };

      console.log('💳 Payment verification result:', {
        orderId: result.orderId,
        amount: result.amount,
        success: result.isSuccess,
        responseCode: result.responseCode,
        message: result.responseMessage
      });

      return result;
    } catch (error) {
      console.error('❌ Error verifying VNPay return URL:', error);
      throw new AppError(`Payment verification failed: ${error.message}`, ERROR_CODES.PAYMENT_VERIFICATION_FAILED);
    }
  }

  /**
   * Process IPN (Instant Payment Notification) from VNPay using official library
   * @param {Object} vnp_Params - VNPay IPN parameters
   * @returns {Object} IPN processing result
   */
  processIPN(vnp_Params) {
    try {
      console.log('📬 Processing VNPay IPN with official library');

      // Use official library to verify IPN data
      const verify = this.vnpay.verifyIpnCall(vnp_Params);

      if (!verify.isVerified) {
        console.error('❌ VNPay IPN verification failed');
        return {
          success: false,
          message: 'IPN verification failed - Invalid signature',
          responseCode: '97' // Checksum failed
        };
      }

      console.log('✅ VNPay IPN verified successfully');

      // Extract payment information from IPN
      const result = {
        success: true,
        isVerified: verify.isVerified,
        isSuccess: verify.isSuccess,
        orderId: vnp_Params.vnp_TxnRef,
        amount: parseInt(vnp_Params.vnp_Amount) / 100, // Convert from cents back to VND
        orderInfo: vnp_Params.vnp_OrderInfo,
        responseCode: vnp_Params.vnp_ResponseCode,
        responseMessage: this.getResponseMessage(vnp_Params.vnp_ResponseCode),
        transactionNo: vnp_Params.vnp_TransactionNo,
        bankCode: vnp_Params.vnp_BankCode,
        payDate: vnp_Params.vnp_PayDate,
        transactionStatus: vnp_Params.vnp_TransactionStatus,
        message: 'IPN processed successfully'
      };

      console.log('📱 IPN processing result:', {
        orderId: result.orderId,
        amount: result.amount,
        success: result.isSuccess,
        responseCode: result.responseCode
      });

      return result;
    } catch (error) {
      console.error('❌ Error processing VNPay IPN:', error);
      return {
        success: false,
        message: `IPN processing failed: ${error.message}`,
        responseCode: '99' // Unknown error
      };
    }
  }

  /**
   * Get available payment methods from VNPay
   * @returns {Array} List of available payment methods
   */
  getPaymentMethods() {
    return [
      { code: 'VNPAYQR', name: 'Thanh toán qua VNPAY QR', icon: 'fas fa-qrcode' },
      { code: 'VNBANK', name: 'Thanh toán qua ATM-Tài khoản ngân hàng nội địa', icon: 'fas fa-university' },
      { code: 'INTCARD', name: 'Thanh toán qua thẻ quốc tế', icon: 'fas fa-credit-card' },
      { code: 'VISA', name: 'Thẻ quốc tế Visa', icon: 'fab fa-cc-visa' },
      { code: 'MASTERCARD', name: 'Thẻ quốc tế MasterCard', icon: 'fab fa-cc-mastercard' },
      { code: 'JCB', name: 'Thẻ quốc tế JCB', icon: 'fab fa-cc-jcb' }
    ];
  }

  /**
   * Get popular bank codes for VNPay
   * @returns {Array} List of popular bank codes
   */
  getBankCodes() {
    return [
      { code: 'NCB', name: 'Ngân hàng NCB' },
      { code: 'AGRIBANK', name: 'Ngân hàng Agribank' },
      { code: 'SCB', name: 'Ngân hàng SCB' },
      { code: 'SACOMBANK', name: 'Ngân hàng SacomBank' },
      { code: 'EXIMBANK', name: 'Ngân hàng EximBank' },
      { code: 'MSBANK', name: 'Ngân hàng MSBANK' },
      { code: 'NAMABANK', name: 'Ngân hàng NamABank' },
      { code: 'VNMART', name: 'Ví VnMart' },
      { code: 'VIETINBANK', name: 'Ngân hàng Vietinbank' },
      { code: 'VIETCOMBANK', name: 'Ngân hàng VCB' },
      { code: 'HDBANK', name: 'Ngân hàng HDBank' },
      { code: 'DONGABANK', name: 'Ngân hàng Dong A' },
      { code: 'TPBANK', name: 'Ngân hàng TPBank' },
      { code: 'OJB', name: 'Ngân hàng OceanBank' },
      { code: 'BIDV', name: 'Ngân hàng BIDV' },
      { code: 'TECHCOMBANK', name: 'Ngân hàng Techcombank' },
      { code: 'VPBANK', name: 'Ngân hàng VPBank' },
      { code: 'MBBANK', name: 'Ngân hàng MBBank' },
      { code: 'ACB', name: 'Ngân hàng ACB' },
      { code: 'OCB', name: 'Ngân hàng OCB' },
      { code: 'IVB', name: 'Ngân hàng IVB' },
      { code: 'SHB', name: 'Ngân hàng SHB' }
    ];
  }

  /**
   * Get client IP address from request
   * @param {Object} req - Express request object
   * @returns {string} Client IP address
   */
  getClientIp(req) {
    return req.headers['x-forwarded-for'] ||
           req.connection.remoteAddress ||
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
           '127.0.0.1';
  }

  /**
   * Format VNPay response codes to readable messages
   * @param {string} responseCode - VNPay response code
   * @returns {string} Readable message
   */
  getResponseMessage(responseCode) {
    const messages = {
      '00': 'Giao dịch thành công',
      '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).',
      '09': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng.',
      '10': 'Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
      '11': 'Giao dịch không thành công do: Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch.',
      '12': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa.',
      '13': 'Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP). Xin quý khách vui lòng thực hiện lại giao dịch.',
      '24': 'Giao dịch không thành công do: Khách hàng hủy giao dịch',
      '51': 'Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch.',
      '65': 'Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày.',
      '75': 'Ngân hàng thanh toán đang bảo trì.',
      '79': 'Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định. Xin quý khách vui lòng thực hiện lại giao dịch',
      '99': 'Các lỗi khác (lỗi còn lại, không có trong danh sách mã lỗi đã liệt kê)'
    };
    
    return messages[responseCode] || 'Lỗi không xác định';
  }

  /**
   * Get test card information for sandbox testing
   * @returns {Object} Test card information
   */
  getTestCardInfo() {
    return {
      bank: 'NCB',
      cardNumber: '9704198526191432198',
      cardHolderName: 'NGUYEN VAN A',
      issueDate: '07/15',
      otpPassword: '123456'
    };
  }

  /**
   * Get management URLs for VNPay
   * @returns {Object} VNPay management URLs
   */
  getManagementUrls() {
    return {
      merchantAdmin: 'https://sandbox.vnpayment.vn/merchantv2/',
      testEnvironment: 'https://sandbox.vnpayment.vn/vnpaygw-sit-testing/user/login',
      credentials: {
        username: 'huynguyenn8297@gmail.com',
        password: 'Huuhuy82@'
      }
    };
  }
}

module.exports = VNPayService;
