const crypto = require('crypto');
const https = require('https');
const { AppError } = require('../middlewares/errorHandler');
const { ERROR_CODES } = require('../config/constants');

/**
 * MoMo Service - Using Official MoMo API
 * Using sandbox credentials for testing
 * 
 * Credentials:
 * - Partner Code: MOMO
 * - Access Key: F8BBA842ECF85
 * - Secret Key: K951B6PE1waDMi640xX08PD3vg6EkVlz
 * - Environment: Sandbox
 */
class MoMoService {
  constructor() {
    // MoMo configuration for sandbox
    this.partnerCode = 'MOMO';
    this.accessKey = 'F8BBA842ECF85';
    this.secretKey = 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
    this.endpoint = 'https://test-payment.momo.vn/v2/gateway/api/create';
    
    // Store callback URLs - FIX: Point return URL to backend for proper signature verification
    this.redirectUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/payment/momo/callback`;
    this.ipnUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/payment/momo/ipn`;

    console.log('🔧 MoMo Service initialized:', {
      partnerCode: this.partnerCode,
      redirectUrl: this.redirectUrl,
      ipnUrl: this.ipnUrl,
      environment: 'sandbox'
    });
  }

  /**
   * Create MoMo payment URL using AIO API
   * @param {Object} orderInfo - Order information
   * @param {string} orderInfo.orderId - Order ID
   * @param {number} orderInfo.amount - Amount in VND
   * @param {string} orderInfo.orderDescription - Order description
   * @param {string} orderInfo.clientIp - Client IP address (optional for MoMo)
   * @returns {string} Payment URL
   */
  async createPaymentUrl(orderInfo) {
    try {
      const { orderId, amount, orderDescription, clientIp } = orderInfo;

      // Validate input
      if (!orderId || !amount || !orderDescription) {
        throw new AppError('Missing required payment information', ERROR_CODES.BAD_REQUEST);
      }

      if (amount <= 0) {
        throw new AppError('Amount must be greater than 0', ERROR_CODES.BAD_REQUEST);
      }

      // Generate unique request ID and use actual order ID for MoMo
      const requestId = orderId + '_' + new Date().getTime(); // Make requestId unique
      const momoOrderId = orderId; // Use actual order code from our system
      
      // Prepare payment parameters according to MoMo documentation
      const requestType = "payWithMethod";
      const extraData = '';
      const orderGroupId = '';
      const autoCapture = true;
      const lang = 'vi';

      // Create raw signature string according to MoMo specification
      const rawSignature = `accessKey=${this.accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${this.ipnUrl}&orderId=${momoOrderId}&orderInfo=${orderDescription}&partnerCode=${this.partnerCode}&redirectUrl=${this.redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

      console.log('🔐 MoMo raw signature:', rawSignature);

      // Generate HMAC SHA256 signature
      const signature = crypto
        .createHmac('sha256', this.secretKey)
        .update(rawSignature)
        .digest('hex');

      console.log('🔐 MoMo signature:', signature);

      // Prepare request body according to MoMo API specification
      const requestBody = {
        partnerCode: this.partnerCode,
        partnerName: "FINO Store",
        storeId: "FINO_STORE",
        requestId: requestId,
        amount: amount.toString(),
        orderId: momoOrderId,
        orderInfo: orderDescription,
        redirectUrl: this.redirectUrl,
        ipnUrl: this.ipnUrl,
        lang: lang,
        requestType: requestType,
        autoCapture: autoCapture,
        extraData: extraData,
        orderGroupId: orderGroupId,
        signature: signature
      };

      console.log('📤 MoMo request body:', requestBody);

      // Make HTTPS request to MoMo API
      const response = await this.makeHttpsRequest(requestBody);
      
      console.log('📥 MoMo API response:', response);

      if (response.resultCode === 0) {
        console.log('✅ MoMo payment URL created successfully');
        console.log('📏 Payment URL length:', response.payUrl.length);
        
        return response.payUrl; // Return payment URL string like VNPay
      } else {
        console.error('❌ MoMo payment creation failed:', response.message);
        throw new AppError(`MoMo payment failed: ${response.message}`, ERROR_CODES.PAYMENT_ERROR);
      }

    } catch (error) {
      console.error('❌ Error creating MoMo payment URL:', error);
      throw new AppError(`Payment URL creation failed: ${error.message}`, ERROR_CODES.PAYMENT_ERROR);
    }
  }

  /**
   * Make HTTPS request to MoMo API
   * @param {Object} requestBody - Request body
   * @returns {Promise<Object>} Response from MoMo
   */
  makeHttpsRequest(requestBody) {
    return new Promise((resolve, reject) => {
      const requestBodyString = JSON.stringify(requestBody);

      const options = {
        hostname: 'test-payment.momo.vn',
        port: 443,
        path: '/v2/gateway/api/create',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(requestBodyString)
        }
      };

      const req = https.request(options, res => {
        console.log(`📡 MoMo API Status: ${res.statusCode}`);
        
        let data = '';
        res.setEncoding('utf8');
        
        res.on('data', chunk => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            console.log('📨 MoMo API Response:', response);
            resolve(response);
          } catch (parseError) {
            reject(new Error(`Failed to parse MoMo response: ${parseError.message}`));
          }
        });
      });

      req.on('error', error => {
        console.error('❌ MoMo HTTPS request error:', error);
        reject(new Error(`MoMo API request failed: ${error.message}`));
      });

      // Send request
      req.write(requestBodyString);
      req.end();
    });
  }

  /**
   * Verify return URL from MoMo after payment using official specification
   * @param {Object} momoParams - MoMo return parameters
   * @returns {Object} Verification result
   */
  verifyReturnUrl(momoParams) {
    try {
      console.log('🔍 Verifying MoMo return URL');
      console.log('📋 MoMo return params:', momoParams);

      const {
        partnerCode,
        orderId,
        requestId,
        amount,
        orderInfo,
        orderType,
        transId,
        resultCode,
        message,
        payType,
        responseTime,
        extraData,
        signature
      } = momoParams;

      // Create raw signature for verification according to MoMo specification
      const rawSignature = `accessKey=${this.accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

      console.log('🔐 MoMo verification raw signature:', rawSignature);

      // Generate signature for verification
      const expectedSignature = crypto
        .createHmac('sha256', this.secretKey)
        .update(rawSignature)
        .digest('hex');

      console.log('🔐 Expected signature:', expectedSignature);
      console.log('🔐 Received signature:', signature);

      const isVerified = expectedSignature === signature;
      const isSuccess = resultCode === '0' && isVerified;

      if (!isVerified) {
        console.error('❌ MoMo return URL verification failed - Invalid signature');
        throw new AppError('Payment verification failed - Invalid signature', ERROR_CODES.PAYMENT_VERIFICATION_FAILED);
      }

      console.log('✅ MoMo return URL verified successfully');

      // Extract payment information
      const result = {
        isVerified: isVerified,
        isSuccess: isSuccess,
        orderId: orderId,
        amount: parseInt(amount),
        orderInfo: orderInfo,
        resultCode: resultCode,
        responseMessage: this.getResponseMessage(resultCode),
        transactionNo: transId,
        payType: payType,
        responseTime: responseTime,
        requestId: requestId
      };

      console.log('💳 MoMo payment verification result:', {
        orderId: result.orderId,
        amount: result.amount,
        success: result.isSuccess,
        resultCode: result.resultCode,
        message: result.responseMessage
      });

      return result;

    } catch (error) {
      console.error('❌ Error verifying MoMo return URL:', error);
      throw new AppError(`Payment verification failed: ${error.message}`, ERROR_CODES.PAYMENT_VERIFICATION_FAILED);
    }
  }

  /**
   * Process IPN (Instant Payment Notification) from MoMo using official specification
   * @param {Object} momoParams - MoMo IPN parameters
   * @returns {Object} IPN processing result
   */
  processIPN(momoParams) {
    try {
      console.log('📬 Processing MoMo IPN');

      // Use the same verification logic as return URL
      const verification = this.verifyReturnUrl(momoParams);

      if (!verification.isVerified) {
        console.error('❌ MoMo IPN verification failed');
        return {
          success: false,
          message: 'IPN verification failed - Invalid signature',
          resultCode: '97' // Checksum failed
        };
      }

      console.log('✅ MoMo IPN verified successfully');

      const result = {
        success: true,
        isVerified: verification.isVerified,
        isSuccess: verification.isSuccess,
        orderId: verification.orderId,
        amount: verification.amount,
        resultCode: verification.resultCode,
        responseMessage: verification.responseMessage,
        transactionNo: verification.transactionNo,
        payType: verification.payType,
        responseTime: verification.responseTime,
        message: 'IPN processed successfully'
      };

      console.log('📱 MoMo IPN processing result:', {
        orderId: result.orderId,
        amount: result.amount,
        success: result.isSuccess,
        resultCode: result.resultCode
      });

      return result;

    } catch (error) {
      console.error('❌ Error processing MoMo IPN:', error);
      return {
        success: false,
        message: `IPN processing failed: ${error.message}`,
        resultCode: '99' // Unknown error
      };
    }
  }

  /**
   * Build MoMo signature according to official specification
   * @param {Object} params - Parameters for signature generation
   * @returns {string} Generated signature
   */
  _buildSignature(params) {
    const {
      accessKey,
      orderId,
      orderInfo,
      amount,
      partnerCode,
      requestType,
      redirectUrl,
      ipnUrl,
      extraData = ''
    } = params;

    // Build data string for signature according to MoMo specification
    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${orderId}&requestType=${requestType}`;

    console.log('🔑 Building MoMo signature from:', rawSignature);

    // Create HMAC SHA256 signature
    const signature = crypto
      .createHmac('sha256', this.secretKey)
      .update(rawSignature)
      .digest('hex');

    console.log('✅ Generated MoMo signature:', signature);

    return signature;
  }

  /**
   * Build MoMo return URL signature for verification
   * @param {Object} params - Return URL parameters
   * @returns {string} Generated signature
   */
  _buildReturnSignature(params) {
    const {
      accessKey,
      amount,
      extraData = '',
      message,
      orderId,
      orderInfo,
      orderType,
      partnerCode,
      payType,
      requestId,
      responseTime,
      resultCode,
      transId
    } = params;

    // Build data string according to MoMo return URL specification
    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

    console.log('🔑 Building MoMo return signature from:', rawSignature);

    // Create HMAC SHA256 signature
    const signature = crypto
      .createHmac('sha256', this.secretKey)
      .update(rawSignature)
      .digest('hex');

    console.log('✅ Generated MoMo return signature:', signature);

    return signature;
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
   * Format MoMo result codes to readable messages
   * @param {string} resultCode - MoMo result code
   * @returns {string} Readable message
   */
  getResponseMessage(resultCode) {
    const messages = {
      '0': 'Giao dịch thành công',
      '9000': 'Giao dịch được khởi tạo, chờ người dùng xác nhận thanh toán',
      '8000': 'Giao dịch đang được xử lý',
      '7000': 'Giao dịch bị từ chối bởi người dùng',
      '6000': 'Giao dịch bị hủy bởi người dùng',
      '5000': 'Giao dịch bị từ chối bởi MoMo',
      '4000': 'Giao dịch không thành công do lỗi hệ thống',
      '3000': 'Giao dịch bị từ chối do tài khoản người dùng bị khóa',
      '2000': 'Giao dịch không thành công do sai thông tin',
      '1000': 'Giao dịch không thành công do lỗi kết nối',
      '10': 'Yêu cầu bị từ chối do không đúng format',
      '11': 'Checksum không hợp lệ',
      '12': 'Tham số không hợp lệ',
      '13': 'Số tiền không hợp lệ',
      '20': 'Merchant không tồn tại',
      '21': 'Token không hợp lệ',
      '40': 'RequestId bị trùng',
      '41': 'OrderId bị trùng',
      '42': 'OrderId không hợp lệ hoặc không tồn tại',
      '43': 'Yêu cầu bị từ chối do thời gian giao dịch đã hết hạn',
      '99': 'Lỗi không xác định'
    };
    
    return messages[resultCode] || 'Lỗi không xác định';
  }

  /**
   * Get test account information for sandbox testing
   * @returns {Object} Test account information
   */
  getTestAccountInfo() {
    return {
      phone: '0963181714',
      password: '111111',
      otp: '888888',
      note: 'Test account for MoMo sandbox environment'
    };
  }

  /**
   * Get sandbox information
   * @returns {Object} Sandbox URLs and credentials
   */
  getSandboxInfo() {
    return {
      environment: 'sandbox',
      paymentUrl: 'https://test-payment.momo.vn',
      merchantAdmin: 'https://business.momo.vn/',
      documentation: 'https://developers.momo.vn/'
    };
  }

  /**
   * Verify MoMo callback/IPN signature
   * @param {Object} momoData - MoMo callback/IPN data
   * @returns {boolean} True if signature is valid
   */
  async verifyCallback(momoData) {
    try {
      console.log('🔐 Verifying MoMo callback signature');
      console.log('📋 MoMo data received:', momoData);

      const {
        partnerCode,
        orderId,
        requestId,
        amount,
        orderInfo,
        orderType,
        transId,
        resultCode,
        message,
        payType,
        responseTime,
        extraData,
        signature
      } = momoData;

      // Create raw signature string for verification
      const rawSignature = `accessKey=${this.accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;
      
      console.log('🔐 Raw signature for verification:', rawSignature);

      // Generate expected signature
      const expectedSignature = crypto
        .createHmac('sha256', this.secretKey)
        .update(rawSignature)
        .digest('hex');

      console.log('🔐 Expected signature:', expectedSignature);
      console.log('🔐 Received signature:', signature);

      const isValid = expectedSignature === signature;
      
      if (isValid) {
        console.log('✅ MoMo signature verification successful');
      } else {
        console.log('❌ MoMo signature verification failed');
      }

      return isValid;

    } catch (error) {
      console.error('❌ Error verifying MoMo callback signature:', error);
      return false;
    }
  }
}

module.exports = MoMoService;
