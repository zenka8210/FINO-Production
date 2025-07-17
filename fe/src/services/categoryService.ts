import { apiClient } from '@/lib/api';
import { 
  Category, 
  ApiResponse, 
  PaginatedResponse 
} from '@/types';

interface CategoryFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  parentId?: string;
}

interface CategoryStats {
  totalProducts: number;
  totalSubcategories: number;
  level: number;
  hasProducts: boolean;
  hasSubcategories: boolean;
}

interface CategoryPath {
  id: string;
  name: string;
  slug: string;
  level: number;
}

export class CategoryService {
  private static instance: CategoryService;

  private constructor() {}

  public static getInstance(): CategoryService {
    if (!CategoryService.instance) {
      CategoryService.instance = new CategoryService();
    }
    return CategoryService.instance;
  }

  // ========== PUBLIC METHODS ==========

  /**
   * Get category tree (hierarchical structure)
   * GET /api/categories/tree
   */
  async getCategoryTree(): Promise<Category[]> {
    try {
      const response = await apiClient.get<Category[]>('/api/categories/tree');
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch category tree');
    }
  }

  /**
   * Get root categories only
   * GET /api/categories/roots
   */
  async getRootCategories(): Promise<Category[]> {
    try {
      const response = await apiClient.get<Category[]>('/api/categories/roots');
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch root categories');
    }
  }

  /**
   * Get child categories of a parent
   * GET /api/categories/:id/children
   */
  async getChildCategories(parentId: string): Promise<Category[]> {
    try {
      const response = await apiClient.get<Category[]>(`/api/categories/${parentId}/children`);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch child categories');
    }
  }

  /**
   * Get category path (breadcrumb)
   * GET /api/categories/:id/path
   */
  async getCategoryPath(categoryId: string): Promise<CategoryPath[]> {
    try {
      const response = await apiClient.get<CategoryPath[]>(`/api/categories/${categoryId}/path`);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch category path');
    }
  }

  /**
   * Get category ancestors
   * GET /api/categories/:id/ancestors
   */
  async getCategoryAncestors(categoryId: string): Promise<Category[]> {
    try {
      const response = await apiClient.get<Category[]>(`/api/categories/${categoryId}/ancestors`);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch category ancestors');
    }
  }

  /**
   * Get all categories (public with pagination)
   * GET /api/categories/public
   */
  async getPublicCategories(filters?: CategoryFilters): Promise<PaginatedResponse<Category>> {
    try {
      const response = await apiClient.getPaginated<Category>('/api/categories/public', filters);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch public categories');
    }
  }

  /**
   * Get category by ID (public)
   * GET /api/categories/:id/public
   */
  async getPublicCategoryById(id: string): Promise<Category> {
    try {
      const response = await apiClient.get<Category>(`/api/categories/${id}/public`);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch public category');
    }
  }

  // ========== ADMIN METHODS ==========

  /**
   * Get all categories (admin with pagination)
   * GET /api/categories
   */
  async getAllCategories(filters?: CategoryFilters): Promise<PaginatedResponse<Category>> {
    try {
      const response = await apiClient.getPaginated<Category>('/api/categories', filters);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch categories');
    }
  }

  /**
   * Get category by ID (admin)
   * GET /api/categories/:id
   */
  async getCategoryById(id: string): Promise<Category> {
    try {
      const response = await apiClient.get<Category>(`/api/categories/${id}`);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch category');
    }
  }

  /**
   * Create new category (Admin only)
   * POST /api/categories
   */
  async createCategory(categoryData: Omit<Category, '_id' | 'createdAt' | 'updatedAt'>): Promise<Category> {
    try {
      const response = await apiClient.post<Category>('/api/categories', categoryData);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create category');
    }
  }

  /**
   * Update category (Admin only)
   * PUT /api/categories/:id
   */
  async updateCategory(id: string, categoryData: Partial<Category>): Promise<Category> {
    try {
      const response = await apiClient.put<Category>(`/api/categories/${id}`, categoryData);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update category');
    }
  }

  /**
   * Delete category (Admin only)
   * DELETE /api/categories/:id
   */
  async deleteCategory(id: string): Promise<ApiResponse<any>> {
    try {
      return await apiClient.delete(`/api/categories/${id}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete category');
    }
  }

  /**
   * Get category statistics (Admin only)
   * GET /api/categories/:id/stats
   */
  async getCategoryStats(id: string): Promise<CategoryStats> {
    try {
      const response = await apiClient.get<CategoryStats>(`/api/categories/${id}/stats`);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch category statistics');
    }
  }

  /**
   * Check if category can be deleted (Admin only)
   * GET /api/categories/:id/can-delete
   */
  async canDeleteCategory(id: string): Promise<{ canDelete: boolean; reason?: string }> {
    try {
      const response = await apiClient.get<{ canDelete: boolean; reason?: string }>(`/api/categories/${id}/can-delete`);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to check delete permission');
    }
  }

  /**
   * Validate parent category (Admin only)
   * POST /api/categories/validate-parent
   */
  async validateParentCategory(parentId: string, categoryId?: string): Promise<{ isValid: boolean; message?: string }> {
    try {
      const data: any = { parentId };
      if (categoryId) data.categoryId = categoryId;
      
      const response = await apiClient.post<{ isValid: boolean; message?: string }>('/api/categories/validate-parent', data);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to validate parent category');
    }
  }

  // ========== LEGACY METHODS (backward compatibility) ==========

  /**
   * @deprecated Use getPublicCategories() instead
   */
  async getCategories(): Promise<Category[]> {
    try {
      const response = await this.getPublicCategories();
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch categories');
    }
  }

  /**
   * @deprecated Use getRootCategories() instead
   */
  async getParentCategories(): Promise<Category[]> {
    return this.getRootCategories();
  }

  /**
   * @deprecated Use getChildCategories() instead
   */
  async getSubcategories(parentId: string): Promise<Category[]> {
    return this.getChildCategories(parentId);
  }
}

// Export singleton instance
export const categoryService = CategoryService.getInstance();
export default categoryService;
