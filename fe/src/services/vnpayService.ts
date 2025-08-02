import { apiClient } from '@/lib/api';

export interface VNPayCheckoutRequest {
  addressId: string;
  paymentMethodId: string;
  voucherId?: string;
}

export interface VNPayCheckoutResponse {
  paymentUrl: string;
  temporaryOrderId: string;
  amount: number;
  expiresAt: string;
}

export interface VNPayPaymentRequest {
  orderId: string;
  amount: number;
  orderDescription: string;
}

export interface VNPayPaymentResponse {
  paymentUrl: string;
  orderId: string;
  amount: number;
}

export interface VNPayMethod {
  code: string;
  name: string;
}

export interface PaymentVerification {
  orderId: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'cancelled';
  status: string;
  paymentDetails?: {
    transactionNo?: string;
    bankCode?: string;
    payDate?: string;
    paymentMethod?: string;
  };
}

class VNPayService {
  /**
   * Create VNPay checkout session (NEW - proper flow)
   */
  async createVNPayCheckout(checkoutData: VNPayCheckoutRequest): Promise<VNPayCheckoutResponse> {
    try {
      const response = await apiClient.post('/api/payment/vnpay/checkout', checkoutData);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating VNPay checkout:', error);
      throw error;
    }
  }

  /**
   * Create VNPay payment URL (LEGACY - for compatibility)
   */
  async createPayment(paymentData: VNPayPaymentRequest): Promise<VNPayPaymentResponse> {
    try {
      const response = await apiClient.post('/api/payment/vnpay/create', paymentData);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating VNPay payment:', error);
      throw error;
    }
  }

  /**
   * Get VNPay payment methods
   */
  async getPaymentMethods(): Promise<VNPayMethod[]> {
    try {
      const response = await apiClient.get('/api/payment/vnpay/methods');
      return response.data;
    } catch (error) {
      console.error('❌ Error getting VNPay payment methods:', error);
      throw error;
    }
  }

  /**
   * Verify payment status
   */
  async verifyPayment(orderId: string): Promise<PaymentVerification> {
    try {
      const response = await apiClient.post('/api/payment/vnpay/verify', { orderId });
      return response.data;
    } catch (error) {
      console.error('❌ Error verifying payment:', error);
      throw error;
    }
  }

  /**
   * Test VNPay integration
   */
  async testIntegration(): Promise<any> {
    try {
      const response = await apiClient.get('/api/payment/test');
      return response.data;
    } catch (error) {
      console.error('❌ Error testing VNPay integration:', error);
      throw error;
    }
  }

  /**
   * Parse VNPay callback parameters from URL
   */
  parseCallbackParams(searchParams: URLSearchParams): any {
    const params: any = {};
    for (const [key, value] of searchParams.entries()) {
      if (key.startsWith('vnp_')) {
        params[key] = value;
      }
    }
    
    // Map VNPay parameters to more readable names
    return {
      ...params,
      orderId: params.vnp_TxnRef,
      amount: params.vnp_Amount ? parseInt(params.vnp_Amount) / 100 : 0,
      responseCode: params.vnp_ResponseCode,
      transactionStatus: params.vnp_TransactionStatus,
      transactionNo: params.vnp_TransactionNo,
      bankCode: params.vnp_BankCode,
      payDate: params.vnp_PayDate,
      isSuccess: params.vnp_ResponseCode === '00' && params.vnp_TransactionStatus === '00'
    };
  }

  /**
   * Get response code message
   */
  getResponseCodeMessage(responseCode: string): string {
    const messages: { [key: string]: string } = {
      '00': 'Giao dịch thành công',
      '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường)',
      '09': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng',
      '10': 'Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
      '11': 'Giao dịch không thành công do: Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch',
      '12': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa',
      '13': 'Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP)',
      '24': 'Giao dịch không thành công do: Khách hàng hủy giao dịch',
      '51': 'Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch',
      '65': 'Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày',
      '75': 'Ngân hàng thanh toán đang bảo trì',
      '79': 'Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định',
      '99': 'Các lỗi khác (lỗi còn lại, không có trong danh sách mã lỗi đã liệt kê)'
    };

    return messages[responseCode] || 'Lỗi không xác định';
  }

  /**
   * Check if payment was successful
   */
  isPaymentSuccessful(responseCode: string): boolean {
    return responseCode === '00';
  }

  /**
   * Check if payment was cancelled by user
   */
  isPaymentCancelled(responseCode: string): boolean {
    return responseCode === '24';
  }

  /**
   * Check if payment failed
   */
  isPaymentFailed(paymentStatus: string): boolean {
    return ['failed', 'cancelled'].includes(paymentStatus);
  }
}

export const vnpayService = new VNPayService();
export default vnpayService;
