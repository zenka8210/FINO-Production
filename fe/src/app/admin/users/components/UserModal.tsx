import { useState, useEffect } from 'react';
import { User } from '../../../../types';
import { userService, orderService } from '../../../../services';
import { useApiNotification } from '../../../../hooks/useApiNotification';
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
  const [userOrders, setUserOrders] = useState<UserOrders[]>([]);
  const [userAddresses, setUserAddresses] = useState<any[]>([]);

  useEffect(() => {
    if (user && isOpen) {
      setActiveTab('info');
    }
  }, [user, isOpen]);

  // Reset state khi modal đóng
  useEffect(() => {
    if (!isOpen) {
      setActiveTab('info');
      setUserOrders([]);
      setUserAddresses([]);
      setIsLoading(false);
    }
  }, [isOpen]);

  const fetchUserOrders = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
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
      setIsLoading(false);
    }
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

        {/* Tabs - Chỉ có tab thông tin cá nhân */}
        <div className={styles.tabsContainer}>
          <button
            className={`${styles.tab} ${styles.active}`}
            onClick={() => setActiveTab('info')}
          >
            Thông tin cá nhân
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
                    <span className={styles.infoLabel}>Địa chỉ:</span>
                    <span className={styles.infoValue}>{user.address || 'Chưa có'}</span>
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
    </div>
  );
}
