# Hooks Refactor Summary

## Refactor Overview
Đã refactor toàn bộ custom hooks trong `src/hooks/` theo tiêu chí:

1. **Context Hooks**: Chỉ truy cập và return giá trị từ context tương ứng
2. **Service Utility Hooks**: Chỉ làm utility wrapper cho service calls  
3. **Error Handling**: Tất cả hooks đều có kiểm tra context và error handling
4. **Clean Structure**: Gọn, rõ ràng, dễ tái sử dụng

## Hooks Architecture

### 🎯 Context Hooks (Global State Access)
Các hooks này truy cập contexts và return lại values/actions:

```typescript
// Authentication
useAuth() -> AuthContext

// Cart Management  
useCart() -> CartContext
useCartItem(productVariantId) -> CartContext with item-specific utils

// Wishlist Management
useWishlist() -> WishlistContext  
useWishlistItem(productId) -> WishlistContext with item-specific utils

// Notifications
useNotifications() -> NotificationContext

// Product Filters (UI State)
useProductFilters() -> ProductContext

// Current Order (UI State)
useCurrentOrder() -> OrderContext
```

### 🛠️ Service Utility Hooks (No Global State)
Các hooks này chỉ wrap service calls, không lưu global state:

```typescript
// Products
useProducts() -> productService wrapper
useProductAdmin() -> admin product operations

// Orders  
useOrders() -> orderService wrapper

// Categories
useCategories() -> categoryService wrapper

// Addresses
useAddresses() -> addressService wrapper
```

## Deleted Hooks
Các hooks sau đã bị xóa vì contexts tương ứng đã bị xóa:

- ❌ `usePaymentMethods` → Sử dụng `paymentMethodService` trực tiếp
- ❌ `useReviews` → Sử dụng `reviewService` trực tiếp  
- ❌ `useVouchers` → Sử dụng `voucherService` trực tiếp
- ❌ `useProductVariants` → Sử dụng `productVariantService` trực tiếp

## Usage Examples

### Context Hooks
```typescript
// ✅ Correct usage - accessing global state
const { user, login, logout } = useAuth();
const { cart, addToCart, removeFromCart } = useCart();
const { wishlist, toggleWishlist } = useWishlist();
```

### Service Utility Hooks  
```typescript
// ✅ Correct usage - fetching data when needed
const { getProducts, loading, error } = useProducts();
const products = await getProducts({ category: 'electronics' });

const { getUserOrders } = useOrders();
const orders = await getUserOrders();
```

### Direct Service Usage
```typescript
// ✅ For simple one-off calls, use services directly
import { paymentMethodService } from '@/services';
const paymentMethods = await paymentMethodService.getActivePaymentMethods();
```

## Error Handling Pattern

Tất cả hooks đều implement pattern:

```typescript
export function useHookName() {
  const context = useContext(); // For context hooks
  
  if (!context) {
    throw new Error('useHookName must be used within a Provider');
  }
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // ... implementation
  
  return {
    loading,
    error,
    clearError,
    // ... other values
  };
}
```

## Benefits

1. **🎯 Clear Separation**: Context hooks vs Service utility hooks
2. **🛡️ Type Safety**: Proper TypeScript với error checking
3. **🚀 Performance**: Không có unnecessary re-renders từ unused contexts  
4. **🧪 Testability**: Hooks dễ test vì logic rõ ràng
5. **📱 Maintainability**: Code gọn, dễ maintain và scale

## Migration Guide

### Before (Old)
```typescript
// ❌ Old way - hooks mixed context + service calls
const { categories, createCategory, deleteCategory } = useCategories();
```

### After (New)
```typescript
// ✅ New way - separate concerns
const { getCategories } = useCategories(); // Service utility
const categories = await getCategories();

// For admin operations, use service directly
import { categoryService } from '@/services';
await categoryService.createCategory(data);
```

Refactor hoàn thành! Hooks structure giờ đây sạch sẽ, rõ ràng và chuẩn production.
