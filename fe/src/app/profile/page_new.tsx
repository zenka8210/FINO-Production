"use client";
import { useState, useEffect } from "react";
import { useAuth } from '@/contexts';
import { useOrders, useNotifications } from '@/hooks';
import { OrderWithRefs, User } from '@/types';
import styles from "./profile.module.css";
import { formatPrice } from '@/utils/formatPrice';
import { useRouter } from "next/navigation";

interface UserFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
}

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const { getUserOrders, loading: ordersLoading, error: ordersError } = useOrders();
  const { success: showSuccess, error: showError } = useNotifications();
  const router = useRouter();

  const [userForm, setUserForm] = useState<UserFormData>({
    name: "",
    email: "",
    phone: "",
    address: ""
  });
  const [orders, setOrders] = useState<OrderWithRefs[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'orders'>('info');
  const [loading, setLoading] = useState(false);

  // Redirect nếu chưa đăng nhập
  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/profile');
      return;
    }

    // Set user form data từ user info
    setUserForm({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      address: user.address || ""
    });
  }, [user, router]);

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      
      try {
        // getUserOrders from current user should work without filters
        const response = await getUserOrders();
        console.log('Orders response:', response);
        
        // getUserOrders() returns PaginatedResponse<OrderWithRefs>
        // Structure: { data: OrderWithRefs[], pagination: {} }
        const ordersArray = Array.isArray(response) ? response : 
                           (response && Array.isArray(response.data)) ? response.data : [];
        setOrders(ordersArray);
      } catch (error) {
        console.error('Error fetching orders:', error);
      }
    };

    fetchOrders();
  }, [user, getUserOrders]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateProfile(userForm);
      setIsEditing(false);
      showSuccess('Cập nhật thông tin thành công');
    } catch (error: any) {
      showError('Lỗi cập nhật thông tin: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const getOrderStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'pending': 'Chờ xử lý',
      'processing': 'Đang xử lý', 
      'shipped': 'Đang giao',
      'delivered': 'Đã giao',
      'cancelled': 'Đã hủy'
    };
    return statusMap[status] || status;
  };

  const getStatusClass = (status: string) => {
    const classMap: Record<string, string> = {
      'pending': styles.statusPending,
      'processing': styles.statusProcessing,
      'shipped': styles.statusShipped,
      'delivered': styles.statusDelivered,
      'cancelled': styles.statusCancelled
    };
    return classMap[status] || '';
  };

  if (!user) {
    return (
      <div className={styles.loading}>
        <p>Đang tải thông tin...</p>
      </div>
    );
  }

  return (
    <div className={styles.profileContainer}>
      <div className={styles.sidebar}>
        <div className={styles.userInfo}>
          <div className={styles.avatar}>
            {user.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <h3>{user.name || 'Người dùng'}</h3>
          <p className={styles.email}>{user.email}</p>
        </div>
        
        <nav className={styles.nav}>
          <button 
            className={`${styles.navItem} ${activeTab === 'info' ? styles.active : ''}`}
            onClick={() => setActiveTab('info')}
          >
            Thông tin cá nhân
          </button>
          <button 
            className={`${styles.navItem} ${activeTab === 'orders' ? styles.active : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            Lịch sử đơn hàng
          </button>
        </nav>
      </div>

      <div className={styles.content}>
        {activeTab === 'info' && (
          <div className={styles.infoSection}>
            <div className={styles.sectionHeader}>
              <h2>Thông tin cá nhân</h2>
              <button 
                className={styles.editButton}
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? 'Hủy' : 'Chỉnh sửa'}
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Họ và tên:</label>
                <input
                  type="text"
                  value={userForm.name}
                  onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                  disabled={!isEditing}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Email:</label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                  disabled={!isEditing}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Số điện thoại:</label>
                <input
                  type="tel"
                  value={userForm.phone}
                  onChange={(e) => setUserForm(prev => ({ ...prev, phone: e.target.value }))}
                  disabled={!isEditing}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Địa chỉ:</label>
                <textarea
                  value={userForm.address}
                  onChange={(e) => setUserForm(prev => ({ ...prev, address: e.target.value }))}
                  disabled={!isEditing}
                  className={styles.textarea}
                  rows={3}
                />
              </div>

              {isEditing && (
                <div className={styles.formActions}>
                  <button 
                    type="submit" 
                    className={styles.saveButton}
                    disabled={loading}
                  >
                    {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </div>
              )}
            </form>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className={styles.ordersSection}>
            <h2>Lịch sử đơn hàng</h2>
            
            {ordersLoading ? (
              <div className={styles.loading}>
                <p>Đang tải đơn hàng...</p>
              </div>
            ) : ordersError ? (
              <div className={styles.error}>
                <p>Lỗi khi tải đơn hàng: {ordersError}</p>
              </div>
            ) : orders.length === 0 ? (
              <div className={styles.empty}>
                <p>Bạn chưa có đơn hàng nào</p>
                <button 
                  onClick={() => router.push('/products')}
                  className={styles.shopButton}
                >
                  Mua sắm ngay
                </button>
              </div>
            ) : (
              <div className={styles.ordersList}>
                {orders.map((order) => (
                  <div key={order._id} className={styles.orderCard}>
                    <div className={styles.orderHeader}>
                      <div className={styles.orderInfo}>
                        <h3>Đơn hàng #{order.orderCode}</h3>
                        <p className={styles.orderDate}>
                          {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                      <div className={`${styles.orderStatus} ${getStatusClass(order.status)}`}>
                        {getOrderStatusText(order.status)}
                      </div>
                    </div>

                    <div className={styles.orderItems}>
                      {order.items.map((item, index) => (
                        <div key={index} className={styles.orderItem}>
                          <span>Sản phẩm #{index + 1}</span>
                          <span>Số lượng: {item.quantity}</span>
                          <span>{formatPrice(item.totalPrice)}</span>
                        </div>
                      ))}
                    </div>

                    <div className={styles.orderFooter}>
                      <div className={styles.orderTotal}>
                        <strong>Tổng cộng: {formatPrice(order.finalTotal || 0)}</strong>
                      </div>
                      <button 
                        className={styles.orderDetailButton}
                        onClick={() => router.push(`/orders/${order._id}`)}
                      >
                        Chi tiết
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
