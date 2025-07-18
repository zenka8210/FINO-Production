import { apiClient } from '@/lib/api';
import { 
  Size, 
  ApiResponse 
} from '@/types';

export class SizeService {
  private static instance: SizeService;

  private constructor() {}

  public static getInstance(): SizeService {
    if (!SizeService.instance) {
      SizeService.instance = new SizeService();
    }
    return SizeService.instance;
  }

  /**
   * Get all sizes (Public)
   */
  async getSizes(): Promise<Size[]> {
    try {
      const response = await apiClient.get<Size[]>('/api/sizes/public');
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch sizes');
    }
  }

  /**
   * Get size by ID (Public)
   */
  async getSizeById(id: string): Promise<Size> {
    try {
      const response = await apiClient.get<Size>(`/api/sizes/public/${id}`);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch size');
    }
  }

  /**
   * Get size enums (Public)
   */
  async getSizeEnums(category?: string): Promise<string[]> {
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      
      const response = await apiClient.get<string[]>('/api/sizes/enums', params);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch size enums');
    }
  }

  /**
   * Get all size enums (Public)
   */
  async getAllSizeEnums(): Promise<string[]> {
    try {
      const response = await apiClient.get<string[]>('/api/sizes/enums/all');
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch all size enums');
    }
  }

  /**
   * Get size suggestions by category (Public)
   */
  async getSizeSuggestions(category?: string): Promise<Size[]> {
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      
      const response = await apiClient.get<Size[]>('/api/sizes/suggestions', params);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch size suggestions');
    }
  }

  /**
   * Search sizes by name (Public)
   */
  async searchSizes(name: string): Promise<Size[]> {
    try {
      const params = new URLSearchParams();
      params.append('name', name);
      
      const response = await apiClient.get<Size[]>('/api/sizes/search', params);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to search sizes');
    }
  }

  /**
   * Validate size name (Public)
   */
  async validateSizeName(name: string, excludeId?: string): Promise<{ isValid: boolean; message?: string }> {
    try {
      const requestData: any = { name };
      if (excludeId) requestData.excludeId = excludeId;
      
      const response = await apiClient.post('/api/sizes/validate-name', requestData);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to validate size name');
    }
  }

  /**
   * Validate size for use (Public)
   * GET /api/sizes/:id/validate-for-use
   */
  async validateSizeForUse(id: string): Promise<{ isValid: boolean; message?: string }> {
    try {
      const response = await apiClient.get<{ isValid: boolean; message?: string }>(`/api/sizes/${id}/validate-for-use`);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to validate size for use');
    }
  }

  // ========== ADMIN METHODS ==========

  /**
   * Get all sizes with filters (Admin)
   */
  async getAllSizesAdmin(filters?: any): Promise<Size[]> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, value.toString());
          }
        });
      }

      const response = await apiClient.get<Size[]>('/api/sizes', params);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch sizes');
    }
  }

  /**
   * Get size by ID (Admin)
   */
  async getSizeByIdAdmin(id: string): Promise<Size> {
    try {
      const response = await apiClient.get<Size>(`/api/sizes/${id}`);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch size');
    }
  }

  /**
   * Create new size (Admin)
   */
  async createSize(sizeData: Omit<Size, '_id' | 'createdAt' | 'updatedAt'>): Promise<Size> {
    try {
      const response = await apiClient.post<Size>('/api/sizes', sizeData);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create size');
    }
  }

  /**
   * Update size (Admin)
   */
  async updateSize(id: string, sizeData: Partial<Size>): Promise<Size> {
    try {
      const response = await apiClient.put<Size>(`/api/sizes/${id}`, sizeData);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update size');
    }
  }

  /**
   * Delete size (Admin)
   */
  async deleteSize(id: string): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.delete(`/api/sizes/${id}`);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete size');
    }
  }

  /**
   * Bulk create sizes from enum (Admin)
   * POST /api/sizes/bulk-create-enum
   */
  async bulkCreateSizesFromEnum(category: string = 'clothing'): Promise<Size[]> {
    try {
      const response = await apiClient.post<Size[]>('/api/sizes/bulk-create-enum', { category });
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to bulk create sizes from enum');
    }
  }

  /**
   * Get size usage statistics (Admin)
   * GET /api/sizes/:id/usage-stats
   */
  async getSizeUsageStats(id: string): Promise<{
    totalProducts: number;
    totalVariants: number;
    productNames: string[];
    lastUsed: string;
  }> {
    try {
      const response = await apiClient.get(`/api/sizes/${id}/usage-stats`);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch size usage statistics');
    }
  }

  /**
   * Check if size can be deleted (Admin)
   * GET /api/sizes/:id/can-delete
   */
  async canDeleteSize(id: string): Promise<{ canDelete: boolean; reason?: string }> {
    try {
      const response = await apiClient.get<{ canDelete: boolean; reason?: string }>(`/api/sizes/${id}/can-delete`);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to check if size can be deleted');
    }
  }

}

// Export singleton instance
export const sizeService = SizeService.getInstance();
export default sizeService;
