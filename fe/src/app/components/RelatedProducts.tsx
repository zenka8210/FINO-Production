'use client';

import { useState, useRef } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { ProductWithCategory } from '@/types';
import { useRelatedProducts } from '@/hooks';
import { LoadingSpinner, Button } from './ui';
import ProductItem from './ProductItem'; // Import reusable ProductItem component
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

  const [currentSlide, setCurrentSlide] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  
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
            Sản phẩm cùng loại
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
                    .map((product) => (
                      <div key={product._id} className={styles.productWrapper}>
                        <ProductItem
                          product={product}
                          layout="grid"
                          variant="related" // Add related variant
                          showQuickActions={true}
                          showDescription={false}
                          className={styles.relatedProductItem}
                          averageRating={(product as any).averageRating}
                          reviewCount={(product as any).reviewCount}
                        />
                      </div>
                    ))}
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
