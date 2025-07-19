'use client';

import Link from 'next/link';
import { ProductWithCategory } from '@/types';
import { useCart, useWishlist } from '@/hooks';
import { formatCurrency } from '@/lib/utils';
import styles from './ProductItem.module.css';

interface ProductItemProps {
  product: ProductWithCategory;
  layout?: 'grid' | 'list';
  showQuickActions?: boolean;
  showDescription?: boolean;
  className?: string;
}

export default function ProductItem({ 
  product, 
  layout = 'grid',
  showQuickActions = true,
  showDescription = false,
  className = ''
}: ProductItemProps) {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  
  const inWishlist = isInWishlist(product._id);

  // Calculate price info
  const currentPrice = product.salePrice && product.salePrice < product.price 
    ? product.salePrice 
    : product.price;
  const isOnSale = product.salePrice && product.salePrice < product.price;
  const discountPercent = isOnSale ? Math.round((1 - product.salePrice! / product.price) * 100) : 0;

  // Handle add to cart
  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await addToCart(product._id, 1);
    } catch (error) {
      console.error('Add to cart error:', error);
    }
  };

  // Handle wishlist toggle
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

  const containerClass = `${styles.productItem} ${styles[layout]} ${className}`;

  return (
    <article className={containerClass}>
      <Link href={`/products/${product._id}`} className={styles.productLink}>
        {/* Image Section */}
        <div className={styles.imageWrapper}>
          <img
            src={product.images?.[0] || '/placeholder.jpg'}
            alt={product.name}
            className={styles.productImage}
            loading="lazy"
          />
          
          {/* Sale Badge */}
          {isOnSale && (
            <div className={styles.saleBadge}>
              -{discountPercent}%
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
                title="Thêm vào giỏ hàng"
                aria-label="Thêm vào giỏ hàng"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5H21M7 13v6a2 2 0 002 2h8a2 2 0 002-2v-6" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className={styles.productInfo}>
          {/* Category */}
          <div className={styles.categoryName}>
            {product.category?.name || 'Chưa phân loại'}
          </div>
          
          {/* Product Name */}
          <h3 className={styles.productName}>
            {product.name}
          </h3>
          
          {/* Description (only for list layout) */}
          {showDescription && layout === 'list' && product.description && (
            <p className={styles.productDescription}>
              {product.description}
            </p>
          )}
          
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

          {/* CTA Button - Only in grid layout */}
          {layout === 'grid' && (
            <button
              className={styles.ctaButton}
              onClick={handleAddToCart}
            >
              Mua ngay
            </button>
          )}
        </div>
      </Link>
    </article>
  );
}
