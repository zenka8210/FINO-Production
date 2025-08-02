import { apiClient } from '@/lib/api';
import { 
  Color, 
  ApiResponse 
} from '@/types';

export class ColorService {
  private static instance: ColorService;

  private constructor() {}

  public static getInstance(): ColorService {
    if (!ColorService.instance) {
      ColorService.instance = new ColorService();
    }
    return ColorService.instance;
  }

  /**
   * Get all colors (Public)
   */
  async getColors(): Promise<Color[]> {
    try {
      // Add limit=1000 to get all colors without pagination
      const response = await apiClient.get<ApiResponse<Color[]>>('/api/colors/public?limit=1000');
      return response.data?.data || [];
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch colors');
    }
  }

  /**
   * Get color by ID (Public)
   */
  async getColorById(id: string): Promise<Color> {
    try {
      const response = await apiClient.get<Color>(`/api/colors/public/${id}`);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch color');
    }
  }

  /**
   * Get suggested colors (Public)
   */
  async getSuggestedColors(): Promise<Color[]> {
    try {
      const response = await apiClient.get<Color[]>('/api/colors/suggestions');
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch suggested colors');
    }
  }

  /**
   * Search colors by name (Public)
   */
  async searchColors(name: string): Promise<Color[]> {
    try {
      const params = new URLSearchParams();
      params.append('name', name);
      
      const response = await apiClient.get<Color[]>('/api/colors/search', params);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to search colors');
    }
  }

  /**
   * Validate color name (Public)
   */
  async validateColorName(name: string, excludeId?: string): Promise<{ isValid: boolean; message?: string }> {
    try {
      const requestData: any = { name };
      if (excludeId) requestData.excludeId = excludeId;
      
      const response = await apiClient.post('/api/colors/validate-name', requestData);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to validate color name');
    }
  }

  // ========== ADMIN METHODS ==========

  /**
   * Get all colors with filters (Admin)
   */
  async getAllColorsAdmin(filters?: any): Promise<Color[]> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, value.toString());
          }
        });
      }

      const response = await apiClient.get<Color[]>('/api/colors', params);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch colors');
    }
  }

  /**
   * Get color by ID (Admin)
   * GET /api/colors/:id
   */
  async getColorByIdAdmin(id: string): Promise<Color> {
    try {
      const response = await apiClient.get<Color>(`/api/colors/${id}`);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch color');
    }
  }

  /**
   * Update color (Admin)
   */
  async updateColor(id: string, colorData: Partial<Color>): Promise<Color> {
    try {
      const response = await apiClient.put<Color>(`/api/colors/${id}`, colorData);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update color');
    }
  }

  /**
   * Delete color (Admin)
   */
  async deleteColor(id: string): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.delete(`/api/colors/${id}`);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete color');
    }
  }

  /**
   * Check if color can be deleted (Admin only)
   * GET /api/colors/:id/can-delete
   */
  async canDeleteColor(id: string): Promise<{ canDelete: boolean; reason?: string }> {
    try {
      const response = await apiClient.get<{ canDelete: boolean; reason?: string }>(`/api/colors/${id}/can-delete`);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to check if color can be deleted');
    }
  }

  /**
   * Create a new color (Admin only)
   * POST /api/colors
   */
  async createColor(colorData: { name: string }): Promise<Color> {
    try {
      const response = await apiClient.post<ApiResponse<Color>>('/api/colors', colorData);
      return response.data?.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create color');
    }
  }

  /**
   * Get color usage statistics (Admin only)
   * GET /api/colors/:id/usage-stats
   */
  async getColorUsageStats(id: string): Promise<{
    totalProducts: number;
    totalVariants: number;
    productNames: string[];
    lastUsed: string;
  }> {
    try {
      const response = await apiClient.get(`/api/colors/${id}/usage-stats`);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch color usage statistics');
    }
  }

  /**
   * Validate color for use (Admin only)
   * GET /api/colors/:id/validate-for-use
   */
  async validateColorForUse(id: string): Promise<{ isValid: boolean; message?: string }> {
    try {
      const response = await apiClient.get<{ isValid: boolean; message?: string }>(`/api/colors/${id}/validate-for-use`);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to validate color for use');
    }
  }

}

// Export singleton instance
export const colorService = ColorService.getInstance();
export default colorService;
