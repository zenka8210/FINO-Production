// ============= CONTEXT HOOKS (ACCESS GLOBAL STATE) =============
// These hooks access contexts and return their values

export { useAuth } from './useAuth';
export { useCart, useCartItem } from './useCart';
export { useWishlist, useWishlistItem } from './useWishlist';
export { useNotifications } from './useNotifications';
export { useProductFilters } from './useProducts';
export { useCurrentOrder } from './useOrders';

// ============= UTILITY HOOKS (HELPERS) =============
// Utility hooks for API notifications and other helper functions

export { useApiNotification } from './useApiNotification';

// ============= SERVICE UTILITY HOOKS (NO GLOBAL STATE) =============
// These hooks are utilities for service calls without storing global state

export { useProduct } from './useProduct';
export { useProducts, useProductAdmin } from './useProducts';
export { useProductStats } from './useProductStats';
export { useRelatedProducts } from './useRelatedProducts';
export { useOrders } from './useOrders';
export { useCategories } from './useCategories';
export { useAddresses } from './useAddresses';
export { useReviews } from './useReviews';

// ============= API UTILITY HOOKS =============
// Generic hooks for API calls, pagination, and file uploads

export { 
  useApiCall, 
  usePaginatedApiCall, 
  useFileUpload 
} from './useApiCall';

// ============= NOTES =============
// The following hooks have been removed as their contexts were deleted:
// - usePaymentMethods (use paymentMethodService directly)
// - useVouchers (use voucherService directly)
// - useProductVariants (use productVariantService directly)
