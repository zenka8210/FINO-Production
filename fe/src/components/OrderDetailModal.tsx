import { useState, useEffect } from 'react';
import { OrderWithRefs } from '@/types';
import { orderService } from '@/services/orderService';

interface OrderDetailModalProps {
  orderId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function OrderDetailModal({ orderId, isOpen, onClose }: OrderDetailModalProps) {
  const [orderDetail, setOrderDetail] = useState<OrderWithRefs | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrderDetail();
    }
  }, [isOpen, orderId]);

  const fetchOrderDetail = async () => {
    if (!orderId) return;
    
    try {
      setLoading(true);
      setError(null);
      // Use admin method to fetch order details
      const detail = await orderService.getOrderByIdAdmin(orderId);
      setOrderDetail(detail);
    } catch (err: any) {
      setError(err.message || 'Không thể tải chi tiết đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  // 🆕 Helper function to get address (with fallback to snapshot)
  const getDisplayAddress = () => {
    if (!orderDetail) return null;
    
    // If address exists, use it directly
    if (orderDetail.address) {
      return orderDetail.address;
    }
    
    // Fallback to addressSnapshot if available
    if (orderDetail.addressSnapshot) {
      return {
        fullName: orderDetail.addressSnapshot.fullName,
        phone: orderDetail.addressSnapshot.phone,
        addressLine: orderDetail.addressSnapshot.addressLine,
        ward: orderDetail.addressSnapshot.ward,
        district: orderDetail.addressSnapshot.district,
        city: orderDetail.addressSnapshot.city,
        isSnapshot: true // Flag to indicate this is from snapshot
      };
    }
    
    return null;
  };

  const getStatusDisplay = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      pending: { label: 'Chờ xử lý', color: '#F59E0B' },
      processing: { label: 'Đang xử lý', color: '#06B6D4' },
      shipped: { label: 'Đã gửi hàng', color: '#8B5CF6' },
      delivered: { label: 'Đã giao', color: '#10B981' },
      cancelled: { label: 'Đã hủy', color: '#DC2626' }
    };
    return statusMap[status] || { label: status, color: '#9CA3AF' };
  };

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: '0.75rem',
          maxWidth: '800px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1f2937', margin: 0 }}>
            Chi tiết đơn hàng
          </h2>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem',
              border: 'none',
              background: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#6b7280',
              borderRadius: '0.375rem'
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem' }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
              <div>Đang tải chi tiết đơn hàng...</div>
            </div>
          )}

          {error && (
            <div style={{
              padding: '1rem',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '0.5rem',
              color: '#dc2626',
              marginBottom: '1rem'
            }}>
              {error}
            </div>
          )}

          {orderDetail && !loading && (
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              {/* Order Info */}
              <div style={{
                background: '#f9fafb',
                padding: '1rem',
                borderRadius: '0.5rem',
                border: '1px solid #e5e7eb'
              }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', color: '#374151' }}>
                  Thông tin đơn hàng
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', fontSize: '0.875rem' }}>
                  <div>
                    <span style={{ color: '#6b7280' }}>Mã đơn hàng:</span>
                    <span style={{ fontWeight: 600, marginLeft: '0.5rem', color: '#1f2937' }}>
                      {orderDetail.orderCode}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: '#6b7280' }}>Ngày đặt:</span>
                    <span style={{ fontWeight: 600, marginLeft: '0.5rem', color: '#1f2937' }}>
                      {new Date(orderDetail.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: '#6b7280' }}>Trạng thái:</span>
                    <span 
                      style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.375rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        marginLeft: '0.5rem',
                        backgroundColor: getStatusDisplay(orderDetail.status).color,
                        color: 'white'
                      }}
                    >
                      {getStatusDisplay(orderDetail.status).label}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: '#6b7280' }}>Phương thức thanh toán:</span>
                    <span style={{ fontWeight: 600, marginLeft: '0.5rem', color: '#1f2937' }}>
                      {orderDetail.paymentMethod?.method || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div style={{
                background: '#f0f9ff',
                padding: '1rem',
                borderRadius: '0.5rem',
                border: '1px solid #bae6fd'
              }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', color: '#374151' }}>
                  Thông tin khách hàng
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', fontSize: '0.875rem' }}>
                  <div>
                    <span style={{ color: '#6b7280' }}>Người đặt:</span>
                    <span style={{ fontWeight: 600, marginLeft: '0.5rem', color: '#1f2937' }}>
                      {orderDetail.user?.name || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: '#6b7280' }}>Email:</span>
                    <span style={{ fontWeight: 600, marginLeft: '0.5rem', color: '#1f2937' }}>
                      {orderDetail.user?.email || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Delivery Info */}
              <div style={{
                background: '#f0fdf4',
                padding: '1rem',
                borderRadius: '0.5rem',
                border: '1px solid #bbf7d0'
              }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', color: '#374151' }}>
                  Thông tin giao hàng
                </h3>
                <div style={{ fontSize: '0.875rem' }}>
                  {(() => {
                    const displayAddress = getDisplayAddress();
                    return displayAddress ? (
                      <>
                        <div style={{ marginBottom: '0.5rem' }}>
                          <span style={{ color: '#6b7280' }}>Người nhận:</span>
                          <span style={{ fontWeight: 600, marginLeft: '0.5rem', color: '#1f2937' }}>
                            {displayAddress.fullName || 'N/A'}
                            {(displayAddress as any).isSnapshot && (
                              <span style={{ 
                                marginLeft: '0.5rem', 
                                fontSize: '0.75rem', 
                                color: '#f59e0b', 
                                fontStyle: 'italic' 
                              }}>
                                (từ lịch sử)
                              </span>
                            )}
                          </span>
                        </div>
                        <div style={{ marginBottom: '0.5rem' }}>
                          <span style={{ color: '#6b7280' }}>Số điện thoại:</span>
                          <span style={{ fontWeight: 600, marginLeft: '0.5rem', color: '#1f2937' }}>
                            {displayAddress.phone || 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span style={{ color: '#6b7280' }}>Địa chỉ:</span>
                          <div style={{ fontWeight: 600, marginTop: '0.25rem', color: '#1f2937' }}>
                            {displayAddress.addressLine}<br />
                            {displayAddress.ward}, {displayAddress.district}, {displayAddress.city}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div style={{ color: '#9ca3af', fontStyle: 'italic' }}>
                        Không có thông tin giao hàng
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Products */}
              <div style={{
                background: '#fefce8',
                padding: '1rem',
                borderRadius: '0.5rem',
                border: '1px solid #fef3c7'
              }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', color: '#374151' }}>
                  Sản phẩm đã đặt ({orderDetail.items?.length || 0} sản phẩm)
                </h3>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {orderDetail.items?.map((item, index) => (
                    <div key={index} style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto auto auto',
                      gap: '0.75rem',
                      alignItems: 'center',
                      padding: '0.75rem',
                      backgroundColor: 'white',
                      borderRadius: '0.375rem',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div>
                        <div style={{ fontWeight: 600, color: '#1f2937', marginBottom: '0.25rem' }}>
                          {item.productVariant?.product?.name || 'Sản phẩm không xác định'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                          {item.productVariant?.size?.name && `Size: ${item.productVariant.size.name}`}
                          {item.productVariant?.color?.name && ` - Màu: ${item.productVariant.color.name}`}
                        </div>
                      </div>
                      <div style={{ textAlign: 'center', fontSize: '0.875rem', color: '#374151' }}>
                        x{item.quantity}
                      </div>
                      <div style={{ textAlign: 'right', fontSize: '0.875rem', color: '#374151' }}>
                        {item.price?.toLocaleString('vi-VN')}đ
                      </div>
                      <div style={{ textAlign: 'right', fontWeight: 600, color: '#1f2937' }}>
                        {item.totalPrice?.toLocaleString('vi-VN')}đ
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Total */}
              <div style={{
                background: '#f0fdf4',
                padding: '1rem',
                borderRadius: '0.5rem',
                border: '1px solid #bbf7d0'
              }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', color: '#374151' }}>
                  Tổng cộng
                </h3>
                <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.875rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6b7280' }}>Tạm tính:</span>
                    <span style={{ color: '#374151' }}>
                      {((orderDetail.items || []).reduce((sum, item) => sum + (item?.totalPrice || 0), 0)).toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                  {orderDetail.discountAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#6b7280' }}>Giảm giá:</span>
                      <span style={{ color: '#dc2626' }}>
                        -{orderDetail.discountAmount.toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6b7280' }}>Phí vận chuyển:</span>
                    <span style={{ color: '#374151' }}>
                      {orderDetail.shippingFee?.toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    paddingTop: '0.5rem',
                    borderTop: '1px solid #e5e7eb',
                    fontSize: '1rem',
                    fontWeight: 700
                  }}>
                    <span style={{ color: '#1f2937' }}>Tổng cộng:</span>
                    <span style={{ color: '#059669' }}>
                      {(orderDetail.finalTotal || 
                        ((orderDetail.items || []).reduce((sum, item) => sum + (item?.totalPrice || 0), 0) 
                         - (orderDetail.discountAmount || 0) + (orderDetail.shippingFee || 0))
                      ).toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
