import { apiClient } from '@/lib/api';
import { 
  PaymentMethod, 
  ApiResponse 
} from '@/types';

export class PaymentMethodService {
  private static instance: PaymentMethodService;

  private constructor() {}

  public static getInstance(): PaymentMethodService {
    if (!PaymentMethodService.instance) {
      PaymentMethodService.instance = new PaymentMethodService();
    }
    return PaymentMethodService.instance;
  }

  /**
   * Get active payment methods (Public)
   */
  async getActivePaymentMethods(): Promise<PaymentMethod[]> {
    try {
      // Use direct fetch since apiClient has response parsing issues
      const response = await fetch('http://localhost:5000/api/payment-methods/active');
      const data = await response.json();
      
      if (data.success && Array.isArray(data.message)) {
        return data.message;
      } else {
        console.error('🏦 Invalid response format:', data);
        throw new Error('Invalid response format from payment methods API');
      }
    } catch (error: any) {
      console.error('🏦 PaymentMethodService error:', error);
      throw new Error(error.message || 'Failed to fetch active payment methods');
    }
  }

  /**
   * Get payment methods by type (Public)
   */
  async getPaymentMethodsByType(type: 'COD' | 'VNPay'): Promise<PaymentMethod[]> {
    try {
      const response = await apiClient.get<PaymentMethod[]>(`/api/payment-methods/type/${type}`);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch payment methods by type');
    }
  }

  // ========== ADMIN METHODS ==========

  /**
   * Get all payment methods with filters (Admin)
   */
  async getPaymentMethodsWithFilters(filters?: any): Promise<PaymentMethod[]> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, value.toString());
          }
        });
      }

      const response = await apiClient.get<PaymentMethod[]>('/api/payment-methods', params);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch payment methods');
    }
  }

  /**
   * Get payment method statistics (Admin)
   */
  async getPaymentMethodStats(): Promise<any> {
    try {
      const response = await apiClient.get('/api/payment-methods/stats');
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch payment method statistics');
    }
  }

  /**
   * Create payment method (Admin)
   */
  async createPaymentMethod(paymentMethodData: Omit<PaymentMethod, '_id' | 'createdAt' | 'updatedAt'>): Promise<PaymentMethod> {
    try {
      const response = await apiClient.post<PaymentMethod>('/api/payment-methods', paymentMethodData);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create payment method');
    }
  }

  /**
   * Get payment method by ID (Admin)
   */
  async getPaymentMethodById(id: string): Promise<PaymentMethod> {
    try {
      const response = await apiClient.get<PaymentMethod>(`/api/payment-methods/${id}`);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch payment method');
    }
  }

  /**
   * Update payment method (Admin)
   */
  async updatePaymentMethod(id: string, paymentMethodData: Partial<PaymentMethod>): Promise<PaymentMethod> {
    try {
      const response = await apiClient.put<PaymentMethod>(`/api/payment-methods/${id}`, paymentMethodData);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update payment method');
    }
  }

  /**
   * Delete payment method (Admin)
   */
  async deletePaymentMethod(id: string): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.delete(`/api/payment-methods/${id}`);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete payment method');
    }
  }

  /**
   * Toggle payment method status (Admin)
   */
  async togglePaymentMethodStatus(id: string): Promise<PaymentMethod> {
    try {
      const response = await apiClient.put<PaymentMethod>(`/api/payment-methods/${id}/toggle-status`);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to toggle payment method status');
    }
  }

  /**
   * Update payment method order (Admin)
   */
  async updatePaymentMethodOrder(id: string, order: number): Promise<PaymentMethod> {
    try {
      const response = await apiClient.put<PaymentMethod>(`/api/payment-methods/${id}/order`, { order });
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update payment method order');
    }
  }

  /**
   * Update payment method configuration (Admin)
   */
  async updatePaymentMethodConfig(id: string, config: any): Promise<PaymentMethod> {
    try {
      const response = await apiClient.put<PaymentMethod>(`/api/payment-methods/${id}/config`, { config });
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update payment method configuration');
    }
  }

  /**
   * Bulk toggle payment method status (Admin)
   */
  async bulkToggleStatus(ids: string[]): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.put('/api/payment-methods/bulk/toggle-status', { ids });
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to bulk toggle payment method status');
    }
  }

  /**
   * Bulk delete payment methods (Admin only)
   * DELETE /api/payment-methods/bulk/delete
   */
  async bulkDelete(ids: string[]): Promise<ApiResponse<any>> {
    try {
      const params = new URLSearchParams();
      ids.forEach(id => params.append('ids', id));
      const response = await apiClient.delete(`/api/payment-methods/bulk/delete?${params.toString()}`);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to bulk delete payment methods');
    }
  }

}

// Export singleton instance
export const paymentMethodService = PaymentMethodService.getInstance();
export default paymentMethodService;
