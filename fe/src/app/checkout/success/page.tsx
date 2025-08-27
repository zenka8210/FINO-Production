'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, useCart } from '@/hooks';
import { Button, PageHeader, LoadingSpinner } from '@/app/components/ui';
import { FaCheckCircle, FaShoppingBag, FaHome, FaReceipt } from 'react-icons/fa';
import { formatCurrency } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { orderService } from '@/services/orderService';
import { OrderWithRefs } from '@/types';
import styles from './CheckoutSuccessPage.module.css';

function CheckoutSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const { clearCart } = useCart();
  const [orderDetails, setOrderDetails] = useState<OrderWithRefs | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const orderId = searchParams.get('orderId');
  const orderCode = searchParams.get('orderCode'); // From VNPay/MoMo callback
  const transactionId = searchParams.get('transactionId'); // VNPay/MoMo transaction ID
  const paymentMethod = searchParams.get('paymentMethod'); // 'vnpay' or 'momo' if came from payment gateway
  const paymentType = searchParams.get('payment'); // Legacy 'vnpay' support
  const paymentStatus = searchParams.get('status'); // 'success' if payment successful
  const amount = searchParams.get('amount'); // Amount from payment callback

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
  }, [user, router, authLoading]);

  // Load order details - memoized to prevent unnecessary re-renders
  const loadOrderDetails = useCallback(async () => {
    const finalOrderId = orderCode || orderId; // Prefer orderCode from VNPay callback
    if (!finalOrderId || !user) return;

    try {
      setIsLoading(true);
      
      console.log('🔍 SUCCESS PAGE - Loading order details for ID:', finalOrderId);
      
      // Check if the ID looks like an ObjectId (24 hex chars) or orderCode (starts with FINO)
      let order;
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(finalOrderId);
      const isOrderCode = finalOrderId.startsWith('FINO');
      
      if (isOrderCode) {
        console.log('🔍 SUCCESS PAGE - Getting order by orderCode:', finalOrderId);
        order = await orderService.getOrderByCode(finalOrderId);
      } else if (isObjectId) {
        console.log('🔍 SUCCESS PAGE - Getting order by ObjectId:', finalOrderId);
        order = await orderService.getOrderById(finalOrderId);
      } else {
        throw new Error('Invalid order identifier format');
      }
      
      console.log('✅ Order details loaded:', order);
      
      // Recalculate discount if voucher exists but discountAmount is 0
      if (order.voucher && order.discountAmount === 0 && order.voucher.discountPercent > 0 && order.total) {
        console.log('🔄 Recalculating discount for voucher:', order.voucher.code);
        
        const calculatedDiscount = Math.floor(order.total * (order.voucher.discountPercent / 100));
        const maxDiscount = order.voucher.maximumDiscountAmount || 200000;
        const finalDiscount = Math.min(calculatedDiscount, maxDiscount);
        
        // Update order with correct calculations
        order.discountAmount = finalDiscount;
        order.finalTotal = order.total - finalDiscount + (order.shippingFee || 0);
        
        console.log('✅ Corrected calculations:', {
          originalTotal: order.total,
          calculatedDiscount: calculatedDiscount,
          maxDiscount: maxDiscount,
          finalDiscount: finalDiscount,
          correctedFinalTotal: order.finalTotal
        });
      }
      
      setOrderDetails(order);
      
      // Clear cart logic for different payment methods
      const paymentMethod = searchParams.get('paymentMethod') || '';
      const fromVNPayProcessing = paymentMethod === 'vnpay'; // VNPay has processing page that clears cart
      const fromMoMoCallback = paymentMethod === 'momo'; // MoMo redirects directly here
      
      if (!fromVNPayProcessing) {
        // Clear cart for COD orders and MoMo orders (backend should also clear for MoMo success)
        console.log(`🧹 Clearing cart after successful ${paymentMethod || 'COD'} order...`);
        try {
          // Clear cart with success message for non-VNPay orders
          const clearMessage = fromMoMoCallback ? 'Thanh toán MoMo thành công!' : '';
          clearCart(clearMessage);
          console.log(`✅ Cart cleared on success page for ${paymentMethod || 'COD'}`);
        } catch (cartError) {
          console.warn('⚠️ Cart clear failed but order was successful:', cartError);
        }
      } else {
        console.log('🔍 VNPay payment detected - cart already cleared in processing page');
      }
    } catch (error: any) {
      console.error('❌ Error loading order details:', error);
      
      // Handle specific error cases
      if (error.message.includes('không có quyền') || error.message.includes('forbidden')) {
        console.error('🚫 Access denied - redirecting to orders page');
        router.push('/profile?section=orders');
      } else if (error.message.includes('Không tìm thấy')) {
        console.error('📭 Order not found - redirecting to orders page');
        router.push('/profile?section=orders');
      }
      // For other errors, stay on page but show error state
    } finally {
      setIsLoading(false);
    }
  }, [orderCode, orderId, user, router]);

  useEffect(() => {
    loadOrderDetails();
  }, [loadOrderDetails]);

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="container">
        <div className={styles.pageContainer}>
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  // No order found
  if (!orderDetails) {
    return (
      <div className="container">
        <div className={styles.pageContainer}>
          <div className={styles.errorState}>
            <FaReceipt className={styles.errorIcon} />
            <h2>Không tìm thấy đơn hàng</h2>
            <p>Đơn hàng không tồn tại hoặc đã bị xóa</p>
            <div className={styles.errorActions}>
              <Button onClick={() => router.push('/')}>
                Về trang chủ
              </Button>
              <Button variant="outline" onClick={() => router.push('/profile?section=orders')}>
                Xem đơn hàng
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className={styles.pageContainer}>
        <PageHeader
          title="Đặt hàng thành công"
          subtitle="Cảm ơn bạn đã tin tưởng và mua hàng tại cửa hàng"
          icon={FaCheckCircle}
          breadcrumbs={[
            { label: 'Trang chủ', href: '/' },
            { label: 'Giỏ hàng', href: '/cart' },
            { label: 'Thanh toán', href: '/checkout' },
            { label: 'Thành công', href: '/checkout/success' }
          ]}
        />

        <div className={styles.successContainer}>
          {/* Success Message */}
          <div className={styles.successMessage}>
            <div className={styles.successIcon}>
              <FaCheckCircle />
            </div>
            <h1 className={styles.successTitle}>Đặt hàng thành công!</h1>
            <p className={styles.successSubtitle}>
              Đơn hàng #{orderDetails.orderCode} đã được tạo thành công
            </p>
            <div className={styles.orderMeta}>
              <span>Tổng tiền: <strong>{formatCurrency(orderDetails.finalTotal || 0)}</strong></span>
              <span>Phương thức: <strong>
                {orderDetails.paymentMethod?.method === 'COD' 
                  ? 'Thanh toán khi nhận hàng' 
                  : orderDetails.paymentMethod?.method === 'VNPay'
                    ? 'VNPay (Thanh toán online)'
                    : orderDetails.paymentMethod?.method === 'Momo'
                      ? 'MoMo (Thanh toán online)'
                      : orderDetails.paymentMethod?.method}
              </strong></span>
              {(paymentMethod === 'vnpay' || paymentType === 'vnpay') && paymentStatus === 'success' && (
                <span className={styles.vnpaySuccess}>
                  <FaCheckCircle />
                  Thanh toán VNPay thành công
                </span>
              )}
              {paymentMethod === 'momo' && paymentStatus === 'success' && (
                <span className={styles.momoSuccess}>
                  <FaCheckCircle />
                  Thanh toán MoMo thành công
                </span>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className={styles.orderSummary}>
            <h3 className={styles.summaryTitle}>Chi tiết đơn hàng</h3>
            <div className={styles.summaryBreakdown}>
              <div className={styles.summaryRow}>
                <span>Tạm tính:</span>
                <span>{formatCurrency((orderDetails.total || 0))}</span>
              </div>
              {orderDetails.voucher && orderDetails.discountAmount > 0 && (
                <div className={styles.summaryRow}>
                  <span>Giảm giá ({orderDetails.voucher.code}):</span>
                  <span className={styles.discount}>-{formatCurrency(orderDetails.discountAmount)}</span>
                </div>
              )}
              <div className={styles.summaryRow}>
                <span>Phí vận chuyển:</span>
                <span>{formatCurrency(orderDetails.shippingFee || 0)}</span>
              </div>
              <div className={styles.summaryRow + ' ' + styles.summaryTotal}>
                <span><strong>Tổng cộng:</strong></span>
                <span><strong>{formatCurrency(orderDetails.finalTotal || 0)}</strong></span>
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className={styles.orderDetails}>
            <div className={styles.detailsGrid}>
              {/* Shipping Address */}
              <div className={styles.detailsCard}>
                <h3 className={styles.cardTitle}>Địa chỉ giao hàng</h3>
                <div className={styles.addressInfo}>
                  <p className={styles.addressName}>
                    {orderDetails.address?.fullName} - {orderDetails.address?.phone}
                  </p>
                  <p className={styles.addressText}>
                    {orderDetails.address?.addressLine}, {orderDetails.address?.ward}, {orderDetails.address?.district}, {orderDetails.address?.city}
                  </p>
                </div>
              </div>

              {/* Order Items */}
              <div className={styles.detailsCard}>
                <h3 className={styles.cardTitle}>Sản phẩm đã đặt</h3>
                <div className={styles.orderItems}>
                  {orderDetails.items?.map((item: any, index: number) => (
                    <div key={index} className={styles.orderItem}>
                      <div className={styles.itemImage}>
                        <Image
                          src={item.productVariant?.product?.images?.[0] || '/images/placeholder.jpg'}
                          alt={item.productVariant?.product?.name || 'Product'}
                          width={60}
                          height={60}
                          className={styles.productImage}
                        />
                      </div>
                      <div className={styles.itemDetails}>
                        <h4 className={styles.itemName}>{item.productVariant?.product?.name}</h4>
                        <div className={styles.itemMeta}>
                          <span>Số lượng: {item.quantity}</span>
                          <span>Đơn giá: {formatCurrency(item.price)}</span>
                        </div>
                      </div>
                      <div className={styles.itemTotal}>
                        {formatCurrency((item.price || 0) * (item.quantity || 0))}
                      </div>
                    </div>
                  )) || []}
                </div>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className={styles.nextSteps}>
            <h3 className={styles.stepsTitle}>Bước tiếp theo</h3>
            <div className={styles.stepsList}>
              <div className={styles.step}>
                <div className={styles.stepNumber}>1</div>
                <div className={styles.stepContent}>
                  <h4>Chờ xác nhận</h4>
                  <p>Chúng tôi sẽ liên hệ xác nhận đơn hàng trong vòng 24h</p>
                </div>
              </div>
              <div className={styles.step}>
                <div className={styles.stepNumber}>2</div>
                <div className={styles.stepContent}>
                  <h4>Chuẩn bị hàng</h4>
                  <p>Đơn hàng sẽ được đóng gói và chuẩn bị giao</p>
                </div>
              </div>
              <div className={styles.step}>
                <div className={styles.stepNumber}>3</div>
                <div className={styles.stepContent}>
                  <h4>Giao hàng</h4>
                  <p>Sản phẩm sẽ được giao đến địa chỉ bạn đã cung cấp</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className={styles.actionButtons}>
            <Button
              onClick={() => {
                // Only add fromPayment=true for payment gateway payments, not for COD
                const fromPaymentGateway = ['vnpay', 'momo'].includes(searchParams.get('paymentMethod') || '');
                const targetUrl = orderDetails?._id 
                  ? `/orders/${orderDetails._id}${fromPaymentGateway ? '?fromPayment=true' : ''}`
                  : '/profile?section=orders';
                router.push(targetUrl);
              }}
              className={styles.primaryButton}
            >
              <FaShoppingBag />
              Xem đơn hàng
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
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
