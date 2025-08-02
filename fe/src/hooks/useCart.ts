import { useCart as useCartContext } from '@/contexts';

/**
 * Custom hook for cart operations
 * Only accesses CartContext - does not make direct service calls
 */
export function useCart() {
  const context = useCartContext();

  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }

  return {
    // State from context
    cart: context.cart,
    isLoading: context.isLoading,
    error: context.error,

    // Actions from context
    addToCart: context.addToCart,
    addToCartSilent: context.addToCartSilent,
    addMultipleToCart: context.addMultipleToCart,
    updateCartItem: context.updateCartItem,
    removeFromCart: context.removeFromCart,
    clearCart: context.clearCart,
    loadCart: context.loadCart,
    clearError: context.clearError,

    // Computed values from context
    getCartTotal: context.getCartTotal,
    getCartItemsCount: context.getCartItemsCount,

    // Utility computed values
    isEmpty: !context.cart || context.cart.items.length === 0,
    hasItems: context.cart && context.cart.items.length > 0,
    itemsCount: context.getCartItemsCount(),
    total: context.getCartTotal(),
  };
}

/**
 * Hook for cart item operations
 */
export function useCartItem(productVariantId: string) {
  const { cart, updateCartItem, removeFromCart } = useCart();

  const cartItem = cart?.items.find(item => item.productVariant._id === productVariantId);
  const quantity = cartItem?.quantity || 0;
  const isInCart = quantity > 0;

  const incrementQuantity = () => {
    updateCartItem(productVariantId, quantity + 1);
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      updateCartItem(productVariantId, quantity - 1);
    } else {
      removeFromCart(productVariantId);
    }
  };

  const setQuantity = (newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productVariantId);
    } else {
      updateCartItem(productVariantId, newQuantity);
    }
  };

  return {
    cartItem,
    quantity,
    isInCart,
    incrementQuantity,
    decrementQuantity,
    setQuantity,
    removeItem: () => removeFromCart(productVariantId),
  };
}
