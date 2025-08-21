'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './FlashSale.module.css';
import ProductItem from './ProductItem';
import { ProductWithCategory } from '@/types';
import { FaChevronLeft, FaChevronRight, FaFire, FaClock } from 'react-icons/fa';
import { useProducts } from '@/hooks/useProducts';
import { LoadingSpinner } from '@/app/components/ui';
import { isProductOnSale, getDiscountPercent } from '@/lib/productUtils';

interface FlashSaleProps {
  maxProducts?: number;
  autoSlide?: boolean;
  slideInterval?: number;
  initialProducts?: ProductWithCategory[]; // Add support for SSR data
}

export default function FlashSale({ 
  maxProducts = 20, 
  autoSlide = true, 
  slideInterval = 5000,
  initialProducts // Add initial data prop
}: FlashSaleProps) {
  const { getProducts, loading } = useProducts();
  const [flashSaleProducts, setFlashSaleProducts] = useState<ProductWithCategory[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [saleEndTime, setSaleEndTime] = useState<Date | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // PERFORMANCE: Add memory cache to prevent unnecessary API calls
  const cacheRef = useRef<{
    data: ProductWithCategory[] | null;
    timestamp: number;
    expiry: number;
  }>({
    data: null,
    timestamp: 0,
    expiry: 5 * 60 * 1000 // 5 minutes cache
  });

  // PERFORMANCE FIX: Use useEffect with simple dependency to prevent multiple API calls
  useEffect(() => {
    // Use initial data if provided (SSR case)
    if (initialProducts && initialProducts.length > 0) {
      console.log('📦 FlashSale: Using SSR initial products');
      // Filter only products on sale from initial data
      const saleProducts = initialProducts.filter(product => isProductOnSale(product));
      setFlashSaleProducts(saleProducts.slice(0, maxProducts));
      setHasInitialized(true);
      return; // Don't fetch if we have initial data
    }

    if (hasInitialized) return; // Already initialized, skip
    
    // PERFORMANCE: Check cache first
    const now = Date.now();
    if (cacheRef.current.data && (now - cacheRef.current.timestamp) < cacheRef.current.expiry) {
      setFlashSaleProducts(cacheRef.current.data);
      setHasInitialized(true);
      return;
    }

    setHasInitialized(true);
    setIsLoading(true);
    
    const fetchProducts = async () => {
      try {
        // Get sale products for display (use same query as Sale page for consistency)
        console.log(`🔍 FlashSale: Calling API with isOnSale=true, limit=${maxProducts} (same as Sale page)`);
        const response = await getProducts({
          isOnSale: 'true',  // Use string like Sale page
          limit: 1000,       // Use high limit like Sale page to get all, then slice
          sort: 'createdAt', 
          order: 'desc' 
        });
        
        console.log(`📦 FlashSale: API response received:`, response);
        
        // Use EXACT same data parsing as sale page
        const productsArray = Array.isArray(response.data) ? response.data : 
                             (response.data && Array.isArray((response.data as any).data)) ? (response.data as any).data : [];
        
        console.log(`📊 FlashSale: Parsed ${productsArray.length} products from API`);
        
        let saleProducts = [];
        
        if (productsArray.length > 0) {
          // Additional frontend filter to ensure products are on sale - using backend computed fields
          saleProducts = productsArray
            .filter((product: ProductWithCategory) => 
              product.isOnSale && product.isActive !== false
            )
            .slice(0, maxProducts); // Ensure we don't exceed maxProducts
        }
        
        // Only set products if we have actual sale products - NO FALLBACK
        if (saleProducts.length > 0) {
          console.log(`🎯 FlashSale: Found ${saleProducts.length} sale products, setting state...`);
          setFlashSaleProducts(saleProducts);
          
          // PERFORMANCE: Cache the results
          cacheRef.current = {
            data: saleProducts,
            timestamp: Date.now(),
            expiry: 5 * 60 * 1000 // 5 minutes
          };
        } else {
          console.log(`⚠️ FlashSale: No sale products found from ${productsArray.length} products`);
        }
      } catch (error) {
        console.error('❌ FlashSale Error:', error);
        setFlashSaleProducts([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProducts();
  }, [initialProducts, maxProducts]); // Add dependencies

  const autoSlideRef = useRef<NodeJS.Timeout | null>(null);
  
  // Calculate realistic sale end time based on flash sale logic
  const calculateSaleEndTime = useCallback((products: ProductWithCategory[]) => {
    // Check if any product has real saleEndDate
    const productsWithSaleDate = products.filter(p => 
      p.saleEndDate && new Date(p.saleEndDate) > new Date()
    );
    
    if (productsWithSaleDate.length > 0) {
      // Use the earliest sale end date
      const earliestEndDate = productsWithSaleDate
        .map(p => new Date(p.saleEndDate!))
        .sort((a, b) => a.getTime() - b.getTime())[0];
      
      setSaleEndTime(earliestEndDate);
      return;
    }
    
    // For flash sale products (based on time), calculate realistic end time
    const now = new Date();
    const currentHour = now.getHours();
    
    // Flash sale runs 9AM-9PM, so calculate end time accordingly
    if (currentHour >= 9 && currentHour < 21) {
      // Sale ends at 9 PM today
      const endTime = new Date();
      endTime.setHours(21, 0, 0, 0);
      setSaleEndTime(endTime);
    } else {
      // Sale starts again at 9 AM next day
      const nextSaleStart = new Date();
      if (currentHour >= 21) {
        // If after 9 PM, next sale starts tomorrow 9 AM
        nextSaleStart.setDate(nextSaleStart.getDate() + 1);
      }
      nextSaleStart.setHours(21, 0, 0, 0); // End at 9 PM next day
      setSaleEndTime(nextSaleStart);
    }
  }, []);

  // Update countdown timer based on real sale data
  const updateCountdown = useCallback(() => {
    if (!saleEndTime) return;
    
    const now = new Date();
    const distance = saleEndTime.getTime() - now.getTime();
    
    if (distance > 0) {
      const hours = Math.floor(distance / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      
      setTimeLeft({ hours, minutes, seconds });
    } else {
      // Sale ended, reset timer
      setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
    }
  }, [saleEndTime]);

  // Separate useEffect for calculating sale end time when products change
  useEffect(() => {
    if (flashSaleProducts.length > 0 && !saleEndTime) {
      calculateSaleEndTime(flashSaleProducts);
    }
  }, [flashSaleProducts, calculateSaleEndTime]); // Remove saleEndTime from dependency to prevent loop

  // Cố định 4 sản phẩm mỗi slide (theo yêu cầu)
  const productsPerSlide = 4;
  const totalSlides = Math.ceil(flashSaleProducts.length / productsPerSlide);
  
  console.log(`📊 FlashSale Render Stats:`, {
    totalProducts: flashSaleProducts.length,
    productsPerSlide,
    totalSlides,
    maxProducts
  });

  // Real-time countdown timer based on sale data
  useEffect(() => {
    if (!saleEndTime) return;
    
    // Update immediately
    updateCountdown();
    
    // Update every second
    const timer = setInterval(updateCountdown, 1000);
    
    return () => clearInterval(timer);
  }, [saleEndTime, updateCountdown]);

  // Auto slide functionality
  useEffect(() => {
    if (autoSlide && totalSlides > 1) {
      autoSlideRef.current = setInterval(() => {
        setCurrentSlide(prev => (prev >= totalSlides - 1 ? 0 : prev + 1));
      }, slideInterval);

      return () => {
        if (autoSlideRef.current) {
          clearInterval(autoSlideRef.current);
        }
      };
    }
  }, [autoSlide, slideInterval, totalSlides]);

  // Manual slide controls
  const goToSlide = (slideIndex: number) => {
    if (autoSlideRef.current) {
      clearInterval(autoSlideRef.current);
    }
    setCurrentSlide(slideIndex);
  };

  const nextSlide = () => {
    goToSlide(currentSlide >= totalSlides - 1 ? 0 : currentSlide + 1);
  };

  const prevSlide = () => {
    goToSlide(currentSlide <= 0 ? totalSlides - 1 : currentSlide - 1);
  };

  // Format timer
  const formatTime = (time: number) => {
    return time.toString().padStart(2, '0');
  };

  if (loading || isLoading) {
    return (
      <div className={styles.flashSaleContainer}>
        <div className={styles.header}>
          <div className={styles.titleSection}>
            <h2 className={styles.title}>
              <FaFire className={styles.fireIcon} />
              <span className={styles.saleText}>SALE</span>
            </h2>
          </div>
        </div>
        <div className={styles.productsSection}>
          <div className={styles.loadingContainer}>
            <LoadingSpinner size="lg" />
            <span className={styles.loadingText}>Đang tải sản phẩm flash sale...</span>
          </div>
        </div>
      </div>
    );
  }

  if (flashSaleProducts.length === 0) {
    return (
      <div className={styles.flashSaleContainer}>
        <div className={styles.header}>
          <div className={styles.titleSection}>
            <h2 className={styles.title}>
              <FaFire className={styles.fireIcon} />
              <span className={styles.saleText}>SALE</span>
            </h2>
          </div>
        </div>
        <div className={styles.productsSection}>
          <div className={styles.emptyState}>
            <FaFire className={styles.emptyStateIcon} />
            <h3 className={styles.emptyStateTitle}>Chưa có sản phẩm Sale</h3>
            <p className={styles.emptyStateText}>
              Hãy quay lại sau để không bỏ lỡ những ưu đãi hấp dẫn nhất!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.flashSaleContainer}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h2 className={styles.title}>
            <FaFire className={styles.fireIcon} />
            <span className={styles.saleText}>SALE</span>
          </h2>
          
          <div className={styles.subtitle}>
            <FaClock className={styles.clockIcon} />
            <span>Kết thúc sau:</span>
            <div className={styles.countdown}>
              {timeLeft.hours > 0 && (
                <>
                  <span className={styles.timeUnit}>
                    {formatTime(timeLeft.hours)}
                    <small>h</small>
                  </span>
                  <span className={styles.timeSeparator}>:</span>
                </>
              )}
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
        </div>
        
        <div className={styles.viewAllSection}>
          <a href="/sale" className={styles.viewAllLink}>
            Xem thêm sản phẩm khác
            <span className={styles.viewAllArrow}></span>
          </a>
        </div>
      </div>

      {/* Products Section */}
      <div className={styles.productsSection}>
        <div className={styles.sliderContainer}>
          {/* Navigation Buttons */}
          {totalSlides > 1 && (
            <>
              <button 
                className={`${styles.sliderNav} ${styles.sliderNavPrev}`}
                onClick={prevSlide}
                aria-label="Slide trước"
              >
                <FaChevronLeft />
              </button>
              
              <button 
                className={`${styles.sliderNav} ${styles.sliderNavNext}`}
                onClick={nextSlide}
                aria-label="Slide tiếp theo"
              >
                <FaChevronRight />
              </button>
            </>
          )}

          {/* Products Grid - 4 sản phẩm mỗi slide */}
          <div className={styles.sliderWrapper}>
            <div 
              className={styles.sliderTrack}
              style={{
                transform: `translateX(-${currentSlide * 100}%)`,
                transition: 'transform 0.3s ease-in-out'
              }}
            >
              {Array.from({ length: totalSlides }, (_, slideIndex) => (
                <div key={slideIndex} className={styles.slide}>
                  <div className={styles.productsGrid}>
                    {flashSaleProducts
                      .slice(slideIndex * 4, (slideIndex + 1) * 4)
                      .map((product) => (
                        <div key={product._id} className={styles.productSlot}>
                          <ProductItem 
                            product={product} 
                            layout="grid"
                            showQuickActions={true}
                          />
                        </div>
                      ))}
                    
                    {/* Empty slots để đảm bảo luôn có 4 slots */}
                    {Array.from({ 
                      length: 4 - flashSaleProducts.slice(slideIndex * 4, (slideIndex + 1) * 4).length 
                    }, (_, index) => (
                      <div key={`empty-${index}`} className={styles.emptySlot}>
                        <div className={styles.emptySlotContent}>
                          <FaClock className={styles.emptyIcon} />
                          <span>Sản phẩm sắp có</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Slide Indicators */}
          {totalSlides > 1 && (
            <div className={styles.slideIndicators}>
              {Array.from({ length: totalSlides }, (_, index) => (
                <button
                  key={index}
                  className={`${styles.indicator} ${
                    index === currentSlide ? styles.indicatorActive : ''
                  }`}
                  onClick={() => goToSlide(index)}
                  aria-label={`Slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
