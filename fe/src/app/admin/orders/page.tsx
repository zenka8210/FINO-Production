"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../contexts/AuthContext";
import styles from "./order-admin.module.css";

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: number;
  userId: string;
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    district: string;
    note?: string;
  };
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  discountCode: string;
  finalTotal: number;
  shippingMethod: string;
  paymentMethod: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminOrdersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    if (!user || user.role !== "admin") {
      router.replace("/login");
      return;
    }
    
    fetchOrders();
  }, [user, router]);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      const data = await response.json();
      
      if (data.success) {
        // Sắp xếp đơn hàng theo thời gian tạo (mới nhất trước)
        const sortedOrders = data.orders.sort((a: Order, b: Order) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setOrders(sortedOrders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      const response = await fetch('/api/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: orderId,
          status: newStatus
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Cập nhật danh sách đơn hàng
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === orderId 
              ? { ...order, status: newStatus, updatedAt: new Date().toISOString() }
              : order
          )
        );
        
        // Cập nhật đơn hàng được chọn nếu có
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
        }
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Đang xử lý';
      case 'confirmed': return 'Đã xác nhận';
      case 'shipping': return 'Đang giao hàng';
      case 'delivered': return 'Đã giao hàng';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'confirmed': return '#3b82f6';
      case 'shipping': return '#8b5cf6';
      case 'delivered': return '#10b981';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const filteredOrders = filterStatus === 'all' 
    ? orders 
    : orders.filter(order => order.status === filterStatus);

  if (!user || user.role !== "admin") {
    return null;
  }

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '50px' }}>
        <h2>Đang tải danh sách đơn hàng...</h2>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="row">
        <div className="col-12">
          <div className={styles.adminContainer}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '30px',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <h1>Quản lý đơn hàng</h1>
              
              {/* Filter buttons */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setFilterStatus('all')}
                  className={filterStatus === 'all' ? 'btn-brand' : 'btn-secondary'}
                  style={{ padding: '8px 16px', fontSize: '14px' }}
                >
                  Tất cả ({orders.length})
                </button>
                <button
                  onClick={() => setFilterStatus('pending')}
                  className={filterStatus === 'pending' ? 'btn-brand' : 'btn-secondary'}
                  style={{ padding: '8px 16px', fontSize: '14px' }}
                >
                  Đang xử lý ({orders.filter(o => o.status === 'pending').length})
                </button>
                <button
                  onClick={() => setFilterStatus('confirmed')}
                  className={filterStatus === 'confirmed' ? 'btn-brand' : 'btn-secondary'}
                  style={{ padding: '8px 16px', fontSize: '14px' }}
                >
                  Đã xác nhận ({orders.filter(o => o.status === 'confirmed').length})
                </button>
                <button
                  onClick={() => setFilterStatus('shipping')}
                  className={filterStatus === 'shipping' ? 'btn-brand' : 'btn-secondary'}
                  style={{ padding: '8px 16px', fontSize: '14px' }}
                >
                  Đang giao ({orders.filter(o => o.status === 'shipping').length})
                </button>
                <button
                  onClick={() => setFilterStatus('delivered')}
                  className={filterStatus === 'delivered' ? 'btn-brand' : 'btn-secondary'}
                  style={{ padding: '8px 16px', fontSize: '14px' }}
                >
                  Đã giao ({orders.filter(o => o.status === 'delivered').length})
                </button>
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px', 
                color: '#6b7280',
                backgroundColor: '#f9fafb',
                borderRadius: '8px'
              }}>
                <h3>Không có đơn hàng nào</h3>
                <p>Chưa có đơn hàng {filterStatus !== 'all' ? `với trạng thái "${getStatusText(filterStatus)}"` : 'nào'}.</p>
              </div>
            ) : (
              <div className={styles.ordersGrid}>
                {filteredOrders.map((order) => (
                  <div key={order.id} className={styles.orderCard}>
                    <div className={styles.orderHeader}>
                      <div>
                        <h3>Đơn hàng #{order.id}</h3>
                        <p style={{ color: '#6b7280', fontSize: '14px', margin: '4px 0' }}>
                          {new Date(order.createdAt).toLocaleDateString('vi-VN')} lúc {new Date(order.createdAt).toLocaleTimeString('vi-VN')}
                        </p>
                      </div>
                      <div 
                        className={styles.statusBadge}
                        style={{ 
                          backgroundColor: getStatusColor(order.status) + '20',
                          color: getStatusColor(order.status)
                        }}
                      >
                        {getStatusText(order.status)}
                      </div>
                    </div>

                    <div className={styles.customerInfo}>
                      <h4>Thông tin khách hàng:</h4>
                      <p><strong>Tên:</strong> {order.customerInfo.firstName} {order.customerInfo.lastName}</p>
                      <p><strong>SĐT:</strong> {order.customerInfo.phone}</p>
                      <p><strong>Email:</strong> {order.customerInfo.email}</p>
                      <p><strong>Địa chỉ:</strong> {order.customerInfo.address}, {order.customerInfo.district}, {order.customerInfo.city}</p>
                      {order.customerInfo.note && (
                        <p><strong>Ghi chú:</strong> {order.customerInfo.note}</p>
                      )}
                    </div>

                    <div className={styles.orderItems}>
                      <h4>Sản phẩm:</h4>
                      {order.items.map((item, index) => (
                        <div key={index} className={styles.orderItem}>
                          <span>{item.name} x {item.quantity}</span>
                          <span style={{ fontWeight: 'bold' }}>
                            {item.price.toLocaleString('vi-VN')} VND
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className={styles.orderSummary}>
                      <div className={styles.summaryRow}>
                        <span>Tạm tính:</span>
                        <span>{order.subtotal.toLocaleString('vi-VN')} VND</span>
                      </div>
                      <div className={styles.summaryRow}>
                        <span>Phí vận chuyển:</span>
                        <span>{order.shippingFee.toLocaleString('vi-VN')} VND</span>
                      </div>
                      {order.discount > 0 && (
                        <div className={styles.summaryRow} style={{ color: '#e11d48' }}>
                          <span>Giảm giá ({order.discountCode}):</span>
                          <span>-{order.discount.toLocaleString('vi-VN')} VND</span>
                        </div>
                      )}
                      <div className={styles.summaryRow} style={{ 
                        fontWeight: 'bold', 
                        fontSize: '16px',
                        borderTop: '1px solid #e5e7eb',
                        paddingTop: '8px' 
                      }}>
                        <span>Tổng cộng:</span>
                        <span style={{ color: 'var(--brand-color)' }}>
                          {order.finalTotal.toLocaleString('vi-VN')} VND
                        </span>
                      </div>
                    </div>

                    <div className={styles.orderActions}>
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        className={styles.statusSelect}
                      >
                        <option value="pending">Đang xử lý</option>
                        <option value="confirmed">Đã xác nhận</option>
                        <option value="shipping">Đang giao hàng</option>
                        <option value="delivered">Đã giao hàng</option>
                        <option value="cancelled">Đã hủy</option>
                      </select>
                      
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="btn-secondary"
                        style={{ padding: '8px 16px', fontSize: '14px' }}
                      >
                        Xem chi tiết
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal chi tiết đơn hàng */}
      {selectedOrder && (
        <div className={styles.modal} onClick={() => setSelectedOrder(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Chi tiết đơn hàng #{selectedOrder.id}</h2>
              <button 
                className={styles.closeButton}
                onClick={() => setSelectedOrder(null)}
              >
                ×
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.detailSection}>
                <h3>Thông tin đơn hàng</h3>
                <p><strong>Mã đơn:</strong> #{selectedOrder.id}</p>
                <p><strong>Ngày tạo:</strong> {new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}</p>
                <p><strong>Ngày cập nhật:</strong> {new Date(selectedOrder.updatedAt).toLocaleString('vi-VN')}</p>
                <p><strong>Trạng thái:</strong> 
                  <span style={{ 
                    color: getStatusColor(selectedOrder.status),
                    fontWeight: 'bold',
                    marginLeft: '8px'
                  }}>
                    {getStatusText(selectedOrder.status)}
                  </span>
                </p>
                <p><strong>Phương thức thanh toán:</strong> {
                  selectedOrder.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng' :
                  selectedOrder.paymentMethod === 'bank' ? 'Chuyển khoản ngân hàng' :
                  selectedOrder.paymentMethod === 'momo' ? 'Ví điện tử Momo' :
                  selectedOrder.paymentMethod === 'card' ? 'Thẻ tín dụng' : selectedOrder.paymentMethod
                }</p>
                <p><strong>Phương thức giao hàng:</strong> {
                  selectedOrder.shippingMethod === 'economy' ? 'Giao hàng tiết kiệm' : 'Giao hàng nhanh'
                }</p>
              </div>

              <div className={styles.detailSection}>
                <h3>Thông tin khách hàng</h3>
                <p><strong>Họ tên:</strong> {selectedOrder.customerInfo.firstName} {selectedOrder.customerInfo.lastName}</p>
                <p><strong>Email:</strong> {selectedOrder.customerInfo.email}</p>
                <p><strong>Điện thoại:</strong> {selectedOrder.customerInfo.phone}</p>
                <p><strong>Địa chỉ:</strong> {selectedOrder.customerInfo.address}</p>
                <p><strong>Quận/Huyện:</strong> {selectedOrder.customerInfo.district}</p>
                <p><strong>Tỉnh/Thành:</strong> {selectedOrder.customerInfo.city}</p>
                {selectedOrder.customerInfo.note && (
                  <p><strong>Ghi chú:</strong> {selectedOrder.customerInfo.note}</p>
                )}
              </div>

              <div className={styles.detailSection}>
                <h3>Sản phẩm đặt hàng</h3>
                {selectedOrder.items.map((item, index) => (
                  <div key={index} className={styles.detailItem}>
                    <span>{item.name}</span>
                    <span>Số lượng: {item.quantity}</span>
                    <span style={{ fontWeight: 'bold' }}>
                      {item.price.toLocaleString('vi-VN')} VND
                    </span>
                  </div>
                ))}
              </div>

              <div className={styles.detailSection}>
                <h3>Tổng kết thanh toán</h3>
                <div className={styles.paymentSummary}>
                  <div className={styles.summaryRow}>
                    <span>Tạm tính:</span>
                    <span>{selectedOrder.subtotal.toLocaleString('vi-VN')} VND</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span>Phí vận chuyển:</span>
                    <span>{selectedOrder.shippingFee.toLocaleString('vi-VN')} VND</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className={styles.summaryRow} style={{ color: '#e11d48' }}>
                      <span>Giảm giá ({selectedOrder.discountCode}):</span>
                      <span>-{selectedOrder.discount.toLocaleString('vi-VN')} VND</span>
                    </div>
                  )}
                  <div className={styles.summaryRow} style={{ 
                    fontWeight: 'bold', 
                    fontSize: '18px',
                    borderTop: '2px solid #e5e7eb',
                    paddingTop: '12px',
                    color: 'var(--brand-color)'
                  }}>
                    <span>Tổng cộng:</span>
                    <span>{selectedOrder.finalTotal.toLocaleString('vi-VN')} VND</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
