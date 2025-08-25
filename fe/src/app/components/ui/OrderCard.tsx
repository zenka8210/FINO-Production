'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApiNotification, useOrders } from '@/hooks';
import { Button, OrderDetailButton } from '@/app/components/ui';
import { OrderWithRefs } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { 
  FaEye, 
  FaClock, 
  FaCheckCircle, 
  FaTruck, 
  FaTimesCircle,
  FaShoppingCart,
  FaStar,
  FaMapMarkerAlt
} from 'react-icons/fa';
import styles from './OrderCard.module.css';

interface OrderCardProps {
  order: OrderWithRefs;
  showReviewButton?: boolean;
  onReviewOrder?: (order: OrderWithRefs) => void;
  onReorderComplete?: () => void;
  onCancelOrder?: (orderId: string) => void;
  onReorderOrder?: (order: OrderWithRefs) => void;
  onChangeAddress?: (order: OrderWithRefs) => void;
  isOrderReviewed?: (orderId: string) => boolean;
  maxItems?: number;
  showDetailedInfo?: boolean;
}

export default function OrderCard({ 
  order, 
  showReviewButton = false,
  onReviewOrder,
  onReorderComplete,
  onCancelOrder,
  onReorderOrder,
  onChangeAddress,
  isOrderReviewed,
  maxItems = 3,
  showDetailedInfo = false
}: OrderCardProps) {
  const router = useRouter();
  const { showError, showSuccess } = useApiNotification();
  const { cancelOrder } = useOrders();
  const [isLoading, setIsLoading] = useState(false);

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get order status configuration
  const getOrderStatusConfig = (status: string) => {
    const statusConfig = {
      pending: { 
        icon: <FaClock />, 
        label: 'Chờ xác nhận', 
        className: styles.statusPending 
      },
      processing: { 
        icon: <FaTruck />, 
        label: 'Đang xử lý', 
        className: styles.statusProcessing 
      },
      shipped: { 
        icon: <FaTruck />, 
        label: 'Đã gửi hàng', 
        className: styles.statusShipped 
      },
      delivered: { 
        icon: <FaCheckCircle />, 
        label: 'Đã giao', 
        className: styles.statusDelivered 
      },
      cancelled: { 
        icon: <FaTimesCircle />, 
        label: 'Đã hủy', 
        className: styles.statusCancelled 
      }
    };

    return statusConfig[status as keyof typeof statusConfig] || { 
      icon: <FaClock />,
      label: status, 
      className: styles.statusPending 
    };
  };

  // Handle cancel order
  const handleCancelOrder = async (orderId: string) => {
    if (onCancelOrder) {
      // Use parent's cancel handler if provided
      onCancelOrder(orderId);
    } else {
      // Fall back to internal handler
      try {
        setIsLoading(true);
        await cancelOrder(orderId);
        showSuccess('Đã hủy đơn hàng thành công');
        if (onReorderComplete) {
          onReorderComplete();
        }
      } catch (error: any) {
        showError('Không thể hủy đơn hàng', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Handle reorder
  const handleReorder = async (order: OrderWithRefs) => {
    if (onReorderOrder) {
      // Use parent's reorder handler if provided
      onReorderOrder(order);
    } else {
      // Fall back to basic implementation
      try {
        setIsLoading(true);
        // This would add all items from the order back to cart
        // For now, show a temporary message
        showError('Tính năng mua lại đang được phát triển');
      } catch (error: any) {
        showError('Không thể thực hiện mua lại', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const statusConfig = getOrderStatusConfig(order.status);

  return (
    <div className={styles.orderCard}>
      <div className={styles.orderHeader}>
        <div className={styles.orderInfo}>
          <h4 className={styles.orderCode}>#{order.orderCode}</h4>
          {showDetailedInfo ? (
            <div className={styles.orderMeta}>
              <span className={styles.orderDate}>
                <FaClock className={styles.metaIcon} />
                {formatDate(order.createdAt)}
              </span>
              <span className={`${styles.orderStatus} ${statusConfig.className}`}>
                {statusConfig.icon}
                {statusConfig.label}
              </span>
            </div>
          ) : (
            <p className={styles.orderDate}>{formatDate(order.createdAt)}</p>
          )}
        </div>
        {!showDetailedInfo && (
          <div className={`${styles.orderStatus} ${statusConfig.className}`}>
            {statusConfig.label}
          </div>
        )}
        {showDetailedInfo && (
          <div className={styles.orderTotal}>
            <span className={styles.totalLabel}>Tổng tiền:</span>
            <span className={styles.totalAmount}>{formatCurrency(order.finalTotal || 0)}</span>
          </div>
        )}
      </div>
      
      <div className={styles.orderItems}>
        {order.items?.slice(0, maxItems).map((item: any, index: number) => (
          <div key={index} className={styles.orderItem}>
            {showDetailedInfo ? (
              <div className={styles.itemInfo}>
                <span className={styles.itemName}>
                  {item.productSnapshot?.productName || 
                   item.productVariant?.product?.name || 
                   item.productName || 
                   '🛍️ Sản phẩm đã được xóa'}
                </span>
                <span className={styles.itemDetails}>
                  {/* Show variant details from snapshot or reference */}
                  <div style={{ marginBottom: '4px' }}>
                    {/* Color and Size info */}
                    {(item.productSnapshot?.colorName || item.productVariant?.color?.name) && (
                      <span style={{ marginRight: '12px', padding: '2px 6px', background: '#f3f4f6', borderRadius: '4px', fontSize: '0.85em' }}>
                        🎨 {item.productSnapshot?.colorName || item.productVariant?.color?.name}
                      </span>
                    )}
                    {(item.productSnapshot?.sizeName || item.productVariant?.size?.name) && (
                      <span style={{ marginRight: '12px', padding: '2px 6px', background: '#f3f4f6', borderRadius: '4px', fontSize: '0.85em' }}>
                        📏 {item.productSnapshot?.sizeName || item.productVariant?.size?.name}
                      </span>
                    )}
                  </div>
                  
                  {/* Quantity and Price */}
                  <div>
                    Số lượng: {item.quantity} • {formatCurrency(item.price)}
                  </div>
                  
                  {/* Status indicators */}
                  {item.productSnapshot && (
                    <div style={{ color: '#10b981', marginTop: '4px', fontSize: '0.8em', fontStyle: 'italic' }}>
                      ✅ Dữ liệu được bảo toàn
                    </div>
                  )}
                  {!item.productVariant && !item.productSnapshot && (
                    <div style={{ color: '#dc2626', marginTop: '4px', fontSize: '0.8em', fontStyle: 'italic' }}>
                      ⚠️ Dữ liệu sản phẩm không đầy đủ
                    </div>
                  )}
                  {item.productVariant && !item.productSnapshot && (
                    <div style={{ color: '#f59e0b', marginTop: '4px', fontSize: '0.8em', fontStyle: 'italic' }}>
                      🔗 Sử dụng tham chiếu sản phẩm
                    </div>
                  )}
                </span>
              </div>
            ) : (
              <>
                <span>
                  {/* Priority: 1. Snapshot, 2. ProductVariant reference, 3. Fallback */}
                  {item.productSnapshot?.productName || 
                   item.productVariant?.product?.name || 
                   item.productName || 
                   '⚠️ Sản phẩm không xác định'}
                  {!item.productVariant && !item.productSnapshot && (
                    <span style={{ color: '#dc2626', fontSize: '0.8em', marginLeft: '4px' }}>
                      (Lỗi dữ liệu)
                    </span>
                  )}
                </span>
                <span>x{item.quantity}</span>
              </>
            )}
          </div>
        ))}
        {(order.items?.length || 0) > maxItems && (
          <p className={styles.moreItems}>
            +{(order.items?.length || 0) - maxItems} sản phẩm khác
          </p>
        )}
      </div>

      <div className={styles.orderFooter}>
        {!showDetailedInfo && (
          <div className={styles.orderTotal}>
            <strong>{order.finalTotal?.toLocaleString('vi-VN')}đ</strong>
          </div>
        )}
        <div className={styles.orderActions}>
          <OrderDetailButton 
            orderId={order._id}
            variant="outline"
            size="sm"
          >
            <FaEye className={styles.buttonIcon} />
            {showDetailedInfo ? 'Xem chi tiết' : 'Chi tiết'}
          </OrderDetailButton>
          
          {order.status === 'pending' && (
            <Button
              variant="outline"
              size="sm"
              className={styles.cancelButton}
              onClick={async () => {
                if (confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) {
                  await handleCancelOrder(order._id);
                }
              }}
              disabled={isLoading}
            >
              <FaTimesCircle className={styles.buttonIcon} />
              {isLoading ? 'Đang hủy...' : 'Hủy đơn'}
            </Button>
          )}
          
          {/* Address change button for pending orders */}
          {order.status === 'pending' && onChangeAddress && (
            <Button
              variant="outline"
              size="sm"
              className={styles.addressButton}
              onClick={() => onChangeAddress(order)}
              disabled={isLoading}
            >
              <FaMapMarkerAlt className={styles.buttonIcon} />
              Đổi địa chỉ
            </Button>
          )}
          
          {/* Review button for delivered orders */}
          {showReviewButton && order.status === 'delivered' && onReviewOrder && isOrderReviewed && (
            <Button
              variant="outline"
              size="sm"
              className={styles.reviewButton}
              onClick={() => isOrderReviewed(order._id) ? undefined : onReviewOrder(order)}
              disabled={isOrderReviewed(order._id)}
            >
              <FaStar className={styles.buttonIcon} />
              {isOrderReviewed(order._id) ? 'Đã đánh giá' : 'Đánh giá'}
            </Button>
          )}
          
          {/* Reorder button - ALWAYS LAST (rightmost) */}
          <Button
            variant="primary"
            size="sm"
            className={styles.reorderButton}
            onClick={() => handleReorder(order)}
            disabled={isLoading}
          >
            <FaShoppingCart className={styles.buttonIcon} />
            Mua lại
          </Button>
        </div>
      </div>
    </div>
  );
}
