import { apiClient } from '@/lib/api';
import { 
  Voucher, 
  CreateVoucherRequest, 
  ApiResponse,
  PaginatedResponse
} from '@/types';

interface VoucherFilters {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  isActive?: boolean;
}

interface ApplyVoucherRequest {
  code: string;
  orderValue: number;
  items?: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
}

interface ApplyVoucherResponse {
  isValid: boolean;
  discountAmount: number;
  finalTotal: number;
  voucher?: Voucher;
  message?: string;
}

export class VoucherService {
  private static instance: VoucherService;

  private constructor() {}

  public static getInstance(): VoucherService {
    if (!VoucherService.instance) {
      VoucherService.instance = new VoucherService();
    }
    return VoucherService.instance;
  }

  // ========== PUBLIC ROUTES ==========

  /**
   * Get all vouchers with pagination and filters
   */
  async getAllVouchers(filters?: VoucherFilters): Promise<PaginatedResponse<Voucher>> {
    try {
      const response = await apiClient.getPaginated<Voucher>('/api/vouchers', filters);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch vouchers');
    }
  }

  /**
   * Get active vouchers
   */
  async getActiveVouchers(): Promise<Voucher[]> {
    try {
      const response = await apiClient.get<Voucher[]>('/api/vouchers/active');
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch active vouchers');
    }
  }

  /**
   * Get voucher by ID
   */
  async getVoucherById(id: string): Promise<Voucher> {
    try {
      const response = await apiClient.get<Voucher>(`/api/vouchers/${id}`);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch voucher');
    }
  }

  /**
   * Get voucher by code
   */
  async getVoucherByCode(code: string): Promise<Voucher> {
    try {
      const response = await apiClient.get<Voucher>(`/api/vouchers/code/${code}`);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch voucher');
    }
  }

  // ========== AUTHENTICATED USER ROUTES ==========

  /**
   * Get user's used vouchers
   */
  async getUserUsedVouchers(): Promise<Voucher[]> {
    try {
      const response = await apiClient.get<Voucher[]>('/api/vouchers/my-used-voucher');
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch used vouchers');
    }
  }

  /**
   * Check voucher usage for current user
   */
  async checkVoucherUsage(code: string): Promise<{ hasUsed: boolean; usageCount?: number; maxUsage?: number }> {
    try {
      const response = await apiClient.get<{ hasUsed: boolean; usageCount?: number; maxUsage?: number }>(`/api/vouchers/check-usage/${code}`);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to check voucher usage');
    }
  }

  /**
   * Apply voucher to order
   */
  async applyVoucher(data: ApplyVoucherRequest): Promise<ApplyVoucherResponse> {
    try {
      const response = await apiClient.post<ApplyVoucherResponse>('/api/vouchers/apply', data);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to apply voucher');
    }
  }

  // ========== ADMIN ROUTES ==========

  /**
   * Create voucher (Admin only)
   */
  async createVoucher(voucherData: CreateVoucherRequest): Promise<Voucher> {
    try {
      const response = await apiClient.post<Voucher>('/api/vouchers/admin', voucherData);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create voucher');
    }
  }

  /**
   * Get all vouchers for admin with pagination
   */
  async getAdminVouchers(filters?: VoucherFilters): Promise<PaginatedResponse<Voucher>> {
    try {
      const response = await apiClient.getPaginated<Voucher>('/api/vouchers/admin', filters);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch admin vouchers');
    }
  }

  /**
   * Get voucher by ID for admin
   */
  async getAdminVoucherById(id: string): Promise<Voucher> {
    try {
      const response = await apiClient.get<Voucher>(`/api/vouchers/admin/${id}`);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch admin voucher');
    }
  }

  /**
   * Delete voucher (Admin only)
   */
  async deleteVoucher(voucherId: string): Promise<ApiResponse<any>> {
    try {
      return await apiClient.delete(`/api/vouchers/admin/${voucherId}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete voucher');
    }
  }

  /**
   * Update voucher (Admin only)
   */
  async updateVoucher(id: string, voucherData: Partial<CreateVoucherRequest>): Promise<Voucher> {
    try {
      const response = await apiClient.patch<Voucher>(`/api/vouchers/admin/${id}`, voucherData);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update voucher');
    }
  }

  /**
   * Toggle voucher status (Admin only)
   */
  async toggleVoucherStatus(id: string): Promise<Voucher> {
    try {
      const response = await apiClient.patch<Voucher>(`/api/vouchers/admin/${id}/toggle-status`);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to toggle voucher status');
    }
  }

  // ========== LEGACY METHODS (kept for backward compatibility) ==========

  /**
   * @deprecated Use getActiveVouchers() instead
   */
  async getAvailableVouchers(): Promise<Voucher[]> {
    return this.getActiveVouchers();
  }

  /**
   * @deprecated Use applyVoucher() instead
   */
  async validateVoucher(code: string, orderValue: number): Promise<{
    isValid: boolean;
    voucher?: Voucher;
    discountAmount?: number;
    message?: string;
  }> {
    try {
      const response = await this.applyVoucher({ code, orderValue });
      return {
        isValid: response.isValid,
        voucher: response.voucher,
        discountAmount: response.discountAmount,
        message: response.message
      };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to validate voucher');
    }
  }
}

// Export singleton instance
export const voucherService = VoucherService.getInstance();
export default voucherService;
