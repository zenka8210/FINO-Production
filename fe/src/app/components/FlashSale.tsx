'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './FlashSale.module.css';
import ProductItem from './ProductItem';
import { ProductWithCategory } from '@/types';
import { isProductOnSale, getDiscountPercent, getCurrentPrice } from '@/lib/productUtils';
import { FaChevronLeft, FaChevronRight, FaFire } from 'react-icons/fa';
import { useProducts } from '@/hooks/useProducts';
import { productService } from '@/services';

interface FlashSaleProps {
  refreshInterval?: number; // Optional: auto-refresh interval in milliseconds
}

export default function FlashSale({ refreshInterval = 0 }: FlashSaleProps) { // Default: no auto-refresh
  const { getFeaturedProducts, getProducts, loading } = useProducts();
  const [flashSaleProducts, setFlashSaleProducts] = useState<ProductWithCategory[]>([]);
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [nextSaleTime, setNextSaleTime] = useState<Date | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Calculate real flash sale timer based on actual sale end dates
  const calculateRealTimer = useCallback((products: ProductWithCategory[]) => {
    if (products.length === 0) return;

    // Find the earliest sale end date among all products
    const now = new Date();
    const validEndDates: Date[] = [];

    products.forEach(product => {
      if (product.saleEndDate && isProductOnSale(product)) {
        const endDate = new Date(product.saleEndDate);
        if (!isNaN(endDate.getTime())) {
          validEndDates.push(endDate);
        }
      }
    });

    if (validEndDates.length > 0) {
      const earliestEndDate = validEndDates.reduce((earliest, current) => 
        current < earliest ? current : earliest
      );

      if (earliestEndDate.getTime() > now.getTime()) {
        setNextSaleTime(earliestEndDate);
        const distance = earliestEndDate.getTime() - now.getTime();
        
        if (distance > 0) {
          const hours = Math.floor(distance / (1000 * 60 * 60));
          const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((distance % (1000 * 60)) / 1000);
          
          setTimeLeft({ hours, minutes, seconds });
        } else {
          setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        }
      } else {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        setNextSaleTime(null);
      }
    } else {
      setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
      setNextSaleTime(null);
    }
  }, []);

  // Fetch real flash sale products with enhanced business logic
  const fetchFlashSaleProducts = useCallback(async () => {
    try {
      // Strategy: Combine real sale products with featured products for optimal mix
      const [saleResponse, featuredProducts] = await Promise.all([
        // Get actual products on sale
        getProducts({ 
          limit: 6, // Reduced request since we only need 4 final products
          isOnSale: true 
        }),
        // Get featured products based on popularity metrics
        productService.getFeaturedProducts(6) // Reduced request for 4 final products
      ]);
      
      const saleProductsArray = Array.isArray(saleResponse.data) ? saleResponse.data : 
                               (saleResponse.data && Array.isArray((saleResponse.data as any).data)) ? 
                               (saleResponse.data as any).data : [];

      // Filter and enhance sale products 
      const validSaleProducts = saleProductsArray
        .filter((product: ProductWithCategory) => {
          return isProductOnSale(product) && 
                 product.isActive !== false &&
                 getDiscountPercent(product) >= 10; // Minimum 10% discount
        });

      // Combine sale products with featured products for diverse selection
      const combinedProducts = [
        ...validSaleProducts,
        ...featuredProducts.filter((featured: ProductWithCategory) => 
          // Add featured products that aren't already in sale products
          !validSaleProducts.some((sale: ProductWithCategory) => sale._id === featured._id)
        )
      ];

      // Sort by business priority: sale products first, then by popularity score
      const finalProducts = combinedProducts
        .sort((a: ProductWithCategory, b: ProductWithCategory) => {
          const aOnSale = isProductOnSale(a);
          const bOnSale = isProductOnSale(b);
          
          // Prioritize products on sale
          if (aOnSale && !bOnSale) return -1;
          if (!aOnSale && bOnSale) return 1;
          
          // Among sale products, sort by discount percentage
          if (aOnSale && bOnSale) {
            return getDiscountPercent(b) - getDiscountPercent(a);
          }
          
          // Among non-sale products, maintain featured order (already sorted by popularity)
          return 0;
        })
        .slice(0, 4); // Show exactly 4 products for full row display (no scrolling)

      setFlashSaleProducts(finalProducts);
      
      // Calculate real timer based on actual sale data
      calculateRealTimer(validSaleProducts);
      
    } catch (error) {
      console.error('Failed to fetch flash sale products:', error);
      setFlashSaleProducts([]);
    }
  }, [getProducts, calculateRealTimer]);

  // Real-time timer based on actual sale data
  useEffect(() => {
    if (nextSaleTime) {
      const updateTimer = () => {
        const now = new Date();
        const distance = nextSaleTime.getTime() - now.getTime();
        
        if (distance > 0) {
          const hours = Math.floor(distance / (1000 * 60 * 60));
          const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((distance % (1000 * 60)) / 1000);
          
          setTimeLeft({ hours, minutes, seconds });
        } else {
          // Sale ended, refresh products to remove expired ones
          setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
          fetchFlashSaleProducts();
        }
      };

      updateTimer();
      const timer = setInterval(updateTimer, 1000);
      
      return () => clearInterval(timer);
    }
  }, [nextSaleTime, fetchFlashSaleProducts]);

  // Auto-refresh products at specified interval - FIXED: Only run once on mount and when refreshInterval changes
  useEffect(() => {
    // Initial fetch
    fetchFlashSaleProducts();
    
    // Set up refresh timer - only if refreshInterval is valid
    if (refreshInterval > 0) {
      const refreshTimer = setInterval(() => {
        fetchFlashSaleProducts();
      }, refreshInterval);

      return () => clearInterval(refreshTimer);
    }
  }, [fetchFlashSaleProducts, refreshInterval]); // Include fetchFlashSaleProducts in dependencies

  // Scroll functionality - wrapped in useCallback
  const checkScrollButtons = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  }, []);

  const scrollLeft = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  }, []);

  const scrollRight = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    checkScrollButtons();
    const scrollContainer = scrollRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', checkScrollButtons);
      return () => scrollContainer.removeEventListener('scroll', checkScrollButtons);
    }
  }, [flashSaleProducts, checkScrollButtons]);

  // Format timer display
  const formatTime = (value: number) => String(value).padStart(2, '0');

  // Don't render if no products on sale
  if (!loading && flashSaleProducts.length === 0) {
    return null;
  }

  return (
    <div className={styles.flashSaleContainer}>
      {/* Header Section - Real Sale Timer */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h2 className={styles.title}>
            <FaFire className={styles.fireIcon} />
            <span className={styles.flashText}>FLASH</span>
            <span className={styles.saleText}>SALE</span>
          </h2>
          {nextSaleTime && (timeLeft.hours > 0 || timeLeft.minutes > 0 || timeLeft.seconds > 0) && (
            <div className={styles.subtitle}>
              <span>Kết thúc sau:</span>
              <div className={styles.countdown}>
                <span className={styles.timeUnit}>
                  {formatTime(timeLeft.hours)}
                  <small>h</small>
                </span>
                <span className={styles.timeSeparator}>:</span>
                <span className={styles.timeUnit}>
                  {formatTime(timeLeft.minutes)}
                  <small>m</small>
                </span>
                <span className={styles.timeSeparator}>:</span>
                <span className={styles.timeUnit}>
                  {formatTime(timeLeft.seconds)}
                  <small>s</small>
                </span>
              </div>
            </div>
          )}
        </div>
        
        <div className={styles.viewAllSection}>
          <a href="/flash-sale" className={styles.viewAllLink}>
            Xem tất cả
          </a>
        </div>
      </div>

      {/* Products Section - Removed Fake Stock Progress */}
      <div className={styles.productsSection}>
        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner} />
            <span>Đang tải sản phẩm flash sale...</span>
          </div>
        ) : flashSaleProducts.length > 0 ? (
          <>
            {/* Navigation Buttons */}
            <button 
              className={`${styles.navButton} ${styles.navLeft}`}
              onClick={scrollLeft}
              disabled={!canScrollLeft}
              aria-label="Cuộn trái"
            >
              <FaChevronLeft />
            </button>
            
            <button 
              className={`${styles.navButton} ${styles.navRight}`}
              onClick={scrollRight}
              disabled={!canScrollRight}
              aria-label="Cuộn phải"
            >
              <FaChevronRight />
            </button>

            {/* Scrollable Products Container */}
            <div 
              className={styles.productsContainer}
              ref={scrollRef}
              onScroll={checkScrollButtons}
            >
              <div className={styles.productsGrid}>
                {flashSaleProducts.map((product) => (
                  <div key={product._id} className={styles.productCard}>
                    {/* Sale Badge - Only show discount */}
                    <div className={styles.discountBadge}>
                      -{getDiscountPercent(product)}%
                    </div>
                    
                    {/* Clean Product Item - No fake stock data */}
                    <ProductItem 
                      product={product} 
                      layout="grid"
                      showQuickActions={true}
                    />
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className={styles.emptyState}>
            <FaFire className={styles.emptyIcon} />
            <p>Hiện tại chưa có sản phẩm flash sale</p>
            <small>Vui lòng quay lại sau!</small>
          </div>
        )}
      </div>
    </div>
  );
}
