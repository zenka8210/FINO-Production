'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/app/components/ui';
import { FaExclamationTriangle, FaHome, FaShoppingCart } from 'react-icons/fa';
import styles from './CheckoutErrorPage.module.css';

function CheckoutErrorPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    // Get error message from URL params
    const message = searchParams.get('message');
    if (message) {
      setErrorMessage(decodeURIComponent(message));
    } else {
      setErrorMessage('Thanh toán không thành công');
    }
  }, [searchParams]);

  const handleBackToCart = () => {
    router.push('/cart');
  };

  const handleBackToHome = () => {
    router.push('/');
  };

  return (
    <div className="container">
      <div className={styles.pageContainer}>
        <div className={styles.errorContainer}>
          <div className={styles.errorIcon}>
            <FaExclamationTriangle />
          </div>
          
          <h1 className={styles.title}>Thanh toán thất bại</h1>
          
          <div className={styles.message}>
            <p>{errorMessage}</p>
          </div>

          <div className={styles.details}>
            <h3>Có thể do các nguyên nhân sau:</h3>
            <ul>
              <li>Thanh toán bị hủy bởi người dùng</li>
              <li>Thông tin thanh toán không chính xác</li>
              <li>Tài khoản không đủ số dư</li>
              <li>Lỗi kết nối với cổng thanh toán</li>
            </ul>
          </div>

          <div className={styles.actions}>
            <Button 
              variant="primary" 
              onClick={handleBackToCart}
              className={styles.primaryButton}
            >
              <FaShoppingCart />
              Quay lại giỏ hàng
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleBackToHome}
              className={styles.secondaryButton}
            >
              <FaHome />
              Về trang chủ
            </Button>
          </div>

          <div className={styles.support}>
            <p>
              Nếu bạn cần hỗ trợ, vui lòng liên hệ với chúng tôi qua email hoặc hotline.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">Đang tải...</p>
        </div>
      </div>
    }>
      <CheckoutErrorPageContent />
    </Suspense>
  );
}
