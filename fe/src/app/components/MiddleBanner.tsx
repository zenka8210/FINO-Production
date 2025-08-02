'use client';
import { useState, useEffect } from 'react';
import styles from './MiddleBanner.module.css';
import Link from 'next/link';
import { bannerService } from '@/services';
import { Banner } from '@/types';
import { LoadingSpinner } from './ui';

export default function MiddleBanner() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMiddleBanners = async () => {
      try {
        setLoading(true);
        // Get active banners and filter for middle section
        const activeBanners = await bannerService.getActiveBanners();
        
        // Filter banners suitable for middle banner (you can add specific criteria)
        const middleBanners = activeBanners.filter(banner => 
          banner.title && banner.title.length > 0
        ).slice(0, 1); // Take only first banner for middle section
        
        setBanners(middleBanners);
      } catch (err: any) {
        setError(err.message);
        console.error('Failed to fetch middle banners:', err);
        
        // Fallback content if API fails
        setBanners([{
          _id: 'fallback-middle',
          title: 'Bộ Sưu Tập Đặc Biệt',
          image: '/images/anh4.jpg',
          link: '/products',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }]);
      } finally {
        setLoading(false);
      }
    };

    fetchMiddleBanners();
  }, []);

  if (loading) {
    return (
      <div className={styles.middleBanner}>
        <LoadingSpinner text="Đang tải banner..." />
      </div>
    );
  }

  if (error || banners.length === 0) {
    // Fallback design with improved UI
    return (
      <div className={styles.middleBanner}>
        <div className={styles.bannerContent}>
          <div className={styles.textSection}>
            <div className={styles.badge}>✨ ĐẶC BIỆT</div>
            <h2 className={styles.title}>Bộ Sưu Tập Đặc Biệt</h2>
            <p className={styles.subtitle}>
              Khám phá những thiết kế độc đáo và phong cách hiện đại nhất
            </p>
            <Link href="/products" className={styles.ctaButton}>
              <span>Xem Ngay</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path 
                  d="M5 12h14M12 5l7 7-7 7" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>
          <div className={styles.imageSection}>
            <div className={styles.imageWrapper}>
              <img 
                src="/images/anh4.jpg" 
                alt="Special Collection"
                className={styles.bannerImage}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/images/anh1.jpg";
                }}
              />
              <div className={styles.imageOverlay}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const banner = banners[0];

  return (
    <div className={styles.middleBanner}>
      <div className={styles.bannerContent}>
        <div className={styles.textSection}>
          <div className={styles.badge}>✨ ĐẶC BIỆT</div>
          <h2 className={styles.title}>{banner.title}</h2>
          <p className={styles.subtitle}>
            Khám phá những thiết kế độc đáo và phong cách hiện đại nhất
          </p>
          <Link href={banner.link} className={styles.ctaButton}>
            <span>Xem Ngay</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path 
                d="M5 12h14M12 5l7 7-7 7" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
        <div className={styles.imageSection}>
          <div className={styles.imageWrapper}>
            <img 
              src={banner.image} 
              alt={banner.title}
              className={styles.bannerImage}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/images/anh4.jpg";
              }}
            />
            <div className={styles.imageOverlay}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
