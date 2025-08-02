import { useState, useCallback } from 'react';
import { orderService } from '@/services/orderService';
import { OrderWithRefs, PaginatedResponse } from '@/types';

interface OrderFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  paymentMethod?: string;
  userId?: string;
}

export function useAdminOrders() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getOrders = useCallback(async (filters?: OrderFilters): Promise<PaginatedResponse<OrderWithRefs>> => {
    try {
      setLoading(true);
      setError(null);
      // Fix linter: chỉ truyền status hợp lệ
      let safeFilters = { ...filters };
      const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
      if (safeFilters.status && !validStatuses.includes(safeFilters.status)) {
        delete safeFilters.status;
      } else if (safeFilters.status) {
        safeFilters.status = safeFilters.status as 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
      }
      return await orderService.getAllOrders(safeFilters as any);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateOrderStatus = useCallback(async (id: string, status: string) => {
    try {
      setLoading(true);
      setError(null);
      return await orderService.updateOrderStatus(id, status as any);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getOrderStatistics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      return await orderService.getOrderStatistics();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteOrder = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      return await orderService.deleteOrder(id);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = () => setError(null);

  return {
    loading,
    error,
    getOrders,
    updateOrderStatus,
    getOrderStatistics,
    deleteOrder,
    clearError,
  };
} 