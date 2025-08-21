"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../contexts/AuthContext";
import { useAdminReviews } from "../../../hooks/useAdminReviews";
import { useApiNotification } from "../../../hooks/useApiNotification";
import { ReviewWithRefs } from "../../../types";
import styles from "./review-admin.module.css";

export default function AdminReviewsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { showSuccess, showError } = useApiNotification();
  const {
    loading,
    error,
    getReviews,
    getReviewStatistics,
    deleteReview,
    clearError
  } = useAdminReviews();
  
  const [reviews, setReviews] = useState<ReviewWithRefs[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filterRating, setFilterRating] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<string>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReviews, setTotalReviews] = useState(0);
  const [statistics, setStatistics] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState<ReviewWithRefs | null>(null);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    // Admin access control is handled by AdminLayout
    fetchReviews();
    fetchStatistics();
  }, [currentPage, filterRating, debouncedSearchTerm, sortBy, sortOrder]);

  const fetchReviews = async () => {
    try {
      console.log('🔄 Fetching reviews...', { currentPage, debouncedSearchTerm, filterRating, sortBy, sortOrder });
      clearError();
      
      const filters = {
        page: currentPage,
        limit: 20,
        search: debouncedSearchTerm || undefined,
        rating: filterRating !== 'all' ? filterRating : undefined,
        sortBy,
        sortOrder
      };

      const response = await getReviews(filters);
      
      console.log('✅ Reviews fetched:', response);
      setReviews(Array.isArray(response.data) ? response.data : []);
      setTotalPages(response.totalPages || 1);
      setTotalReviews(response.total || 0);
    } catch (err: any) {
      console.error('❌ Error fetching reviews:', err);
      setReviews([]);
      showError('Lỗi tải danh sách đánh giá', err);
    }
  };

  const fetchStatistics = async () => {
    try {
      console.log('🔄 Fetching statistics...');
      const stats = await getReviewStatistics();
      console.log('✅ Statistics fetched:', stats);
      setStatistics(stats);
    } catch (err) {
      console.error('❌ Error fetching statistics:', err);
      // Set default statistics if API fails
      setStatistics({
        totalReviews: 0,
        averageRating: 0,
        pendingReviews: 0,
        approvedReviews: 0,
        ratingDistribution: [],
        topProducts: []
      });
    }
  };

  const handleDeleteReview = async (review: ReviewWithRefs) => {
    setSelectedReview(review);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedReview) return;
    
    try {
      await deleteReview(selectedReview._id);
      showSuccess('Đã xóa đánh giá thành công');
      setShowDeleteModal(false);
      setSelectedReview(null);
      fetchReviews();
    } catch (err: any) {
      showError('Lỗi xóa đánh giá', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <span key={index} className={index < rating ? styles.starFilled : styles.starEmpty}>
        ★
      </span>
    ));
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSortChange = (newSortBy: string) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
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

  return (
    <div className={styles.container}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className={styles.pageContainer}>
        {/* Page Header */}
        <div className={styles.pageHeader}>
          <div className={styles.headerContent}>
            <div className={styles.titleSection}>
              <h1 className={styles.pageTitle}>Quản lý đánh giá</h1>
              <p className={styles.pageSubtitle}>
                Quản lý tất cả đánh giá sản phẩm từ khách hàng
              </p>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className={styles.statsContainer}>
            <div className={styles.statsCard}>
              <div className={styles.statsIcon}>📊</div>
              <div className={styles.statsContent}>
                <h3>{statistics.totalReviews || 0}</h3>
                <p>Tổng đánh giá</p>
              </div>
            </div>
            <div className={styles.statsCard}>
              <div className={styles.statsIcon}>⭐</div>
              <div className={styles.statsContent}>
                <h3>{statistics.averageRating?.toFixed(1) || '0.0'}</h3>
                <p>Điểm trung bình</p>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className={styles.filtersContainer}>
          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="Tìm kiếm theo tên khách hàng, email hoặc từ khóa trong bình luận..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          
          <div className={styles.filterGroup}>
            <select
              value={filterRating}
              onChange={(e) => setFilterRating(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">Tất cả đánh giá</option>
              <option value="5">5 sao</option>
              <option value="4">4 sao</option>
              <option value="3">3 sao</option>
              <option value="2">2 sao</option>
              <option value="1">1 sao</option>
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
            </select>
          </div>
        </div>

        {/* Content Header */}
        <div className={styles.contentHeader}>
          <h2 className={styles.contentTitle}>
            {debouncedSearchTerm || filterRating !== 'all' 
              ? `Kết quả tìm kiếm (${totalReviews} đánh giá)` 
              : `Danh sách đánh giá (${totalReviews} đánh giá)`}
          </h2>
        </div>

        {/* Reviews Table */}
        <div className={styles.tableContainer}>
          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              <p>Đang tải danh sách đánh giá...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📝</div>
              <h3>Không có đánh giá nào</h3>
              <p>Chưa có đánh giá nào phù hợp với tiêu chí tìm kiếm.</p>
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.reviewsTable}>
                <thead>
                  <tr>
                    <th onClick={() => handleSortChange('user')} className={styles.sortableHeader}>
                      Khách hàng
                      {sortBy === 'user' && (
                        <span className={styles.sortIcon}>
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                    <th onClick={() => handleSortChange('product')} className={styles.sortableHeader}>
                      Sản phẩm
                      {sortBy === 'product' && (
                        <span className={styles.sortIcon}>
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                    <th onClick={() => handleSortChange('rating')} className={styles.sortableHeader}>
                      Đánh giá
                      {sortBy === 'rating' && (
                        <span className={styles.sortIcon}>
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                    <th>Bình luận</th>
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
                  {reviews.map((review) => (
                    <tr key={review._id}>
                      <td>
                        <div className={styles.userInfo}>
                          <div className={styles.userName}>
                            {review.user?.name || 'N/A'}
                          </div>
                          <div className={styles.userEmail}>
                            {review.user?.email || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className={styles.productInfo}>
                          {review.product?.images?.[0] && (
                            <img
                              src={review.product.images[0]}
                              alt={review.product.name}
                              className={styles.productImage}
                            />
                          )}
                          <div className={styles.productDetails}>
                            <div className={styles.productName}>
                              {review.product?.name || 'N/A'}
                            </div>
                            <div className={styles.productPrice}>
                              {review.product?.price?.toLocaleString('vi-VN')}đ
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className={styles.ratingContainer}>
                          <div className={styles.stars}>
                            {renderStars(review.rating)}
                          </div>
                          <span className={styles.ratingNumber}>
                            {review.rating}/5
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className={styles.commentContainer}>
                          <p className={styles.comment}>
                            {review.comment}
                          </p>
                        </div>
                      </td>
                      <td>
                        <div className={styles.dateContainer}>
                          {formatDate(review.createdAt)}
                        </div>
                      </td>
                      <td>
                        <div className={styles.actionButtons}>
                          <button
                            onClick={() => handleDeleteReview(review)}
                            className={`${styles.actionButton} ${styles.deleteButton}`}
                            title="Xóa đánh giá"
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
            <div className={styles.pagination}>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={styles.paginationButton}
              >
                « Trước
              </button>
              
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`${styles.paginationButton} ${
                    currentPage === page ? styles.activePage : ''
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={styles.paginationButton}
              >
                Sau »
              </button>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedReview && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <div className={styles.modalHeader}>
                <h3>Xác nhận xóa đánh giá</h3>
              </div>
              <div className={styles.modalContent}>
                <p>Bạn có chắc chắn muốn xóa đánh giá này?</p>
                <div className={styles.reviewPreview}>
                  <div className={styles.stars}>
                    {renderStars(selectedReview.rating)}
                  </div>
                  <p>"{selectedReview.comment}"</p>
                  <p><strong>Khách hàng:</strong> {selectedReview.user?.name}</p>
                  <p><strong>Sản phẩm:</strong> {selectedReview.product?.name}</p>
                </div>
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
                  className={`${styles.modalButton} ${styles.deleteButton}`}
                  disabled={loading}
                >
                  {loading ? 'Đang xóa...' : 'Xóa'}
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}