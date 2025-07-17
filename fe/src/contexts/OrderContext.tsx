'use client';

import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { OrderWithRefs, OrderStatus } from '@/types';
import { orderService } from '@/services';
import { useNotification } from './NotificationContext';

// Use the OrderDetail type from OrderWithRefs
type OrderDetailWithRefs = OrderWithRefs['items'][0];

interface OrderState {
  currentOrder: OrderWithRefs | null;
  orderItems: OrderDetailWithRefs[];
  loading: boolean;
  error: string | null;
}

interface OrderContextType {
  currentOrder: OrderWithRefs | null;
  orderItems: OrderDetailWithRefs[];
  loading: boolean;
  error: string | null;
  createOrder: (orderData: any) => Promise<OrderWithRefs>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  clearCurrentOrder: () => void;
  addOrderItem: (item: OrderDetailWithRefs) => void;
  removeOrderItem: (itemIndex: number) => void;
  getOrderTotal: () => number;
  clearError: () => void;
}

type OrderAction =
  | { type: 'LOADING' }
  | { type: 'ORDER_SUCCESS'; payload: OrderWithRefs }
  | { type: 'CLEAR_ORDER' }
  | { type: 'ADD_ITEM'; payload: OrderDetailWithRefs }
  | { type: 'REMOVE_ITEM'; payload: number }
  | { type: 'ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' };

const initialState: OrderState = {
  currentOrder: null,
  orderItems: [],
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
        orderItems: action.payload.items,
        loading: false, 
        error: null 
      };
    case 'CLEAR_ORDER':
      return { 
        ...state, 
        currentOrder: null, 
        orderItems: [],
        loading: false, 
        error: null 
      };
    case 'ADD_ITEM':
      return {
        ...state,
        orderItems: [...state.orderItems, action.payload]
      };
    case 'REMOVE_ITEM':
      return {
        ...state,
        orderItems: state.orderItems.filter((item, index) => index !== action.payload)
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

  const clearCurrentOrder = useCallback((): void => {
    dispatch({ type: 'CLEAR_ORDER' });
  }, []);

  const addOrderItem = useCallback((item: OrderDetailWithRefs): void => {
    dispatch({ type: 'ADD_ITEM', payload: item });
  }, []);

  const removeOrderItem = useCallback((itemIndex: number): void => {
    dispatch({ type: 'REMOVE_ITEM', payload: itemIndex });
  }, []);

  const getOrderTotal = useCallback((): number => {
    return state.orderItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [state.orderItems]);

  const clearError = useCallback((): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const contextValue: OrderContextType = {
    currentOrder: state.currentOrder,
    orderItems: state.orderItems,
    loading: state.loading,
    error: state.error,
    createOrder,
    updateOrderStatus,
    clearCurrentOrder,
    addOrderItem,
    removeOrderItem,
    getOrderTotal,
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
