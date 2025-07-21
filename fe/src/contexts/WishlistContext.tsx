'use client';

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { WishList, WishListItem } from '@/types';
import { wishlistService } from '@/services';
import { useApiNotification } from '@/hooks/useApiNotification';

interface WishlistState {
  wishlist: WishList | null;
  loading: boolean;
  error: string | null;
}

interface WishlistContextType {
  wishlist: WishList | null;
  wishlistItems: WishListItem[];
  loading: boolean;
  error: string | null;
  loadWishlist: () => Promise<void>;
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  clearWishlist: () => Promise<void>;
  toggleWishlist: (productId: string) => Promise<void>;
  syncWishlistFromSession: (sessionWishlist: string[]) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  getWishlistItemsCount: () => number;
  hasItems: () => boolean;
  refreshWishlist: () => Promise<void>;
  clearError: () => void;
}

type WishlistAction =
  | { type: 'LOADING' }
  | { type: 'WISHLIST_SUCCESS'; payload: WishList }
  | { type: 'CLEAR_WISHLIST' }
  | { type: 'ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' };

const initialState: WishlistState = {
  wishlist: null,
  loading: false,
  error: null,
};

function wishlistReducer(state: WishlistState, action: WishlistAction): WishlistState {
  switch (action.type) {
    case 'LOADING':
      return { ...state, loading: true, error: null };
    case 'WISHLIST_SUCCESS':
      return { ...state, wishlist: action.payload, loading: false, error: null };
    case 'CLEAR_WISHLIST':
      return { ...state, wishlist: null, loading: false, error: null };
    case 'ERROR':
      return { ...state, loading: false, error: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

interface WishlistProviderProps {
  children: React.ReactNode;
}

export function WishlistProvider({ children }: WishlistProviderProps) {
  const [state, dispatch] = useReducer(wishlistReducer, initialState);
  const { showSuccess, showError } = useApiNotification();

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = useCallback(async (): Promise<void> => {
    try {
      dispatch({ type: 'LOADING' });
      const wishlist = await wishlistService.getWishlist();
      dispatch({ type: 'WISHLIST_SUCCESS', payload: wishlist });
    } catch (error: any) {
      dispatch({ type: 'ERROR', payload: error.message });
    }
  }, []);

  const addToWishlist = useCallback(async (productId: string): Promise<void> => {
    try {
      dispatch({ type: 'LOADING' });
      const updatedWishlist = await wishlistService.addToWishlist(productId);
      dispatch({ type: 'WISHLIST_SUCCESS', payload: updatedWishlist });
      showSuccess('Added to wishlist', 'Product has been added to your wishlist');
    } catch (error: any) {
      dispatch({ type: 'ERROR', payload: error.message });
      showError('Failed to add to wishlist', error.message);
      throw error;
    }
  }, [showSuccess, showError]);

  const removeFromWishlist = useCallback(async (productId: string): Promise<void> => {
    try {
      dispatch({ type: 'LOADING' });
      const updatedWishlist = await wishlistService.removeFromWishlist(productId);
      dispatch({ type: 'WISHLIST_SUCCESS', payload: updatedWishlist });
      showSuccess('Removed from wishlist', 'Product has been removed from your wishlist');
    } catch (error: any) {
      dispatch({ type: 'ERROR', payload: error.message });
      showError('Failed to remove from wishlist', error.message);
      throw error;
    }
  }, [showSuccess, showError]);

  const clearWishlist = useCallback(async (): Promise<void> => {
    try {
      dispatch({ type: 'LOADING' });
      await wishlistService.clearWishlist();
      dispatch({ type: 'CLEAR_WISHLIST' });
      showSuccess('Wishlist cleared', 'All items have been removed from your wishlist');
    } catch (error: any) {
      dispatch({ type: 'ERROR', payload: error.message });
      showError('Failed to clear wishlist', error.message);
      throw error;
    }
  }, [showSuccess, showError]);

  const isInWishlist = useCallback((productId: string): boolean => {
    if (!state.wishlist) return false;
    return state.wishlist.items.some(item => {
      // Handle both string ID and populated product object
      if (typeof item.product === 'string') {
        return item.product === productId;
      }
      // If product is populated (has _id property)
      return (item.product as any)?._id === productId;
    });
  }, [state.wishlist]);

  const toggleWishlist = useCallback(async (productId: string): Promise<void> => {
    if (isInWishlist(productId)) {
      await removeFromWishlist(productId);
    } else {
      await addToWishlist(productId);
    }
  }, [isInWishlist, addToWishlist, removeFromWishlist]);

  const getWishlistItemsCount = useCallback((): number => {
    if (!state.wishlist) return 0;
    return state.wishlist.items.length;
  }, [state.wishlist]);

  const hasItems = useCallback((): boolean => {
    return (state.wishlist?.items.length || 0) > 0;
  }, [state.wishlist]);

  const refreshWishlist = useCallback(async (): Promise<void> => {
    await loadWishlist();
  }, [loadWishlist]);

  const syncWishlistFromSession = useCallback(async (sessionWishlist: string[]): Promise<void> => {
    try {
      dispatch({ type: 'LOADING' });
      // Sync each item from session wishlist
      for (const productId of sessionWishlist) {
        if (!isInWishlist(productId)) {
          await wishlistService.addToWishlist(productId);
        }
      }
      // Reload wishlist to get updated state
      await loadWishlist();
      showSuccess('Wishlist synced', 'Your wishlist has been synchronized');
    } catch (error: any) {
      dispatch({ type: 'ERROR', payload: error.message });
      showError('Failed to sync wishlist', error.message);
    }
  }, [isInWishlist, loadWishlist, showSuccess, showError]);

  const clearError = useCallback((): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const contextValue: WishlistContextType = {
    wishlist: state.wishlist,
    wishlistItems: state.wishlist?.items || [],
    loading: state.loading,
    error: state.error,
    loadWishlist,
    addToWishlist,
    removeFromWishlist,
    clearWishlist,
    toggleWishlist,
    syncWishlistFromSession,
    isInWishlist,
    getWishlistItemsCount,
    hasItems,
    refreshWishlist,
    clearError,
  };

  return (
    <WishlistContext.Provider value={contextValue}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist(): WishlistContextType {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}

export default WishlistContext;
