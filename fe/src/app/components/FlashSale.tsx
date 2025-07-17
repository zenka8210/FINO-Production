'use client';
import { useState, useEffect, useRef } from 'react';
import styles from './FlashSale.module.css';
import ProductItem from './ProductItem';
import { ProductWithCategory } from '@/types';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

interface FlashSaleProps {
  products: ProductWithCategory[];
}

export default function FlashSale({ products }: FlashSaleProps) {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  useEffect(() => {
    // Set end time to 24 hours from now
    const endTime = new Date();
    endTime.setHours(endTime.getHours() + 24);

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = endTime.getTime() - now;

      if (distance > 0) {
        const hours = Math.floor(distance / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        setTimeLeft({ hours, minutes, seconds });
      } else {
        // Reset timer when it reaches 0
        endTime.setHours(endTime.getHours() + 24);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const checkScrollButtons = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    checkScrollButtons();
    const scrollContainer = scrollRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', checkScrollButtons);
      return () => scrollContainer.removeEventListener('scroll', checkScrollButtons);
    }
  }, [products]);

  // Ensure products is array before slicing
  const flashSaleProducts = Array.isArray(products) ? products.slice(0, 10) : [];

  return (
    <div className={styles.flashSaleContainer}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h2 className={styles.title}>
            <span className={styles.flashText}>FLASH</span>
            <span className={styles.saleText}>SALE</span>
          </h2>
          <span className={styles.subtitle}>Kết thúc sau</span>
        </div>
        
        <div className={styles.timerSection}>
          <div className={styles.timeBlock}>
            <span className={styles.timeNumber}>{String(timeLeft.hours).padStart(2, '0')}</span>
            <span className={styles.timeLabel}>Đã kết thúc</span>
          </div>
          <div className={styles.timeBlock}>
            <span className={styles.timeNumber}>{String(timeLeft.minutes).padStart(2, '0')}</span>
            <span className={styles.timeLabel}>Đã kết thúc</span>
          </div>
          <div className={styles.timeBlock}>
            <span className={styles.timeNumber}>{String(Math.floor(timeLeft.hours / 4) * 4).padStart(2, '0')}</span>
            <span className={styles.timeLabel}>Đã kết thúc</span>
          </div>
          <div className={styles.timeBlock}>
            <span className={styles.timeNumber}>{String(Math.floor(timeLeft.hours / 4) * 4 + 4).padStart(2, '0')}</span>
            <span className={styles.timeLabel}>Đang diễn ra</span>
          </div>
          <div className={styles.timeBlock}>
            <span className={styles.timeNumber}>{String(Math.floor(timeLeft.hours / 4) * 4 + 8).padStart(2, '0')}</span>
            <span className={styles.timeLabel}>Sắp diễn ra</span>
          </div>
        </div>        <div className={styles.viewAllSection}>
          <a href="/flash-sale" className={styles.viewAllLink}>
            Xem tất cả →
          </a>
        </div>
      </div>

      <div className={styles.productsSection}>
        {/* Navigation Buttons */}
        <button 
          className={`${styles.navButton} ${styles.navLeft}`}
          onClick={scrollLeft}
          disabled={!canScrollLeft}
          style={{ opacity: canScrollLeft ? 1 : 0.3 }}
        >
          <FaChevronLeft />
        </button>
        
        <button 
          className={`${styles.navButton} ${styles.navRight}`}
          onClick={scrollRight}
          disabled={!canScrollRight}
          style={{ opacity: canScrollRight ? 1 : 0.3 }}
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
                <div className={styles.discountBadge}>-50%</div>
                <ProductItem product={product} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
