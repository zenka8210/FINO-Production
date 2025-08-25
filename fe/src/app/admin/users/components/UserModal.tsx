import { useState, useEffect } from 'react';
import { User, Address } from '../../../../types';
import { userService, orderService, addressService } from '../../../../services';
import { useApiNotification } from '../../../../hooks/useApiNotification';
import { apiClient } from '../../../../lib/api';
import OrderDetailModal from '../../../../components/OrderDetailModal';
import styles from './UserModal.module.css';

interface UserModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleStatus: (userId: string, currentStatus: boolean) => void;
  onUpdateRole: (userId: string, newRole: 'customer' | 'admin') => void;
}

interface UserOrders {
  _id: string;
  orderCode: string;
  total: number;
  finalTotal: number;
  status: string;
  createdAt: string;
}

export default function UserModal({
  user,
  isOpen,
  onClose,
  onToggleStatus,
  onUpdateRole
}: UserModalProps) {
  const { showSuccess, showError } = useApiNotification();
  const [activeTab, setActiveTab] = useState<'info' | 'orders' | 'addresses'>('info');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [userOrders, setUserOrders] = useState<UserOrders[]>([]);
  const [userAddresses, setUserAddresses] = useState<Address[]>([]);
  
  // Order detail modal state
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isOrderDetailModalOpen, setIsOrderDetailModalOpen] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      setActiveTab('info');
      // Load both addresses and orders count when modal opens
      fetchUserAddresses();
      fetchUserOrders();
    }
  }, [user, isOpen]);

  // Reset state khi modal đóng
  useEffect(() => {
    if (!isOpen) {
      setActiveTab('info');
      setUserOrders([]);
      setUserAddresses([]);
      setIsLoading(false);
      setIsLoadingOrders(false);
      setIsLoadingAddresses(false);
      setSelectedOrderId(null);
      setIsOrderDetailModalOpen(false);
    }
  }, [isOpen]);

  const fetchUserOrders = async () => {
    if (!user) return;
    
    try {
      setIsLoadingOrders(true);
      const response = await orderService.getOrdersByUserId(user._id, {
        sortBy: 'createdAt',
        sortOrder: 'desc'
      }) as any;
      
      console.log('[DEBUG] UserModal orders response:', response);
      
      // Handle nested response structure from backend
      let orders = [];
      if (response?.data?.documents) {
        // Backend returns: { data: { documents: [...], pagination: {...} } }
        orders = response.data.documents;
      } else if (Array.isArray(response?.data)) {
        // Backend returns: { data: [...] }
        orders = response.data;
      } else if (Array.isArray(response)) {
        // Direct array response
        orders = response;
      }
      
      console.log('[DEBUG] UserModal processed orders:', orders);
      setUserOrders(orders as any);
    } catch (error: any) {
      console.error('Error fetching user orders:', error);
      setUserOrders([]);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const fetchUserAddresses = async () => {
    if (!user) return;
    
    try {
      setIsLoadingAddresses(true);
      console.log('[DEBUG] UserModal fetching addresses for user:', user._id);
      
      // Use apiClient which automatically handles authentication
      const response = await apiClient.get(`/api/users/${user._id}/addresses`);
      
      console.log('[DEBUG] UserModal addresses response:', response);
      
      // Handle response structure
      const addresses = response.data || [];
      setUserAddresses(addresses);
      console.log('[DEBUG] UserModal addresses set:', addresses.length, 'addresses');
      
    } catch (error: any) {
      console.error('[ERROR] UserModal fetch addresses failed:', error);
      setUserAddresses([]);
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  // Order detail modal handlers
  const handleOrderClick = (orderId: string) => {
    setSelectedOrderId(orderId);
    setIsOrderDetailModalOpen(true);
  };

  const handleCloseOrderModal = () => {
    setSelectedOrderId(null);
    setIsOrderDetailModalOpen(false);
  };

  const handleToggleStatus = () => {
    if (!user) return;
    onToggleStatus(user._id, user.isActive);
  };

  const handleRoleChange = (newRole: 'customer' | 'admin') => {
    if (!user) return;
    
    if (newRole === 'admin') {
      if (!confirm(`Bạn có chắc chắn muốn cấp quyền Admin cho "${user.email}"?`)) {
        return;
      }
    }
    
    onUpdateRole(user._id, newRole);
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? '#10b981' : '#6b7280';
  };

  const getRoleColor = (role: string) => {
    return role === 'admin' ? '#dc2626' : '#6c47ff';
  };

  const getOrderStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      'pending': '#f59e0b',
      'processing': '#3b82f6',
      'shipped': '#6366f1',
      'delivered': '#10b981',
      'cancelled': '#ef4444'
    };
    return statusColors[status] || '#6b7280';
  };

  if (!isOpen || !user) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.userTitle}>
            <h2 className={styles.userName}>{user.name || 'Chưa có tên'}</h2>
            <p className={styles.userEmail}>{user.email}</p>
          </div>
          <button onClick={onClose} className={styles.closeButton}>
            ✕
          </button>
        </div>

        {/* User Status & Role Badges */}
        <div className={styles.userBadges}>
          <span 
            className={styles.statusBadge}
            style={{ backgroundColor: getStatusColor(user.isActive) }}
          >
            {user.isActive ? 'Hoạt động' : 'Đã khóa'}
          </span>
          <span 
            className={styles.roleBadge}
            style={{ backgroundColor: getRoleColor(user.role) }}
          >
            {user.role === 'admin' ? 'Quản trị viên' : 'Khách hàng'}
          </span>
        </div>

        {/* Tabs */}
        <div className={styles.tabsContainer}>
          <button
            className={`${styles.tab} ${activeTab === 'info' ? styles.active : ''}`}
            onClick={() => setActiveTab('info')}
          >
            Thông tin cá nhân
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'addresses' ? styles.active : ''}`}
            onClick={() => {
              setActiveTab('addresses');
              // Only fetch if not already loaded
              if (userAddresses.length === 0 && !isLoadingAddresses) {
                fetchUserAddresses();
              }
            }}
          >
            Địa chỉ ({userAddresses.length})
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'orders' ? styles.active : ''}`}
            onClick={() => {
              setActiveTab('orders');
              // Only fetch if not already loaded
              if (userOrders.length === 0 && !isLoadingOrders) {
                fetchUserOrders();
              }
            }}
          >
            Đơn hàng gần nhất ({userOrders.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className={styles.tabContent}>
          {activeTab === 'info' && (
            <div className={styles.infoTab}>
              <div className={styles.userInfo}>
                <div className={styles.infoGroup}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Email:</span>
                    <span className={styles.infoValue}>{user.email}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Tên:</span>
                    <span className={styles.infoValue}>{user.name || 'Chưa có'}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Số điện thoại:</span>
                    <span className={styles.infoValue}>{user.phone || 'Chưa có'}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Ngày tạo:</span>
                    <span className={styles.infoValue}>
                      {new Date(user.createdAt).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Cập nhật lần cuối:</span>
                    <span className={styles.infoValue}>
                      {new Date(user.updatedAt).toLocaleString('vi-VN')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'addresses' && (
            <div className={styles.addressesTab}>
              <div className={styles.addressHeader}>
                <h4>Danh sách địa chỉ ({userAddresses.length})</h4>
              </div>
              
              {isLoadingAddresses ? (
                <div className={styles.loadingState}>
                  <span>Đang tải địa chỉ...</span>
                </div>
              ) : userAddresses.length === 0 ? (
                <div className={styles.emptyState}>
                  <span>Người dùng chưa có địa chỉ nào</span>
                </div>
              ) : (
                <div className={styles.addressList}>
                  {userAddresses.map((address, index) => (
                    <div key={address._id || index} className={styles.addressItem}>
                      <div className={styles.addressHeader}>
                        <div className={styles.addressName}>
                          <strong>{address.fullName}</strong>
                          {address.isDefault && (
                            <span className={styles.defaultBadge}>Mặc định</span>
                          )}
                        </div>
                        <div className={styles.addressPhone}>{address.phone}</div>
                      </div>
                      <div className={styles.addressDetails}>
                        <div className={styles.addressLine}>{address.addressLine}</div>
                        <div className={styles.addressLocation}>
                          {address.ward}, {address.district}, {address.city}
                        </div>
                      </div>
                      <div className={styles.addressMeta}>
                        <span className={styles.createdDate}>
                          Tạo: {new Date(address.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className={styles.ordersTab}>
              <div className={styles.ordersHeader}>
                <h4>Lịch sử {userOrders.length} đơn hàng gần nhất</h4>
              </div>
              
              {isLoadingOrders ? (
                <div className={styles.loadingState}>
                  <span>Đang tải đơn hàng...</span>
                </div>
              ) : userOrders.length === 0 ? (
                <div className={styles.emptyState}>
                  <span>Người dùng chưa có đơn hàng nào</span>
                </div>
              ) : (
                <div className={styles.orderList}>
                  {userOrders.map((order) => (
                    <div 
                      key={order._id} 
                      className={styles.orderItem}
                      onClick={() => handleOrderClick(order._id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className={styles.orderHeader}>
                        <div className={styles.orderCode}>
                          <strong>#{order.orderCode}</strong>
                        </div>
                        <div 
                          className={styles.orderStatus}
                          style={{ color: getOrderStatusColor(order.status) }}
                        >
                          {order.status}
                        </div>
                      </div>
                      <div className={styles.orderDetails}>
                        <div className={styles.orderMoney}>
                          <span>Tổng tiền: </span>
                          <strong style={{ color: '#1E40AF' }}>
                            {order.finalTotal?.toLocaleString('vi-VN')}₫
                          </strong>
                        </div>
                        <div className={styles.orderDate}>
                          {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className={styles.modalActions}>
          <div className={styles.leftActions}>
            <button
              onClick={handleToggleStatus}
              className={`${styles.actionButton} ${user.isActive ? styles.lockButton : styles.unlockButton}`}
            >
              {user.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
            </button>
            
            <select
              value={user.role}
              onChange={(e) => handleRoleChange(e.target.value as 'customer' | 'admin')}
              className={styles.roleSelect}
            >
              <option value="customer">Khách hàng</option>
              <option value="admin">Quản trị viên</option>
            </select>
          </div>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrderId && (
        <OrderDetailModal
          orderId={selectedOrderId}
          isOpen={isOrderDetailModalOpen}
          onClose={handleCloseOrderModal}
        />
      )}
    </div>
  );
}
