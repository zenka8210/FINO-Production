'use client';

import Link from 'next/link';
import { useState, useRef } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { ProductWithCategory } from '@/types';
import { useRelatedProducts, useCart, useWishlist, useApiNotification } from '@/hooks';
import { LoadingSpinner, Button } from './ui';
import { formatCurrency } from '@/lib/utils';
import { isProductOnSale, getCurrentPrice, getDiscountPercent } from '@/lib/productUtils';
import { selectBestVariant, hasAvailableVariants } from '@/lib/variantUtils';
import VariantCacheService from '@/services/variantCacheService';
import styles from './RelatedProducts.module.css';

interface RelatedProductsProps {
  currentId: string;
  category?: string;
  limit?: number;
}

export default function RelatedProducts({ currentId, category, limit = 12 }: RelatedProductsProps) {
  const { relatedProducts, loading, error, refetch } = useRelatedProducts({
    currentId,
    category,
    limit
  });

  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { showError } = useApiNotification();
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const sliderRef = useRef<HTMLDivElement>(null);
  const variantCache = VariantCacheService.getInstance();
  
  // Calculate products per slide (3 on desktop, 2 on tablet, 1 on mobile)
  const getProductsPerSlide = () => 3;
  const productsPerSlide = getProductsPerSlide();
  const totalSlides = Math.ceil((relatedProducts?.length || 0) / productsPerSlide);
  
  // Slider navigation
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };
  
  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  // Handle add to cart with smart variant selection
  const handleAddToCart = async (product: ProductWithCategory, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (addingToCart === product._id) return;

    try {
      setAddingToCart(product._id);

      // Check if product already has variants loaded
      if (product.variants && product.variants.length > 0) {
        console.log('📦 RelatedProducts: Using pre-loaded variants');
        
        if (!hasAvailableVariants(product.variants)) {
          showError('Sản phẩm hiện tại hết hàng');
          return;
        }

        const bestVariant = selectBestVariant(product.variants);
        if (!bestVariant) {
          showError('Không thể chọn biến thể sản phẩm');
          return;
        }

        await addToCart(bestVariant._id, 1);
        return;
      }

      // If no variants loaded, fetch them
      console.log('🔄 RelatedProducts: Loading variants for product:', product._id);
      const variants = await variantCache.getVariants(product._id);
      
      if (!variants || variants.length === 0) {
        showError('Sản phẩm hiện tại không có sẵn');
        return;
      }

      if (!hasAvailableVariants(variants)) {
        showError('Sản phẩm hiện tại hết hàng');
        return;
      }

      const bestVariant = selectBestVariant(variants);
      if (!bestVariant) {
        showError('Không thể chọn biến thể sản phẩm');
        return;
      }

      await addToCart(bestVariant._id, 1);

    } catch (error) {
      console.error('RelatedProducts add to cart error:', error);
      showError('Không thể thêm sản phẩm vào giỏ hàng');
    } finally {
      setAddingToCart(null);
    }
  };

  // Handle wishlist toggle
  const handleWishlistToggle = async (product: ProductWithCategory, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      if (isInWishlist(product._id)) {
        await removeFromWishlist(product._id);
      } else {
        await addToWishlist(product._id);
      }
    } catch (error) {
      console.error('Wishlist error:', error);
    }
  };

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

  if (error) {
    return (
      <div className={styles.relatedSection}>
        <div className={styles.container}>
          <div className={styles.errorContainer}>
            <h3 className={styles.title}>Sản phẩm liên quan</h3>
            <p className={styles.errorMessage}>
              Không thể tải sản phẩm liên quan. 
              <Button 
                onClick={() => refetch()} 
                variant="outline" 
                size="sm"
                className={styles.retryButton}
              >
                Thử lại
              </Button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!relatedProducts || relatedProducts.length === 0) {
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

        {/* Slider Container */}
        <div className={styles.sliderContainer}>
          {totalSlides > 1 && (
            <button
              className={`${styles.navButton} ${styles.prevButton}`}
              onClick={prevSlide}
              disabled={totalSlides <= 1}
            >
              <FaChevronLeft />
            </button>
          )}

          <div className={styles.sliderWrapper}>
            <div 
              ref={sliderRef}
              className={styles.slider}
              style={{
                transform: `translateX(-${currentSlide * 100}%)`,
                transition: 'transform 0.3s ease-in-out'
              }}
            >
              {Array.from({ length: totalSlides }, (_, slideIndex) => (
                <div key={slideIndex} className={styles.slide}>
                  {relatedProducts
                    ?.slice(slideIndex * productsPerSlide, (slideIndex + 1) * productsPerSlide)
                    .map((product) => {
                      const currentPrice = getCurrentPrice(product);
                      const isOnSale = isProductOnSale(product);
                      const discountPercent = getDiscountPercent(product);
                      const inWishlist = isInWishlist(product._id);

                      return (
                        <div key={product._id} className={styles.productCard}>
                          <Link href={`/products/${product._id}`} className={styles.productLink}>
                            {/* Product Image */}
                            <div className={styles.imageWrapper}>
                              {product.images && product.images.length > 0 ? (
                                <img
                                  src={product.images[0]}
                                  alt={product.name}
                                  className={styles.productImage}
                                  loading="lazy"
                                />
                              ) : (
                                <div className={styles.noImage}>
                                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                    <circle cx="8.5" cy="8.5" r="1.5"/>
                                    <polyline points="21,15 16,10 5,21"/>
                                  </svg>
                                </div>
                              )}
                              
                              {isOnSale && (
                                <div className={styles.saleTag}>
                                  -{discountPercent}%
                                </div>
                              )}

                              {/* Wishlist Button */}
                              <button
                                className={`${styles.wishlistButton} ${inWishlist ? styles.active : ''}`}
                                onClick={(e) => handleWishlistToggle(product, e)}
                                title={inWishlist ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                                </svg>
                              </button>
                            </div>

                            {/* Product Info */}
                            <div className={styles.productInfo}>
                              <div className={styles.productMeta}>
                                {product.category && (
                                  <span className={styles.category}>
                                    {typeof product.category === 'string' ? product.category : product.category.name}
                                  </span>
                                )}
                                <div className={styles.rating}>
                                  <span className={styles.stars}>
                                    {'★'.repeat(Math.floor((product as any).averageRating || 4))}
                                    {'☆'.repeat(5 - Math.floor((product as any).averageRating || 4))}
                                  </span>
                                  <span className={styles.reviewCount}>
                                    ({(product as any).reviewCount || 0})
                                  </span>
                                </div>
                              </div>

                              <h4 className={styles.productName} title={product.name}>
                                {product.name}
                              </h4>

                              <div className={styles.priceSection}>
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
                                onClick={(e) => handleAddToCart(product, e)}
                                disabled={addingToCart === product._id}
                              >
                                {addingToCart === product._id ? (
                                  <>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.spinner}>
                                      <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c.93 0 1.83.14 2.68.41" />
                                    </svg>
                                    Đang thêm...
                                  </>
                                ) : (
                                  'Mua ngay'
                                )}
                              </button>
                            </div>
                          </Link>
                        </div>
                      );
                    })}
                </div>
              ))}
            </div>
          </div>

          {totalSlides > 1 && (
            <button
              className={`${styles.navButton} ${styles.nextButton}`}
              onClick={nextSlide}
              disabled={totalSlides <= 1}
            >
              <FaChevronRight />
            </button>
          )}
        </div>

        {/* Slider Dots */}
        {totalSlides > 1 && (
          <div className={styles.dotsContainer}>
            {Array.from({ length: totalSlides }, (_, index) => (
              <button
                key={index}
                className={`${styles.dot} ${currentSlide === index ? styles.active : ''}`}
                onClick={() => setCurrentSlide(index)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
