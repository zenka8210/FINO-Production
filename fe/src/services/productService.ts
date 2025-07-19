import { apiClient } from '@/lib/api';
import { 
  Product, 
  ProductWithCategory,
  ProductVariant,
  ProductVariantWithRefs,
  ProductFilters,
  CreateProductRequest,
  UpdateProductRequest,
  CreateVariantRequest,
  PaginatedResponse,
  ApiResponse 
} from '@/types';

export class ProductService {
  private static instance: ProductService;

  private constructor() {}

  public static getInstance(): ProductService {
    if (!ProductService.instance) {
      ProductService.instance = new ProductService();
    }
    return ProductService.instance;
  }

  /**
   * Get all public products with pagination, filtering, and sorting
   */
  async getProducts(filters?: ProductFilters): Promise<PaginatedResponse<ProductWithCategory>> {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, value.toString());
          }
        });
      }

      const response = await apiClient.getPaginated<ProductWithCategory>('/api/products/public', params);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch products');
    }
  }

  /**
   * Get available products (in stock only)
   */
  async getAvailableProducts(includeVariants: boolean = true): Promise<PaginatedResponse<ProductWithCategory>> {
    try {
      const params = new URLSearchParams();
      params.append('includeVariants', includeVariants.toString());

      const response = await apiClient.getPaginated<ProductWithCategory>('/api/products/available', params);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch available products');
    }
  }

  /**
   * Get public display products (for homepage, listing)
   */
  async getPublicDisplayProducts(): Promise<ProductWithCategory[]> {
    try {
      const response = await apiClient.get('/api/products/public-display');
      
      // API returns: { success: true, data: { products: [...], pagination: {...} } }
      if (response.data && response.data.products && Array.isArray(response.data.products)) {
        return response.data.products;
      } else {
        console.warn('Unexpected response structure from public-display API:', response);
        return [];
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch public display products');
    }
  }

  /**
   * Get product by ID (admin only)
   */
  async getProductById(id: string): Promise<ProductWithCategory> {
    try {
      const response = await apiClient.get<ProductWithCategory>(`/api/products/${id}`);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch product');
    }
  }

  /**
   * Get product by ID for public display (product details page)
   */
  async getPublicProductById(id: string): Promise<ProductWithCategory> {
    try {
      const endpoint = `/api/products/public/${id}?includeVariants=true`;
      console.log('📡 Calling public product API:', endpoint);
      const response = await apiClient.get<ProductWithCategory>(endpoint);
      console.log('✅ Product API response:', response.data);
      return response.data!;
    } catch (error: any) {
      console.error('❌ Product API error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch product');
    }
  }

  /**
   * Get product variants by product ID
   */
  async getProductVariants(productId: string): Promise<ProductVariantWithRefs[]> {
    try {
      const response = await apiClient.get<ProductVariantWithRefs[]>(`/api/product-variants/product/${productId}`);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch product variants');
    }
  }

  /**
   * Get variant by ID
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
   * Check product availability
   */
  async checkProductAvailability(productId: string): Promise<{ isAvailable: boolean; variants: any[] }> {
    try {
      const response = await apiClient.get(`/api/products/check-availability/${productId}`);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to check availability');
    }
  }

  /**
   * Check variant stock
   */
  async checkVariantStock(variantId: string, quantity: number): Promise<{ hasEnoughStock: boolean; availableStock: number }> {
    try {
      const params = new URLSearchParams();
      params.append('quantity', quantity.toString());

      const response = await apiClient.get(`/api/products/check-variant-stock/${variantId}`, params);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to check variant stock');
    }
  }

  /**
   * Validate cart items before checkout
   */
  async validateCartItems(items: Array<{ variantId: string; quantity: number }>): Promise<{ isValid: boolean; errors: any[] }> {
    try {
      const response = await apiClient.post('/api/products/validate-cart', { items });
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to validate cart');
    }
  }

  /**
   * Search products
   */
  async searchProducts(query: string, filters?: Omit<ProductFilters, 'search'>): Promise<PaginatedResponse<ProductWithCategory>> {
    try {
      const searchFilters = { ...filters, search: query };
      return await this.getProducts(searchFilters);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to search products');
    }
  }

  /**
   * Get featured products
   */
  async getFeaturedProducts(limit: number = 8): Promise<ProductWithCategory[]> {
    try {
      const filters: ProductFilters = {
        limit,
        sort: 'createdAt',
        order: 'desc'
      };
      
      const response = await this.getAvailableProducts();
      return response.data.slice(0, limit);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch featured products');
    }
  }

  /**
   * Get products by category (public endpoint)
   */
  async getProductsByCategory(categoryId: string, includeVariants: boolean = true): Promise<PaginatedResponse<ProductWithCategory>> {
    try {
      const params = new URLSearchParams();
      params.append('includeVariants', includeVariants.toString());

      const response = await apiClient.getPaginated<ProductWithCategory>(`/api/products/category/${categoryId}/public`, params);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch products by category');
    }
  }

  /**
   * Get sale products
   */
  async getSaleProducts(filters?: Omit<ProductFilters, 'isOnSale'>): Promise<PaginatedResponse<ProductWithCategory>> {
    try {
      const saleFilters = { ...filters, isOnSale: true };
      return await this.getProducts(saleFilters);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch sale products');
    }
  }

  // ========== ADMIN METHODS ==========

  /**
   * Get all products (Admin only) - with pagination, filtering, and sorting
   */
  async getAllProductsAdmin(filters?: ProductFilters): Promise<PaginatedResponse<ProductWithCategory>> {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, value.toString());
          }
        });
      }

      const response = await apiClient.getPaginated<ProductWithCategory>('/api/products', params);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch all products for admin');
    }
  }

  /**
   * Get product by ID (Admin only)
   */
  async getProductByIdAdmin(id: string, includeVariants: boolean = true): Promise<ProductWithCategory> {
    try {
      const params = new URLSearchParams();
      params.append('includeVariants', includeVariants.toString());

      const response = await apiClient.get<ProductWithCategory>(`/api/products/${id}`, params);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch product for admin');
    }
  }

  /**
   * Create new product (Admin only)
   */
  async createProduct(productData: CreateProductRequest): Promise<Product> {
    try {
      const response = await apiClient.post<Product>('/api/products', productData);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create product');
    }
  }

  /**
   * Update product (Admin only)
   */
  async updateProduct(productData: UpdateProductRequest): Promise<Product> {
    try {
      const { _id, ...updateData } = productData;
      const response = await apiClient.put<Product>(`/api/products/${_id}`, updateData);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update product');
    }
  }

  /**
   * Delete product (Admin only)
   */
  async deleteProduct(productId: string): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.delete(`/api/products/${productId}`);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete product');
    }
  }

  /**
   * Create product variant (Admin only)
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
   * Update product variant (Admin only)
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
   * Delete product variant (Admin only)
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
   * Get out of stock products (Admin only)
   */
  async getOutOfStockProducts(): Promise<ProductWithCategory[]> {
    try {
      const response = await apiClient.get<ProductWithCategory[]>('/api/products/admin/out-of-stock');
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch out of stock products');
    }
  }

  /**
   * Get out of stock notifications (Admin only)
   */
  async getOutOfStockNotifications(): Promise<any> {
    try {
      const response = await apiClient.get('/api/products/admin/out-of-stock-notification');
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch out of stock notifications');
    }
  }

  /**
   * Get product statistics (Admin)
   * GET /api/products/admin/statistics
   */
  async getProductStatistics(): Promise<{
    totalProducts: number;
    totalVariants: number;
    activeProducts: number;
    outOfStockProducts: number;
    lowStockProducts: number;
    categoryStats: any[];
    topProducts: any[];
  }> {
    try {
      const response = await apiClient.get('/api/products/admin/statistics');
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch product statistics');
    }
  }

  /**
   * Validate product for display (Public)
   * GET /api/products/:id/validate-display
   */
  async validateProductForDisplay(productId: string): Promise<{ isValid: boolean; message?: string }> {
    try {
      const response = await apiClient.get<{ isValid: boolean; message?: string }>(`/api/products/${productId}/validate-display`);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to validate product for display');
    }
  }

  /**
   * Prevent out of stock add to cart (Public)
   * POST /api/products/check-add-to-cart
   */
  async preventOutOfStockAddToCart(data: { productVariantId: string; quantity: number }): Promise<{ canAdd: boolean; availableStock?: number; message?: string }> {
    try {
      const response = await apiClient.post<{ canAdd: boolean; availableStock?: number; message?: string }>('/api/products/check-add-to-cart', data);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to check add to cart availability');
    }
  }

  /**
   * Get public products (optimized for display) - Remove duplicate method
   */
  // Removed duplicate method - using getPublicDisplayProducts() instead

  /**
   * Validate product for display (Admin version)
   * GET /api/products/:id/validate-display-admin
   */
  async validateProductForDisplayAdmin(productId: string): Promise<{ isValid: boolean; message?: string }> {
    try {
      const response = await apiClient.get<{ isValid: boolean; message?: string }>(`/api/products/${productId}/validate-display-admin`);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to validate product for admin display');
    }
  }

}

// Export singleton instance
export const productService = ProductService.getInstance();
export default productService;
