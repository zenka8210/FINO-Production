"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ProductWithCategory } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { isProductOnSale, getCurrentPrice, getDiscountPercent } from '@/lib/productUtils';
import { useCart, useWishlist } from '@/hooks';
import Button from './Button';
import styles from './ProductCard.module.css';

interface ProductCardProps {
  product: ProductWithCategory;
  showQuickActions?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  showQuickActions = true 
}) => {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  
  const inWishlist = isInWishlist(product._id);

  // Use productUtils for consistent sale logic
  const isOnSale = isProductOnSale(product);
  const currentPrice = getCurrentPrice(product);
  const discountPercent = getDiscountPercent(product);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation(); // Stop event bubbling
    
    try {
      await addToCart(product._id, 1);
      // Remove duplicate showSuccess - let useCart handle notifications
    } catch (error) {
      console.error('Add to cart error:', error);
      // Let useCart handle error notifications
    }
  };

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation(); // Stop event bubbling
    
    try {
      if (inWishlist) {
        await removeFromWishlist(product._id);
        // Remove duplicate showSuccess - let useWishlist handle notifications
      } else {
        await addToWishlist(product._id);
        // Remove duplicate showSuccess - let useWishlist handle notifications
      }
    } catch (error) {
      console.error('Wishlist toggle error:', error);
      // Let useWishlist handle error notifications
    }
  };

  return (
    <div className={styles.productCard}>
      <Link href={`/products/${product._id}`} className={styles.productLink}>
        <div className={styles.imageWrapper}>
          <Image
            src={product.images?.[0] || '/images/placeholder.jpg'}
            alt={product.name}
            width={300}
            height={300}
            className={styles.productImage}
          />
          
          {isOnSale && discountPercent > 0 && (
            <div className={styles.discountBadge}>
              -{discountPercent}%
            </div>
          )}
          
          {showQuickActions && (
            <div className={styles.quickActions}>
              <button
                className={styles.wishlistBtn}
                onClick={handleWishlistToggle}
                aria-label={inWishlist ? "Xóa khỏi yêu thích" : "Thêm vào yêu thích"}
              >
                <svg
                  width="20"
                  height="20"
                  fill={inWishlist ? "var(--color-error)" : "none"}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </button>
              <button
                className={styles.cartBtn}
                onClick={handleAddToCart}
                aria-label="Thêm vào giỏ hàng"
              >
                <svg
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5H21M7 13v6a2 2 0 002 2h8a2 2 0 002-2v-6"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      </Link>

      <div className={styles.productInfo}>
        <div className={styles.category}>
          {product.category?.name}
        </div>
        
        <h3 className={styles.productName}>
          {product.name}
        </h3>
        
        <div className={styles.priceWrapper}>
          {isOnSale ? (
            <>
              <span className={styles.currentPrice}>
                {formatCurrency(currentPrice)}
              </span>
              <span className={styles.originalPrice}>
                {formatCurrency(product.price)}
              </span>
            </>
          ) : (
            <span className={styles.currentPrice}>
              {formatCurrency(currentPrice)}
            </span>
          )}
        </div>

        <div className={styles.actions}>
          <Button
            variant="primary"
            size="md"
            onClick={handleAddToCart}
            className={styles.addToCartBtn}
          >
            Mua ngay
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
