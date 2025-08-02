'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './BannerSlider.module.css';
import { Banner } from '@/types';
import { bannerService } from '@/services';

// Configuration: Set to true for completely clean banners with no overlay elements
const CLEAN_MODE = false; // Change to true to hide all overlay elements
const INFO_POSITION: 'bottomLeft' | 'topLeft' | 'topRight' | 'center' = 'bottomLeft'; // Options: 'bottomLeft', 'topLeft', 'topRight', 'center'

interface BannerSliderProps {
  initialBanners?: Banner[]; // Add support for SSR data
}

export default function BannerSlider({ initialBanners }: BannerSliderProps) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Use initial data if provided (SSR case)
    if (initialBanners && initialBanners.length > 0) {
      console.log('📦 BannerSlider: Using SSR initial banners');
      // Filter out "New Arrival" banners to avoid duplication with MiddleBanner
      const sliderBanners = initialBanners.filter(banner => 
        banner.title &&
        !banner.title.toLowerCase().includes('new arrival') &&
        !banner.title.toLowerCase().includes('bộ sưu tập mới') &&
        !banner.title.toLowerCase().includes('sản phẩm mới')
      );
      setBanners(sliderBanners);
      setLoading(false);
      return; // Don't fetch if we have initial data
    }

    // Fallback to API fetch if no initial data
    const fetchBanners = async () => {
      try {
        setLoading(true);
        console.log('🎯 BannerSlider: Fetching banners from API...');
        const response = await bannerService.getActiveBanners();
        console.log('✅ BannerSlider: API response:', response);
        
        // Filter out "New Arrival" banners to avoid duplication with MiddleBanner
        const sliderBanners = response.filter(banner => 
          banner.title &&
          !banner.title.toLowerCase().includes('new arrival') &&
          !banner.title.toLowerCase().includes('bộ sưu tập mới') &&
          !banner.title.toLowerCase().includes('sản phẩm mới')
        );
        
        setBanners(sliderBanners);
        console.log('📊 BannerSlider: Set banners state:', sliderBanners.length, 'banners (filtered)');
      } catch (err: any) {
        setError(err.message);
        console.error('❌ BannerSlider: Failed to fetch banners:', err);
        
        // Fallback banners nếu không fetch được từ API
        const fallbackBanners = [
          {
            _id: '1',
            title: 'FINO SHOP - Phong Cách Nam Tính',
            description: 'Khám phá bộ sưu tập thời trang nam cao cấp',
            image: '/images/bner1.jpg',
            link: '/products',
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            _id: '2',
            title: 'Khuyến Mãi Lớn',
            description: 'Giảm giá đến 50% cho tất cả sản phẩm',
            image: '/images/bner2.jpg',
            link: '/products',
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];
        setBanners(fallbackBanners);
        console.log('⚠️ BannerSlider: Using fallback banners:', fallbackBanners.length);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, [initialBanners]); // Add initialBanners to dependencies

  const nextSlide = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (banners.length > 0) {
      setCurrentSlide(prev => (prev + 1) % banners.length);
    }
  }, [banners.length]);

  const prevSlide = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (banners.length > 0) {
      setCurrentSlide(prev => prev === 0 ? banners.length - 1 : prev - 1);
    }
  }, [banners.length]);

  // Auto-slide functionality
  useEffect(() => {
    if (banners.length > 1) {
      intervalRef.current = setInterval(() => nextSlide(), 8000); // Increased from 4s to 8s
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [nextSlide, banners.length]);

  const goToSlide = (index: number, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setCurrentSlide(index);
  };

  // Get banner info position class
  const getInfoPositionClass = () => {
    switch (INFO_POSITION) {
      case 'topLeft': return styles.topLeft;
      case 'topRight': return styles.topRight;
      case 'center': return styles.center;
      default: return ''; // bottomLeft is default
    }
  };

  if (loading) {
    return (
      <div className={styles.bannerSlider}>
        <div className={styles.loadingBanner}>
          <div>Đang tải banner...</div>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('Banner error:', error);
    return (
      <div className={styles.bannerSlider}>
        <div className={styles.fallbackBanner}>
          <div className={styles.fallbackContent}>
            <h2>FINO SHOP</h2>
            <p>Thời trang nam hiện đại</p>
          </div>
        </div>
      </div>
    );
  }

  if (banners.length === 0) {
    console.log('No banners found, showing fallback');
    return (
      <div className={styles.bannerSlider}>
        <div className={styles.fallbackBanner}>
          <div className={styles.fallbackContent}>
            <h2>FINO SHOP</h2>
            <p>Thời trang nam hiện đại</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.bannerSlider} ${CLEAN_MODE ? styles.cleanMode : ''}`}>
      <div className={styles.sliderContainer}>
        <div 
          className={styles.sliderWrapper}
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {banners.map((banner, index) => (
            <div key={banner._id} className={styles.slide}>
              <a href={banner.link} className={styles.slideLink}>
                <div className={styles.slideContent}>
                  <img 
                    src={banner.image} 
                    alt={banner.title || 'Banner'}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/images/bner1.jpg'; // fallback image
                    }}
                  />
                  <div className={styles.slideOverlay}>
                    {!CLEAN_MODE && (
                      <div className={`${styles.bannerInfo} ${getInfoPositionClass()}`}>
                        {banner.title && (
                          <h3 className={styles.bannerTitle}>{banner.title}</h3>
                        )}
                        {banner.description && (
                          <p className={styles.bannerDescription}>{banner.description}</p>
                        )}
                        <div className={styles.bannerCTA}>
                          <span>Khám Phá Ngay</span>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path 
                              d="M5 12h14M12 5l7 7-7 7" 
                              stroke="currentColor" 
                              strokeWidth="2" 
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </a>
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        {!CLEAN_MODE && banners.length > 1 && (
          <>
            <button className={styles.prevButton} onClick={prevSlide}>
              ‹
            </button>
            <button className={styles.nextButton} onClick={nextSlide}>
              ›
            </button>
          </>
        )}

        {/* Dots Indicator */}
        {!CLEAN_MODE && banners.length > 1 && (
          <div className={styles.dotsContainer}>
            {banners.map((_, index) => (
              <button
                key={index}
                className={`${styles.dot} ${index === currentSlide ? styles.activeDot : ''}`}
                onClick={(e) => goToSlide(index, e)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
