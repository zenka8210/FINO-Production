"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../contexts/AuthContext";
import { useApiNotification } from "../../../hooks/useApiNotification";
import { useAdminCategories } from "../../../hooks/useAdminCategories";
import { Category } from "../../../types";
import styles from "./category-admin.module.css";

interface CategoryFilters {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  hasParent?: boolean;
}

interface CategoryFormData {
  name: string;
  description?: string;
  parent?: string; // For hierarchy support  
  isActive: boolean;
}

interface CategoryWithStats extends Category {
  productCount?: number;
  childrenCount?: number;
  hasChildren?: boolean;
  hasProducts?: boolean;
}

export default function AdminCategoriesPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { showSuccess, showError } = useApiNotification();
  const {
    loading,
    error,
    clearError,
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    permanentlyDeleteCategory,
    getCategoryStatistics,
  } = useAdminCategories();
  
  // Categories data & pagination
  const [categories, setCategories] = useState<CategoryWithStats[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]); // For parent dropdown
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCategories, setTotalCategories] = useState(0);
  const [categoriesPerPage] = useState(12);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  // Statistics
  const [categoryStats, setCategoryStats] = useState({
    totalCategories: 0,
    activeCategories: 0,
    inactiveCategories: 0,
    parentCategories: 0,
    childCategories: 0,
    totalProducts: 0,
    categoriesWithProducts: 0,
    categoryStructure: {
      parentCount: 0,
      childCount: 0,
      avgChildrenPerParent: 0
    }
  });
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState('displayOrder');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    parent: '', // For hierarchy
    isActive: true
  });

  // Page jump functionality
  const [showPageInput, setShowPageInput] = useState(false);
  const [pageInputValue, setPageInputValue] = useState('');

  // Helper function to get parent category name
  const getParentCategoryName = (parentId: string) => {
    const parent = allCategories.find(cat => cat._id === parentId);
    return parent ? parent.name : 'Không xác định';
  };

  // Auth check
  useEffect(() => {
    console.log('[DEBUG] Auth check - isLoading:', isLoading, 'user:', user);
    if (isLoading) return;
    if (!user || user.role !== "admin") {
      console.log('[DEBUG] Redirecting to login - user role:', user?.role);
      router.replace("/login");
      return;
    }
    console.log('[DEBUG] User is admin, should fetch categories');
  }, [user, router, isLoading]);

  // Fetch categories with debouncing for search
  useEffect(() => {
    console.log('[DEBUG] Filter useEffect triggered', { isLoading, user: !!user, role: user?.role });
    if (isLoading || !user || user.role !== "admin") return;
    
    if (searchTerm || filterStatus !== 'all' || sortBy !== 'displayOrder' || sortOrder !== 'asc') {
      console.log('[DEBUG] Using debounced fetch due to filters/search');
      const timeoutId = setTimeout(() => {
        if (currentPage !== 1) {
          setCurrentPage(1);
        } else {
          fetchCategories();
        }
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      fetchCategories();
    }
  }, [searchTerm, filterStatus, sortBy, sortOrder, currentPage, isLoading, user]);

  // Fetch stats on mount
  useEffect(() => {
    if (isLoading || !user || user.role !== "admin") return;
    fetchCategoryStats();
    fetchAllCategories(); // Load all categories for parent dropdown
  }, [isLoading, user]);

  const fetchCategoryStats = async () => {
    try {
      setIsLoadingStats(true);
      const response = await getCategoryStatistics();
      console.log('[DEBUG] Category statistics response:', response);
      
      setCategoryStats({
        totalCategories: response.totalCategories || 0,
        activeCategories: response.activeCategories || 0,
        inactiveCategories: response.inactiveCategories || 0,
        parentCategories: response.parentCategories || 0,
        childCategories: response.childCategories || 0,
        totalProducts: response.totalProducts || 0,
        categoriesWithProducts: response.categoriesWithProducts || 0,
        categoryStructure: response.categoryStructure || {
          parentCount: 0,
          childCount: 0,
          avgChildrenPerParent: 0
        }
      });
    } catch (error: any) {
      console.error('[DEBUG] Error fetching category stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setIsLoadingCategories(true);
      clearError();
      
      const filters: CategoryFilters = {
        page: currentPage,
        limit: categoriesPerPage,
        search: searchTerm || undefined,
        isActive: filterStatus === 'active' ? true : filterStatus === 'inactive' ? false : undefined,
        hasParent: true // Only get child categories
      };
      
      console.log('[DEBUG] Fetching categories with filters:', filters);
      const response = await getCategories(filters);
      console.log('[DEBUG] Categories response:', response);
      
      if (response && response.data) {
        // Enhance categories with product count from backend
        const categoriesWithStats = response.data.map((cat: Category) => ({
          ...cat,
          productCount: cat.productCount || 0,
          hasChildren: false, // Will be populated if needed
          hasProducts: (cat.productCount || 0) > 0
        }));
        
        setCategories(categoriesWithStats);
        setTotalPages(response.pagination?.totalPages || 1);
        setTotalCategories(response.pagination?.total || 0);
      } else {
        setCategories([]);
        setTotalPages(1);
        setTotalCategories(0);
      }
    } catch (error: any) {
      console.error('[DEBUG] Error fetching categories:', error);
      showError('Không thể tải danh sách danh mục', error);
      setCategories([]);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  // Fetch all categories for parent dropdown
  const fetchAllCategories = async () => {
    try {
      const response = await getCategories({ limit: 1000, isActive: true });
      if (response && response.data) {
        setAllCategories(response.data);
      }
    } catch (error: any) {
      console.error('[DEBUG] Error fetching all categories:', error);
    }
  };

  const handleCreateCategory = () => {
    setSelectedCategory(null);
    setIsCreating(true);
    setFormData({
      name: '',
      description: '',
      parent: '',
      isActive: true
    });
    setShowModal(true);
  };

  const handleEditCategory = (category: CategoryWithStats) => {
    setSelectedCategory(category);
    setIsCreating(false);
    setFormData({
      name: category.name,
      description: category.description || '',
      parent: category.parent || '',
      isActive: category.isActive
    });
    setShowModal(true);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    const categoryToDelete = categories.find(cat => cat._id === categoryId);
    const categoryName = categoryToDelete?.name || 'danh mục này';
    
    if (!confirm(`Bạn có chắc chắn muốn vô hiệu hóa danh mục "${categoryName}"?\n\nLưu ý: Danh mục sẽ bị ẩn khỏi hệ thống nhưng không bị xóa vĩnh viễn để bảo toàn dữ liệu.`)) return;
    
    try {
      await deleteCategory(categoryId);
      showSuccess(`Đã vô hiệu hóa danh mục "${categoryName}" thành công. Danh mục sẽ không còn hiển thị trên hệ thống.`);
      fetchCategories();
      fetchCategoryStats();
    } catch (error: any) {
      // Parse error message to provide more specific feedback
      if (error.message.includes('danh mục con')) {
        showError('Không thể vô hiệu hóa danh mục vì còn danh mục con đang hoạt động. Vui lòng vô hiệu hóa các danh mục con trước.', error);
      } else if (error.message.includes('sản phẩm')) {
        showError('Không thể vô hiệu hóa danh mục vì còn sản phẩm đang sử dụng. Vui lòng chuyển sản phẩm sang danh mục khác hoặc xóa sản phẩm trước.', error);
      } else {
        showError('Không thể vô hiệu hóa danh mục', error);
      }
    }
  };

  const handleHideEmptyCategory = async (categoryId: string) => {
    if (!confirm('Bạn có chắc chắn muốn ẩn danh mục này? Danh mục sẽ ngưng hoạt động và không hiển thị trên trang chủ.')) return;
    
    try {
      await updateCategory(categoryId, { isActive: false });
      showSuccess('Đã ẩn danh mục thành công');
      fetchCategories();
      fetchCategoryStats();
    } catch (error: any) {
      showError('Không thể ẩn danh mục', error);
    }
  };

  const handleReactivateCategory = async (categoryId: string) => {
    const categoryToReactivate = categories.find(cat => cat._id === categoryId);
    const categoryName = categoryToReactivate?.name || 'danh mục này';
    
    if (!confirm(`Bạn có chắc chắn muốn kích hoạt lại danh mục "${categoryName}"?`)) return;
    
    try {
      await updateCategory(categoryId, { isActive: true });
      showSuccess(`Đã kích hoạt lại danh mục "${categoryName}" thành công`);
      fetchCategories();
      fetchCategoryStats();
    } catch (error: any) {
      showError('Không thể kích hoạt lại danh mục', error);
    }
  };

  const handlePermanentDeleteCategory = async (categoryId: string) => {
    const categoryToDelete = categories.find(cat => cat._id === categoryId);
    const categoryName = categoryToDelete?.name || 'danh mục này';
    
    if (!confirm(`⚠️ CẢNH BÁO: Bạn có chắc chắn muốn XÓA VĨNH VIỄN danh mục "${categoryName}" khỏi database?\n\nHành động này KHÔNG THỂ HOÀN TÁC và có thể ảnh hưởng đến:\n- Dữ liệu đơn hàng cũ\n- Tham chiếu trong hệ thống\n- Báo cáo thống kê\n\nChỉ xóa khi bạn hoàn toàn chắc chắn!`)) return;
    
    // Double confirmation
    if (!confirm(`Xác nhận lần cuối: XÓA VĨNH VIỄN danh mục "${categoryName}"?`)) return;
    
    try {
      await permanentlyDeleteCategory(categoryId);
      showSuccess(`Đã xóa vĩnh viễn danh mục "${categoryName}" khỏi database`);
      fetchCategories();
      fetchCategoryStats();
    } catch (error: any) {
      showError('Không thể xóa vĩnh viễn danh mục', error);
    }
  };

  const handleSaveCategory = async () => {
    try {
      if (isCreating) {
        await createCategory(formData);
        showSuccess('Tạo danh mục thành công');
      } else if (selectedCategory) {
        await updateCategory(selectedCategory._id, formData);
        showSuccess('Cập nhật danh mục thành công');
      }
      
      setShowModal(false);
      fetchCategories();
      fetchCategoryStats();
    } catch (error: any) {
      showError(
        isCreating ? 'Không thể tạo danh mục' : 'Không thể cập nhật danh mục',
        error
      );
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handlePageJump = () => {
    const pageNum = parseInt(pageInputValue);
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
      setShowPageInput(false);
      setPageInputValue('');
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}>Đang tải...</div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="container">
      <div className={styles.pageContainer}>
        {/* Page Header */}
        <div className={styles.pageHeader}>
          <div className={styles.headerContent}>
            <h1 className={styles.pageTitle}>Quản lý danh mục</h1>
            <p className={styles.pageSubtitle}>
              Quản lý các danh mục sản phẩm trong hệ thống
            </p>
          </div>
          <button
            onClick={handleCreateCategory}
            className={styles.createButton}
          >
            ➕ Tạo danh mục mới
          </button>
        </div>

        {/* Statistics Cards */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📁</div>
            <div className={styles.statContent}>
              <h3>{isLoadingStats ? '...' : categoryStats.totalCategories}</h3>
              <p>Tổng danh mục</p>
              <small className={styles.statDetail}>
                {isLoadingStats ? '...' : `${categoryStats.parentCategories || 0} cha • ${categoryStats.childCategories || 0} con`}
              </small>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIcon}>✅</div>
            <div className={styles.statContent}>
              <h3>{isLoadingStats ? '...' : categoryStats.activeCategories}</h3>
              <p>Đang hoạt động</p>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIcon}>❌</div>
            <div className={styles.statContent}>
              <h3>{isLoadingStats ? '...' : categoryStats.inactiveCategories}</h3>
              <p>Ngưng hoạt động</p>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📦</div>
            <div className={styles.statContent}>
              <h3>{isLoadingStats ? '...' : categoryStats.totalProducts}</h3>
              <p>Tổng sản phẩm</p>
            </div>
          </div>
        </div>

        {/* Simplified Filters */}
        <div className={styles.filtersContainer}>
          <div className={styles.filtersGrid}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>🔍 Tìm kiếm danh mục</label>
              <input
                type="text"
                placeholder="Nhập tên danh mục để tìm kiếm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>📊 Trạng thái hoạt động</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
                className={styles.filterSelect}
              >
                <option value="all">🔄 Tất cả trạng thái</option>
                <option value="active">✅ Đang hoạt động</option>
                <option value="inactive">❌ Ngưng hoạt động</option>
              </select>
            </div>

            {(searchTerm || filterStatus !== 'all') && (
              <div className={styles.filterGroup}>
                <button
                  onClick={handleClearFilters}
                  className={styles.clearFiltersButton}
                >
                  🔄 Đặt lại bộ lọc
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Categories Content */}
        <div className={styles.categoriesContent}>
          {/* Loading State */}
          {isLoadingCategories && (
            <div className={styles.loadingGrid}>
              {[...Array(6)].map((_, i) => (
                <div key={i} className={styles.skeletonCard}>
                  <div className={styles.skeletonContent}>
                    <div className={styles.skeletonTitle}></div>
                    <div className={styles.skeletonText}></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && !isLoadingCategories && (
            <div className={styles.errorState}>
              <div className={styles.errorIcon}>⚠️</div>
              <h3>Có lỗi xảy ra</h3>
              <p>{error}</p>
              <button 
                onClick={fetchCategories} 
                className={styles.retryButton}
              >
                🔄 Thử lại
              </button>
            </div>
          )}

          {/* Empty State */}
          {!isLoadingCategories && !error && categories.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📁</div>
              <h3>Không có danh mục nào</h3>
              <p>
                {searchTerm || filterStatus !== 'all'
                  ? 'Không tìm thấy danh mục phù hợp với bộ lọc'
                  : 'Chưa có danh mục nào trong hệ thống'}
              </p>
              {!searchTerm && filterStatus === 'all' && (
                <button
                  onClick={handleCreateCategory}
                  className={styles.primaryButton}
                >
                  ➕ Tạo danh mục đầu tiên
                </button>
              )}
            </div>
          )}

          {/* Categories Grid */}
          {!isLoadingCategories && !error && categories.length > 0 && (
            <>
              <div className={styles.categoriesGrid}>
                {categories.map((category) => (
                  <div key={category._id} className={`${styles.categoryCard} ${(category.productCount || 0) === 0 ? styles.emptyCategory : ''}`}>
                    <div className={styles.categoryContent}>
                      <div className={styles.categoryLeft}>
                        <div className={styles.categoryInfo}>
                          <div className={styles.categoryHeader}>
                            <h3 className={styles.categoryName}>
                              {category.name}
                            </h3>
                          </div>
                          {category.description && (
                            <p className={styles.categoryDescription}>
                              {category.description}
                            </p>
                          )}
                          <div className={styles.categoryMeta}>
                            <span className={`${styles.statusBadge} ${category.isActive ? styles.active : styles.inactive}`}>
                              {category.isActive ? '✅ Hoạt động' : '❌ Ngưng'}
                            </span>
                            
                            {/* Smart product count display */}
                            {(category.productCount || 0) > 0 ? (
                              <span className={styles.productCountBadge}>
                                📦 {category.productCount} sản phẩm
                              </span>
                            ) : (
                              <span className={styles.emptyProductBadge}>
                                📭 Chưa có sản phẩm
                              </span>
                            )}
                          </div>
                          
                          {/* Warning and actions for empty categories */}
                          {(category.productCount || 0) === 0 && category.isActive && (
                            <div className={styles.emptyWarning}>
                              <p className={styles.warningText}>
                                ⚠️ Danh mục này chưa có sản phẩm nào. Bạn có muốn tạm ẩn để tránh hiển thị trống trên trang chủ?
                              </p>
                              <button
                                onClick={() => handleHideEmptyCategory(category._id)}
                                className={styles.hideButton}
                              >
                                👁️‍🗨️ Tạm ẩn danh mục
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className={styles.categoryActions}>
                        <button
                          onClick={() => handleEditCategory(category)}
                          className={styles.editButton}
                          title="Chỉnh sửa"
                        >
                          ✏️
                        </button>
                        {category.isActive ? (
                          <button
                            onClick={() => handleDeleteCategory(category._id)}
                            className={styles.deleteButton}
                            title="Vô hiệu hóa danh mục (ẩn khỏi hệ thống)"
                          >
                            ❌
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReactivateCategory(category._id)}
                            className={styles.activateButton}
                            title="Kích hoạt lại danh mục"
                          >
                            ✅
                          </button>
                        )}
                        <button
                          onClick={() => handlePermanentDeleteCategory(category._id)}
                          className={styles.permanentDeleteButton}
                          title="Xóa vĩnh viễn khỏi database (NGUY HIỂM)"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className={styles.paginationContainer}>
                  <div className={styles.paginationInfo}>
                    Hiển thị {((currentPage - 1) * categoriesPerPage) + 1}-{Math.min(currentPage * categoriesPerPage, totalCategories)} / {totalCategories} danh mục
                  </div>
                  
                  <div className={styles.paginationControls}>
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={styles.paginationButton}
                    >
                      ← Trước
                    </button>
                    
                    <div className={styles.paginationNumbers}>
                      {[...Array(Math.min(5, totalPages))].map((_, index) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = index + 1;
                        } else if (currentPage <= 3) {
                          pageNum = index + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + index;
                        } else {
                          pageNum = currentPage - 2 + index;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`${styles.paginationNumber} ${currentPage === pageNum ? styles.active : ''}`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={styles.paginationButton}
                    >
                      Sau →
                    </button>
                    
                    <div className={styles.pageJumpContainer}>
                      {!showPageInput ? (
                        <button 
                          onClick={() => setShowPageInput(true)}
                          className={styles.pageJumpButton}
                        >
                          Nhảy đến...
                        </button>
                      ) : (
                        <div className={styles.pageJumpInput}>
                          <input
                            type="number"
                            min={1}
                            max={totalPages}
                            value={pageInputValue}
                            onChange={(e) => setPageInputValue(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handlePageJump()}
                            placeholder="Trang"
                            className={styles.pageInput}
                          />
                          <button onClick={handlePageJump} className={styles.pageJumpConfirm}>
                            Đi
                          </button>
                          <button 
                            onClick={() => {
                              setShowPageInput(false);
                              setPageInputValue('');
                            }}
                            className={styles.pageJumpCancel}
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Category Modal */}
        {showModal && (
          <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>{isCreating ? 'Thêm danh mục mới' : 'Chỉnh sửa danh mục'}</h2>
                <button onClick={() => setShowModal(false)} className={styles.closeButton}>
                  ✕
                </button>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Tên danh mục *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={styles.formInput}
                    placeholder="Nhập tên danh mục"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Mô tả</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className={styles.formTextarea}
                    placeholder="Nhập mô tả danh mục"
                    rows={3}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Danh mục cha</label>
                  <select
                    value={formData.parent}
                    onChange={(e) => setFormData({ ...formData, parent: e.target.value })}
                    className={styles.formSelect}
                  >
                    <option value="">-- Không có (Danh mục gốc) --</option>
                    {allCategories
                      .filter(cat => cat._id !== selectedCategory?._id) // Prevent self-reference
                      .map(cat => (
                        <option key={cat._id} value={cat._id}>
                          {cat.name}
                        </option>
                      ))
                    }
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Trạng thái</label>
                  <select
                    value={formData.isActive ? 'active' : 'inactive'}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'active' })}
                    className={styles.formSelect}
                  >
                    <option value="active">Hoạt động</option>
                    <option value="inactive">Ngưng hoạt động</option>
                  </select>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  onClick={() => setShowModal(false)}
                  className={styles.cancelButton}
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveCategory}
                  className={styles.saveButton}
                  disabled={!formData.name.trim() || loading}
                >
                  {loading ? 'Đang lưu...' : isCreating ? 'Tạo danh mục' : 'Lưu thay đổi'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
