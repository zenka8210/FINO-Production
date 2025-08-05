'use client';

import { useState, useEffect, useMemo, memo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useCart, useApiNotification } from '@/hooks';
import { Button, PageHeader, LoadingSpinner, Pagination } from '@/app/components/ui';
import { FaShoppingCart, FaTrash, FaPlus, FaMinus, FaCreditCard, FaTag, FaGift } from 'react-icons/fa';
import { formatCurrency } from '@/lib/utils';
import { addressService, voucherService } from '@/services';
import { CartWithRefs, Address, Voucher } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import styles from './CartPage.module.css';

// Sort options for cart items
const SORT_OPTIONS = [
  { value: 'price-asc', label: 'Giá sản phẩm: Thấp đến Cao', sort: 'price' as const, order: 'asc' as const },
  { value: 'price-desc', label: 'Giá sản phẩm: Cao đến Thấp', sort: 'price' as const, order: 'desc' as const },
  { value: 'name-asc', label: 'Tên sản phẩm: A-Z', sort: 'name' as const, order: 'asc' as const },
] as const;

export default function CartPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { 
    cart, 
    isLoading: cartLoading, 
    updateCartItem, 
    removeFromCart, 
    clearCart,
    loadCart,
    getCartTotal,
    isEmpty,
    hasItems,
    itemsCount
  } = useCart();
  const { showSuccess, showError, handleApiResponse } = useApiNotification();
  
  // State management
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('price-asc'); // Keep only basic sorting
  const [hasDefaultAddress, setHasDefaultAddress] = useState<boolean | null>(null);
  const [hasReloadedOnce, setHasReloadedOnce] = useState(false);
  const [voucherSuggestion, setVoucherSuggestion] = useState<{
    voucher: Voucher | null;
    discountAmount: number;
    savings: string;
  } | null>(null);
  const [loadingVoucher, setLoadingVoucher] = useState(false);
  
  const itemsPerPage = 10;

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/cart');
      return;
    }
  }, [user, router, authLoading]);

  // Check if user has default address (optimized)
  useEffect(() => {
    const checkDefaultAddress = async () => {
      if (!user) {
        setHasDefaultAddress(null);
        return;
      }
      
      try {
        // Use a simpler, cached approach
        const userAddresses = await addressService.getUserAddresses();
        const hasDefault = userAddresses.some((addr: Address) => addr.isDefault);
        setHasDefaultAddress(hasDefault);
      } catch (error) {
        console.error('Error checking default address:', error);
        setHasDefaultAddress(false);
      }
    };

    // Only check address once per session to reduce API calls
    if (user && hasDefaultAddress === null) {
      checkDefaultAddress();
    }
  }, [user]); // Remove showError from dependency to prevent infinite loop

  // Load voucher suggestion when cart total changes
  useEffect(() => {
    const loadVoucherSuggestion = async () => {
      if (!cart?.items?.length || cartLoading) return;
      
      const cartTotal = getCartTotal();
      if (cartTotal <= 0) {
        setVoucherSuggestion(null);
        return;
      }

      setLoadingVoucher(true);
      try {
        const suggestion = await voucherService.getBestVoucherForCart(cartTotal);
        setVoucherSuggestion(suggestion);
      } catch (error) {
        console.error('Error loading voucher suggestion:', error);
        setVoucherSuggestion(null);
      } finally {
        setLoadingVoucher(false);
      }
    };

    // Debounce to avoid too many API calls
    const timeoutId = setTimeout(loadVoucherSuggestion, 500);
    return () => clearTimeout(timeoutId);
  }, [cart?.items, cartLoading, getCartTotal]);

  // Smart auto-reload: Only reload once when detecting unpopulated data
  useEffect(() => {
    if (cart && cart.items && cart.items.length > 0 && !hasReloadedOnce) {
      const hasUnpopulatedItems = cart.items.some(item => 
        !item.productVariant?.product?.name || 
        typeof item.productVariant === 'string'
      );
      
      if (hasUnpopulatedItems) {
        setHasReloadedOnce(true);
        setTimeout(() => loadCart(), 50); // Minimal delay
      }
    }
  }, [cart?.items?.length, hasReloadedOnce, loadCart]);

  // NOTE: Auto-reload with protection against infinite loops

  // Sort cart items (simplified - no filtering for better performance)
  const sortedItems = useMemo(() => {
    if (!cart?.items) return [];

    let items = cart.items.filter(item => {
      // DEFENSIVE: Skip items with unpopulated data
      if (!item.productVariant?.product?.name) {
        return false; // Hide unpopulated items until reload
      }
      return true;
    });

    // Sort items - Simplified version for performance
    const sortOption = SORT_OPTIONS.find(opt => opt.value === sortBy);
    if (sortOption) {
      items.sort((a, b) => {
        let aValue, bValue;
        
        switch (sortOption.sort) {
          case 'price':
            // Use unit price for stable sorting
            aValue = a.price;
            bValue = b.price;
            
            if (sortOption.order === 'desc') {
              if (aValue > bValue) return -1;
              if (aValue < bValue) return 1;
              return a.productVariant._id.localeCompare(b.productVariant._id);
            } else {
              if (aValue < bValue) return -1;
              if (aValue > bValue) return 1;
              return a.productVariant._id.localeCompare(b.productVariant._id);
            }
            
          case 'name':
            const aName = a.productVariant?.product?.name || 'Unknown Product';
            const bName = b.productVariant?.product?.name || 'Unknown Product';
            const comparison = aName.localeCompare(bName, 'vi', { 
              sensitivity: 'accent',
              numeric: true 
            });
            return comparison !== 0 ? comparison : a.productVariant._id.localeCompare(b.productVariant._id);
            
          default:
            return 0;
        }
      });
    }

    return items;
  }, [cart?.items, sortBy]);

  // Pagination
  const totalPages = Math.ceil(sortedItems.length / itemsPerPage);
  const paginatedItems = sortedItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calculate totals
  const subtotal = getCartTotal();

  // Handle sorting change (simplified - no filter handlers)
  const handleSortChange = (sort: string) => {
    setSortBy(sort);
    setCurrentPage(1);
  };

  // Prevent duplicate cart updates
  const pendingUpdatesRef = useRef<Set<string>>(new Set());

  // Handle quantity changes - Debounced and optimized for real-time updates
  const handleQuantityChange = useCallback(async (productVariantId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    // Prevent multiple calls for same item
    const requestKey = `${productVariantId}-${newQuantity}`;
    if (pendingUpdatesRef.current.has(requestKey)) {
      console.log('🚫 Duplicate request prevented:', requestKey);
      return;
    }
    
    // Track pending requests
    pendingUpdatesRef.current.add(requestKey);
    
    try {
      console.log('🔄 Updating quantity:', { productVariantId, newQuantity });
      await updateCartItem(productVariantId, newQuantity);
    } catch (error) {
      console.error('Error updating quantity:', error);
    } finally {
      // Clean up request tracking
      pendingUpdatesRef.current.delete(requestKey);
    }
  }, [updateCartItem]);

  // Handle item removal - Optimized for real-time updates
  const handleRemoveItem = useCallback(async (productVariantId: string) => {
    // Prevent multiple calls for same item
    const requestKey = `remove-${productVariantId}`;
    if (pendingUpdatesRef.current.has(requestKey)) {
      console.log('🚫 Duplicate remove request prevented:', requestKey);
      return;
    }
    
    // Track pending requests
    pendingUpdatesRef.current.add(requestKey);
    
    try {
      console.log('🗑️ Removing item:', productVariantId);
      await removeFromCart(productVariantId);
    } catch (error) {
      console.error('Error removing item:', error);
      // Error handling is done in CartContext
    } finally {
      // Clean up request tracking
      pendingUpdatesRef.current.delete(requestKey);
    }
  }, [removeFromCart]);

  // Handle clear cart - Memoized to prevent unnecessary re-renders
  const handleClearCart = useCallback(async () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tất cả sản phẩm khỏi giỏ hàng?')) {
      try {
        await clearCart();
      } catch (error) {
        console.error('Error clearing cart:', error);
      }
    }
  }, [clearCart]);

  // Handle checkout button click
  const handleCheckoutClick = useCallback(() => {
    if (hasDefaultAddress === false) {
      showError('Vui lòng thiết lập địa chỉ mặc định để có thể thanh toán', 
        'Bạn có thể thiết lập địa chỉ trong trang hồ sơ cá nhân');
      router.push('/profile?section=addresses');
      return;
    }
    
    if (hasDefaultAddress === null) {
      showError('Đang kiểm tra địa chỉ, vui lòng thử lại');
      return;
    }
    
    router.push('/checkout');
  }, [hasDefaultAddress, showError, router]);

  // Loading state
  if (authLoading || cartLoading) {
    return (
      <div className="container">
        <div className={styles.pageContainer}>
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  // Empty cart state
  if (isEmpty) {
    return (
      <div className="container">
        <div className={styles.pageContainer}>
          <PageHeader
            title="Giỏ hàng"
            subtitle="Giỏ hàng của bạn đang trống"
            icon={FaShoppingCart}
            breadcrumbs={[
              { label: 'Trang chủ', href: '/' },
              { label: 'Giỏ hàng', href: '/cart' }
            ]}
          />

          <div className={styles.emptyState}>
            <div className={styles.emptyStateContent}>
              <FaShoppingCart className={styles.emptyStateIcon} />
              <h2 className={styles.emptyStateTitle}>Giỏ hàng trống</h2>
              <p className={styles.emptyStateText}>
                Bạn chưa có sản phẩm nào trong giỏ hàng. 
                Hãy khám phá và thêm những sản phẩm yêu thích!
              </p>
              <div className={styles.emptyStateActions}>
                <Button
                  onClick={() => router.push('/products')}
                  className={styles.exploreButton}
                >
                  Khám phá sản phẩm
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/')}
                  className={styles.homeButton}
                >
                  Về trang chủ
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className={styles.pageContainer}>
        {/* Page Header */}
        <PageHeader
          title="Giỏ hàng"
          subtitle={`${itemsCount} sản phẩm trong giỏ hàng`}
          icon={FaShoppingCart}
          breadcrumbs={[
            { label: 'Trang chủ', href: '/' },
            { label: 'Giỏ hàng', href: '/cart' }
          ]}
        />

        {/* Main Content */}
        <div className={styles.contentWrapper}>
          {/* Cart Content - Full Width */}
          <div className={styles.cartContainer}>
            {/* Cart Actions */}
            <div className={styles.cartActions}>
              <div className={styles.actionButtons}>
                <Button
                  variant="outline"
                  onClick={handleClearCart}
                  className={styles.clearCartButton}
                >
                  <FaTrash />
                  Xóa tất cả
                </Button>
                
                {/* Simple Checkout Button - Similar to Wishlist "Buy All" Button */}
                <Button
                  onClick={handleCheckoutClick}
                  className={`${styles.checkoutButton} ${voucherSuggestion && hasDefaultAddress !== false ? styles.checkoutButtonWithVoucher : ''}`}
                  disabled={hasDefaultAddress === false || loadingVoucher}
                >
                  <FaCreditCard />
                  {loadingVoucher ? 
                    'Đang tải...' :
                    hasDefaultAddress === false ? 
                      'Thiết lập địa chỉ' : 
                      voucherSuggestion ?
                        `Thanh toán (${formatCurrency(subtotal - voucherSuggestion.discountAmount)})` :
                        `Thanh toán (${formatCurrency(subtotal)})`
                  }
                  {voucherSuggestion && hasDefaultAddress !== false && (
                    <span className={styles.voucherBadge}>
                      <FaGift />
                      -{formatCurrency(voucherSuggestion.discountAmount)}
                    </span>
                  )}
                </Button>
              </div>
              <div className={styles.resultsInfo}>
                <div className={styles.sortControls}>
                  <label htmlFor="sort-select">Sắp xếp:</label>
                  <select 
                    id="sort-select"
                    value={sortBy} 
                    onChange={(e) => handleSortChange(e.target.value)}
                    className={styles.sortSelect}
                  >
                    {SORT_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <span className={styles.resultsCount}>
                  Hiển thị {paginatedItems.length} trong tổng số {sortedItems.length} sản phẩm
                </span>
              </div>
            </div>

            {/* Cart Items */}
            {paginatedItems.length > 0 ? (
              <div className={styles.cartItems}>
                {paginatedItems.map((item, index) => {
                  // Skip items with null productVariant
                  if (!item.productVariant || !item.productVariant._id) {
                    console.warn('Skipping cart item with null productVariant:', item);
                    return null;
                  }
                  
                  return (
                    <CartItemCard
                      key={`${item.productVariant._id}-${index}`}
                      item={item}
                      onQuantityChange={handleQuantityChange}
                      onRemove={handleRemoveItem}
                    />
                  );
                }).filter(Boolean)}
              </div>
            ) : (
              <div className={styles.noResults}>
                <FaShoppingCart className={styles.noResultsIcon} />
                <h3>Giỏ hàng trống</h3>
                <p>Chưa có sản phẩm nào trong giỏ hàng của bạn</p>
                <Button onClick={() => router.push('/products')}>
                  Mua sắm ngay
                </Button>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination
                pagination={{
                  page: currentPage,
                  totalPages: totalPages,
                  limit: itemsPerPage,
                  totalProducts: sortedItems.length,
                  hasNextPage: currentPage < totalPages,
                  hasPrevPage: currentPage > 1
                }}
                onPageChange={setCurrentPage}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Cart Item Card Component
interface CartItemCardProps {
  item: CartWithRefs['items'][0];
  onQuantityChange: (productVariantId: string, newQuantity: number) => void;
  onRemove: (productVariantId: string) => void;
}

const CartItemCard = memo(function CartItemCard({ item, onQuantityChange, onRemove }: CartItemCardProps) {
  const { productVariant, quantity } = item;
  
  // Add null checks for productVariant and its nested properties
  if (!productVariant) {
    console.error('CartItemCard: productVariant is null');
    return null;
  }
  
  if (!productVariant.product) {
    console.error('CartItemCard: productVariant.product is null');
    return null;
  }
  
  const { product, price, size, color } = productVariant;
  
  // Use product's sale price if available, otherwise use variant price
  const currentPrice = product.salePrice || price;
  const isOnSale = product.salePrice && product.salePrice < product.price;
  const totalPrice = currentPrice * quantity;

  const mainImage = product.images && product.images.length > 0 ? product.images[0] : null;

  return (
    <div className={styles.cartItem}>
      {/* Product Image */}
      <div className={styles.itemImage}>
        {mainImage ? (
          <Image
            src={mainImage}
            alt={product.name}
            width={100}
            height={100}
            className={styles.productImage}
          />
        ) : (
          <div className={styles.noImage}>
            <FaShoppingCart />
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className={styles.itemInfo}>
        <Link 
          href={`/products/${product._id}`}
          className={styles.productNameLink}
        >
          <h4 className={styles.productName}>{product.name}</h4>
        </Link>
        <div className={styles.variantInfo}>
          {color && <span className={styles.variantItem}>Màu: {color.name}</span>}
          {size && <span className={styles.variantItem}>Size: {size.name}</span>}
        </div>
        <div className={styles.priceInfo}>
          <span className={styles.currentPrice}>{formatCurrency(currentPrice)}</span>
          {isOnSale && (
            <span className={styles.originalPrice}>{formatCurrency(price)}</span>
          )}
        </div>
      </div>

      {/* Quantity Controls - Real-time updates */}
      <div className={styles.quantityControls}>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (quantity > 1 && productVariant._id) {
              onQuantityChange(productVariant._id, quantity - 1);
            }
          }}
          disabled={quantity <= 1 || !productVariant._id}
          className={`${styles.quantityButton} ${quantity <= 1 ? styles.disabled : ''}`}
          aria-label="Giảm số lượng"
        >
          <FaMinus />
        </button>
        <span className={styles.quantity} aria-label={`Số lượng: ${quantity}`}>
          {quantity}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (productVariant._id) {
              onQuantityChange(productVariant._id, quantity + 1);
            }
          }}
          disabled={!productVariant._id}
          className={styles.quantityButton}
          aria-label="Tăng số lượng"
        >
          <FaPlus />
        </button>
      </div>

      {/* Total Price */}
      <div className={styles.itemTotal}>
        <span className={styles.totalPrice}>{formatCurrency(totalPrice)}</span>
      </div>

      {/* Action Buttons */}
      <div className={styles.itemActions}>
        {/* Edit Variants Button */}
        <Link 
          href={`/products/${product._id}?variant=${productVariant._id}`}
          className={styles.editVariantButton}
          title="Sửa đổi kích thước/màu sắc"
        >
          ⚙️
        </Link>
        
        {/* Remove Button */}
        <button
          type="button"
          onClick={() => {
            if (productVariant._id) {
              onRemove(productVariant._id);
            }
          }}
          disabled={!productVariant._id}
          className={styles.removeButton}
          title="Xóa sản phẩm"
        >
          <FaTrash />
        </button>
      </div>
    </div>
  );
});
