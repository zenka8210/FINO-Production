'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { CartContextType, CartWithRefs, CartItem, AddToCartRequest } from '@/types';
import { cartService } from '@/services';
import { useApiNotification } from '@/hooks/useApiNotification';
import { useAuth } from './AuthContext';

interface CartState {
  cart: CartWithRefs | null;
  isLoading: boolean;
  error: string | null;
}

type CartAction =
  | { type: 'CART_LOADING' }
  | { type: 'CART_SUCCESS'; payload: CartWithRefs }
  | { type: 'CART_ERROR'; payload: string }
  | { type: 'CART_LOADING_END' }
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
    case 'CART_LOADING_END':
      return {
        ...state,
        isLoading: false,
        error: null,
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
  const { showSuccess, showError } = useApiNotification();
  const { user, isLoading: authLoading } = useAuth();

  // Load cart when user is authenticated
  useEffect(() => {
    if (user && !authLoading) {
      loadCart();
    } else if (!user && !authLoading) {
      // Clear cart when user logs out
      dispatch({ type: 'CLEAR_CART' });
    }
  }, [user, authLoading]);

  const loadCart = async (): Promise<void> => {
    try {
      dispatch({ type: 'CART_LOADING' });
      // Use optimized endpoint that already has minimal populate
      const cart = await cartService.getCart();
      dispatch({ type: 'CART_SUCCESS', payload: cart });
    } catch (error: any) {
      // If user is not authenticated, don't show error
      if (error.message?.includes('Unauthorized') || error.message?.includes('Xác thực')) {
        dispatch({ type: 'CLEAR_CART' });
      } else {
        dispatch({ type: 'CART_ERROR', payload: error.message });
      }
    }
  };

  const addToCart = async (productVariantId: string, quantity: number): Promise<void> => {
    try {
      dispatch({ type: 'CART_LOADING' });
      
      // Call API first - no optimistic update to avoid confusion
      const updatedCart = await cartService.addToCart(productVariantId, quantity);
      
      // Only show success if API call succeeds
      dispatch({ type: 'CART_SUCCESS', payload: updatedCart });
      showSuccess('Đã thêm vào giỏ hàng');
      
    } catch (error: any) {
      console.error('addToCart error:', error);
      dispatch({ type: 'CART_ERROR', payload: error.message });
      
      // If cart not found error, try to reload cart
      if (error.message?.includes('Cart not found') || error.message?.includes('404')) {
        console.log('Cart not found, attempting to reload...');
        try {
          await loadCart();
        } catch (loadError) {
          console.error('Failed to reload cart:', loadError);
        }
      } else if (!error.message?.includes('Unauthorized') && 
                 !error.message?.includes('Xác thực') &&
                 !error.message?.includes('Token') &&
                 !error.message?.includes('Login required')) {
        // For other errors (not authentication), show generic error message
        showError('Có lỗi xảy ra, vui lòng thử lại');
      }
      
      throw error;
    }
  };

  // Silent version for bulk operations (no notifications)
  const addToCartSilent = async (productVariantId: string, quantity: number): Promise<void> => {
    try {
      dispatch({ type: 'CART_LOADING' });
      const updatedCart = await cartService.addToCart(productVariantId, quantity);
      dispatch({ type: 'CART_SUCCESS', payload: updatedCart });
      // No notification here
    } catch (error: any) {
      console.error('addToCartSilent error:', error);
      dispatch({ type: 'CART_ERROR', payload: error.message });
      
      // If cart not found error, try to reload cart
      if (error.message?.includes('Cart not found') || error.message?.includes('404')) {
        console.log('Cart not found in silent add, attempting to reload...');
        try {
          await loadCart();
        } catch (loadError) {
          console.error('Failed to reload cart in silent add:', loadError);
        }
      }
      
      throw error; // Let caller handle error notification
    }
  };

  // Batch version for adding multiple items at once - OPTIMIZED
  const addMultipleToCart = async (items: Array<{ productVariantId: string; quantity: number }>): Promise<{ successCount: number; errorCount: number }> => {
    try {
      dispatch({ type: 'CART_LOADING' });
      
      // Use the new batch API endpoint for much better performance
      const batchItems = items.map(item => ({
        productVariant: item.productVariantId,
        quantity: item.quantity
      }));
      
      const result = await cartService.batchAddToCart(batchItems);
      
      // Batch returns minimal cart data - cart page will auto-reload for full data
      dispatch({ type: 'CART_SUCCESS', payload: result.cart });
      
      return { 
        successCount: result.successCount, 
        errorCount: result.errorCount 
      };
    } catch (error: any) {
      console.error('❌ CartContext: Batch add failed, falling back to sequential');
      dispatch({ type: 'CART_ERROR', payload: error.message });
      
      // Fallback to original sequential method if batch fails
      return await addMultipleToCartSequential(items);
    }
  };

  // Fallback sequential method (original implementation)
  const addMultipleToCartSequential = async (items: Array<{ productVariantId: string; quantity: number }>): Promise<{ successCount: number; errorCount: number }> => {
    try {
      dispatch({ type: 'CART_LOADING' });
      
      let successCount = 0;
      let errorCount = 0;
      
      // Process items sequentially to avoid cart conflicts
      for (const item of items) {
        try {
          // Validate item data before making API call
          if (!item.productVariantId || typeof item.productVariantId !== 'string' || item.productVariantId.trim() === '') {
            console.error('Invalid productVariantId:', item.productVariantId);
            errorCount++;
            continue;
          }
          
          if (!item.quantity || item.quantity <= 0) {
            console.error('Invalid quantity:', item.quantity);
            errorCount++;
            continue;
          }
          
          await cartService.addToCart(item.productVariantId, item.quantity);
          successCount++;
        } catch (error) {
          console.error(`Failed to add item ${item.productVariantId}:`, error);
          errorCount++;
        }
      }
      
      // Get the latest cart state after all operations
      try {
        const updatedCart = await cartService.getCart();
        dispatch({ type: 'CART_SUCCESS', payload: updatedCart });
      } catch (error) {
        console.error('Failed to fetch updated cart:', error);
        // Don't reload cart here - just keep the current state to avoid extra API calls
        dispatch({ type: 'CART_ERROR', payload: 'Failed to update cart state' });
      }
      
      return { successCount, errorCount };
    } catch (error: any) {
      console.error('addMultipleToCartSequential error:', error);
      dispatch({ type: 'CART_ERROR', payload: error.message });
      throw error;
    }
  };

  const updateCartItem = async (productVariantId: string, quantity: number): Promise<void> => {
    console.log('🔄 CartContext: updateCartItem called', { productVariantId, quantity });
    
    if (!state.cart) {
      // If no cart exists, try to load it first
      console.log('No cart found, attempting to load cart first...');
      await loadCart();
      if (!state.cart) {
        throw new Error('Cart not found');
      }
    }
    
    // Optimistic update - update UI immediately for better UX
    const optimisticCart = {
      ...state.cart,
      items: state.cart.items.map(item => 
        item.productVariant._id === productVariantId 
          ? { ...item, quantity }
          : item
      ).filter(item => item.quantity > 0) // Remove items with 0 quantity
    };
    
    console.log('🔄 Optimistic update applied', { 
      updatedItem: optimisticCart.items.find(item => item.productVariant._id === productVariantId)?.quantity 
    });
    
    // Update UI immediately
    dispatch({ type: 'CART_SUCCESS', payload: optimisticCart });
    
    try {
      // Sync with backend - no need to fetch full cart again
      console.log('🔄 Calling backend cartService.updateCartItem...');
      await cartService.updateCartItem(productVariantId, quantity);
      console.log('✅ Backend update completed successfully');
      
      // Optimistic update was successful, no need to reload
      // Only reload if there's a specific error that requires it
    } catch (error: any) {
      console.error('CartContext: updateCartItem failed', error);
      
      // Revert optimistic update only on failure
      if (state.cart) {
        dispatch({ type: 'CART_SUCCESS', payload: state.cart });
      }
      
      // Show error but don't reload cart unless necessary
      dispatch({ type: 'CART_ERROR', payload: error.message });
      showError('Không thể cập nhật giỏ hàng', error.message);
      
      // Only reload cart if there's a data inconsistency error
      if (error.message?.includes('not found') || error.message?.includes('404')) {
        try {
          await loadCart();
        } catch (loadError) {
          console.error('Failed to reload cart after update error:', loadError);
        }
      }
      
      throw error;
    }
  };

  const removeFromCart = async (productVariantId: string): Promise<void> => {
    if (!state.cart) {
      // If no cart exists, try to load it first
      console.log('No cart found, attempting to load cart first...');
      await loadCart();
      if (!state.cart) {
        throw new Error('Cart not found');
      }
    }
    
    // Optimistic update - remove item immediately for better UX
    const optimisticCart = {
      ...state.cart,
      items: state.cart.items.filter(item => item.productVariant._id !== productVariantId)
    };
    
    // Update UI immediately
    dispatch({ type: 'CART_SUCCESS', payload: optimisticCart });
    
    try {
      // Sync with backend - no need to fetch full cart again
      console.log('🔄 Calling backend cartService.removeFromCart...');
      await cartService.removeFromCart(productVariantId);
      console.log('✅ Backend remove completed successfully');
      
      // Show success notification
      showSuccess('Đã xóa khỏi giỏ hàng');
      
      // Optimistic update was successful, no need to reload
    } catch (error: any) {
      console.error('CartContext: removeFromCart failed', error);
      
      // Revert optimistic update only on failure
      if (state.cart) {
        dispatch({ type: 'CART_SUCCESS', payload: state.cart });
      }
      
      // Show error but don't reload cart unless necessary
      dispatch({ type: 'CART_ERROR', payload: error.message });
      showError('Không thể xóa khỏi giỏ hàng', error.message);
      
      // Only reload cart if there's a data inconsistency error
      if (error.message?.includes('not found') || error.message?.includes('404')) {
        try {
          await loadCart();
        } catch (loadError) {
          console.error('Failed to reload cart after remove error:', loadError);
        }
      }
      
      throw error;
    }
  };

  const changeVariant = async (oldProductVariantId: string, newProductVariantId: string, quantity: number): Promise<void> => {
    if (!state.cart) {
      console.log('No cart found, attempting to load cart first...');
      await loadCart();
      if (!state.cart) {
        throw new Error('Cart not found');
      }
    }

    try {
      dispatch({ type: 'CART_LOADING' });
      
      console.log('🔄 Calling backend cartService.changeCartItemVariant...');
      const updatedCart = await cartService.changeCartItemVariant(oldProductVariantId, newProductVariantId, quantity);
      console.log('✅ Backend changeVariant completed successfully');
      
      dispatch({ type: 'CART_SUCCESS', payload: updatedCart });
      showSuccess('Đã thay đổi phiên bản sản phẩm');
      
    } catch (error: any) {
      console.error('CartContext: changeVariant failed', error);
      
      dispatch({ type: 'CART_ERROR', payload: error.message });
      showError('Không thể thay đổi phiên bản sản phẩm', error.message);
      
      // Reload cart on error to ensure consistency
      try {
        await loadCart();
      } catch (loadError) {
        console.error('Failed to reload cart after changeVariant error:', loadError);
      }
      
      throw error;
    }
  };

  const clearCart = async (customMessage?: string): Promise<void> => {
    console.log('🔍 clearCart called with message:', customMessage);
    try {
      dispatch({ type: 'CART_LOADING' });
      await cartService.clearCart();
      dispatch({ type: 'CLEAR_CART' });
      
      // Only show toast if custom message is provided and not empty
      if (customMessage !== undefined && customMessage !== '') {
        console.log('🎯 Showing toast:', customMessage);
        showSuccess(customMessage);
      } else if (customMessage === undefined) {
        // Default message when no parameter provided
        console.log('🎯 Showing default toast');
        showSuccess('Đã xóa tất cả sản phẩm');
      } else {
        console.log('🔇 Silent clear - no toast');
      }
      // If customMessage is empty string, show no toast
    } catch (error: any) {
      dispatch({ type: 'CART_ERROR', payload: error.message });
      showError('Không thể xóa giỏ hàng', error.message);
      throw error;
    }
  };

  const getCartTotal = (): number => {
    if (!state.cart?.items?.length) return 0;
    
    // Calculate subtotal based on backend computed prices
    return state.cart.items.reduce((total, item) => {
      // Add null checks to prevent errors
      if (!item.productVariant?.product) {
        return total; // Skip unpopulated items silently
      }
      
      // CRITICAL FIX: Trust backend computed values completely
      // Backend already handles all sale logic, date validation, and price calculations
      const product = item.productVariant.product;
      const regularPrice = item.productVariant.price;
      const currentPrice = product.currentPrice || product.price || regularPrice; // Backend computed price
      
      // Additional safety check for price
      if (!currentPrice || isNaN(currentPrice)) {
        console.warn('Cart item has invalid price:', { item, currentPrice, regularPrice });
        return total;
      }
      
      const itemTotal = currentPrice * item.quantity;
      if (isNaN(itemTotal)) {
        console.warn('Cart item total is NaN:', { currentPrice, quantity: item.quantity });
        return total;
      }
      
      return total + itemTotal;
    }, 0);
  };

  const getCartItemsCount = (): number => {
    if (!state.cart) return 0;
    return state.cart.items.reduce((total, item) => {
      // Add null check to prevent errors
      if (!item.productVariant) {
        return total; // Skip unpopulated items silently
      }
      return total + item.quantity;
    }, 0);
  };

  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const contextValue: CartContextType = {
    cart: state.cart,
    isLoading: state.isLoading,
    error: state.error,
    addToCart,
    addToCartSilent,
    addMultipleToCart,
    updateCartItem,
    removeFromCart,
    changeVariant,
    clearCart,
    loadCart,
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
