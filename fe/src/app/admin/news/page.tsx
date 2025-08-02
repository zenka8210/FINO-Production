"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../contexts/AuthContext";
import { useApiNotification } from "../../../hooks/useApiNotification";
import { useAdminPosts } from "../../../hooks/useAdminPosts";
import { Post, PostWithAuthor } from "../../../types";
import styles from "./news-admin.module.css";

interface PostFilters {
  page?: number;
  limit?: number;
  search?: string;
  isPublished?: boolean;
}

interface PostFormData {
  title: string;
  content: string;
  describe: string;
  image: string;
  isPublished: boolean;
}

interface PostWithStats extends PostWithAuthor {
  viewCount?: number;
}

export default function AdminNewsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { showSuccess, showError } = useApiNotification();
  const {
    loading,
    error,
    clearError,
    getPosts,
    createPost,
    updatePost,
    deletePost,
    getPostStatistics,
  } = useAdminPosts();
  
  // Posts data & pagination
  const [posts, setPosts] = useState<PostWithStats[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const [postsPerPage] = useState(12);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);

  // Statistics
  const [postStats, setPostStats] = useState({
    totalPosts: 0,
    publishedPosts: 0,
    draftPosts: 0
  });
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [formData, setFormData] = useState<PostFormData>({
    title: '',
    content: '',
    describe: '',
    image: '',
    isPublished: true
  });

  // Page jump functionality
  const [showPageInput, setShowPageInput] = useState(false);
  const [pageInputValue, setPageInputValue] = useState('');

  // Auth check
  useEffect(() => {
    if (isLoading) return;
    
    if (!user || user.role !== "admin") {
      router.replace("/login");
      return;
    }
  }, [user, isLoading, router]);

  // Load data on component mount and filter changes
  useEffect(() => {
    if (!user || user.role !== "admin" || isLoading) return;
    loadPostsData();
    loadStatistics();
  }, [user, isLoading, currentPage, searchTerm, filterStatus, sortBy, sortOrder]);

  const loadPostsData = async () => {
    try {
      setIsLoadingPosts(true);
      clearError();
      
      const filters: PostFilters & { sortBy?: string; sortOrder?: string } = {
        page: currentPage,
        limit: postsPerPage,
        search: searchTerm || undefined,
        isPublished: filterStatus === 'published' ? true : filterStatus === 'draft' ? false : undefined,
        sortBy: sortBy,
        sortOrder: sortOrder
      };
      
      const response = await getPosts(filters);
      setPosts(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalPosts(response.pagination?.total || 0);
    } catch (err: any) {
      console.error('Error loading posts:', err);
      showError('Không thể tải danh sách bài viết');
      setPosts([]);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  const loadStatistics = async () => {
    try {
      setIsLoadingStats(true);
      const stats = await getPostStatistics();
      setPostStats(stats);
    } catch (err: any) {
      console.error('Error loading statistics:', err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleCreatePost = () => {
    setSelectedPost(null);
    setIsCreating(true);
    setFormData({
      title: '',
      content: '',
      describe: '',
      image: '',
      isPublished: true
    });
    setShowModal(true);
  };

  const handleEditPost = (post: PostWithAuthor) => {
    setSelectedPost({
      ...post,
      author: typeof post.author === 'object' ? post.author._id : post.author
    });
    setIsCreating(false);
    setFormData({
      title: post.title,
      content: post.content,
      describe: post.describe,
      image: post.image,
      isPublished: post.isPublished
    });
    setShowModal(true);
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bài viết này?')) return;
    
    try {
      await deletePost(postId);
      showSuccess('Xóa bài viết thành công');
      loadPostsData();
      loadStatistics();
    } catch (err: any) {
      console.error('Error deleting post:', err);
      showError('Không thể xóa bài viết');
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim() || !formData.describe.trim() || !formData.image.trim()) {
      showError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      if (isCreating) {
        await createPost(formData);
        showSuccess('Tạo bài viết thành công');
      } else if (selectedPost) {
        await updatePost(selectedPost._id, formData);
        showSuccess('Cập nhật bài viết thành công');
      }
      
      setShowModal(false);
      loadPostsData();
      loadStatistics();
    } catch (err: any) {
      console.error('Error saving post:', err);
      showError(isCreating ? 'Không thể tạo bài viết' : 'Không thể cập nhật bài viết');
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handlePageJump = () => {
    const page = parseInt(pageInputValue);
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setShowPageInput(false);
      setPageInputValue('');
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

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}>Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className={styles.pageContainer}>
        {/* Page Header */}
        <div className={styles.pageHeader}>
          <div className={styles.headerContent}>
            <h1 className={styles.pageTitle}>📰 Quản lý tin tức</h1>
            <p className={styles.pageSubtitle}>
              Quản lý và theo dõi các bài viết tin tức trên hệ thống
            </p>
          </div>
          <button 
            onClick={handleCreatePost}
            className={styles.createButton}
          >
            ➕ Tạo bài viết mới
          </button>
        </div>

        {/* Statistics Cards */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📰</div>
            <div className={styles.statContent}>
              <h3>{isLoadingStats ? '...' : postStats.totalPosts}</h3>
              <p>Tổng bài viết</p>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIcon}>✅</div>
            <div className={styles.statContent}>
              <h3>{isLoadingStats ? '...' : postStats.publishedPosts}</h3>
              <p>Đã xuất bản</p>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📝</div>
            <div className={styles.statContent}>
              <h3>{isLoadingStats ? '...' : postStats.draftPosts}</h3>
              <p>Bản nháp</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className={styles.filtersContainer}>
          <div className={styles.filtersGrid}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Tìm kiếm (real-time)</label>
              <input
                type="text"
                placeholder="Tìm theo tiêu đề, mô tả..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.formInput}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Trạng thái</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'published' | 'draft')}
                className={styles.formSelect}
              >
                <option value="all">Tất cả</option>
                <option value="published">✅ Đã xuất bản</option>
                <option value="draft">📝 Bản nháp</option>
              </select>
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Sắp xếp</label>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order as 'asc' | 'desc');
                }}
                className={styles.formSelect}
              >
                <option value="createdAt-desc">Mới nhất</option>
                <option value="createdAt-asc">Cũ nhất</option>
                <option value="title-asc">Tên A-Z</option>
                <option value="title-desc">Tên Z-A</option>
              </select>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className={styles.mainContent}>
          <div className="row">
            <div className="col-12">
              <div className={styles.contentCard}>
                <div className={styles.contentHeader}>
                  <h3 className={styles.contentTitle}>
                    Danh sách bài viết ({totalPosts})
                  </h3>
                </div>
                
                <div className={styles.contentBody}>
                  {isLoadingPosts ? (
                    <div className={styles.loadingContainer}>
                      <div className={styles.loadingSpinner}>Đang tải bài viết...</div>
                    </div>
                  ) : posts.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                      <p>Không tìm thấy bài viết nào</p>
                    </div>
                  ) : (
                    <table className={styles.newsTable}>
                      <thead>
                        <tr>
                          <th>Bài viết</th>
                          <th>Trạng thái</th>
                          <th>Tác giả</th>
                          <th>Ngày tạo</th>
                          <th>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {posts.map((post) => (
                          <tr key={post._id}>
                            <td>
                              <div className={styles.newsItem}>
                                <img 
                                  src={post.image} 
                                  alt={post.title}
                                  className={styles.newsImage}
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/images/placeholder.jpg';
                                  }}
                                />
                                <div className={styles.newsDetails}>
                                  <h4>{post.title}</h4>
                                  <p>{post.describe}</p>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className={`${styles.statusBadge} ${
                                post.isPublished ? styles.statusPublished : styles.statusDraft
                              }`}>
                                {post.isPublished ? 'Đã xuất bản' : 'Bản nháp'}
                              </span>
                            </td>
                            <td>
                              <div className={styles.authorText}>
                                {post.author?.name || 'Unknown'}
                              </div>
                            </td>
                            <td>
                              <div className={styles.dateText}>
                                {formatDate(post.createdAt)}
                              </div>
                            </td>
                            <td>
                              <div className={styles.actionButtons}>
                                <button
                                  onClick={() => handleEditPost(post)}
                                  className={`${styles.actionButton} ${styles.editButton}`}
                                  title="Chỉnh sửa"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => handleDeletePost(post._id)}
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
                  )}
                </div>

                {/* Pagination */}
                {!isLoadingPosts && posts.length > 0 && (
                  <div className={styles.paginationContainer}>                    
                    <div className={styles.paginationControls}>
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage <= 1}
                        className={styles.pageButton}
                      >
                        ← Trước
                      </button>
                      
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`${styles.pageButton} ${currentPage === pageNum ? styles.active : ''}`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        className={styles.pageButton}
                      >
                        Sau →
                      </button>
                      
                      {totalPages > 5 && (
                        <div style={{ marginLeft: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {showPageInput ? (
                            <>
                              <input
                                type="number"
                                min="1"
                                max={totalPages}
                                value={pageInputValue}
                                onChange={(e) => setPageInputValue(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handlePageJump()}
                                className={styles.formInput}
                                style={{ width: '80px', padding: '0.25rem 0.5rem' }}
                                placeholder="Trang"
                                autoFocus
                              />
                              <button onClick={handlePageJump} className={styles.pageButton}>
                                Đi
                              </button>
                              <button 
                                onClick={() => {
                                  setShowPageInput(false);
                                  setPageInputValue('');
                                }}
                                className={styles.pageButton}
                              >
                                ✕
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setShowPageInput(true)}
                              className={styles.pageButton}
                            >
                              Đến trang...
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderContent}>
                <div className={styles.modalIcon}>
                  {isCreating ? '📝' : '✏️'}
                </div>
                <div>
                  <h2 className={styles.modalTitle}>
                    {isCreating ? 'Tạo bài viết mới' : 'Chỉnh sửa bài viết'}
                  </h2>
                  <p className={styles.modalSubtitle}>
                    {isCreating ? 'Tạo một bài viết mới cho trang web' : 'Cập nhật thông tin bài viết'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className={styles.modalCloseButton}
                type="button"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className={styles.modalScrollArea}>
              <form onSubmit={handleSubmitForm} className={styles.modalForm}>
                <div className={styles.formContainer}>
                  {/* Title Field */}
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>
                      <span className={styles.labelText}>Tiêu đề bài viết</span>
                      <span className={styles.requiredMark}>*</span>
                    </label>
                    <div className={styles.inputWrapper}>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className={styles.textInput}
                        placeholder="Nhập tiêu đề hấp dẫn cho bài viết"
                        required
                      />
                    </div>
                  </div>

                  {/* Description Field */}
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>
                      <span className={styles.labelText}>Mô tả ngắn</span>
                      <span className={styles.requiredMark}>*</span>
                    </label>
                    <div className={styles.inputWrapper}>
                      <textarea
                        value={formData.describe}
                        onChange={(e) => setFormData({ ...formData, describe: e.target.value })}
                        className={styles.textareaInput}
                        placeholder="Viết mô tả ngắn gọn, thu hút về nội dung bài viết"
                        rows={3}
                        required
                      />
                      <div className={styles.inputHint}>
                        Mô tả sẽ hiển thị trong danh sách bài viết và kết quả tìm kiếm
                      </div>
                    </div>
                  </div>

                  {/* Image Field */}
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>
                      <span className={styles.labelText}>Hình ảnh đại diện</span>
                      <span className={styles.requiredMark}>*</span>
                    </label>
                    <div className={styles.inputWrapper}>
                      <input
                        type="url"
                        value={formData.image}
                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                        className={styles.textInput}
                        placeholder="https://example.com/image.jpg"
                        required
                      />
                      <div className={styles.inputHint}>
                        URL hình ảnh chất lượng cao, tỷ lệ 16:9 được khuyến nghị
                      </div>
                      {formData.image && (
                        <div className={styles.imagePreview}>
                          <img src={formData.image} alt="Preview" className={styles.previewImage} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content Field */}
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>
                      <span className={styles.labelText}>Nội dung bài viết</span>
                      <span className={styles.requiredMark}>*</span>
                    </label>
                    <div className={styles.inputWrapper}>
                      <textarea
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        className={styles.contentTextarea}
                        placeholder="Nhập nội dung chi tiết của bài viết. Bạn có thể sử dụng HTML tags để định dạng."
                        rows={8}
                        required
                      />
                      <div className={styles.inputHint}>
                        Hỗ trợ HTML tags: &lt;p&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;ul&gt;, &lt;ol&gt;, &lt;li&gt;
                      </div>
                    </div>
                  </div>

                  {/* Status Field */}
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>
                      <span className={styles.labelText}>Trạng thái xuất bản</span>
                    </label>
                    <div className={styles.statusToggle}>
                      <div className={styles.statusOptions}>
                        <label className={`${styles.statusOption} ${!formData.isPublished ? styles.active : ''}`}>
                          <input
                            type="radio"
                            name="publishStatus"
                            checked={!formData.isPublished}
                            onChange={() => setFormData({ ...formData, isPublished: false })}
                            className={styles.statusRadio}
                          />
                          <div className={styles.statusContent}>
                            <div className={styles.statusIcon}>📝</div>
                            <div className={styles.statusInfo}>
                              <span className={styles.statusTitle}>Bản nháp</span>
                              <span className={styles.statusDesc}>Chưa hiển thị công khai</span>
                            </div>
                          </div>
                        </label>
                        
                        <label className={`${styles.statusOption} ${formData.isPublished ? styles.active : ''}`}>
                          <input
                            type="radio"
                            name="publishStatus"
                            checked={formData.isPublished}
                            onChange={() => setFormData({ ...formData, isPublished: true })}
                            className={styles.statusRadio}
                          />
                          <div className={styles.statusContent}>
                            <div className={styles.statusIcon}>✅</div>
                            <div className={styles.statusInfo}>
                              <span className={styles.statusTitle}>Xuất bản</span>
                              <span className={styles.statusDesc}>Hiển thị công khai</span>
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className={styles.modalFooter}>
                  <div className={styles.footerActions}>
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className={styles.cancelButton}
                      disabled={loading}
                    >
                      <span>Hủy bỏ</span>
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className={styles.submitButton}
                    >
                      {loading ? (
                        <>
                          <div className={styles.loadingSpinner}></div>
                          <span>Đang xử lý...</span>
                        </>
                      ) : (
                        <>
                          <span>{isCreating ? '✨ Tạo bài viết' : '💾 Cập nhật'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
