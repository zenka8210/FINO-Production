import { useState, useCallback } from 'react';
import { OrderWithRefs, OrderFilters, PaginatedResponse, OrderStatus } from '@/types';
import { orderService } from '@/services';
import { useOrder } from '@/contexts';

/**
 * Hook for current order state management
 * Uses OrderContext for managing current order state
 */
export function useCurrentOrder() {
  const context = useOrder();

  if (!context) {
    throw new Error('useCurrentOrder must be used within an OrderProvider');
  }

  return {
    // State from context
    currentOrder: context.currentOrder,
    orderItems: context.orderItems,
    loading: context.loading,
    error: context.error,

    // Actions from context
    createOrder: context.createOrder,
    updateOrderStatus: context.updateOrderStatus,
    clearCurrentOrder: context.clearCurrentOrder,
    addOrderItem: context.addOrderItem,
    removeOrderItem: context.removeOrderItem,
    clearError: context.clearError,

    // Computed values from context
    getOrderTotal: context.getOrderTotal,

    // Utility computed values
    hasItems: context.orderItems.length > 0,
    isEmpty: context.orderItems.length === 0,
    itemsCount: context.orderItems.length,
    total: context.getOrderTotal(),
  };
}

/**
 * Hook for order-related operations without global state.
 * Use this for fetching orders when needed, not for storing them globally.
 */
export function useOrders() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getUserOrders = useCallback(async (filters?: OrderFilters): Promise<PaginatedResponse<OrderWithRefs>> => {
    try {
      setLoading(true);
      setError(null);
      const response = await orderService.getUserOrders(filters);
      return response;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAllOrders = useCallback(async (filters?: OrderFilters): Promise<PaginatedResponse<OrderWithRefs>> => {
    try {
      setLoading(true);
      setError(null);
      const response = await orderService.getAllOrders(filters);
      return response;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getOrderById = useCallback(async (id: string): Promise<OrderWithRefs> => {
    try {
      setLoading(true);
      setError(null);
      const order = await orderService.getOrderById(id);
      return order;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getOrdersByUserId = useCallback(async (userId: string, filters?: OrderFilters): Promise<PaginatedResponse<OrderWithRefs>> => {
    try {
      setLoading(true);
      setError(null);
      const response = await orderService.getOrdersByUserId(userId, filters);
      return response;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelOrder = useCallback(async (id: string): Promise<OrderWithRefs> => {
    try {
      setLoading(true);
      setError(null);
      const cancelledOrder = await orderService.cancelOrder(id);
      return cancelledOrder;
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
    getUserOrders,
    getAllOrders,
    getOrderById,
    getOrdersByUserId,
    cancelOrder,
    clearError,
  };
}
