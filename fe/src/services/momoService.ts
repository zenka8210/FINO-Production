import { apiClient } from '@/lib/api';

export interface MoMoCheckoutRequest {
  addressId: string;
  paymentMethodId: string;
  voucherId?: string;
}

export interface MoMoCheckoutResponse {
  paymentUrl: string;
  orderCode: string;
  orderId: string;
  amount: number;
  status: string;
  momoOrderId: string;
  requestId: string;
}

export interface MoMoCallbackData {
  orderId: string;
  resultCode: number;
  message: string;
  transId: string;
  signature: string;
}

class MoMoService {
  /**
   * Create MoMo checkout session
   */
  async createMoMoCheckout(checkoutData: MoMoCheckoutRequest): Promise<MoMoCheckoutResponse> {
    try {
      const response = await apiClient.post('/api/payment/momo/checkout', checkoutData);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating MoMo checkout:', error);
      throw error;
    }
  }

  /**
   * Process MoMo callback (for frontend processing)
   */
  async processMoMoCallback(callbackData: MoMoCallbackData): Promise<any> {
    try {
      const response = await apiClient.post('/api/payment/momo/callback', callbackData);
      return response.data;
    } catch (error) {
      console.error('❌ Error processing MoMo callback:', error);
      throw error;
    }
  }

  /**
   * Verify MoMo payment status
   */
  async verifyMoMoPayment(orderCode: string): Promise<any> {
    try {
      const response = await apiClient.get(`/api/orders/code/${orderCode}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error verifying MoMo payment:', error);
      throw error;
    }
  }
}

export const momoService = new MoMoService();
