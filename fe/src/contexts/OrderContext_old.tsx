'use client';

import React, { createContext, useContext, useReducer, useCallback } from 'react';
import {
  OrderContextType,
  OrderWithRefs,
  OrderFilters,
  OrderStatus
} from '@/types';
import { orderService } from '@/services';
import { useNotification } from './NotificationContext';

interface OrderState {
  orders: OrderWithRefs[];
  currentOrder: OrderWithRefs | null;
  loading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
  filters: OrderFilters;
}

type OrderAction =
  | { type: 'LOADING' }
  | { type: 'ORDERS_SUCCESS'; payload: { orders: OrderWithRefs[]; totalPages: number; currentPage: number } }
  | { type: 'ORDER_SUCCESS'; payload: OrderWithRefs }
  | { type: 'SET_FILTERS'; payload: Partial<OrderFilters> }
  | { type: 'CLEAR_FILTERS' }
  | { type: 'ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' };

const initialFilters: OrderFilters = {
  page: 1,
  limit: 10,
  status: undefined,
  startDate: undefined,
  endDate: undefined,
};

const initialState: OrderState = {
  orders: [],
  currentOrder: null,
  loading: false,
  error: null,
  totalPages: 1,
  currentPage: 1,
  filters: initialFilters,
};

function orderReducer(state: OrderState, action: OrderAction): OrderState {
  switch (action.type) {
    case 'LOADING':
      return {
        ...state,
        loading: true,
        error: null,
      };
    case 'ORDERS_SUCCESS':
      return {
        ...state,
        orders: action.payload.orders,
        totalPages: action.payload.totalPages,
        currentPage: action.payload.currentPage,
        loading: false,
        error: null,
      };
    case 'ORDER_SUCCESS':
      return {
        ...state,
        currentOrder: action.payload,
        loading: false,
        error: null,
      };
    case 'SET_FILTERS':
      return {
        ...state,
        filters: { ...state.filters, ...action.payload },
      };
    case 'CLEAR_FILTERS':
      return {
        ...state,
        filters: initialFilters,
      };
    case 'ERROR':
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

interface OrderProviderProps {
  children: React.ReactNode;
}

export function OrderProvider({ children }: OrderProviderProps) {
  const [state, dispatch] = useReducer(orderReducer, initialState);
  const { success, error: showError } = useNotification();

  const loadOrders = useCallback(async (): Promise<void> => {
    try {
      dispatch({ type: 'LOADING' });
      const response = await orderService.getAllOrders(state.filters);
      dispatch({
        type: 'ORDERS_SUCCESS',
        payload: {
          orders: response.data,
          totalPages: response.pagination.totalPages,
          currentPage: response.pagination.current,
        }
      });
    } catch (error: any) {
      dispatch({ type: 'ERROR', payload: error.message });
      showError('Failed to load orders', error.message);
    }
  }, [state.filters, showError]);

  const loadOrderById = useCallback(async (id: string): Promise<void> => {
    try {
      dispatch({ type: 'LOADING' });
      const order = await orderService.getOrderById(id);
      dispatch({ type: 'ORDER_SUCCESS', payload: order });
    } catch (error: any) {
      dispatch({ type: 'ERROR', payload: error.message });
      showError('Failed to load order', error.message);
    }
  }, [showError]);

  const updateOrderStatus = useCallback(async (orderId: string, status: OrderStatus): Promise<void> => {
    try {
      dispatch({ type: 'LOADING' });
      const updatedOrder = await orderService.updateOrderStatus(orderId, status);
      
      // Update orders list
      const updatedOrders = state.orders.map(order =>
        order._id === orderId ? updatedOrder : order
      );
      
      dispatch({
        type: 'ORDERS_SUCCESS',
        payload: {
          orders: updatedOrders,
          totalPages: state.totalPages,
          currentPage: state.currentPage,
        }
      });
      
      // Update current order if it matches
      if (state.currentOrder?._id === orderId) {
        dispatch({ type: 'ORDER_SUCCESS', payload: updatedOrder });
      }
      
      success('Order updated', `Order status changed to ${status}`);
    } catch (error: any) {
      dispatch({ type: 'ERROR', payload: error.message });
      showError('Failed to update order', error.message);
      throw error;
    }
  }, [state.orders, state.currentOrder, state.totalPages, state.currentPage, success, showError]);

  const cancelOrder = useCallback(async (orderId: string): Promise<void> => {
    try {
      await updateOrderStatus(orderId, 'cancelled');
    } catch (error) {
      throw error;
    }
  }, [updateOrderStatus]);

  const refreshOrders = useCallback(async (): Promise<void> => {
    await loadOrders();
  }, [loadOrders]);

  const setFilters = useCallback((filters: Partial<OrderFilters>): void => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  }, []);

  const clearFilters = useCallback((): void => {
    dispatch({ type: 'CLEAR_FILTERS' });
  }, []);

  // Load orders when filters change
  React.useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const contextValue: OrderContextType = {
    orders: state.orders,
    currentOrder: state.currentOrder,
    loading: state.loading,
    error: state.error,
    totalPages: state.totalPages,
    currentPage: state.currentPage,
    filters: state.filters,
    loadOrders,
    loadOrderById,
    setFilters,
    clearFilters,
    refreshOrders,
    updateOrderStatus,
    cancelOrder,
  };

  return (
    <OrderContext.Provider value={contextValue}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrder(): OrderContextType {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
}

export default OrderContext;
