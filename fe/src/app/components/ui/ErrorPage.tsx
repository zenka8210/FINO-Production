'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui';
import styles from './ErrorPage.module.css';

interface ErrorPageProps {
  title?: string;
  message?: string;
  showHomeButton?: boolean;
  showRefreshButton?: boolean;
  showBackButton?: boolean;
  errorCode?: string;
  customActions?: React.ReactNode;
  className?: string;
}

export default function ErrorPage({
  title = "Oops! Có gì đó không đúng",
  message = "Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển. Đừng lo lắng, chúng tôi sẽ giúp bạn tìm lại đúng hướng!",
  showHomeButton = true,
  showRefreshButton = true,
  showBackButton = true,
  errorCode = "404",
  customActions,
  className = ""
}: ErrorPageProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleGoHome = () => {
    router.push('/');
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  if (!mounted) return null;

  return (
    <div className={`${styles.errorPage} ${className}`}>
      <div className={styles.container}>
        <div className={styles.content}>
          {/* Animated Error Code */}
          <div className={styles.errorCodeContainer}>
            <div className={styles.errorCode}>
              {errorCode.split('').map((digit, index) => (
                <span
                  key={index}
                  className={styles.digit}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {digit}
                </span>
              ))}
            </div>
            <div className={styles.errorCodeShadow}>
              {errorCode.split('').map((digit, index) => (
                <span key={index} className={styles.digitShadow}>
                  {digit}
                </span>
              ))}
            </div>
          </div>

          {/* Floating Elements Animation */}
          <div className={styles.floatingElements}>
            <div className={styles.circle}></div>
            <div className={styles.square}></div>
            <div className={styles.triangle}></div>
            <div className={styles.diamond}></div>
          </div>

          {/* Error Message */}
          <div className={styles.messageContainer}>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.message}>{message}</p>
          </div>

          {/* Action Buttons */}
          <div className={styles.actions}>
            {customActions || (
              <>
                {showHomeButton && (
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleGoHome}
                    className={styles.actionButton}
                  >
                    🏠 Về trang chủ
                  </Button>
                )}
                
                {showBackButton && (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleGoBack}
                    className={styles.actionButton}
                  >
                    ← Quay lại
                  </Button>
                )}

                {showRefreshButton && (
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={handleRefresh}
                    className={styles.actionButton}
                  >
                    🔄 Tải lại trang
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Search Suggestion */}
          <div className={styles.suggestion}>
            <p>💡 Gợi ý: Bạn có thể tìm kiếm sản phẩm hoặc danh mục mong muốn từ trang chủ</p>
          </div>
        </div>

        {/* Animated Background Pattern */}
        <div className={styles.backgroundPattern}>
          <div className={styles.wave}></div>
          <div className={styles.wave}></div>
          <div className={styles.wave}></div>
        </div>
      </div>
    </div>
  );
}
