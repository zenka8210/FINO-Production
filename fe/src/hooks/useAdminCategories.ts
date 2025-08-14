import { useState } from 'react';
import { categoryService } from '../services/categoryService';

export const useAdminCategories = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const getCategories = async (filters: any = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await categoryService.getAllCategories(filters);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Có lỗi xảy ra';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async (categoryData: any) => {
    try {
      setLoading(true);
      setError(null);
      const response = await categoryService.createCategory(categoryData);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Có lỗi xảy ra';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateCategory = async (id: string, categoryData: any) => {
    try {
      setLoading(true);
      setError(null);
      const response = await categoryService.updateCategory(id, categoryData);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Có lỗi xảy ra';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await categoryService.deleteCategory(id);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Có lỗi xảy ra';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const permanentlyDeleteCategory = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await categoryService.permanentlyDeleteCategory(id);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Có lỗi xảy ra';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getCategoryStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use new admin statistics API
      const response = await categoryService.getAdminStatistics();
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Có lỗi xảy ra';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    clearError,
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    permanentlyDeleteCategory,
    getCategoryStatistics,
  };
};
