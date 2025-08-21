"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../contexts/AuthContext";
import { useAdminVouchers } from "../../../hooks/useAdminVouchers";
import { useApiNotification } from "../../../hooks/useApiNotification";
import { Voucher, CreateVoucherRequest } from "../../../types";
import styles from "./voucher-admin.module.css";

export default function VoucherPage() {
  console.log('🎯 VoucherPage component rendered');
  const { user, isLoading } = useAuth();
  console.log('👤 User state:', { user, isLoading });
  const router = useRouter();
  const { showSuccess, showError } = useApiNotification();
  const {
    loading,
    error,
    clearError,
    getVouchers,
    createVoucher,
    updateVoucher,
    deleteVoucher,
    toggleVoucherStatus,
    getVoucherStatistics,
  } = useAdminVouchers();

  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [statistics, setStatistics] = useState({
    totalVouchers: 0,
    activeVouchers: 0,
    expiredVouchers: 0,
    usedVouchers: 0,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalVouchers, setTotalVouchers] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [editing, setEditing] = useState<Voucher | null>(null);

  // Form states
  const [code, setCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [minimumOrderValue, setMinimumOrderValue] = useState(0);
  const [maximumOrderValue, setMaximumOrderValue] = useState(0);
  const [maximumDiscountAmount, setMaximumDiscountAmount] = useState(200000);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [totalUsageLimit, setTotalUsageLimit] = useState(1000);
  const [isOneTimePerUser, setIsOneTimePerUser] = useState(true);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    // Admin access control is handled by AdminLayout
    fetchVouchers();
    fetchStatistics();
  }, [currentPage, filterStatus, debouncedSearchTerm, sortBy, sortOrder]);

  const fetchVouchers = async () => {
    try {
      console.log('🔄 Fetching vouchers...', { currentPage, debouncedSearchTerm, filterStatus, sortBy, sortOrder });
      clearError();
      
      const filters = {
        page: currentPage,
        limit: 20,
        search: debouncedSearchTerm || undefined,
        isActive: filterStatus === 'active' ? true : filterStatus === 'inactive' ? false : undefined,
        sortBy: sortBy,
        sortOrder: sortOrder
      };
      
      const response = await getVouchers(filters);
      console.log('✅ Vouchers fetched:', response);
      
      setVouchers(Array.isArray(response.data) ? response.data : []);
      setTotalPages(response.totalPages || response.pagination?.totalPages || 1);
      setTotalVouchers(response.total || response.pagination?.total || 0);
    } catch (err: any) {
      console.error('❌ Error fetching vouchers:', err);
      setVouchers([]);
      showError('Lỗi tải danh sách voucher', err);
    }
  };

  const fetchStatistics = async () => {
    try {
      console.log('🔄 Fetching statistics...');
      const stats = await getVoucherStatistics();
      console.log('✅ Statistics fetched:', stats);
      setStatistics(stats);
    } catch (err: any) {
      console.error('❌ Error fetching statistics:', err);
      // Set default statistics if API fails
      setStatistics({
        totalVouchers: 0,
        activeVouchers: 0,
        expiredVouchers: 0,
        usedVouchers: 0,
      });
    }
  };

  const handleSortChange = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setSortBy('createdAt');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  const resetForm = () => {
    setCode("");
    setDiscountPercent(0);
    setMinimumOrderValue(0);
    setMaximumOrderValue(0);
    setMaximumDiscountAmount(200000);
    setStartDate("");
    setEndDate("");
    setTotalUsageLimit(1000);
    setIsOneTimePerUser(true);
    setEditing(null);
    setShowCreateModal(false);
  };

  const handleCreateVoucher = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const handleEditVoucher = (voucher: Voucher) => {
    setEditing(voucher);
    setCode(voucher.code);
    setDiscountPercent(voucher.discountPercent);
    setMinimumOrderValue(voucher.minimumOrderValue);
    setMaximumOrderValue(voucher.maximumOrderValue || 0);
    setMaximumDiscountAmount(voucher.maximumDiscountAmount);
    setStartDate(voucher.startDate.split('T')[0]);
    setEndDate(voucher.endDate.split('T')[0]);
    setTotalUsageLimit(voucher.totalUsageLimit || 1000);
    setIsOneTimePerUser(voucher.isOneTimePerUser);
    setShowCreateModal(true);
  };

  const handleDeleteVoucher = (voucher: Voucher) => {
    setSelectedVoucher(voucher);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedVoucher) return;

    try {
      await deleteVoucher(selectedVoucher._id);
      showSuccess('Xóa voucher thành công!');
      setShowDeleteModal(false);
      setSelectedVoucher(null);
      fetchVouchers();
      fetchStatistics();
    } catch (err: any) {
      showError('Lỗi xóa voucher', err);
    }
  };

  const handleToggleStatus = async (voucher: Voucher) => {
    try {
      await toggleVoucherStatus(voucher._id);
      showSuccess(`${voucher.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'} voucher thành công!`);
      fetchVouchers();
      fetchStatistics();
    } catch (err: any) {
      showError('Lỗi thay đổi trạng thái voucher', err);
    }
  };

  const handleSubmitForm = async () => {
    if (!code || !discountPercent || !startDate || !endDate) {
      showError('Vui lòng nhập đầy đủ thông tin bắt buộc!');
      return;
    }
    
    try {
      const voucherData: CreateVoucherRequest = {
        code,
        discountPercent,
        minimumOrderValue,
        maximumOrderValue: maximumOrderValue || undefined,
        maximumDiscountAmount,
        startDate,
        endDate,
        totalUsageLimit,
        isOneTimePerUser,
      };
      
      if (editing) {
        await updateVoucher(editing._id, voucherData);
        showSuccess('Cập nhật voucher thành công!');
      } else {
        await createVoucher(voucherData);
        showSuccess('Thêm voucher thành công!');
      }
      
      resetForm();
      fetchVouchers();
      fetchStatistics();
    } catch (err: any) {
      showError(editing ? 'Lỗi cập nhật voucher' : 'Lỗi tạo voucher', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('vi-VN') + 'đ';
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Đang tải...</p>
      </div>
    );
  }

  const isVoucherActive = (voucher: Voucher) => {
    const now = new Date();
    const start = new Date(voucher.startDate);
    const end = new Date(voucher.endDate);
    return voucher.isActive && start <= now && now <= end;
  };

  const isVoucherExpired = (voucher: Voucher) => {
    const now = new Date();
    const end = new Date(voucher.endDate);
    return now > end;
  };

  const getStatusBadge = (voucher: Voucher) => {
    if (isVoucherExpired(voucher)) {
      return <span className={styles.statusBadge} style={{ background: '#ef4444' }}>Đã hết hạn/Vô hiệu hóa</span>;
    }
    if (voucher.isActive) {
      return <span className={styles.statusBadge} style={{ background: '#10b981' }}>Hoạt động</span>;
    }
    return <span className={styles.statusBadge} style={{ background: '#6b7280' }}>Vô hiệu hóa</span>;
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Đang tải...</p>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className={styles.container}>
        <div className={styles.pageContainer}>
          <h1>Không có quyền truy cập</h1>
          <p>Bạn cần quyền admin để truy cập trang này.</p>
        </div>
      </div>
    );
  }
  return (
    <div className={styles.container}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className={styles.pageContainer}>
          {/* Page Header */}
          <div className={styles.pageHeader}>
            <div className={styles.headerContent}>
              <div className={styles.titleSection}>
                <h1 className={styles.pageTitle}>Quản lý Voucher</h1>
                <p className={styles.pageSubtitle}>
                  Quản lý tất cả voucher giảm giá trong hệ thống
                </p>
              </div>
              <div className={styles.headerActions}>
                <button
                  onClick={handleCreateVoucher}
                  className={styles.createButton}
                >
                  <span>➕</span>
                  Tạo voucher mới
                </button>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          {statistics && (
            <div className={styles.statsContainer}>
              <div className={styles.statsCard}>
                <div className={styles.statsIcon}>🎫</div>
                <div className={styles.statsContent}>
                  <h3>{statistics.totalVouchers || 0}</h3>
                  <p>Tổng voucher</p>
                </div>
              </div>
              <div className={styles.statsCard}>
                <div className={styles.statsIcon}>✅</div>
                <div className={styles.statsContent}>
                  <h3>{statistics.activeVouchers || 0}</h3>
                  <p>Đang hoạt động</p>
                </div>
              </div>
              <div className={styles.statsCard}>
                <div className={styles.statsIcon}>⏰</div>
                <div className={styles.statsContent}>
                  <h3>{statistics.expiredVouchers || 0}</h3>
                  <p>Đã hết hạn/Vô hiệu hóa</p>
                </div>
              </div>
              <div className={styles.statsCard}>
                <div className={styles.statsIcon}>📊</div>
                <div className={styles.statsContent}>
                  <h3>{statistics.usedVouchers || 0}</h3>
                  <p>Đã sử dụng</p>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className={styles.filtersContainer}>
            <div className={styles.searchContainer}>
              <input
                type="text"
                placeholder="Tìm kiếm theo mã voucher, mô tả..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            
            <div className={styles.filterGroup}>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Đang hoạt động</option>
                <option value="inactive">Vô hiệu hóa</option>
              </select>

              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [newSortBy, newSortOrder] = e.target.value.split('-');
                  setSortBy(newSortBy);
                  setSortOrder(newSortOrder);
                }}
                className={styles.filterSelect}
              >
                <option value="createdAt-desc">Mới nhất</option>
                <option value="createdAt-asc">Cũ nhất</option>
                <option value="discountPercent-desc">Giảm giá cao nhất</option>
                <option value="discountPercent-asc">Giảm giá thấp nhất</option>
                <option value="endDate-asc">Sắp hết hạn</option>
              </select>

              <button
                onClick={resetFilters}
                className={styles.resetFiltersButton}
              >
                Đặt lại bộ lọc
              </button>
            </div>
          </div>

          {/* Content Header */}
          <div className={styles.contentHeader}>
            <h2 className={styles.contentTitle}>
              {debouncedSearchTerm || filterStatus !== 'all' 
                ? `Kết quả tìm kiếm (${totalVouchers} voucher)` 
                : `Danh sách voucher (${totalVouchers} voucher)`}
            </h2>
          </div>

          {/* Vouchers Table */}
          <div className={styles.tableContainer}>
            {loading ? (
              <div className={styles.loadingState}>
                <div className={styles.spinner}></div>
                <p>Đang tải danh sách voucher...</p>
              </div>
            ) : vouchers.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>🎫</div>
                <h3>Không có voucher nào</h3>
                <p>Chưa có voucher nào phù hợp với tiêu chí tìm kiếm.</p>
              </div>
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.vouchersTable}>
                  <thead>
                    <tr>
                      <th onClick={() => handleSortChange('code')} className={styles.sortableHeader}>
                        Mã voucher
                        {sortBy === 'code' && (
                          <span className={styles.sortIcon}>
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </th>
                      <th onClick={() => handleSortChange('discountPercent')} className={styles.sortableHeader}>
                        Giảm giá
                        {sortBy === 'discountPercent' && (
                          <span className={styles.sortIcon}>
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </th>
                      <th>Điều kiện</th>
                      <th>Thời gian</th>
                      <th>Sử dụng</th>
                      <th>Trạng thái</th>
                      <th onClick={() => handleSortChange('createdAt')} className={styles.sortableHeader}>
                        Ngày tạo
                        {sortBy === 'createdAt' && (
                          <span className={styles.sortIcon}>
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vouchers.map((voucher) => (
                      <tr key={voucher._id}>
                        <td>
                          <div className={styles.voucherCode}>{voucher.code}</div>
                        </td>
                        <td>
                          <div className={styles.discountBadge}>
                            {voucher.discountPercent}%
                          </div>
                          {voucher.maximumDiscountAmount && (
                            <div className={styles.usageInfo}>
                              Tối đa: {formatCurrency(voucher.maximumDiscountAmount)}
                            </div>
                          )}
                        </td>
                        <td>
                          <div className={styles.usageInfo}>
                            Đơn tối thiểu: {formatCurrency(voucher.minimumOrderValue)}
                          </div>
                          {voucher.maximumOrderValue && (
                            <div className={styles.usageInfo}>
                              Đơn tối đa: {formatCurrency(voucher.maximumOrderValue)}
                            </div>
                          )}
                        </td>
                        <td>
                          <div className={styles.dateInfo}>
                            {formatDate(voucher.startDate)} - {formatDate(voucher.endDate)}
                          </div>
                        </td>
                        <td>
                          <div className={styles.usageInfo}>
                            Đã sử dụng: {voucher.usedCount || 0}/{voucher.totalUsageLimit || 1000}
                          </div>
                          <div className={styles.usageInfo}>
                            Giới hạn tổng: {voucher.totalUsageLimit}
                          </div>
                          {voucher.isOneTimePerUser && (
                            <div className={styles.usageInfo}>1 lần/khách</div>
                          )}
                        </td>
                        <td>
                          {getStatusBadge(voucher)}
                        </td>
                        <td>
                          <div className={styles.dateInfo}>
                            {formatDate(voucher.createdAt)}
                          </div>
                        </td>
                        <td>
                          <div className={styles.actions}>
                            <button
                              onClick={() => handleEditVoucher(voucher)}
                              className={`${styles.actionButton} ${styles.editButton}`}
                              title="Sửa"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleToggleStatus(voucher)}
                              className={`${styles.actionButton} ${styles.toggleButton}`}
                              title={voucher.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
                            >
                              {voucher.isActive ? '🔒' : '🔓'}
                            </button>
                            <button
                              onClick={() => handleDeleteVoucher(voucher)}
                              className={`${styles.actionButton} ${styles.deleteButton}`}
                              title="Xóa"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={styles.paginationContainer}>
              <div className={styles.paginationInfo}>
                Hiển thị {((currentPage - 1) * 20) + 1}-{Math.min(currentPage * 20, totalVouchers)} của {totalVouchers} voucher
              </div>
              <div className={styles.paginationButtons}>
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={styles.paginationButton}
                >
                  ← Trước
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const startPage = Math.max(1, currentPage - 2);
                  const pageNumber = startPage + i;
                  if (pageNumber > totalPages) return null;
                  
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => setCurrentPage(pageNumber)}
                      className={`${styles.paginationButton} ${currentPage === pageNumber ? styles.active : ''}`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className={styles.paginationButton}
                >
                  Sau →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {editing ? 'Sửa voucher' : 'Tạo voucher mới'}
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className={styles.closeButton}
              >
                ×
              </button>
            </div>
            
            <div className={styles.modalContent}>
              <div className={styles.modalForm}>
                <div className={styles.modalFormGroup}>
                  <label className={styles.modalLabel}>Mã voucher *</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="VD: SALE20"
                    className={styles.modalInput}
                  />
                </div>
                
                <div className={styles.modalFormGroup}>
                  <label className={styles.modalLabel}>Phần trăm giảm giá (%) *</label>
                  <input
                    type="number"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Number(e.target.value))}
                    min="1"
                    max="100"
                    className={styles.modalInput}
                  />
                </div>

                <div className={styles.modalFormRow}>
                  <div className={styles.modalFormGroup}>
                    <label className={styles.modalLabel}>Giá trị đơn tối thiểu</label>
                    <input
                      type="number"
                      value={minimumOrderValue}
                      onChange={(e) => setMinimumOrderValue(Number(e.target.value))}
                      min="0"
                      className={styles.modalInput}
                    />
                  </div>
                  <div className={styles.modalFormGroup}>
                    <label className={styles.modalLabel}>Giá trị đơn tối đa</label>
                    <input
                      type="number"
                      value={maximumOrderValue}
                      onChange={(e) => setMaximumOrderValue(Number(e.target.value))}
                      min="0"
                      className={styles.modalInput}
                    />
                  </div>
                </div>

                <div className={styles.modalFormGroup}>
                  <label className={styles.modalLabel}>Số tiền giảm tối đa</label>
                  <input
                    type="number"
                    value={maximumDiscountAmount}
                    onChange={(e) => setMaximumDiscountAmount(Number(e.target.value))}
                    min="0"
                    className={styles.modalInput}
                  />
                </div>

                <div className={styles.modalFormRow}>
                  <div className={styles.modalFormGroup}>
                    <label className={styles.modalLabel}>Ngày bắt đầu *</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className={styles.modalInput}
                    />
                  </div>
                  
                  <div className={styles.modalFormGroup}>
                    <label className={styles.modalLabel}>Ngày kết thúc *</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className={styles.modalInput}
                    />
                  </div>
                </div>

                <div className={styles.modalFormGroup}>
                  <label className={styles.modalLabel}>Tổng số lần sử dụng tối đa</label>
                  <input
                    type="number"
                    value={totalUsageLimit}
                    onChange={(e) => setTotalUsageLimit(Number(e.target.value))}
                    min="1"
                    className={styles.modalInput}
                  />
                </div>

                <div className={styles.modalCheckboxGroup}>
                  <input
                    type="checkbox"
                    checked={isOneTimePerUser}
                    onChange={(e) => setIsOneTimePerUser(e.target.checked)}
                    className={styles.modalCheckbox}
                    id="oneTimePerUser"
                  />
                  <label htmlFor="oneTimePerUser" className={styles.modalCheckboxLabel}>
                    Chỉ sử dụng 1 lần/khách hàng
                  </label>
                </div>
              </div>
            </div>
            
            <div className={styles.modalActions}>
              <button
                onClick={() => setShowCreateModal(false)}
                className={`${styles.modalButton} ${styles.cancelButton}`}
              >
                Hủy
              </button>
              <button
                onClick={handleSubmitForm}
                className={`${styles.modalButton} ${styles.confirmButton}`}
                disabled={loading}
              >
                {loading ? 'Đang xử lý...' : (editing ? 'Cập nhật' : 'Tạo voucher')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedVoucher && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Xác nhận xóa voucher</h2>
              <button
                onClick={() => setShowDeleteModal(false)}
                className={styles.closeButton}
              >
                ×
              </button>
            </div>
            
            <div className={styles.modalContent}>
              <p>Bạn có chắc chắn muốn xóa voucher <strong>{selectedVoucher.code}</strong>?</p>
              <p className={styles.modalWarningText}>
                Hành động này không thể hoàn tác.
              </p>
            </div>
            
            <div className={styles.modalActions}>
              <button
                onClick={() => setShowDeleteModal(false)}
                className={`${styles.modalButton} ${styles.cancelButton}`}
              >
                Hủy
              </button>
              <button
                onClick={confirmDelete}
                className={`${styles.modalButton} ${styles.confirmButton}`}
                disabled={loading}
              >
                {loading ? 'Đang xóa...' : 'Xóa voucher'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
