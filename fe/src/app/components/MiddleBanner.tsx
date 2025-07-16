'use client';
import styles from './MiddleBanner.module.css';
import Link from 'next/link';

export default function MiddleBanner() {
  return (
    <div className={styles.middleBanner}>
      <div className={styles.bannerContent}>
        <div className={styles.textSection}>
          <h2 className={styles.title}>Bộ Sưu Tập Đặc Biệt</h2>
          <p className={styles.subtitle}>Khám phá những thiết kế độc đáo và phong cách hiện đại</p>
          <Link href="/products" className={styles.ctaButton}>
            Xem Ngay
          </Link>
        </div>
        <div className={styles.imageSection}>
          <img 
            src="/images/anh4.jpg" 
            alt="Special Collection"
            className={styles.bannerImage}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/images/anh1.jpg";
            }}
          />
        </div>
      </div>
    </div>
  );
}
