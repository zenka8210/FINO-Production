'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './BannerSlider.module.css';
import { Banner } from '@/types';
import { bannerService } from '@/services';

export default function BannerSlider() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setLoading(true);
        const response = await bannerService.getActiveBanners();
        setBanners(response);
      } catch (err: any) {
        setError(err.message);
        console.error('Failed to fetch banners:', err);
        
        // Fallback banners nếu không fetch được từ API
        setBanners([
          {
            _id: '1',
            title: 'FINO SHOP - Phong Cách Nam Tính',
            image: '/images/bner1.jpg',
            link: '/products',
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            _id: '2',
            title: 'Bộ Sưu Tập Mới 2025',
            image: '/images/bner2.jpg',
            link: '/products',
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, []);

  const nextSlide = useCallback(() => {
    if (banners.length > 0) {
      setCurrentSlide(prev => (prev + 1) % banners.length);
    }
  }, [banners.length]);

  const prevSlide = useCallback(() => {
    if (banners.length > 0) {
      setCurrentSlide(prev => prev === 0 ? banners.length - 1 : prev - 1);
    }
  }, [banners.length]);

  // Auto-slide functionality
  useEffect(() => {
    if (banners.length > 1) {
      intervalRef.current = setInterval(nextSlide, 5000);
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [nextSlide, banners.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
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

  if (error || banners.length === 0) {
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
    <div className={styles.bannerSlider}>
      <div className={styles.sliderContainer}>
        <div 
          className={styles.sliderWrapper}
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {banners.map((banner, index) => (
            <div key={banner._id} className={styles.slide}>
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
                  <div className={styles.slideText}>
                    {banner.title && <h2>{banner.title}</h2>}
                    <a href={banner.link} className={styles.slideButton}>
                      Khám Phá Ngay
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        {banners.length > 1 && (
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
        {banners.length > 1 && (
          <div className={styles.dotsContainer}>
            {banners.map((_, index) => (
              <button
                key={index}
                className={`${styles.dot} ${index === currentSlide ? styles.activeDot : ''}`}
                onClick={() => goToSlide(index)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
