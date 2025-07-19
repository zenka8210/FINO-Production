import { useState, useCallback } from 'react';
import { Category } from '@/types';
import { categoryService } from '@/services';

/**
 * Hook for category-related operations without global state.
 * Use this for fetching categories when needed, not for storing them globally.
 */
export function useCategories() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCategories = useCallback(async (): Promise<Category[]> => {
    try {
      setLoading(true);
      setError(null);
      const response = await categoryService.getPublicCategories();
      return response.data; // Extract array from paginated response
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getCategoryById = useCallback(async (id: string): Promise<Category> => {
    try {
      setLoading(true);
      setError(null);
      const category = await categoryService.getCategoryById(id);
      return category;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getParentCategories = useCallback(async (): Promise<Category[]> => {
    try {
      setLoading(true);
      setError(null);
      const categories = await categoryService.getParentCategories();
      return categories;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getSubcategories = useCallback(async (parentId: string): Promise<Category[]> => {
    try {
      setLoading(true);
      setError(null);
      const categories = await categoryService.getSubcategories(parentId);
      return categories;
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
    getCategories,
    getCategoryById,
    getParentCategories,
    getSubcategories,
    clearError,
  };
}
