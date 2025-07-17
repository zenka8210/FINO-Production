'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { CartContextType, CartWithRefs, CartItem, AddToCartRequest } from '@/types';
import { cartService } from '@/services';
import { useNotification } from './NotificationContext';

interface CartState {
  cart: CartWithRefs | null;
  isLoading: boolean;
  error: string | null;
}

type CartAction =
  | { type: 'CART_LOADING' }
  | { type: 'CART_SUCCESS'; payload: CartWithRefs }
  | { type: 'CART_ERROR'; payload: string }
  | { type: 'CLEAR_CART' }
  | { type: 'CLEAR_ERROR' };

const initialState: CartState = {
  cart: null,
  isLoading: false,
  error: null,
};

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'CART_LOADING':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'CART_SUCCESS':
      return {
        ...state,
        cart: action.payload,
        isLoading: false,
        error: null,
      };
    case 'CART_ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };
    case 'CLEAR_CART':
      return {
        ...state,
        cart: null,
        isLoading: false,
        error: null,
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

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: React.ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { success, error: showError } = useNotification();

  // Load cart on mount
  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async (): Promise<void> => {
    try {
      dispatch({ type: 'CART_LOADING' });
      const cart = await cartService.getCart();
      dispatch({ type: 'CART_SUCCESS', payload: cart });
    } catch (error: any) {
      dispatch({ type: 'CART_ERROR', payload: error.message });
    }
  };

  const addToCart = async (productVariantId: string, quantity: number): Promise<void> => {
    try {
      dispatch({ type: 'CART_LOADING' });
      const updatedCart = await cartService.addToCart(productVariantId, quantity);
      dispatch({ type: 'CART_SUCCESS', payload: updatedCart });
      success('Added to cart', 'Product has been added to your cart');
    } catch (error: any) {
      dispatch({ type: 'CART_ERROR', payload: error.message });
      showError('Failed to add to cart', error.message);
      throw error;
    }
  };

  const updateCartItem = async (productVariantId: string, quantity: number): Promise<void> => {
    try {
      dispatch({ type: 'CART_LOADING' });
      const updatedCart = await cartService.updateCartItem(productVariantId, quantity);
      dispatch({ type: 'CART_SUCCESS', payload: updatedCart });
    } catch (error: any) {
      dispatch({ type: 'CART_ERROR', payload: error.message });
      showError('Failed to update cart', error.message);
      throw error;
    }
  };

  const removeFromCart = async (productVariantId: string): Promise<void> => {
    try {
      dispatch({ type: 'CART_LOADING' });
      const updatedCart = await cartService.removeFromCart(productVariantId);
      dispatch({ type: 'CART_SUCCESS', payload: updatedCart });
      success('Removed from cart', 'Product has been removed from your cart');
    } catch (error: any) {
      dispatch({ type: 'CART_ERROR', payload: error.message });
      showError('Failed to remove from cart', error.message);
      throw error;
    }
  };

  const clearCart = async (): Promise<void> => {
    try {
      dispatch({ type: 'CART_LOADING' });
      await cartService.clearCart();
      dispatch({ type: 'CLEAR_CART' });
      success('Cart cleared', 'All items have been removed from your cart');
    } catch (error: any) {
      dispatch({ type: 'CART_ERROR', payload: error.message });
      showError('Failed to clear cart', error.message);
      throw error;
    }
  };

  const getCartTotal = (): number => {
    if (!state.cart) return 0;
    return state.cart.finalTotal || 0;
  };

  const getCartItemsCount = (): number => {
    if (!state.cart) return 0;
    return state.cart.items.reduce((total, item) => total + item.quantity, 0);
  };

  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const contextValue: CartContextType = {
    cart: state.cart,
    isLoading: state.isLoading,
    error: state.error,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    getCartTotal,
    getCartItemsCount,
    clearError,
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

export default CartContext;
