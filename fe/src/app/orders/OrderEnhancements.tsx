'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { OrderWithRefs } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { Button, Modal } from '@/app/components/ui';
import { 
  FaClock, 
  FaCheckCircle, 
  FaTruck, 
  FaTimesCircle,
  FaEye,
  FaDownload,
  FaUndo,
  FaStar,
  FaBox,
  FaShippingFast,
  FaMoneyBillWave,
  FaPhone,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaReceipt,
  FaHistory,
  FaChartLine,
  FaGift
} from 'react-icons/fa';
import styles from './OrderEnhancements.module.css';

interface EnhancedOrderCardProps {
  order: OrderWithRefs;
  onCancelOrder?: (orderId: string) => Promise<void>;
  onReorder?: (orderId: string) => Promise<void>;
  onDownloadInvoice?: (orderId: string) => void;
}

export function EnhancedOrderCard({ 
  order, 
  onCancelOrder,
  onReorder,
  onDownloadInvoice 
}: EnhancedOrderCardProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Enhanced order analytics
  const orderAnalytics = useMemo(() => {
    const totalItems = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
    const avgItemPrice = totalItems > 0 ? (order.finalTotal || 0) / totalItems : 0;
    const hasDiscount = order.discountAmount && order.discountAmount > 0;
    const shippingCost = order.shippingFee || 0;
    
    return {
      totalItems,
      avgItemPrice,
      hasDiscount,
      shippingCost,
      subtotal: (order.finalTotal || 0) - shippingCost + (order.discountAmount || 0)
    };
  }, [order]);

  // Get status configuration
  const getStatusConfig = (status: string) => {
    const statusConfig = {
      pending: { 
        icon: <FaClock />, 
        label: 'Chờ xác nhận', 
        className: styles.statusPending,
        color: '#f59e0b',
        bgColor: '#fef3c7'
      },
      processing: { 
        icon: <FaBox />, 
        label: 'Đang xử lý', 
        className: styles.statusProcessing,
        color: '#3b82f6',
        bgColor: '#dbeafe'
      },
      shipped: { 
        icon: <FaShippingFast />, 
        label: 'Đã gửi hàng', 
        className: styles.statusShipped,
        color: '#8b5cf6',
        bgColor: '#e9d5ff'
      },
      delivered: { 
        icon: <FaCheckCircle />, 
        label: 'Đã giao', 
        className: styles.statusDelivered,
        color: '#10b981',
        bgColor: '#d1fae5'
      },
      cancelled: { 
        icon: <FaTimesCircle />, 
        label: 'Đã hủy', 
        className: styles.statusCancelled,
        color: '#ef4444',
        bgColor: '#fee2e2'
      }
    };

    return statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  };

  const statusConfig = getStatusConfig(order.status);

  // Get payment status
  const getPaymentStatusConfig = (paymentStatus: string) => {
    const paymentConfig = {
      paid: { label: 'Đã thanh toán', color: '#10b981', icon: <FaCheckCircle /> },
      pending: { label: 'Chờ thanh toán', color: '#f59e0b', icon: <FaClock /> },
      failed: { label: 'Thanh toán thất bại', color: '#ef4444', icon: <FaTimesCircle /> },
      cancelled: { label: 'Đã hủy', color: '#6b7280', icon: <FaTimesCircle /> }
    };

    return paymentConfig[paymentStatus as keyof typeof paymentConfig] || paymentConfig.pending;
  };

  const paymentConfig = getPaymentStatusConfig(order.paymentStatus || 'pending');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCancelOrder = async () => {
    if (!onCancelOrder || isProcessing) return;

    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn hủy đơn hàng #${order.orderCode}?`
    );

    if (confirmed) {
      try {
        setIsProcessing(true);
        await onCancelOrder(order._id);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleReorder = async () => {
    if (!onReorder || isProcessing) return;

    try {
      setIsProcessing(true);
      await onReorder(order._id);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadInvoice = () => {
    if (onDownloadInvoice) {
      onDownloadInvoice(order._id);
    }
  };

  const canCancelOrder = order.status === 'pending' || order.status === 'processing';
  const canReorder = order.status === 'delivered' || order.status === 'cancelled';
  const canDownload = order.status === 'delivered' && order.paymentStatus === 'paid';

  return (
    <div className={styles.enhancedOrderCard}>
      {/* Header with status and info */}
      <div className={styles.orderHeader}>
        <div className={styles.orderMainInfo}>
          <div className={styles.orderCodeSection}>
            <h4 className={styles.orderCode}>#{order.orderCode}</h4>
            <div className={styles.orderMeta}>
              <span className={styles.orderDate}>
                <FaClock className={styles.metaIcon} />
                {formatDate(order.createdAt)}
              </span>
            </div>
          </div>

          <div className={styles.statusSection}>
            <div 
              className={`${styles.orderStatus} ${statusConfig.className}`}
              style={{ 
                color: statusConfig.color,
                backgroundColor: statusConfig.bgColor
              }}
            >
              <span className={styles.statusIcon}>{statusConfig.icon}</span>
              {statusConfig.label}
            </div>
            
            <div 
              className={styles.paymentStatus}
              style={{ color: paymentConfig.color }}
            >
              <span className={styles.statusIcon}>{paymentConfig.icon}</span>
              {paymentConfig.label}
            </div>
          </div>
        </div>

        <div className={styles.orderTotal}>
          <span className={styles.totalLabel}>Tổng tiền</span>
          <span className={styles.totalAmount}>
            {formatCurrency(order.finalTotal || 0)}
          </span>
        </div>
      </div>

      {/* Enhanced Order Information */}
      <div className={styles.orderInfoGrid}>
        <div className={styles.orderItems}>
          <h5 className={styles.sectionTitle}>
            <FaBox className={styles.titleIcon} />
            Sản phẩm ({orderAnalytics.totalItems} món)
          </h5>
          <div className={styles.itemsList}>
            {order.items?.slice(0, 3).map((item: any, index: number) => (
              <div key={index} className={styles.orderItemPreview}>
                <div className={styles.itemImage}>
                  {item.productVariant?.product?.images?.[0] ? (
                    <img 
                      src={item.productVariant.product.images[0]} 
                      alt={item.productVariant?.product?.name}
                      className={styles.productThumbnail}
                    />
                  ) : (
                    <div className={styles.noImagePlaceholder}>
                      <FaBox />
                    </div>
                  )}
                </div>
                
                <div className={styles.itemDetails}>
                  <div className={styles.itemName}>
                    {item.productVariant?.product?.name || item.productName}
                  </div>
                  <div className={styles.itemVariant}>
                    {item.productVariant?.color?.name && `${item.productVariant.color.name}`}
                    {item.productVariant?.color?.name && item.productVariant?.size?.name && ' • '}
                    {item.productVariant?.size?.name && `${item.productVariant.size.name}`}
                  </div>
                  <div className={styles.itemQuantityPrice}>
                    SL: {item.quantity} • {formatCurrency(item.price)}
                  </div>
                </div>
              </div>
            ))}
            
            {(order.items?.length || 0) > 3 && (
              <div className={styles.moreItemsIndicator}>
                <FaGift className={styles.moreIcon} />
                +{(order.items?.length || 0) - 3} sản phẩm khác
              </div>
            )}
          </div>
        </div>

        <div className={styles.orderMeta}>
          <h5 className={styles.sectionTitle}>
            <FaCalendarAlt className={styles.titleIcon} />
            Thông tin đơn hàng
          </h5>
          <div className={styles.metaList}>
            <div className={styles.metaItem}>
              <FaReceipt className={styles.metaIcon} />
              <span>Mã đơn: #{order.orderCode}</span>
            </div>
            <div className={styles.metaItem}>
              <FaCalendarAlt className={styles.metaIcon} />
              <span>Ngày đặt: {formatDate(order.createdAt)}</span>
            </div>
            {(order as any).shippingAddress && (
              <div className={styles.metaItem}>
                <FaMapMarkerAlt className={styles.metaIcon} />
                <span>{(order as any).shippingAddress.fullAddress || 'Địa chỉ giao hàng'}</span>
              </div>
            )}
            {(order as any).customerInfo?.phone && (
              <div className={styles.metaItem}>
                <FaPhone className={styles.metaIcon} />
                <span>{(order as any).customerInfo.phone}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Order Summary */}
      <div className={styles.orderSummary}>
        <div className={styles.summaryHeader}>
          <FaChartLine className={styles.summaryIcon} />
          <span>Chi tiết thanh toán</span>
        </div>
        
        <div className={styles.summaryContent}>
          <div className={styles.summaryRow}>
            <span>Tạm tính ({orderAnalytics.totalItems} sản phẩm):</span>
            <span>{formatCurrency(orderAnalytics.subtotal)}</span>
          </div>
          
          {orderAnalytics.hasDiscount && (
            <div className={styles.summaryRow}>
              <span>Giảm giá:</span>
              <span className={styles.discount}>-{formatCurrency(order.discountAmount || 0)}</span>
            </div>
          )}
          
          <div className={styles.summaryRow}>
            <span>Phí vận chuyển:</span>
            <span>{orderAnalytics.shippingCost > 0 ? formatCurrency(orderAnalytics.shippingCost) : 'Miễn phí'}</span>
          </div>
          
          <div className={`${styles.summaryRow} ${styles.totalRow}`}>
            <span>Tổng cộng:</span>
            <span>{formatCurrency(order.finalTotal || 0)}</span>
          </div>
          
          {orderAnalytics.totalItems > 0 && (
            <div className={styles.avgPrice}>
              Giá trung bình: {formatCurrency(orderAnalytics.avgItemPrice)}/sản phẩm
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Action Buttons */}
      <div className={styles.orderActions}>
        <div className={styles.primaryActions}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/orders/${order._id}`)}
            className={styles.viewDetailBtn}
          >
            <FaEye />
            Xem chi tiết
          </Button>

          {order.status === 'shipped' || order.status === 'processing' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTrackingModal(true)}
              className={styles.trackingBtn}
            >
              <FaTruck />
              Theo dõi
            </Button>
          ) : null}

          {canDownload && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReceiptModal(true)}
              className={styles.receiptBtn}
            >
              <FaReceipt />
              Hóa đơn
            </Button>
          )}
        </div>

        <div className={styles.secondaryActions}>
          {canReorder && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleReorder}
              disabled={isProcessing}
              className={styles.reorderBtn}
            >
              <FaUndo />
              Đặt lại
            </Button>
          )}

          {canCancelOrder && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancelOrder}
              disabled={isProcessing}
              className={styles.cancelBtn}
            >
              <FaTimesCircle />
              Hủy đơn
            </Button>
          )}

          {order.status === 'delivered' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/orders/${order._id}/review`)}
              className={styles.reviewBtn}
            >
              <FaStar />
              Đánh giá
            </Button>
          )}
        </div>
      </div>

      {/* Tracking Modal */}
      {showTrackingModal && (
        <Modal
          isOpen={showTrackingModal}
          onClose={() => setShowTrackingModal(false)}
          title="Theo dõi đơn hàng"
          className={styles.trackingModal}
        >
          <div className={styles.trackingContent}>
            <div className={styles.trackingHeader}>
              <FaTruck className={styles.trackingIcon} />
              <h4>Đơn hàng #{order.orderCode}</h4>
            </div>
            
            <div className={styles.trackingTimeline}>
              <div className={`${styles.timelineItem} ${styles.completed}`}>
                <div className={styles.timelineIcon}>
                  <FaCheckCircle />
                </div>
                <div className={styles.timelineContent}>
                  <h5>Đơn hàng đã được xác nhận</h5>
                  <p>{formatDate(order.createdAt)}</p>
                </div>
              </div>
              
              {(order.status === 'processing' || order.status === 'shipped' || order.status === 'delivered') && (
                <div className={`${styles.timelineItem} ${styles.completed}`}>
                  <div className={styles.timelineIcon}>
                    <FaBox />
                  </div>
                  <div className={styles.timelineContent}>
                    <h5>Đang chuẩn bị hàng</h5>
                    <p>Cửa hàng đang đóng gói sản phẩm</p>
                  </div>
                </div>
              )}
              
              {(order.status === 'shipped' || order.status === 'delivered') && (
                <div className={`${styles.timelineItem} ${styles.completed}`}>
                  <div className={styles.timelineIcon}>
                    <FaShippingFast />
                  </div>
                  <div className={styles.timelineContent}>
                    <h5>Đang vận chuyển</h5>
                    <p>Đơn hàng đang trên đường giao đến bạn</p>
                  </div>
                </div>
              )}
              
              {order.status === 'delivered' && (
                <div className={`${styles.timelineItem} ${styles.completed}`}>
                  <div className={styles.timelineIcon}>
                    <FaCheckCircle />
                  </div>
                  <div className={styles.timelineContent}>
                    <h5>Đã giao thành công</h5>
                    <p>Cảm ơn bạn đã mua hàng!</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Receipt Modal */}
      {showReceiptModal && (
        <Modal
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
          title="Hóa đơn điện tử"
          className={styles.receiptModal}
        >
          <div className={styles.receiptContent}>
            <div className={styles.receiptHeader}>
              <h3>HÓA ĐƠN ĐIỆN TỬ</h3>
              <p>Mã đơn hàng: #{order.orderCode}</p>
              <p>Ngày: {formatDate(order.createdAt)}</p>
            </div>
            
            <div className={styles.receiptBody}>
              <h4>Thông tin khách hàng:</h4>
              <p>{(order as any).customerInfo?.name || (order as any).customerInfo?.fullName || 'Khách hàng'}</p>
              {(order as any).customerInfo?.phone && <p>SĐT: {(order as any).customerInfo.phone}</p>}
              
              <h4>Địa chỉ giao hàng:</h4>
              <p>{(order as any).shippingAddress?.fullAddress || 'Địa chỉ giao hàng'}</p>
              
              <h4>Chi tiết đơn hàng:</h4>
              <div className={styles.receiptItems}>
                {order.items?.map((item: any, index: number) => (
                  <div key={index} className={styles.receiptItem}>
                    <span>{item.productVariant?.product?.name || item.productName}</span>
                    <span>x{item.quantity}</span>
                    <span>{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              
              <div className={styles.receiptSummary}>
                <div className={styles.summaryRow}>
                  <span>Tạm tính:</span>
                  <span>{formatCurrency(orderAnalytics.subtotal)}</span>
                </div>
                {orderAnalytics.hasDiscount && (
                  <div className={styles.summaryRow}>
                    <span>Giảm giá:</span>
                    <span>-{formatCurrency(order.discountAmount || 0)}</span>
                  </div>
                )}
                <div className={styles.summaryRow}>
                  <span>Phí vận chuyển:</span>
                  <span>{formatCurrency(orderAnalytics.shippingCost)}</span>
                </div>
                <div className={`${styles.summaryRow} ${styles.totalRow}`}>
                  <span>Tổng cộng:</span>
                  <span>{formatCurrency(order.finalTotal || 0)}</span>
                </div>
              </div>
            </div>
            
            <div className={styles.receiptActions}>
              <Button onClick={handleDownloadInvoice}>
                <FaDownload />
                Tải xuống
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// Order Statistics Component
interface OrderStatsProps {
  orders: OrderWithRefs[];
}

export function OrderStats({ orders }: OrderStatsProps) {
  const stats = {
    total: orders.length,
    pending: orders.filter(order => order.status === 'pending').length,
    processing: orders.filter(order => order.status === 'processing').length,
    delivered: orders.filter(order => order.status === 'delivered').length,
    cancelled: orders.filter(order => order.status === 'cancelled').length,
    totalSpent: orders
      .filter(order => order.status === 'delivered')
      .reduce((sum, order) => sum + (order.finalTotal || 0), 0)
  };

  const statItems = [
    { label: 'Tổng đơn hàng', value: stats.total, icon: <FaBox />, color: '#6b7280' },
    { label: 'Chờ xác nhận', value: stats.pending, icon: <FaClock />, color: '#f59e0b' },
    { label: 'Đang xử lý', value: stats.processing, icon: <FaTruck />, color: '#3b82f6' },
    { label: 'Đã giao', value: stats.delivered, icon: <FaCheckCircle />, color: '#10b981' },
    { label: 'Đã hủy', value: stats.cancelled, icon: <FaTimesCircle />, color: '#ef4444' }
  ];

  return (
    <div className={styles.orderStats}>
      <div className={styles.statsGrid}>
        {statItems.map((stat, index) => (
          <div key={index} className={styles.statCard}>
            <div 
              className={styles.statIcon}
              style={{ color: stat.color }}
            >
              {stat.icon}
            </div>
            <div className={styles.statInfo}>
              <div className={styles.statValue}>{stat.value}</div>
              <div className={styles.statLabel}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {stats.totalSpent > 0 && (
        <div className={styles.totalSpentCard}>
          <div className={styles.spentIcon}>
            <FaMoneyBillWave />
          </div>
          <div className={styles.spentInfo}>
            <div className={styles.spentLabel}>Tổng chi tiêu</div>
            <div className={styles.spentAmount}>{formatCurrency(stats.totalSpent)}</div>
          </div>
        </div>
      )}
    </div>
  );
}
