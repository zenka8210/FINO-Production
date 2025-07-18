'use client';

import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { OrderWithRefs, OrderStatus } from '@/types';
import { orderService } from '@/services';
import { useNotification } from './NotificationContext';

interface OrderState {
  currentOrder: OrderWithRefs | null;
  loading: boolean;
  error: string | null;
}

// Simplified order context for managing current order state
// Order list operations are handled directly through orderService
interface OrderContextType {
  currentOrder: OrderWithRefs | null;
  loading: boolean;
  error: string | null;
  createOrder: (orderData: any) => Promise<OrderWithRefs>;
  loadOrderById: (orderId: string) => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  cancelOrder: (orderId: string) => Promise<void>;
  clearCurrentOrder: () => void;
  clearError: () => void;
}

type OrderAction =
  | { type: 'LOADING' }
  | { type: 'ORDER_SUCCESS'; payload: OrderWithRefs }
  | { type: 'CLEAR_ORDER' }
  | { type: 'ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' };

const initialState: OrderState = {
  currentOrder: null,
  loading: false,
  error: null,
};

function orderReducer(state: OrderState, action: OrderAction): OrderState {
  switch (action.type) {
    case 'LOADING':
      return { ...state, loading: true, error: null };
    case 'ORDER_SUCCESS':
      return { 
        ...state, 
        currentOrder: action.payload,
        loading: false, 
        error: null 
      };
    case 'CLEAR_ORDER':
      return { 
        ...state, 
        currentOrder: null,
        loading: false, 
        error: null 
      };
    case 'ERROR':
      return { ...state, loading: false, error: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
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

  const createOrder = useCallback(async (orderData: any): Promise<OrderWithRefs> => {
    try {
      dispatch({ type: 'LOADING' });
      const order = await orderService.createOrder(orderData);
      dispatch({ type: 'ORDER_SUCCESS', payload: order });
      success('Order created', 'Your order has been placed successfully');
      return order;
    } catch (error: any) {
      dispatch({ type: 'ERROR', payload: error.message });
      showError('Failed to create order', error.message);
      throw error;
    }
  }, [success, showError]);

  const loadOrderById = useCallback(async (orderId: string): Promise<void> => {
    try {
      dispatch({ type: 'LOADING' });
      const order = await orderService.getOrderById(orderId);
      dispatch({ type: 'ORDER_SUCCESS', payload: order });
    } catch (error: any) {
      dispatch({ type: 'ERROR', payload: error.message });
      showError('Failed to load order', error.message);
      throw error;
    }
  }, [showError]);

  const updateOrderStatus = useCallback(async (orderId: string, status: OrderStatus): Promise<void> => {
    try {
      dispatch({ type: 'LOADING' });
      const updatedOrder = await orderService.updateOrderStatus(orderId, status);
      dispatch({ type: 'ORDER_SUCCESS', payload: updatedOrder });
      success('Order updated', 'Order status has been updated');
    } catch (error: any) {
      dispatch({ type: 'ERROR', payload: error.message });
      showError('Failed to update order', error.message);
      throw error;
    }
  }, [success, showError]);

  const cancelOrder = useCallback(async (orderId: string): Promise<void> => {
    try {
      dispatch({ type: 'LOADING' });
      await orderService.cancelOrder(orderId);
      // Reload the order to get updated status
      const updatedOrder = await orderService.getOrderById(orderId);
      dispatch({ type: 'ORDER_SUCCESS', payload: updatedOrder });
      success('Order cancelled', 'Order has been cancelled successfully');
    } catch (error: any) {
      dispatch({ type: 'ERROR', payload: error.message });
      showError('Failed to cancel order', error.message);
      throw error;
    }
  }, [success, showError]);

  const clearCurrentOrder = useCallback((): void => {
    dispatch({ type: 'CLEAR_ORDER' });
  }, []);

  const clearError = useCallback((): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const contextValue: OrderContextType = {
    currentOrder: state.currentOrder,
    loading: state.loading,
    error: state.error,
    createOrder,
    loadOrderById,
    updateOrderStatus,
    cancelOrder,
    clearCurrentOrder,
    clearError,
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
