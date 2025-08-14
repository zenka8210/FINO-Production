'use client';

import Link from 'next/link';
import { useState } from 'react';
import { FaStar, FaRegStar } from 'react-icons/fa';
import { ProductWithCategory, ProductVariantWithRefs } from '@/types';
import { useCart, useWishlist, useApiNotification } from '@/hooks';
import { formatCurrency } from '@/lib/utils';
import { getProductPriceInfo } from '@/lib/productUtils';
import { selectBestVariant, hasAvailableVariants } from '@/lib/variantUtils';
import VariantCacheService from '@/services/variantCacheService';
import styles from './ProductItem.module.css';

interface ProductItemProps {
  product: ProductWithCategory;
  layout?: 'grid' | 'list';
  showQuickActions?: boolean;
  showDescription?: boolean;
  className?: string;
  variant?: 'default' | 'related'; // Add variant prop
  // Rating data props
  averageRating?: number;
  reviewCount?: number;
  // Show rating badge on top-right
  showRatingBadge?: boolean;
}

export default function ProductItem({ 
  product, 
  layout = 'grid',
  showQuickActions = true,
  showDescription = false,
  className = '',
  variant = 'default', // Add variant with default value
  averageRating,
  reviewCount,
  showRatingBadge = false
}: ProductItemProps) {
  // Add defensive check for product
  if (!product || !product._id || !product.name) {
    console.warn('ProductItem: Invalid product data', product);
    return null;
  }

  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { showError } = useApiNotification();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  
  const inWishlist = isInWishlist(product._id);
  const variantCache = VariantCacheService.getInstance();

  // Get price info using utility function for consistent sale logic
  const { currentPrice, isOnSale, discountPercent } = getProductPriceInfo(product);

  // Get rating data from product object or props - prioritize real data
  const productRating = (product as any).averageRating || averageRating || 0;
  const productReviewCount = (product as any).reviewCount || reviewCount || 0;

  // Helper function to render stars
  const renderStars = (rating: number, count: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<FaStar key={i} className={styles.starFilled} />);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(<FaStar key={i} className={styles.starHalf} />);
      } else {
        stars.push(<FaRegStar key={i} className={styles.starEmpty} />);
      }
    }

    return (
      <div className={styles.ratingContainer}>
        <div className={styles.stars}>
          {stars}
        </div>
        <span className={styles.ratingText}>
          {rating > 0 ? `${rating.toFixed(1)} (${count})` : 'Chưa có đánh giá'}
        </span>
      </div>
    );
  };

  // Handle add to cart with optimistic UI updates for smoother UX
  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isAddingToCart) return; // Prevent double clicks
    
    let bestVariant = null;
    
    try {
      // Step 1: Fast variant resolution (optimistic approach)
      if (product?.variants && Array.isArray(product.variants) && product.variants.length > 0) {
        console.log('📦 Using pre-loaded variants');
        
        if (!hasAvailableVariants(product.variants)) {
          showError('Sản phẩm hiện tại hết hàng');
          return;
        }

        bestVariant = selectBestVariant(product.variants, {
          strategy: 'smart',
          preferredColorOrder: ['black', 'đen', 'white', 'trắng', 'blue', 'xanh dương', 'navy', 'xanh navy', 'gray', 'xám'],
          preferredSizeOrder: ['M', 'L', 'XL', 'S', 'XXL', '39', '40', '41', '42', '43']
        });
      } else {
        // Lazy load variants for products from listing pages
        console.log('🔍 Lazy loading variants for product:', product._id);
        const variants = await variantCache.getProductVariants(product._id);

        if (!variants || variants.length === 0) {
          showError('Sản phẩm chưa có phiên bản để mua');
          return;
        }

        if (!hasAvailableVariants(variants)) {
          showError('Sản phẩm hiện tại hết hàng');
          return;
        }

        bestVariant = selectBestVariant(variants, {
          strategy: 'smart',
          preferredColorOrder: ['black', 'đen', 'white', 'trắng', 'blue', 'xanh dương', 'navy', 'xanh navy', 'gray', 'xám'],
          preferredSizeOrder: ['M', 'L', 'XL', 'S', 'XXL', '39', '40', '41', '42', '43']
        });
      }

      if (!bestVariant) {
        showError('Không tìm thấy phiên bản phù hợp');
        return;
      }

      // Step 2: Show loading state only briefly before API call
      setIsAddingToCart(true);
      
      // Step 3: Add to cart with optimistic success handling
      await addToCart(bestVariant._id, 1);
      
      // Step 4: Quick success feedback (context will handle notifications)
      // Loading state will be cleared in finally block

    } catch (error) {
      console.error('Add to cart error:', error);
      showError('Có lỗi xảy ra khi thêm vào giỏ hàng');
    } finally {
      // Always clear loading state quickly for smooth UX
      setIsAddingToCart(false);
    }
  };

  // Handle wishlist toggle - Use regular wishlist service
  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      if (inWishlist) {
        await removeFromWishlist(product._id);
      } else {
        await addToWishlist(product._id);
      }
    } catch (error) {
      console.error('Wishlist error:', error);
    }
  };

  // Get main image from product with defensive checking
  const mainImage = product?.images && Array.isArray(product.images) && product.images.length > 0 
    ? product.images[0] 
    : null;

  const containerClass = `${styles.productItem} ${styles[layout]} ${variant === 'related' ? styles.relatedVariant : ''} ${className}`;

  return (
    <article className={containerClass}>
      <Link href={`/products/${product._id}`} className={styles.productLink}>
        {/* Image Section */}
        <div className={`${styles.imageWrapper} ${!isOnSale ? styles.noSaleBadge : ''}`}>
          {mainImage ? (
            <img
              src={mainImage}
              alt={product.name}
              className={styles.productImage}
              loading="lazy"
            />
          ) : (
            <div className={styles.noImage}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21,15 16,10 5,21"/>
              </svg>
              <span>Không có ảnh</span>
            </div>
          )}
          
          {/* Sale Badge */}
          {isOnSale && (
            <div className={styles.saleBadge}>
              -{discountPercent}%
            </div>
          )}
          
          {/* Rating Badge - Only show if has rating data and showRatingBadge is enabled */}
          {showRatingBadge && productRating > 0 && productReviewCount > 0 && (
            <div className={styles.ratingBadge}>
              ⭐ {productRating.toFixed(1)} ({productReviewCount})
            </div>
          )}

          {/* Quick Actions */}
          {showQuickActions && (
            <div className={styles.quickActions}>
              <button
                className={`${styles.actionBtn} ${inWishlist ? styles.active : ''}`}
                onClick={handleWishlistToggle}
                title={inWishlist ? 'Bỏ khỏi yêu thích' : 'Thêm vào yêu thích'}
                aria-label={inWishlist ? 'Bỏ khỏi yêu thích' : 'Thêm vào yêu thích'}
              >
                <svg
                  width="18"
                  height="18"
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
                onClick={handleAddToCart}
                disabled={isAddingToCart}
                title={isAddingToCart ? 'Đang thêm...' : 'Thêm vào giỏ hàng'}
                aria-label={isAddingToCart ? 'Đang thêm...' : 'Thêm vào giỏ hàng'}
              >
                {isAddingToCart ? (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={styles.spinner}
                    style={{ animation: 'spin 0.8s linear infinite' }}
                  >
                    <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c.93 0 1.83.14 2.68.41" />
                  </svg>
                ) : (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{ transition: 'all 0.2s ease' }}
                  >
                    <path d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5H21M7 13v6a2 2 0 002 2h8a2 2 0 002-2v-6" />
                  </svg>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className={styles.productInfo}>
          {/* Product Content - flexible area */}
          <div className={styles.productContent}>
            {/* Category */}
            <div className={styles.categoryName}>
              {product.category && typeof product.category === 'object' && product.category.name 
                ? product.category.name 
                : product.category && typeof product.category === 'string' 
                ? product.category 
                : 'Chưa phân loại'}
            </div>
            
            {/* Product Name with tooltip for long names */}
            <h3 
              className={styles.productName}
              title={layout === 'grid' && product.name && product.name.length > 50 ? product.name : undefined}
            >
              {product.name || 'Tên sản phẩm không có'}
            </h3>

            {/* Rating display */}
            {renderStars(productRating, productReviewCount)}
            
            {/* Description (only for list layout) */}
            {showDescription && layout === 'list' && product.description && (
              <p className={styles.productDescription}>
                {product.description}
              </p>
            )}
          </div>

          {/* CTA Section - always at bottom */}
          <div className={styles.ctaSection}>
            {/* Price */}
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

            {/* CTA Button - Show in both layouts */}
            <button
              className={styles.ctaButton}
              onClick={handleAddToCart}
              disabled={isAddingToCart}
              style={{ 
                transition: 'all 0.2s ease',
                transform: isAddingToCart ? 'scale(0.98)' : 'scale(1)'
              }}
            >
              {isAddingToCart ? (
                <>
                  <svg 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    style={{ animation: 'spin 0.8s linear infinite' }}
                  >
                    <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c.93 0 1.83.14 2.68.41" />
                  </svg>
                  Đang thêm...
                </>
              ) : (
                <>
                  <svg 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                    style={{ transition: 'all 0.2s ease' }}
                  >
                    <path d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5H21M7 13v6a2 2 0 002 2h8a2 2 0 002-2v-6" />
                  </svg>
                  Mua ngay
                </>
              )}
            </button>
          </div>
        </div>
      </Link>
    </article>
  );
}
