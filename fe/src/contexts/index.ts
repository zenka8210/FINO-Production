// ============= CORE CONTEXTS (GLOBAL STATE MANAGEMENT) =============
export { AuthProvider, useAuth } from './AuthContext';
export { NotificationProvider, useNotification } from './NotificationContext';
export { CartProvider, useCart } from './CartContext';
export { WishlistProvider, useWishlist } from './WishlistContext';

// ============= UI STATE CONTEXTS (FILTERS & LOCAL STATE) =============
export { ProductProvider, useProduct } from './ProductContext';
export { OrderProvider, useOrder } from './OrderContext';

// ============= APP PROVIDER =============
export { AppProvider } from './AppProvider';

// ============= DEFAULT EXPORTS =============
export { default as AuthContext } from './AuthContext';
export { default as NotificationContext } from './NotificationContext';
export { default as CartContext } from './CartContext';
export { default as WishlistContext } from './WishlistContext';
export { default as ProductContext } from './ProductContext';
export { default as OrderContext } from './OrderContext';
