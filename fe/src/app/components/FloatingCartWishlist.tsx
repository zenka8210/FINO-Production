'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaShoppingCart, FaHeart, FaTimes } from 'react-icons/fa';
import { useCart, useWishlist } from '@/hooks';
import { formatCurrency } from '@/lib/utils';
import styles from './FloatingCartWishlist.module.css';

interface FloatingCartWishlistProps {
  showOnScroll?: boolean;
  scrollThreshold?: number;
}

export default function FloatingCartWishlist({ 
  showOnScroll = true, 
  scrollThreshold = 200 
}: FloatingCartWishlistProps) {
  const router = useRouter();
  const { cart, itemsCount, total } = useCart();
  const { itemsCount: wishlistItemsCount } = useWishlist();
  
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Handle scroll visibility
  useEffect(() => {
    if (!showOnScroll) {
      setIsVisible(true);
      return;
    }

    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsVisible(scrollY > scrollThreshold);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showOnScroll, scrollThreshold]);

  const handleCartClick = () => {
    router.push('/cart');
  };

  const handleWishlistClick = () => {
    router.push('/wishlist');
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Floating Action Button */}
      <div className={`${styles.floatingContainer} ${isExpanded ? styles.expanded : ''}`}>
        {/* Main FAB Button */}
        <button
          className={styles.mainFab}
          onClick={toggleExpanded}
          aria-label="Xem giỏ hàng và wishlist"
        >
          {isExpanded ? (
            <FaTimes className={styles.fabIcon} />
          ) : (
            <FaShoppingCart className={styles.fabIcon} />
          )}
          
          {/* Cart count badge */}
          {itemsCount > 0 && !isExpanded && (
            <span className={styles.countBadge}>{itemsCount}</span>
          )}
        </button>

        {/* Expanded Actions */}
        {isExpanded && (
          <div className={styles.expandedActions}>
            {/* Cart Action */}
            <div className={styles.actionGroup}>
              <button
                className={styles.actionButton}
                onClick={handleCartClick}
                aria-label={`Giỏ hàng (${itemsCount} sản phẩm)`}
              >
                <FaShoppingCart className={styles.actionIcon} />
                <div className={styles.actionInfo}>
                  <span className={styles.actionLabel}>Giỏ hàng</span>
                  <span className={styles.actionDetails}>
                    {itemsCount} SP • {formatCurrency(total)}
                  </span>
                </div>
                {itemsCount > 0 && (
                  <span className={styles.actionBadge}>{itemsCount}</span>
                )}
              </button>
            </div>

            {/* Wishlist Action */}
            <div className={styles.actionGroup}>
              <button
                className={styles.actionButton}
                onClick={handleWishlistClick}
                aria-label={`Wishlist (${wishlistItemsCount} sản phẩm)`}
              >
                <FaHeart className={styles.actionIcon} />
                <div className={styles.actionInfo}>
                  <span className={styles.actionLabel}>Yêu thích</span>
                  <span className={styles.actionDetails}>
                    {wishlistItemsCount} sản phẩm
                  </span>
                </div>
                {wishlistItemsCount > 0 && (
                  <span className={styles.actionBadge}>{wishlistItemsCount}</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
