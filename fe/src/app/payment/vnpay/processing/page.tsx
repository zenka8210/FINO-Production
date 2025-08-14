'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { vnpayService } from '@/services/vnpayService';
import { useCart } from '@/hooks';
import styles from './VNPayProcessing.module.css';
import { LoadingSpinner } from '@/app/components/ui';

// Global flag to prevent duplicate cart clearing across component re-renders
let cartClearInProgress = false;

function VNPayProcessingPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { clearCart } = useCart();
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Đang xử lý kết quả thanh toán...');
  const processedRef = useRef(false);
  const cartClearedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) {
      console.log('🔍 Processing already done, skipping...');
      return; // Prevent duplicate processing
    }
    
    const processPayment = async () => {
      console.log('🔄 Starting VNPay payment processing...');
      try {
        processedRef.current = true;
        
        // Parse callback parameters
        const callbackData = vnpayService.parseCallbackParams(searchParams);
        
        console.log('🔔 VNPay processing payment:', callbackData);
        setMessage('Đang xác minh thông tin thanh toán...');

        // Small delay for better UX
        await new Promise(resolve => setTimeout(resolve, 1500));

        if (callbackData.orderId) {
          // Process VNPay callback with backend to trigger email and finalize payment
          try {
            setMessage('Đang xác nhận thanh toán...');
            
            // Call backend callback endpoint to process payment and send email
            const response = await fetch('/api/payment/vnpay/callback', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(callbackData)
            });
            
            if (response.ok) {
              console.log('✅ Backend callback processed successfully');
            } else {
              console.warn('⚠️ Backend callback failed, but VNPay payment is still valid');
            }
          } catch (callbackError) {
            console.warn('⚠️ Backend callback failed, but VNPay payment is still valid:', callbackError);
            // Continue - VNPay payment is valid even if backend callback fails
          }
          
          // VNPay callback data is reliable for determining success
          const isSuccess = callbackData.isSuccess;
          
          setMessage(isSuccess ? 'Thanh toán thành công!' : 'Thanh toán thất bại');
          setStatus(isSuccess ? 'success' : 'failed');

          // Wait a bit before redirect
          await new Promise(resolve => setTimeout(resolve, 1000));

          if (isSuccess) {
            // Success - clear cart and redirect to success page
            if (!cartClearedRef.current && !cartClearInProgress) {
              console.log('🧹 Clearing cart after VNPay success...');
              cartClearedRef.current = true;
              cartClearInProgress = true;
              
              try {
                clearCart('Thanh toán thành công!');
                console.log('✅ Cart cleared after VNPay success');
              } finally {
                // Reset flag after a delay to allow for potential re-renders
                setTimeout(() => {
                  cartClearInProgress = false;
                }, 2000);
              }
            }
            
            const params = new URLSearchParams({
              orderId: callbackData.orderId,
              amount: callbackData.amount?.toString() || '0',
              transactionId: callbackData.transactionId || '',
              paymentMethod: 'vnpay'
            });
            router.replace(`/checkout/success?${params.toString()}`);
          } else {
            // Failed - redirect to fail page
            const params = new URLSearchParams({
              orderId: callbackData.orderId,
              message: vnpayService.getResponseCodeMessage(callbackData.responseCode || '99'),
              responseCode: callbackData.responseCode || '99'
            });
            router.replace(`/checkout/fail?${params.toString()}`);
          }
        } else {
          // No order ID - error
          setStatus('error');
          setMessage('Không tìm thấy thông tin đơn hàng');
          
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const params = new URLSearchParams({
            message: 'Không tìm thấy thông tin đơn hàng'
          });
          router.replace(`/checkout/error?${params.toString()}`);
        }
      } catch (error) {
        console.error('❌ Error processing VNPay payment:', error);
        setStatus('error');
        setMessage('Có lỗi xảy ra khi xử lý thanh toán');
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const params = new URLSearchParams({
          message: 'Có lỗi xảy ra khi xử lý thanh toán'
        });
        router.replace(`/checkout/error?${params.toString()}`);
      }
    };

    processPayment();
  }, [searchParams, router, clearCart]);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={`${styles.icon} ${styles[status]}`}>
            {status === 'processing' && (
              <div className={styles.spinner}>
                <svg viewBox="0 0 50 50">
                  <circle
                    cx="25"
                    cy="25"
                    r="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray="31.416"
                    strokeDashoffset="31.416"
                  >
                    <animate
                      attributeName="stroke-dasharray"
                      dur="2s"
                      values="0 31.416;15.708 15.708;0 31.416"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="stroke-dashoffset"
                      dur="2s"
                      values="0;-15.708;-31.416"
                      repeatCount="indefinite"
                    />
                  </circle>
                </svg>
              </div>
            )}
            {status === 'success' && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20,6 9,17 4,12"></polyline>
              </svg>
            )}
            {status === 'failed' && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            )}
            {status === 'error' && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="7.86,2 16.14,2 22,15.86 2,15.86"></polygon>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            )}
          </div>
          <h1 className={styles.title}>
            {status === 'processing' && 'Đang xử lý thanh toán'}
            {status === 'success' && 'Thanh toán thành công'}
            {status === 'failed' && 'Thanh toán thất bại'}
            {status === 'error' && 'Có lỗi xảy ra'}
          </h1>
        </div>
        
        <div className={styles.content}>
          <p className={styles.message}>{message}</p>
          
          {status === 'processing' && (
            <div className={styles.steps}>
              <div className={styles.step}>
                <div className={styles.stepIcon}>1</div>
                <span>Nhận thông tin từ VNPay</span>
              </div>
              <div className={styles.step}>
                <div className={styles.stepIcon}>2</div>
                <span>Xác minh giao dịch</span>
              </div>
              <div className={styles.step}>
                <div className={styles.stepIcon}>3</div>
                <span>Cập nhật đơn hàng</span>
              </div>
            </div>
          )}
        </div>
        
        <div className={styles.footer}>
          <p className={styles.note}>
            Vui lòng không đóng trang này cho đến khi quá trình hoàn tất
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VNPayProcessingPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <VNPayProcessingPageContent />
    </Suspense>
  );
}
