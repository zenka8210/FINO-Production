'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks';
import { Button, PageHeader } from '@/app/components/ui';
import { FaExclamationTriangle, FaShoppingCart, FaHome, FaArrowLeft, FaPhoneAlt } from 'react-icons/fa';
import Link from 'next/link';
import styles from './CheckoutFailPage.module.css';

export default function CheckoutFailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  
  const errorMessage = searchParams.get('error') || 'Có lỗi xảy ra trong quá trình thanh toán';

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
  }, [user, router, authLoading]);

  // Loading state
  if (authLoading) {
    return (
      <div className="container">
        <div className={styles.pageContainer}>
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Đang xác thực...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className={styles.pageContainer}>
        <PageHeader
          title="Thanh toán thất bại"
          subtitle="Đã có lỗi xảy ra trong quá trình xử lý đơn hàng"
          icon={FaExclamationTriangle}
          breadcrumbs={[
            { label: 'Trang chủ', href: '/' },
            { label: 'Giỏ hàng', href: '/cart' },
            { label: 'Thanh toán', href: '/checkout' },
            { label: 'Thất bại', href: '/checkout/fail' }
          ]}
        />

        <div className={styles.failContainer}>
          {/* Fail Message */}
          <div className={styles.failMessage}>
            <div className={styles.failIcon}>
              <FaExclamationTriangle />
            </div>
            <h1 className={styles.failTitle}>Thanh toán thất bại!</h1>
            <p className={styles.failSubtitle}>
              Đơn hàng của bạn chưa được xử lý thành công
            </p>
            <div className={styles.errorDetails}>
              <div className={styles.errorBox}>
                <h4>Chi tiết lỗi:</h4>
                <p>{errorMessage}</p>
              </div>
            </div>
          </div>

          {/* Possible Reasons */}
          <div className={styles.reasonsSection}>
            <h3 className={styles.reasonsTitle}>Nguyên nhân có thể gây ra lỗi</h3>
            <div className={styles.reasonsList}>
              <div className={styles.reason}>
                <div className={styles.reasonIcon}>💳</div>
                <div className={styles.reasonContent}>
                  <h4>Thông tin thanh toán</h4>
                  <p>Thông tin thẻ không chính xác hoặc thẻ không đủ số dư</p>
                </div>
              </div>
              <div className={styles.reason}>
                <div className={styles.reasonIcon}>📦</div>
                <div className={styles.reasonContent}>
                  <h4>Sản phẩm hết hàng</h4>
                  <p>Một số sản phẩm trong giỏ hàng có thể đã hết hàng</p>
                </div>
              </div>
              <div className={styles.reason}>
                <div className={styles.reasonIcon}>🌐</div>
                <div className={styles.reasonContent}>
                  <h4>Kết nối mạng</h4>
                  <p>Kết nối internet không ổn định trong quá trình xử lý</p>
                </div>
              </div>
              <div className={styles.reason}>
                <div className={styles.reasonIcon}>⏰</div>
                <div className={styles.reasonContent}>
                  <h4>Phiên làm việc hết hạn</h4>
                  <p>Thời gian xử lý quá lâu, phiên làm việc đã hết hạn</p>
                </div>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className={styles.nextSteps}>
            <h3 className={styles.stepsTitle}>Bạn có thể thử</h3>
            <div className={styles.stepsList}>
              <div className={styles.step}>
                <div className={styles.stepNumber}>1</div>
                <div className={styles.stepContent}>
                  <h4>Kiểm tra lại giỏ hàng</h4>
                  <p>Đảm bảo các sản phẩm vẫn còn hàng và thông tin chính xác</p>
                </div>
              </div>
              <div className={styles.step}>
                <div className={styles.stepNumber}>2</div>
                <div className={styles.stepContent}>
                  <h4>Thử lại thanh toán</h4>
                  <p>Kiểm tra thông tin thẻ và thử thanh toán lại</p>
                </div>
              </div>
              <div className={styles.step}>
                <div className={styles.stepNumber}>3</div>
                <div className={styles.stepContent}>
                  <h4>Liên hệ hỗ trợ</h4>
                  <p>Nếu vẫn gặp lỗi, hãy liên hệ với đội ngũ hỗ trợ</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className={styles.actionButtons}>
            <Button
              onClick={() => router.push('/checkout')}
              className={styles.primaryButton}
            >
              <FaArrowLeft />
              Thử lại thanh toán
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/cart')}
              className={styles.secondaryButton}
            >
              <FaShoppingCart />
              Xem lại giỏ hàng
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/products')}
              className={styles.secondaryButton}
            >
              Tiếp tục mua sắm
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/')}
              className={styles.homeButton}
            >
              <FaHome />
              Về trang chủ
            </Button>
          </div>

          {/* Contact Support */}
          <div className={styles.supportSection}>
            <div className={styles.supportCard}>
              <div className={styles.supportIcon}>
                <FaPhoneAlt />
              </div>
              <div className={styles.supportContent}>
                <h4>Cần hỗ trợ?</h4>
                <p>Liên hệ với chúng tôi để được hỗ trợ nhanh chóng</p>
                <div className={styles.contactInfo}>
                  <span>📞 Hotline: 1900-xxxx</span>
                  <span>📧 Email: support@example.com</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
