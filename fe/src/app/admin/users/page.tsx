"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../contexts/AuthContext";
import { useApiNotification } from "../../../hooks/useApiNotification";
import { User } from "../../../types";
import { userService } from "../../../services";
import { orderService } from "../../../services/orderService";
import UserModal from "./components/UserModal";
import OrderDetailModal from "../../../components/OrderDetailModal";
import styles from "./user-admin.module.css";

interface UserFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  role?: 'customer' | 'admin';
  isActive?: boolean;
}

interface UserApiResponse {
  success: boolean;
  message: string;
  data: User[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export default function AdminUsersPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { showSuccess, showError } = useApiNotification();
  
  // Users data & pagination
  const [users, setUsers] = useState<User[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [usersPerPage] = useState(12);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Statistics
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    adminUsers: 0,
    lockedUsers: 0,
    activeUsers: 0
  });
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'customer' | 'admin'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modals
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
  const [selectedUserOrders, setSelectedUserOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  // Orders pagination
  const [ordersCurrentPage, setOrdersCurrentPage] = useState(1);
  const [ordersTotalPages, setOrdersTotalPages] = useState(1);
  const [ordersTotalItems, setOrdersTotalItems] = useState(0);
  const [ordersPerPage] = useState(10);

  // Order Detail Modal
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isOrderDetailModalOpen, setIsOrderDetailModalOpen] = useState(false);

  // Page jump functionality
  const [showPageInput, setShowPageInput] = useState(false);
  const [pageInputValue, setPageInputValue] = useState('');

  // Fetch users with debouncing for search
  useEffect(() => {
    console.log('[DEBUG] Filter useEffect triggered - admin access handled by layout');
    if (isLoading || !user || user.role !== "admin") return;
    
    if (searchTerm || filterRole !== 'all' || filterStatus !== 'all' || sortBy !== 'createdAt' || sortOrder !== 'desc') {
      console.log('[DEBUG] Using debounced fetch due to filters/search');
      const timeoutId = setTimeout(() => {
        if (currentPage !== 1) {
          setCurrentPage(1);
        } else {
          fetchUsers();
        }
      }, searchTerm ? 500 : 0);

      return () => clearTimeout(timeoutId);
    } else {
      console.log('[DEBUG] Using direct fetch (no filters)');
      fetchUsers();
    }
  }, [isLoading, user, filterRole, filterStatus, searchTerm, sortBy, sortOrder]);

  // Fetch users on page change
  useEffect(() => {
    console.log('[DEBUG] Page change useEffect triggered', { currentPage, isLoading, user: !!user, role: user?.role });
    if (isLoading || !user || user.role !== "admin") return;
    fetchUsers();
  }, [currentPage, isLoading, user]);

  // Initial fetch when auth is complete
  useEffect(() => {
    console.log('[DEBUG] Initial fetch useEffect', { isLoading, user: !!user, role: user?.role });
    if (!isLoading && user && user.role === "admin") {
      console.log('[DEBUG] Triggering initial fetchUsers()');
      fetchUsers();
      fetchUserStats();
    }
  }, [isLoading, user]);

  const fetchUserStats = async () => {
    try {
      setIsLoadingStats(true);
      const response = await userService.getUserStatistics();
      console.log('[DEBUG] User statistics response:', response);
      
      // Backend returns statistics in 'overview' object
      const overview = response.overview || response;
      const roleDistribution = response.roleDistribution || {};
      
      setUserStats({
        totalUsers: overview.totalUsers || 0,
        adminUsers: roleDistribution.admin || 0,
        lockedUsers: overview.inactiveUsers || 0,
        activeUsers: overview.activeUsers || 0
      });
    } catch (error: any) {
      console.error('[DEBUG] Error fetching user stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true);
      
      const filters: UserFilters = {
        page: currentPage,
        limit: usersPerPage,
        search: searchTerm || undefined,
        role: (filterRole !== 'all' && filterRole) ? filterRole as 'customer' | 'admin' : undefined,
        isActive: filterStatus !== 'all' ? (filterStatus === 'active') : undefined,
        sortBy,
        sortOrder
      };

      console.log('[DEBUG] Fetching users with filters:', filters);
      const response = await userService.getAllUsers(filters) as any; // Cast as any để bypass type check tạm thời
      console.log('[DEBUG] Users response structure:', Object.keys(response || {}));
      console.log('[DEBUG] Users response:', response);

      // Xử lý response dựa trên structure thực tế từ backend
      const usersData = response?.data || [];
      const pagination = response?.pagination || {};
      
      setUsers(Array.isArray(usersData) ? usersData : []);
      setTotalPages(pagination.totalPages || response?.totalPages || 1);
      setTotalUsers(pagination.total || pagination.totalItems || response?.total || usersData.length);

      console.log('[DEBUG] Users state updated:', {
        usersCount: usersData.length,
        currentPage,
        totalPages: pagination.totalPages || response?.totalPages || 1,
        totalUsers: pagination.totalItems || response?.total || usersData.length
      });

    } catch (error: any) {
      console.error('[DEBUG] Error fetching users:', error);
      showError('Lỗi tải dữ liệu', error.message);
      setUsers([]);
      setTotalPages(1);
      setTotalUsers(0);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Handlers
  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setIsUserModalOpen(true);
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await userService.toggleUserActiveStatus(userId);
      fetchUsers(); // Refresh list
      showSuccess(`${currentStatus ? 'Khóa' : 'Mở khóa'} tài khoản thành công`);
    } catch (error: any) {
      showError('Lỗi cập nhật trạng thái', error.message);
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: 'customer' | 'admin') => {
    try {
      await userService.updateUserRole(userId, newRole);
      fetchUsers(); // Refresh list
      showSuccess('Cập nhật vai trò thành công');
    } catch (error: any) {
      showError('Lỗi cập nhật vai trò', error.message);
    }
  };

  const handleViewUserOrders = async (user: User) => {
    setSelectedUser(user);
    setOrdersCurrentPage(1); // Reset to first page
    setIsOrdersModalOpen(true);
    await fetchUserOrders(user._id, 1);
  };

  const fetchUserOrders = async (userId: string, page: number = ordersCurrentPage) => {
    try {
      setIsLoadingOrders(true);
      
      // Fetch user orders with pagination
      const ordersResponse = await orderService.getOrdersByUserId(userId, {
        page,
        limit: ordersPerPage,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      }) as any;
      
      console.log('[DEBUG] Orders response:', ordersResponse);
      
      // Handle nested response structure from backend
      let orders = [];
      let pagination = null;
      
      if (ordersResponse?.data?.documents) {
        // Backend returns: { data: { documents: [...], pagination: {...} } }
        orders = ordersResponse.data.documents;
        pagination = ordersResponse.data.pagination;
      } else if (Array.isArray(ordersResponse?.data)) {
        // Backend returns: { data: [...] }
        orders = ordersResponse.data;
      } else if (Array.isArray(ordersResponse)) {
        // Direct array response
        orders = ordersResponse;
      }
      
      console.log('[DEBUG] Processed orders:', orders);
      console.log('[DEBUG] Pagination:', pagination);
      
      setSelectedUserOrders(orders);
      
      // Update pagination state
      if (pagination) {
        setOrdersCurrentPage(pagination.page);      // API returns 'page'
        setOrdersTotalPages(pagination.pages);      // API returns 'pages' 
        setOrdersTotalItems(pagination.total);      // API returns 'total'
        console.log('[DEBUG] Pagination state updated:', {
          currentPage: pagination.page,
          totalPages: pagination.pages,
          totalItems: pagination.total
        });
      } else {
        // If no pagination, assume single page
        setOrdersCurrentPage(1);
        setOrdersTotalPages(1);
        setOrdersTotalItems(orders.length);
        console.log('[DEBUG] No pagination, single page:', orders.length);
      }
    } catch (error: any) {
      console.error('[DEBUG] Error fetching orders:', error);
      showError('Lỗi tải đơn hàng', error.message);
      setSelectedUserOrders([]);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const handleOrdersPageChange = async (page: number) => {
    if (selectedUser && page >= 1 && page <= ordersTotalPages && page !== ordersCurrentPage && !isLoadingOrders) {
      await fetchUserOrders(selectedUser._id, page);
    }
  };

  const handleViewOrderDetail = (orderId: string) => {
    setSelectedOrderId(orderId);
    setIsOrderDetailModalOpen(true);
  };

  const handleCloseOrderDetailModal = () => {
    setSelectedOrderId(null);
    setIsOrderDetailModalOpen(false);
  };

  // Pagination handlers
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage && !isLoadingUsers) {
      setCurrentPage(page);
    }
  };

  const handlePageIndicatorClick = () => {
    setShowPageInput(true);
    setPageInputValue(currentPage.toString());
  };

  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetPage = parseInt(pageInputValue);
    if (!isNaN(targetPage) && targetPage >= 1 && targetPage <= totalPages && targetPage !== currentPage) {
      goToPage(targetPage);
    }
    setShowPageInput(false);
    setPageInputValue('');
  };

  const handlePageInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowPageInput(false);
      setPageInputValue('');
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handlePageInputSubmit(e as any);
    }
  };

  const handlePageInputBlur = () => {
    setTimeout(() => {
      setShowPageInput(false);
      setPageInputValue('');
    }, 150);
  };

  // Clear filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterRole('all');
    setFilterStatus('all');
    setSortBy('createdAt');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  const getRoleColor = (role: string) => {
    return role === 'admin' ? '#dc2626' : '#6c47ff';
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? '#10b981' : '#6b7280';
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}>Đang tải...</div>
      </div>
    );
  }

  return (
    <div className={styles.adminContainer}>
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <h1 className={styles.pageTitle}>Quản lý người dùng</h1>
          <p className={styles.pageSubtitle}>
            Quản lý tài khoản người dùng, phân quyền và trạng thái hoạt động
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>👥</div>
          <div className={styles.statContent}>
            <div className={styles.statNumber}>{isLoadingStats ? '...' : userStats.totalUsers}</div>
            <div className={styles.statLabel}>Tổng người dùng</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>👑</div>
          <div className={styles.statContent}>
            <div className={styles.statNumber}>{isLoadingStats ? '...' : userStats.adminUsers}</div>
            <div className={styles.statLabel}>Quản trị viên</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>🔒</div>
          <div className={styles.statContent}>
            <div className={styles.statNumber}>{isLoadingStats ? '...' : userStats.lockedUsers}</div>
            <div className={styles.statLabel}>Tài khoản bị khóa</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>✅</div>
          <div className={styles.statContent}>
            <div className={styles.statNumber}>{isLoadingStats ? '...' : userStats.activeUsers}</div>
            <div className={styles.statLabel}>Đang hoạt động</div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className={styles.filtersContainer}>
        <div className={styles.filtersGrid}>
          {/* Search */}
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Tìm kiếm</label>
            <input
              type="text"
              placeholder="Tìm theo email hoặc tên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          {/* Role Filter */}
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Vai trò</label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as any)}
              className={styles.filterSelect}
            >
              <option value="all">Tất cả vai trò</option>
              <option value="customer">Khách hàng</option>
              <option value="admin">Quản trị viên</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Trạng thái</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
              className={styles.filterSelect}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Đã khóa</option>
            </select>
          </div>

          {/* Sort */}
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Sắp xếp</label>
            <div className={styles.sortContainer}>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={styles.sortSelect}
              >
                <option value="createdAt">Ngày tạo</option>
                <option value="name">Tên</option>
                <option value="email">Email</option>
              </select>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className={styles.sortSelect}
              >
                <option value="desc">Giảm dần</option>
                <option value="asc">Tăng dần</option>
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>&nbsp;</label>
            <button 
              onClick={handleClearFilters}
              className={styles.clearButton}
            >
              Xóa bộ lọc
            </button>
          </div>
        </div>
      </div>

      {/* Users Grid */}
      <div className={styles.usersGrid}>
        {isLoadingUsers ? (
          <div className={styles.loadingGrid}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className={`${styles.userCard} ${styles.loadingCard}`}>
                <div className={styles.loadingContent}>Đang tải...</div>
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>👥</div>
            <h3 className={styles.emptyTitle}>Không tìm thấy người dùng</h3>
            <p className={styles.emptyDescription}>
              Thử thay đổi bộ lọc hoặc tạo người dùng mới
            </p>
          </div>
        ) : (
          users.map((user) => (
            <div key={user._id} className={styles.userCard}>
              <div className={styles.userHeader}>
                <div className={styles.userInfo}>
                  <h3 className={styles.userName}>{user.name || 'Chưa có tên'}</h3>
                  <p className={styles.userEmail}>{user.email}</p>
                </div>
                <div className={styles.userBadges}>
                  <span 
                    className={styles.roleBadge}
                    style={{ backgroundColor: getRoleColor(user.role) }}
                  >
                    {user.role === 'admin' ? 'Admin' : 'Khách hàng'}
                  </span>
                  <span 
                    className={styles.statusBadge}
                    style={{ backgroundColor: getStatusColor(user.isActive) }}
                  >
                    {user.isActive ? 'Hoạt động' : 'Đã khóa'}
                  </span>
                </div>
              </div>

              <div className={styles.userDetails}>
                <div className={styles.userMeta}>
                  <span className={styles.metaLabel}>SĐT:</span>
                  <span className={styles.metaValue}>{user.phone || 'Chưa có'}</span>
                </div>
                <div className={styles.userMeta}>
                  <span className={styles.metaLabel}>Ngày tạo:</span>
                  <span className={styles.metaValue}>
                    {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              </div>

              <div className={styles.userActions}>
                <button
                  onClick={() => handleViewUser(user)}
                  className={styles.viewButton}
                >
                  Xem chi tiết
                </button>
                <button
                  onClick={() => handleViewUserOrders(user)}
                  className={styles.ordersButton}
                >
                  Xem đơn hàng
                </button>
                <button
                  onClick={() => handleToggleUserStatus(user._id, user.isActive)}
                  className={`${styles.statusButton} ${user.isActive ? styles.lockButton : styles.unlockButton}`}
                >
                  {user.isActive ? 'Khóa' : 'Mở khóa'}
                </button>
                <select
                  value={user.role}
                  onChange={(e) => handleUpdateUserRole(user._id, e.target.value as 'customer' | 'admin')}
                  className={styles.roleSelect}
                >
                  <option value="customer">Khách hàng</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {!isLoadingUsers && totalPages > 1 && (
        <div className={styles.paginationContainer}>
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className={`${styles.paginationButton} ${currentPage === 1 ? styles.disabled : ''}`}
          >
            ← Trước
          </button>

          <div className={styles.paginationNumbers}>
            {(() => {
              const pages = [];
              const maxVisible = 5;
              let startPage = Math.max(1, currentPage - 2);
              let endPage = Math.min(totalPages, startPage + maxVisible - 1);
              startPage = Math.max(1, endPage - maxVisible + 1);

              if (startPage > 1) {
                pages.push(
                  <button key={1} onClick={() => goToPage(1)} className={styles.pageNumber}>
                    1
                  </button>
                );
                if (startPage > 2) {
                  pages.push(<span key="dots1" className={styles.pageDots}>...</span>);
                }
              }

              for (let i = startPage; i <= endPage; i++) {
                pages.push(
                  <button
                    key={i}
                    onClick={() => goToPage(i)}
                    className={`${styles.pageNumber} ${i === currentPage ? styles.active : ''}`}
                  >
                    {i}
                  </button>
                );
              }

              if (endPage < totalPages) {
                if (endPage < totalPages - 1) {
                  pages.push(<span key="dots2" className={styles.pageDots}>...</span>);
                }
                pages.push(
                  <button key={totalPages} onClick={() => goToPage(totalPages)} className={styles.pageNumber}>
                    {totalPages}
                  </button>
                );
              }

              return pages;
            })()}
          </div>

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`${styles.paginationButton} ${currentPage === totalPages ? styles.disabled : ''}`}
          >
            Sau →
          </button>

          <div className={styles.pageInfo}>
            {showPageInput ? (
              <form onSubmit={handlePageInputSubmit} style={{ display: 'contents' }}>
                <input
                  type="number"
                  value={pageInputValue}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || (!isNaN(parseInt(value)) && parseInt(value) >= 1 && parseInt(value) <= totalPages)) {
                      setPageInputValue(value);
                    }
                  }}
                  onKeyDown={handlePageInputKeyDown}
                  onBlur={handlePageInputBlur}
                  min="1"
                  max={totalPages}
                  autoFocus
                  className={styles.pageJumpInput}
                  placeholder={currentPage.toString()}
                />
                <span>/{totalPages}</span>
              </form>
            ) : (
              <div 
                onClick={handlePageIndicatorClick}
                className={styles.pageClickable}
                title="Click để nhảy đến trang"
              >
                {currentPage}/{totalPages}
              </div>
            )}
            <div className={styles.totalInfo}>
              Tổng: {totalUsers} người dùng
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <UserModal
        user={selectedUser}
        isOpen={isUserModalOpen}
        onClose={() => {
          setIsUserModalOpen(false);
          setSelectedUser(null);
        }}
        onToggleStatus={handleToggleUserStatus}
        onUpdateRole={handleUpdateUserRole}
      />

      {/* Orders Modal */}
      {isOrdersModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsOrdersModalOpen(false)}>
          <div className={styles.ordersModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Đơn hàng của {selectedUser?.name || selectedUser?.email}</h2>
              <button
                onClick={() => setIsOrdersModalOpen(false)}
                className={styles.closeButton}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              {isLoadingOrders ? (
                <div className={styles.loadingSpinner}>Đang tải đơn hàng...</div>
              ) : !Array.isArray(selectedUserOrders) || selectedUserOrders.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>📦</div>
                  <p>Người dùng chưa có đơn hàng nào</p>
                </div>
              ) : (
                <div className={styles.ordersList}>
                  {selectedUserOrders.map((order: any) => (
                    <div key={order._id} className={styles.orderCard}>
                      <div className={styles.orderHeader}>
                        <div 
                          className={`${styles.orderId} ${styles.clickableOrderId}`}
                          onClick={() => handleViewOrderDetail(order._id)}
                          title="Click để xem chi tiết đơn hàng"
                        >
                          Đơn hàng #{order.orderCode || order._id?.slice(-8)}
                        </div>
                        <div className={`${styles.orderStatus} ${styles[`status_${order.status}`]}`}>
                          {order.status}
                        </div>
                      </div>
                      <div className={styles.orderInfo}>
                        <div className={styles.orderDetail}>
                          <strong>Tổng tiền:</strong> {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.finalTotal || order.totalAmount || order.total || 0)}
                        </div>
                        <div className={styles.orderDetail}>
                          <strong>Ngày đặt:</strong> {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                        </div>
                        <div className={styles.orderDetail}>
                          <strong>Số sản phẩm:</strong> {order.items?.length || 0}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Orders Pagination - Moved outside modalBody */}
            {!isLoadingOrders && selectedUserOrders.length > 0 && (
              <div className={styles.ordersPagination}>
                <div className={styles.paginationInfo}>
                  {ordersTotalPages > 1 ? (
                    <>Trang {ordersCurrentPage} / {ordersTotalPages} - Tổng: {ordersTotalItems} đơn hàng</>
                  ) : (
                    <>Tổng: {ordersTotalItems} đơn hàng</>
                  )}
                </div>
                {ordersTotalPages > 1 && (
                  <div className={styles.paginationControls}>
                    <button
                      onClick={() => handleOrdersPageChange(ordersCurrentPage - 1)}
                      disabled={ordersCurrentPage <= 1 || isLoadingOrders}
                      className={styles.pageButton}
                    >
                      « Trước
                    </button>
                    
                    {Array.from({ length: Math.min(5, ordersTotalPages) }, (_, i) => {
                      const page = ordersCurrentPage <= 3 
                        ? i + 1 
                        : ordersCurrentPage >= ordersTotalPages - 2 
                          ? ordersTotalPages - 4 + i 
                          : ordersCurrentPage - 2 + i;
                      
                      if (page < 1 || page > ordersTotalPages) return null;
                      
                      return (
                        <button
                          key={page}
                          onClick={() => handleOrdersPageChange(page)}
                          disabled={isLoadingOrders}
                          className={`${styles.pageButton} ${page === ordersCurrentPage ? styles.activePage : ''}`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => handleOrdersPageChange(ordersCurrentPage + 1)}
                      disabled={ordersCurrentPage >= ordersTotalPages || isLoadingOrders}
                      className={styles.pageButton}
                    >
                      Sau »
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      <OrderDetailModal
        orderId={selectedOrderId}
        isOpen={isOrderDetailModalOpen}
        onClose={handleCloseOrderDetailModal}
      />
    </div>
  );
}
