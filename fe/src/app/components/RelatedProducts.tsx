'use client';

import Link from 'next/link';
import { ProductWithCategory } from '@/types';
import { useRelatedProducts, useCart, useWishlist } from '@/hooks';
import { LoadingSpinner, Button } from './ui';
import { formatCurrency } from '@/lib/utils';
import { isProductOnSale, getCurrentPrice, getDiscountPercent } from '@/lib/productUtils';
import styles from './RelatedProducts.module.css';

interface RelatedProductsProps {
  currentId: string;
  category?: string;
  limit?: number;
}

export default function RelatedProducts({ currentId, category, limit = 8 }: RelatedProductsProps) {
  const { relatedProducts, loading, error, refetch } = useRelatedProducts({
    currentId,
    category,
    limit
  });

  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  // Handle add to cart
  const handleAddToCart = async (productId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await addToCart(productId, 1);
    } catch (error) {
      console.error('Add to cart error:', error);
    }
  };

  // Handle wishlist toggle
  const handleWishlistToggle = async (productId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const inWishlist = isInWishlist(productId);
      if (inWishlist) {
        await removeFromWishlist(productId);
      } else {
        await addToWishlist(productId);
      }
    } catch (error) {
      console.error('Wishlist error:', error);
    }
  };

  // Calculate price info for a product using productUtils
  const getPriceInfo = (product: ProductWithCategory) => {
    return {
      currentPrice: getCurrentPrice(product),
      isOnSale: isProductOnSale(product), 
      discountPercent: getDiscountPercent(product)
    };
  };

  // Loading state
  if (loading) {
    return (
      <div className={styles.relatedSection}>
        <div className={styles.container}>
          <div className={styles.loadingContainer}>
            <LoadingSpinner size="lg" />
            <p className={styles.loadingText}>Đang tải sản phẩm liên quan...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={styles.relatedSection}>
        <div className={styles.container}>
          <div className={styles.errorContainer}>
            <h3 className={styles.title}>Sản phẩm liên quan</h3>
            <p className={styles.errorMessage}>{error}</p>
            <button className={styles.retryButton} onClick={refetch}>
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (relatedProducts.length === 0) {
    return (
      <div className={styles.relatedSection}>
        <div className={styles.container}>
          <div className={styles.emptyContainer}>
            <h3 className={styles.title}>Sản phẩm liên quan</h3>
            <p className={styles.emptyMessage}>Không có sản phẩm liên quan nào.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.relatedSection}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <h3 className={styles.title}>
            Bạn có thể thích
          </h3>
          <p className={styles.subtitle}>
            Khám phá những sản phẩm tương tự dành cho bạn
          </p>
        </div>

        {/* Products Grid */}
        <div className={styles.productsGrid}>
          {relatedProducts.map((product) => {
            const { currentPrice, isOnSale, discountPercent } = getPriceInfo(product);
            const inWishlist = isInWishlist(product._id);

            return (
              <div key={product._id} className={styles.productCard}>
                <Link href={`/products/${product._id}`}>
                  {/* Image */}
                  <div className={styles.imageWrapper}>
                    <img
                      src={product.images?.[0] || '/placeholder.jpg'}
                      alt={product.name}
                      className={styles.productImage}
                    />
                    
                    {/* Sale Badge */}
                    {isOnSale && (
                      <div className={styles.saleBadge}>
                        -{discountPercent}%
                      </div>
                    )}

                    {/* Quick Actions */}
                    <div className={styles.quickActions}>
                      <button
                        className={`${styles.actionBtn} ${inWishlist ? styles.active : ''}`}
                        onClick={(e) => handleWishlistToggle(product._id, e)}
                        title={inWishlist ? 'Bỏ khỏi yêu thích' : 'Thêm vào yêu thích'}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill={inWishlist ? 'currentColor' : 'none'}
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                      </button>
                      
                      <button
                        className={styles.actionBtn}
                        onClick={(e) => handleAddToCart(product._id, e)}
                        title="Thêm vào giỏ hàng"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5H21M7 13v6a2 2 0 002 2h8a2 2 0 002-2v-6" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className={styles.productInfo}>
                    <div className={styles.categoryName}>
                      {product.category?.name || 'Chưa phân loại'}
                    </div>
                    
                    <h4 className={styles.productName}>
                      {product.name}
                    </h4>
                    
                    <div className={styles.priceWrapper}>
                      <span className={styles.currentPrice}>
                        {formatCurrency(currentPrice)}
                      </span>
                      {isOnSale && (
                        <span className={styles.originalPrice}>
                          {formatCurrency(product.price)}
                        </span>
                      )}
                    </div>

                    <button
                      className={styles.ctaButton}
                      onClick={(e) => handleAddToCart(product._id, e)}
                    >
                      Mua ngay
                    </button>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
