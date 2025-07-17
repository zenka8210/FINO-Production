import { apiClient } from '@/lib/api';
import { 
  ProductVariant,
  ProductVariantWithRefs,
  CreateVariantRequest,
  PaginatedResponse,
  ApiResponse 
} from '@/types';

interface VariantFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  product?: string;
  color?: string;
  size?: string;
  minPrice?: number;
  maxPrice?: number;
  minStock?: number;
  maxStock?: number;
}

export class ProductVariantService {
  private static instance: ProductVariantService;

  private constructor() {}

  public static getInstance(): ProductVariantService {
    if (!ProductVariantService.instance) {
      ProductVariantService.instance = new ProductVariantService();
    }
    return ProductVariantService.instance;
  }

  // ========== PUBLIC METHODS ==========

  /**
   * Get all product variants (Public)
   */
  async getAllVariants(filters?: VariantFilters): Promise<PaginatedResponse<ProductVariantWithRefs>> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, value.toString());
          }
        });
      }

      const response = await apiClient.getPaginated<ProductVariantWithRefs>('/api/product-variants', params);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch product variants');
    }
  }

  /**
   * Get variants by product ID (Public)
   */
  async getVariantsByProductId(productId: string, filters?: Omit<VariantFilters, 'product'>): Promise<ProductVariantWithRefs[]> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, value.toString());
          }
        });
      }

      const response = await apiClient.get<ProductVariantWithRefs[]>(`/api/product-variants/product/${productId}`, params);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch variants by product ID');
    }
  }

  /**
   * Get variant by ID (Public)
   */
  async getVariantById(variantId: string): Promise<ProductVariantWithRefs> {
    try {
      const response = await apiClient.get<ProductVariantWithRefs>(`/api/product-variants/${variantId}`);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch variant');
    }
  }

  /**
   * Validate cart addition (Public)
   */
  async validateCartAddition(variantId: string, quantity: number): Promise<{ canAdd: boolean; message?: string }> {
    try {
      const response = await apiClient.post('/api/product-variants/validate-cart-addition', {
        variantId,
        quantity
      });
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to validate cart addition');
    }
  }

  /**
   * Validate variant requirements (Public)
   */
  async validateVariantRequirements(product: string, color: string, size: string): Promise<{ isValid: boolean; message?: string }> {
    try {
      const response = await apiClient.post('/api/product-variants/validate-requirements', {
        product,
        color,
        size
      });
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to validate variant requirements');
    }
  }

  /**
   * Check product stock status (Public)
   */
  async checkProductStockStatus(productId: string): Promise<any> {
    try {
      const response = await apiClient.get(`/api/product-variants/product/${productId}/stock-status`);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to check product stock status');
    }
  }

  // ========== ADMIN METHODS ==========

  /**
   * Create new product variant (Admin)
   */
  async createVariant(variantData: CreateVariantRequest): Promise<ProductVariant> {
    try {
      const response = await apiClient.post<ProductVariant>('/api/product-variants', variantData);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create variant');
    }
  }

  /**
   * Get all variants for admin (Admin)
   */
  async getAllVariantsAdmin(filters?: VariantFilters): Promise<PaginatedResponse<ProductVariantWithRefs>> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, value.toString());
          }
        });
      }

      const response = await apiClient.getPaginated<ProductVariantWithRefs>('/api/product-variants/admin', params);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch variants for admin');
    }
  }

  /**
   * Update variant stock (Admin)
   */
  async updateVariantStock(variantId: string, quantityChange: number, operation: 'increase' | 'decrease'): Promise<ProductVariant> {
    try {
      const response = await apiClient.put<ProductVariant>(`/api/product-variants/${variantId}/stock`, {
        quantityChange,
        operation
      });
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update variant stock');
    }
  }

  /**
   * Update variant (Admin)
   */
  async updateVariant(variantId: string, variantData: Partial<CreateVariantRequest>): Promise<ProductVariant> {
    try {
      const response = await apiClient.put<ProductVariant>(`/api/product-variants/${variantId}`, variantData);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update variant');
    }
  }

  /**
   * Delete variant (Admin)
   */
  async deleteVariant(variantId: string): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.delete(`/api/product-variants/${variantId}`);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete variant');
    }
  }

  /**
   * Check variant deletion safety (Admin)
   */
  async checkVariantDeletion(variantId: string): Promise<{ canDelete: boolean; message?: string }> {
    try {
      const response = await apiClient.get(`/api/product-variants/${variantId}/check-deletion`);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to check variant deletion');
    }
  }

  /**
   * Get out of stock variants (Admin)
   */
  async getOutOfStockVariants(filters?: { page?: number; limit?: number; product?: string }): Promise<PaginatedResponse<ProductVariantWithRefs>> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, value.toString());
          }
        });
      }

      const response = await apiClient.getPaginated<ProductVariantWithRefs>('/api/product-variants/admin/out-of-stock', params);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch out of stock variants');
    }
  }

  /**
   * Get variant statistics (Admin)
   */
  async getVariantStatistics(): Promise<any> {
    try {
      const response = await apiClient.get('/api/product-variants/admin/statistics');
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch variant statistics');
    }
  }
}

// Export singleton instance
export const productVariantService = ProductVariantService.getInstance();
export default productVariantService;
