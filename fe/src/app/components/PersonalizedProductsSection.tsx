'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { usePersonalizedProducts } from '@/hooks/usePersonalizedProducts';
import { useProductStats } from '@/hooks';
import { useAuth } from '@/contexts';
import ProductItem from './ProductItem';
import { LoadingSpinner } from './ui';
import styles from './PersonalizedProductsSection.module.css';
import { 
  FaHeart, 
  FaEye, 
  FaShoppingCart, 
  FaHistory,
  FaLightbulb,
  FaSyncAlt,
  FaInfoCircle,
  FaChevronRight,
  FaChevronLeft
} from 'react-icons/fa';

interface PersonalizedProductsSectionProps {
  limit?: number;
  excludeIds?: string[];
  showPersonalizationInfo?: boolean;
  className?: string;
}

export default function PersonalizedProductsSection({
  limit = 6, // Back to 6 for slider functionality
  excludeIds = [],
  showPersonalizationInfo = false,
  className = ''
}: PersonalizedProductsSectionProps) {
  const { user } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const { 
    products, 
    loading, 
    error, 
    refetch,
    getPersonalizationDescription,
    getPersonalizationIcon
  } = usePersonalizedProducts({ 
    limit, 
    excludeIds 
  });

  // Reset slide when products change significantly
  useEffect(() => {
    if (products.length > 0) {
      setCurrentSlide(0);
    }
  }, [products.length]); // Only reset when length changes, not content

  // Calculate slider data
  const itemsPerSlide = 3;
  const totalSlides = Math.ceil(products.length / itemsPerSlide);
  const canGoNext = currentSlide < totalSlides - 1;
  const canGoPrev = currentSlide > 0;

  // Get current products to display - memoize to prevent flicker
  const currentProducts = React.useMemo(() => {
    return products.slice(
      currentSlide * itemsPerSlide,
      (currentSlide + 1) * itemsPerSlide
    );
  }, [products, currentSlide, itemsPerSlide]);

  // Slider navigation functions
  const goToNext = () => {
    if (canGoNext) {
      setCurrentSlide(prev => prev + 1);
    }
  };

  const goToPrev = () => {
    if (canGoPrev) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  // Get product statistics for rating display
  const productIds = products.map(p => p._id);
  const { stats: productStats, loading: statsLoading } = useProductStats(productIds);

  // Show loading state
  if (loading) {
    return (
      <section className={`${styles.section} ${className}`}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            Có thể bạn thích
          </h2>
        </div>
        <div className={styles.loadingContainer}>
          <LoadingSpinner text="Đang tải sản phẩm dành cho bạn..." />
        </div>
      </section>
    );
  }

  // Show error state with fallback
  if (error && products.length === 0) {
    return (
      <section className={`${styles.section} ${className}`}>
        <div className={styles.errorContainer}>
          <div className={styles.errorContent}>
            <FaInfoCircle className={styles.errorIcon} />
            <h3>Không thể tải sản phẩm cá nhân hóa</h3>
            <p>Hiển thị sản phẩm phổ biến thay thế</p>
          </div>
        </div>
      </section>
    );
  }

  // Don't render if no products
  if (products.length === 0 && !loading) {
    return null;
  }

  return (
    <section className={`${styles.section} ${className}`}>
      {/* Section Header - Centered */}
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>
          Có thể bạn thích
        </h2>
      </div>

      {/* Products Slider - Single Row */}
      <div className={styles.sliderContainer}>
        <div className={styles.productsSlider} key={`slider-${products.length}`}>
          {currentProducts.map((product, index) => (
            <div 
              key={`${product._id}-${currentSlide}-${index}`} 
              className={styles.productSlide}
            >
              <ProductItem 
                product={product}
              />
            </div>
          ))}
        </div>
        
        {/* Slider Navigation - Only show if more than 3 products */}
        {products.length > 3 && (
          <div className={styles.sliderNavigation} key={`nav-${totalSlides}`}>
            <button 
              className={`${styles.navButton} ${styles.prevButton} ${!canGoPrev ? styles.disabled : ''}`}
              onClick={goToPrev}
              disabled={!canGoPrev}
              type="button"
            >
              <FaChevronLeft />
            </button>
            
            <div className={styles.slideIndicators}>
              {Array.from({ length: totalSlides }, (_, index) => (
                <button
                  key={`indicator-${index}`}
                  className={`${styles.indicator} ${index === currentSlide ? styles.active : ''}`}
                  onClick={() => setCurrentSlide(index)}
                  type="button"
                  aria-label={`Slide ${index + 1}`}
                />
              ))}
            </div>
            
            <button 
              className={`${styles.navButton} ${styles.nextButton} ${!canGoNext ? styles.disabled : ''}`}
              onClick={goToNext}
              disabled={!canGoNext}
              type="button"
            >
              <FaChevronRight />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
