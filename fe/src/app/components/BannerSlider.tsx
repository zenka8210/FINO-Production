'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './BannerSlider.module.css';
import bner1 from '../img/bner1.jpg';
import bner2 from '../img/bner2.jpg';

interface BannerItem {
  id: number;
  image: string;
  title: string;
  subtitle: string;
  buttonText?: string;
  buttonLink?: string;
}

const bannerData: BannerItem[] = [
  {
    id: 1,
    image: bner1.src,
    title: 'FINO SHOP - Phong Cách Nam Tính',
    subtitle: 'Bộ sưu tập thời trang nam hiện đại, lịch lãm',
    buttonText: 'Khám Phá Ngay',
    buttonLink: '/products'
  },
  {
    id: 2,
    image: bner2.src,
    title: 'Bộ Sưu Tập Mới 2025',
    subtitle: 'Khám phá phong cách thời trang hiện đại',
    buttonText: 'Mua Ngay',
    buttonLink: '/products'
  },
  {
    id: 3,
    image: '/images/anh1.jpg',
    title: 'Áo Thun Premium',
    subtitle: 'Chất liệu cao cấp, thiết kế sang trọng',
    buttonText: 'Xem Thêm',
    buttonLink: '/products'
  },
  {
    id: 4,
    image: '/images/anh2.jpg',
    title: 'Sale Khủng 50%',
    subtitle: 'Ưu đãi đặc biệt cho khách hàng thân thiết',
    buttonText: 'Shop Now',
    buttonLink: '/products'
  },
  {
    id: 5,
    image: '/images/anh3.jpg',
    title: 'Thời Trang Công Sở',
    subtitle: 'Phong cách chuyên nghiệp, thanh lịch',
    buttonText: 'Khám Phá',
    buttonLink: '/products'
  }
];

export default function BannerSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto slide with pause on hover
  useEffect(() => {
    if (!isPlaying || isHovered) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      return;
    }
    
    intervalRef.current = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % bannerData.length);
    }, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, isHovered]);

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index);
  }, []);

  const goToPrevSlide = useCallback(() => {
    setCurrentSlide(prev => prev === 0 ? bannerData.length - 1 : prev - 1);
  }, []);
  const goToNextSlide = useCallback(() => {
    setCurrentSlide(prev => (prev + 1) % bannerData.length);
  }, []);
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        goToPrevSlide();
      } else if (event.key === 'ArrowRight') {
        goToNextSlide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrevSlide, goToNextSlide]);

  return (
    <div 
      className={styles.bannerSlider}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Slides */}
      <div className={styles.slidesWrapper}>        {bannerData.map((banner, index) => (
          <div
            key={banner.id}
            className={`${styles.slide} ${index === currentSlide ? styles.active : ''}`}
            style={{ backgroundImage: `url(${banner.image})` }}
            data-slide={index}
          >
            <div className={styles.overlay}></div>            <div className={styles.slideContent}>
              <div className="container">
                <div className="row">
                  <div className="col-12">
                    <div className={styles.contentWrapper}>
                      {/* Chỉ hiển thị title và nút cho banner đầu tiên */}
                      {index === 0 && (
                        <>
                          <h1 className={styles.title}>{banner.title}</h1>
                          <p className={styles.subtitle}>{banner.subtitle}</p>
                          {banner.buttonText && banner.buttonLink && (
                            <a 
                              href={banner.buttonLink} 
                              className={styles.ctaButton}
                            >
                              {banner.buttonText}
                            </a>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>      {/* Navigation Arrows - Ẩn đi */}
      {/* 
      <button 
        className={`${styles.navButton} ${styles.prevButton}`}
        onClick={goToPrevSlide}
        aria-label="Previous slide"
      >
        <i className="fas fa-chevron-left"></i>
      </button>
      <button 
        className={`${styles.navButton} ${styles.nextButton}`}
        onClick={goToNextSlide}
        aria-label="Next slide"
      >
        <i className="fas fa-chevron-right"></i>
      </button>
      */}{/* Dots Indicators */}
      <div className={styles.dotsContainer}>
        {bannerData.map((_, index) => (
          <button
            key={index}
            className={`${styles.dot} ${index === currentSlide ? styles.activeDot : ''}`}
            onClick={() => goToSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Progress Bar */}
      {isPlaying && !isHovered && (
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill}
            key={currentSlide} // Reset animation on slide change
          ></div>
        </div>
      )}
    </div>
  );
}
