import { useWishlist as useWishlistContext } from '@/contexts';

/**
 * Custom hook for wishlist operations
 * Only accesses WishlistContext - does not make direct service calls
 */
export function useWishlist() {
  const context = useWishlistContext();

  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }

  return {
    // State from context
    wishlist: context.wishlist,
    wishlistItems: context.wishlistItems,
    loading: context.loading,
    error: context.error,

    // Actions from context
    loadWishlist: context.loadWishlist,
    addToWishlist: context.addToWishlist,
    removeFromWishlist: context.removeFromWishlist,
    clearWishlist: context.clearWishlist,
    toggleWishlist: context.toggleWishlist,
    syncWishlistFromSession: context.syncWishlistFromSession,
    refreshWishlist: context.refreshWishlist,
    clearError: context.clearError,

    // Computed values from context
    isInWishlist: context.isInWishlist,
    getWishlistItemsCount: context.getWishlistItemsCount,
    hasItems: context.hasItems,

    // Utility computed values
    isEmpty: !context.hasItems(),
    itemsCount: context.getWishlistItemsCount(),
  };
}

/**
 * Hook for checking if a product is in wishlist
 */
export function useWishlistItem(productId: string) {
  const { isInWishlist, addToWishlist, removeFromWishlist, toggleWishlist } = useWishlist();

  const inWishlist = isInWishlist(productId);

  return {
    isInWishlist: inWishlist,
    addToWishlist: () => addToWishlist(productId),
    removeFromWishlist: () => removeFromWishlist(productId),
    toggleWishlist: () => toggleWishlist(productId),
  };
}
