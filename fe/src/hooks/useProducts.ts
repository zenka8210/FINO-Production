import { useState, useCallback } from 'react';
import { ProductWithCategory, ProductFilters, PaginatedResponse } from '@/types';
import { productService } from '@/services';
import { useProduct } from '@/contexts';

/**
 * Hook for product filters state management
 * Uses ProductContext for managing filters state
 */
export function useProductFilters() {
  const context = useProduct();

  if (!context) {
    throw new Error('useProductFilters must be used within a ProductProvider');
  }

  return {
    // State from context
    filters: context.filters,
    isFiltersOpen: context.isFiltersOpen,

    // Actions from context
    setFilters: context.setFilters,
    clearFilters: context.clearFilters,
    toggleFilters: context.toggleFilters,
    setCategory: context.setCategory,
    setPriceRange: context.setPriceRange,
    setSearchTerm: context.setSearchTerm,
  };
}

/**
 * Hook for product-related operations without global state.
 * Use this for fetching products when needed, not for storing them globally.
 */
export function useProducts() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getProducts = useCallback(async (filters?: ProductFilters): Promise<PaginatedResponse<ProductWithCategory>> => {
    try {
      setLoading(true);
      setError(null);
      const response = await productService.getProducts(filters);
      return response;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getProductsWithVariants = useCallback(async (filters?: ProductFilters): Promise<PaginatedResponse<ProductWithCategory>> => {
    try {
      setLoading(true);
      setError(null);
      const response = await productService.getProductsWithVariants(filters);
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

  const getProductsByCategory = useCallback(async (categoryId: string, includeVariants: boolean = true): Promise<PaginatedResponse<ProductWithCategory>> => {
    try {
      setLoading(true);
      setError(null);
      const response = await productService.getProductsByCategory(categoryId, includeVariants);
      return response;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const searchProducts = useCallback(async (query: string, filters?: ProductFilters): Promise<PaginatedResponse<ProductWithCategory>> => {
    try {
      setLoading(true);
      setError(null);
      const response = await productService.searchProducts(query, filters);
      return response;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getFeaturedProducts = useCallback(async (): Promise<ProductWithCategory[]> => {
    try {
      setLoading(true);
      setError(null);
      const products = await productService.getFeaturedProducts();
      return products;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    getProducts,
    getProductsWithVariants,
    getProductById,
    getProductsByCategory,
    searchProducts,
    getFeaturedProducts,
    clearError,
  };
}

/**
 * Separate hook for admin product operations
 */
export function useProductAdmin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createProduct = useCallback(async (productData: any): Promise<any> => {
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

  const updateProduct = useCallback(async (productData: any): Promise<any> => {
    try {
      setLoading(true);
      setError(null);
      const product = await productService.updateProduct(productData);
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

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    createProduct,
    updateProduct,
    deleteProduct,
    clearError,
  };
}
