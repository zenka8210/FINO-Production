import { useState, useCallback } from 'react';
import { Product, ProductWithCategory, PaginatedResponse, ProductFilters } from '@/types';
import { productService } from '@/services';

interface AdminProductFilters extends ProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  isActive?: boolean;
  inStock?: boolean;
  sort?: 'name' | 'price' | 'createdAt';
  order?: 'asc' | 'desc';
  includeVariants?: boolean;
  includeReviewStats?: boolean;
  includeOutOfStock?: boolean;
}

interface ProductStatistics {
  totalProducts: number;
  totalVariants: number;
  activeProducts: number;
  outOfStockProducts: number;
  lowStockProducts: number;
  categoryStats: any[];
  topProducts: any[];
}

/**
 * Hook for admin product management operations
 * Handles fetching, creating, updating, deleting products
 */
export function useAdminProducts() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getProducts = useCallback(async (filters?: AdminProductFilters): Promise<PaginatedResponse<ProductWithCategory>> => {
    try {
      setLoading(true);
      setError(null);
      const response = await productService.getAllProductsAdmin(filters);
      return response;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getProductById = useCallback(async (id: string): Promise<ProductWithCategory> => {
    try {
      setLoading(true);
      setError(null);
      const product = await productService.getProductById(id);
      return product;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createProduct = useCallback(async (productData: {
    name: string;
    price: number;
    description?: string;
    category: string;
    images: string[];
    salePrice?: number;
    saleStartDate?: string;
    saleEndDate?: string;
  }): Promise<Product> => {
    try {
      setLoading(true);
      setError(null);
      const product = await productService.createProduct(productData);
      return product;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProduct = useCallback(async (id: string, updateData: Partial<{
    name: string;
    price: number;
    description: string;
    category: string;
    images: string[];
    salePrice: number;
    saleStartDate: string;
    saleEndDate: string;
    isActive: boolean;
  }>): Promise<Product> => {
    try {
      setLoading(true);
      setError(null);
      const product = await productService.updateProduct({ _id: id, ...updateData });
      return product;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteProduct = useCallback(async (id: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await productService.deleteProduct(id);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleProductStatus = useCallback(async (id: string): Promise<Product> => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the new toggle method from productService
      const updatedProduct = await productService.toggleProductStatus(id);
      console.log('✅ Product status toggled:', updatedProduct);
      
      return updatedProduct;
    } catch (err: any) {
      console.error('❌ Error in toggleProductStatus hook:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getOutOfStockProducts = useCallback(async (): Promise<ProductWithCategory[]> => {
    try {
      setLoading(true);
      setError(null);
      const products = await productService.getOutOfStockProducts();
      return products;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getProductStatistics = useCallback(async (): Promise<ProductStatistics> => {
    try {
      setLoading(true);
      setError(null);
      const stats = await productService.getProductStatistics();
      return stats;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getProductVariants = useCallback(async (productId: string): Promise<any[]> => {
    try {
      setLoading(true);
      setError(null);
      const variants = await productService.getProductVariants(productId);
      return variants;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createVariant = useCallback(async (variantData: {
    product: string;
    color: string;
    size: string;
    price: number;
    stock: number;
    sku?: string;
    images: string[];
  }): Promise<any> => {
    try {
      setLoading(true);
      setError(null);
      const variant = await productService.createVariant(variantData);
      return variant;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateVariant = useCallback(async (variantId: string, variantData: any): Promise<any> => {
    try {
      setLoading(true);
      setError(null);
      const variant = await productService.updateVariant(variantId, variantData);
      return variant;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteVariant = useCallback(async (variantId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await productService.deleteVariant(variantId);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    toggleProductStatus,
    getOutOfStockProducts,
    getProductStatistics,
    getProductVariants,
    createVariant,
    updateVariant,
    deleteVariant,
    clearError: () => setError(null)
  };
}
