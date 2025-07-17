import { apiClient } from '@/lib/api';
import { 
  Banner, 
  CreateBannerRequest, 
  ApiResponse,
  PaginatedResponse
} from '@/types';

interface BannerStatistics {
  totalBanners: number;
  activeBanners: number;
  inactiveBanners: number;
  clickStats: any[];
  performanceMetrics: any;
}

export class BannerService {
  private static instance: BannerService;

  private constructor() {}

  public static getInstance(): BannerService {
    if (!BannerService.instance) {
      BannerService.instance = new BannerService();
    }
    return BannerService.instance;
  }

  // ========== PUBLIC METHODS ==========

  /**
   * Get active client banners (Public)
   * GET /api/banners/active
   */
  async getActiveBanners(): Promise<Banner[]> {
    try {
      const response = await apiClient.get<Banner[]>('/api/banners/active');
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch active banners');
    }
  }

  /**
   * Get banners by status (Public)
   * GET /api/banners/status/:status
   */
  async getBannersByStatus(status: 'active' | 'inactive' | 'draft'): Promise<Banner[]> {
    try {
      const response = await apiClient.get<Banner[]>(`/api/banners/status/${status}`);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch banners by status');
    }
  }

  /**
   * Check banner status (Public)
   * GET /api/banners/:id/check-status
   */
  async checkBannerStatus(bannerId: string): Promise<{ isActive: boolean; status: string }> {
    try {
      const response = await apiClient.get<{ isActive: boolean; status: string }>(`/api/banners/${bannerId}/check-status`);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to check banner status');
    }
  }

  // ========== ADMIN METHODS ==========

  /**
   * Get banner statistics (Admin)
   * GET /api/banners/statistics
   */
  async getBannerStatistics(): Promise<BannerStatistics> {
    try {
      const response = await apiClient.get<BannerStatistics>('/api/banners/statistics');
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch banner statistics');
    }
  }

  /**
   * Get banners with status info (Admin)
   * GET /api/banners/admin/status
   */
  async getBannersWithStatus(): Promise<Banner[]> {
    try {
      const response = await apiClient.get<Banner[]>('/api/banners/admin/status');
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch banners with status');
    }
  }

  /**
   * Validate banner link (Admin)
   * POST /api/banners/validate-link
   */
  async validateBannerLink(link: string): Promise<{ isValid: boolean; message?: string }> {
    try {
      const response = await apiClient.post<{ isValid: boolean; message?: string }>('/api/banners/validate-link', { link });
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to validate banner link');
    }
  }

  /**
   * Get all banners with pagination (Admin)
   * GET /api/banners
   */
  async getAllBanners(filters?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    status?: string;
  }): Promise<PaginatedResponse<Banner>> {
    try {
      const response = await apiClient.getPaginated<Banner>('/api/banners', filters);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch banners');
    }
  }

  /**
   * Get banner by ID (Admin)
   * GET /api/banners/:id
   */
  async getBannerById(bannerId: string): Promise<Banner> {
    try {
      const response = await apiClient.get<Banner>(`/api/banners/${bannerId}`);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch banner');
    }
  }

  /**
   * Create banner (Admin only)
   */
  async createBanner(bannerData: CreateBannerRequest): Promise<Banner> {
    try {
      const response = await apiClient.post<Banner>('/api/banners', bannerData);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create banner');
    }
  }

  /**
   * Update banner (Admin only)
   */
  async updateBanner(bannerId: string, bannerData: Partial<CreateBannerRequest>): Promise<Banner> {
    try {
      const response = await apiClient.put<Banner>(`/api/banners/${bannerId}`, bannerData);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update banner');
    }
  }

  /**
   * Delete banner (Admin only)
   */
  async deleteBanner(bannerId: string): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.delete(`/api/banners/${bannerId}`);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete banner');
    }
  }
}

// Export singleton instance
export const bannerService = BannerService.getInstance();
export default bannerService;
