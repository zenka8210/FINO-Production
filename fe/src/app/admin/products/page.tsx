"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../contexts/AuthContext";
import { useAdminProducts } from "../../../hooks/useAdminProducts";
import { useApiNotification } from "../../../hooks/useApiNotification";
import AdminTable from "../../../components/AdminTable";
import { ProductWithCategory } from "../../../types";
import { ProductStatisticsCards } from "@/app/components/ui";
import styles from "./product-admin.module.css";
import { categoryService } from '@/services/categoryService';
import { colorService } from '@/services/colorService';
import { sizeService } from '@/services/sizeService';
import { productService } from '@/services/productService';
import { Category, Color, Size } from '@/types';
import { useFileUpload } from '@/hooks/useApiCall';
import { SearchableSelect } from '@/app/components/ui';

export default function AdminProductsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { showSuccess, showError } = useApiNotification();
  const {
    loading,
    error,
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    toggleProductStatus,
    getProductStatistics,
    clearError
  } = useAdminProducts();
  
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStock, setFilterStock] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ProductWithCategory | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statistics, setStatistics] = useState<any>(null);
  
  // Categories for filter dropdown
  const [filterCategories, setFilterCategories] = useState<Category[]>([]);
  const [loadingFilterCategories, setLoadingFilterCategories] = useState(false);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    // Đợi AuthContext load xong trước khi kiểm tra
    if (isLoading) return;
    
    if (!user || user.role !== "admin") {
      router.replace("/login");
      return;
    }
    
    fetchProducts();
    fetchStatistics();
    loadFilterCategories();
  }, [user?.role, isLoading, currentPage, filterCategory, filterStock, debouncedSearchTerm]);

  // Load filter categories once
  const loadFilterCategories = async () => {
    if (filterCategories.length > 0) return; // Don't reload if already loaded
    
    setLoadingFilterCategories(true);
    try {
      const response = await categoryService.getPublicCategories();
      setFilterCategories(response.data || []);
    } catch (error) {
      console.error('Error loading filter categories:', error);
      setFilterCategories([]);
    } finally {
      setLoadingFilterCategories(false);
    }
  };

  const fetchProducts = async () => {
    try {
      console.log('🔄 Fetching products...', { currentPage, debouncedSearchTerm, filterCategory });
      clearError();
      const filters = {
        page: currentPage,
        limit: 20, // Hiển thị 20 sản phẩm mỗi trang
        search: debouncedSearchTerm || undefined,
        category: filterCategory !== 'all' ? filterCategory : undefined,
        // PERFORMANCE: Need variants for stock info but skip expensive review stats
        includeVariants: false, // Use efficient aggregation instead
        includeReviewStats: false, // Admin products list doesn't need reviews
        includeOutOfStock: true // Admin needs to see all products
      };
      
      // Timeout sau 10 giây
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );
      
      const response = await Promise.race([
        getProducts(filters),
        timeoutPromise
      ]) as any;
      
      console.log('✅ Products fetched:', response);
      console.log('📊 Pagination info:', { 
        total: response.total, 
        page: response.page, 
        limit: response.limit, 
        totalPages: response.totalPages 
      });
      console.log('📦 Products data:', response.data?.length, 'items');
      console.log('🔍 Response data type:', typeof response.data, 'isArray:', Array.isArray(response.data));
      console.log('🎨 First product variants:', response.data?.[0]?.variants);
      
      // Safe check for products with variants
      if (Array.isArray(response.data)) {
        console.log('🔍 Products with variants:', response.data.filter((p: any) => p.variants?.length > 0).length);
      } else {
        console.warn('⚠️ Response data is not an array:', response.data);
      }
      
      setProducts(Array.isArray(response.data) ? response.data : []);
      setTotalPages(response.totalPages || 1);
    } catch (err: any) {
      console.error('❌ Error fetching products:', err);
      setProducts([]);
      if (err.message === 'Request timeout') {
        console.error('⚠️ API timeout - server có thể không hoạt động');
      }
    }
  };

  const fetchStatistics = async () => {
    try {
      console.log('🔄 Fetching statistics...');
      const stats = await getProductStatistics();
      console.log('✅ Statistics fetched:', stats);
      setStatistics(stats);
    } catch (err) {
      console.error('❌ Error fetching statistics:', err);
      // Set default statistics if API fails
      setStatistics({
        totalProducts: 0,
        activeProducts: 0,
        lowStockProducts: 0,
        totalVariants: 0
      });
    }
  };

  // Calculate real-time statistics from current products
  const calculateStatistics = () => {
    const currentProducts = products || [];
    
    const totalProducts = currentProducts.length;
    const activeProducts = currentProducts.filter(product => product.isActive).length;
    
    // Use stockInfo from backend instead of variants (since includeVariants: false)
    const lowStockProducts = currentProducts.filter(product => {
      const totalStock = product.stockInfo?.totalStock ?? 0;
      return totalStock <= 5;
    }).length;
    
    const totalVariants = currentProducts.reduce((sum, product) => {
      const productStock = product.stockInfo?.totalStock ?? 0;
      return sum + productStock;
    }, 0);

    return {
      totalProducts,
      activeProducts,
      lowStockProducts,
      totalVariants
    };
  };

  // Filter products based on category, stock and search term
  const filteredProducts = products.filter(product => {
    const matchesCategory = filterCategory === 'all' || 
      product.category._id === filterCategory || 
      product.category.name === filterCategory;
    
    // Use stockInfo from backend instead of variants (since includeVariants: false)
    const stockInfo = (product as any).stockInfo;
    const totalStock = stockInfo?.totalStock ?? 0;
    
    const matchesStock = filterStock === 'all' || 
      (filterStock === 'in-stock' && totalStock > 5) ||
      (filterStock === 'low-stock' && totalStock <= 5 && totalStock > 0) ||
      (filterStock === 'out-of-stock' && totalStock === 0);
    const matchesSearch = searchTerm === '' ||
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesStock && matchesSearch;
  });

  // Status mapping for display
  const getStatusDisplay = (isActive: boolean) => {
    return isActive 
      ? { label: 'Hoạt động', color: 'var(--color-success, #10B981)' }
      : { label: 'Không hoạt động', color: 'var(--color-error, #DC2626)' };
  };

  // Table columns configuration
  const columns = [
    {
      key: 'name',
      title: 'Sản phẩm',
      render: (value: string, product: ProductWithCategory) => (
        <div className="flex items-center space-x-3">
          <img
            src={product.images?.[0] ? (product.images[0].startsWith('http') ? product.images[0] : `http://localhost:5000${product.images[0]}`) : '/images/placeholder.jpg'}
            alt={value}
            className={styles.productImage}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyMEg0MFY0MEgyMFYyMFoiIGZpbGw9IiNEMUQ1REIiLz4KPHN2Zz4K';
            }}
          />
          <div>
            <div className={styles.productName}>{value}</div>
            <div className={styles.productSku}>
              ID: {product._id}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'category',
      title: 'Danh mục',
      render: (value: any, product: ProductWithCategory) => (
        <div className="text-sm font-medium" style={{ color: '#1976d2' }}>
          {product.category.name}
        </div>
      )
    },
    {
      key: 'price',
      title: 'Giá',
      align: 'right' as const,
      render: (value: number, product: ProductWithCategory) => (
        <div className={styles.priceCell}>
          {product.salePrice && product.salePrice > 0 ? (
            <div>
              <div className="font-bold text-red-600">
                {product.salePrice.toLocaleString('vi-VN')}đ
              </div>
              <div className="text-sm line-through text-gray-500">
                {value.toLocaleString('vi-VN')}đ
              </div>
            </div>
          ) : (
            <div className="font-bold">
              {value.toLocaleString('vi-VN')}đ
            </div>
          )}
        </div>
      )
    },
    {
      key: 'stock',
      title: 'Số lượng',
      align: 'center' as const,
      render: (value: number, product: ProductWithCategory) => {
        // Use efficient stockInfo from backend instead of calculating from variants
        const stockInfo = (product as any).stockInfo;
        const totalStock = stockInfo?.totalStock ?? 0;
        const totalVariants = stockInfo?.totalVariants ?? 0;
        
        let stockClass = styles.stockHigh;
        if (totalStock <= 5) stockClass = styles.stockLow;
        else if (totalStock <= 20) stockClass = styles.stockMedium;
        
        return (
          <div className={`${styles.stockCell} ${stockClass}`}>
            {totalStock} sp ({totalVariants} biến thể)
          </div>
        );
      }
    },
    {
      key: 'isActive',
      title: 'Trạng thái',
      align: 'center' as const,
      render: (value: boolean) => {
        return (
          <span 
            className={`${styles.statusBadge} ${value ? styles.statusActive : styles.statusInactive}`}
          >
            {value ? 'Hoạt động' : 'Không hoạt động'}
          </span>
        );
      }
    },
    {
      key: 'createdAt',
      title: 'Ngày tạo',
      align: 'center' as const,
      render: (value: string) => (
        <div className="text-sm">
          {new Date(value).toLocaleDateString('vi-VN')}
        </div>
      )
    },
    {
      key: 'actions',
      title: 'Thao tác',
      align: 'center' as const,
      width: '140px',
      render: (_: any, product: ProductWithCategory) => (
        <div className={styles.actionButtonsContainer}>
          <button
            onClick={() => handleEdit(product)}
            className={`${styles.actionButton} ${styles.editButton}`}
            title="Chỉnh sửa"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => handleToggleStatus(product)}
            className={`${styles.actionButton} ${styles.viewButton}`}
            title={product.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {product.isActive ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              )}
            </svg>
          </button>
          <button
            onClick={() => handleDelete(product)}
            className={`${styles.actionButton} ${styles.deleteButton}`}
            title="Xóa"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )
    }
  ];

  const handleEdit = (product: ProductWithCategory) => {
    setEditing(product);
    setShowForm(true);
  };

  const handleToggleStatus = async (product: ProductWithCategory) => {
    try {
      console.log('🔄 Toggling status for product:', product.name, 'Current status:', product.isActive);
      
      const updatedProduct = await toggleProductStatus(product._id);
      
      // Show success notification
      const action = product.isActive ? 'vô hiệu hóa' : 'kích hoạt';
      const newStatus = updatedProduct.isActive ? 'kích hoạt' : 'vô hiệu hóa';
      showSuccess(`Đã ${action} sản phẩm "${product.name}" thành công! Trạng thái hiện tại: ${newStatus}`);
      
      // Refresh data from server to update UI
      console.log('🔄 Refreshing products data...');
      await fetchProducts();
      console.log('✅ Products data refreshed');
      
    } catch (err: any) {
      console.error('❌ Error toggling product status:', err);
      const action = product.isActive ? 'vô hiệu hóa' : 'kích hoạt';
      showError(`Lỗi ${action} sản phẩm "${product.name}": ${err.message || 'Vui lòng thử lại'}`);
    }
  };

  const handleDelete = async (product: ProductWithCategory) => {
    if (!confirm(`Bạn có chắc muốn xóa sản phẩm "${product.name}"?\nHành động này không thể hoàn tác!`)) {
      return;
    }

    try {
      await deleteProduct(product._id);
      // Refresh data from server
      fetchProducts();
      alert('Xóa sản phẩm thành công!');
    } catch (err: any) {
      console.error('Error deleting product:', err);
      alert(`Lỗi xóa sản phẩm: ${err.message || 'Vui lòng thử lại'}`);
    }
  };

  const handleCreate = () => {
    setEditing(null);
    setShowForm(true);
  };

  const handleSubmit = async (formData: any) => {
    try {
      if (editing) {
        await updateProduct(editing._id, formData);
        alert('Cập nhật sản phẩm thành công!');
      } else {
        await createProduct(formData);
        alert('Thêm sản phẩm thành công!');
      }
      
      // Refresh data from server
      fetchProducts();
      setShowForm(false);
      setEditing(null);
    } catch (err: any) {
      console.error('Error saving product:', err);
      alert(`Lỗi ${editing ? 'cập nhật' : 'thêm'} sản phẩm: ${err.message || 'Vui lòng thử lại'}`);
    }
  };

  // Hiển thị loading khi đang load auth
  if (isLoading) {
    return (
      <div className={styles.adminContainer} style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: '18px', marginBottom: '16px' }}>🔄 Đang xác thực...</div>
        <div style={{ color: '#6b7280' }}>Vui lòng đợi trong giây lát</div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className={styles.adminContainer} style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: '18px', marginBottom: '16px' }}>⚠️ Không có quyền truy cập</div>
        <div style={{ color: '#6b7280' }}>Đang chuyển hướng...</div>
      </div>
    );
  }

  return (
    <div className={styles.adminContainer}>
      {/* Header */}
      <div className={styles.adminHeader}>
        <div>
          <h1>Quản lý sản phẩm</h1>
          <p style={{ color: 'var(--color-muted, #9CA3AF)' }}>
            Quản lý tất cả sản phẩm trong hệ thống
          </p>
        </div>
        <div>
          
          </div>
          <div className={styles.adminActions}>
            <button
              onClick={() => {
                console.log('🔄 Force reload...');
                fetchProducts();
                fetchStatistics();
              }}
              className={styles.secondaryButton}
              style={{ marginRight: '12px' }}
            >
              🔄 Reload
            </button>
            <button
              onClick={async () => {
                console.log('📥 Loading all products (optimized)...');
                try {
                  // Load all products WITHOUT variants and review stats for performance
                  const response = await getProducts({ 
                    limit: 1000, 
                    includeVariants: false, 
                    includeReviewStats: false,
                    includeOutOfStock: true // Admin needs all products
                  });
                  console.log('🔥 All products loaded:', response.data?.length, 'items');
                  setProducts(response.data || []);
                  setTotalPages(response.totalPages || 1);
                  showSuccess(`Đã tải ${response.data?.length || 0} sản phẩm`);
                } catch (err) {
                  console.error('❌ Error loading all:', err);
                  showError('Không thể tải tất cả sản phẩm');
                }
              }}
              className={styles.secondaryButton}
              style={{ marginRight: '12px', fontSize: '12px' }}
              disabled={loading}
            >
              {loading ? '⏳' : '📥'} Load All
            </button>
            <button
              onClick={handleCreate}
              className={styles.primaryButton}
            >
              + Thêm sản phẩm
            </button>
          </div>
        </div>

      
      {/* Statistics Cards */}
      <ProductStatisticsCards statistics={calculateStatistics()} />

      {/* Filters Section */}
      <div className={styles.filtersSection}>
        <div className={styles.filtersRow}>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text, #111827)' }}>
              Tìm kiếm
            </label>
            <input
              type="text"
              placeholder="Tìm theo tên sản phẩm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text, #111827)' }}>
              Danh mục
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className={styles.filterSelect}
              disabled={loadingFilterCategories}
            >
              <option value="all">
                {loadingFilterCategories ? 'Đang tải...' : 'Tất cả danh mục'}
              </option>
              {Array.isArray(filterCategories) && filterCategories.map((category: Category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text, #111827)' }}>
              Tồn kho
            </label>
            <select
              value={filterStock}
              onChange={(e) => setFilterStock(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">Tất cả tồn kho</option>
              <option value="in-stock">Còn hàng (&gt;5)</option>
              <option value="low-stock">Sắp hết hàng (1-5)</option>
              <option value="out-of-stock">Hết hàng (0)</option>
            </select>
          </div>
          <div>
            <div 
              className="text-sm font-medium"
              style={{ color: 'var(--color-text, #111827)' }}
            >
              Tổng: {filteredProducts.length} sản phẩm
            </div>
          </div>
        </div>
      </div>

      {/* Display Error */}
      {error && (
        <div 
          className="mb-4 p-4 rounded-lg border"
          style={{ 
            backgroundColor: '#FEF2F2',
            borderColor: '#FECACA',
            color: 'var(--color-error, #DC2626)'
          }}
        >
          {error}
        </div>
      )}

      {/* Admin Table */}
      {loading ? (
        <div className={styles.tableContainer || 'bg-white rounded-lg p-8'}>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '16px', marginBottom: '12px' }}>🔄 Đang tải dữ liệu sản phẩm...</div>
            <div style={{ color: '#6b7280', fontSize: '14px' }}>
              Nếu tải quá lâu, vui lòng kiểm tra kết nối mạng
            </div>
          </div>
        </div>
      ) : (
        <AdminTable
          data={filteredProducts}
          columns={columns}
          loading={loading}
          error={error}
          itemsPerPage={20}
          searchTerm={searchTerm}
          onRetry={fetchProducts}
          emptyMessage="Chưa có sản phẩm nào"
          loadingMessage="Đang tải danh sách sản phẩm..."
        />
      )}

      {/* Form Modal - Simple implementation */}
      {showForm && (
        <ProductForm
          product={editing}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

// Product Form Component - Redesigned for Products + ProductVariants
interface ProductFormProps {
  product: ProductWithCategory | null;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

interface ProductVariantFormData {
  id?: string;
  color: string;
  size: string;
  stock: number;
  price: number;
  images: string[];
}

interface ProductFormData {
  // Main Product fields
  name: string;
  price: number;
  description: string;
  category: string;
  images: string[];
  salePrice?: number;
  saleStartDate?: string;
  saleEndDate?: string;
  isActive: boolean;
  // Product Variants
  variants: ProductVariantFormData[];
}

function ProductForm({ product, onSubmit, onCancel }: ProductFormProps) {
  // Helper function to convert ISO date to datetime-local format
  const formatDateForInput = (isoDate: string | undefined): string => {
    if (!isoDate) return '';
    try {
      const date = new Date(isoDate);
      // Format to YYYY-MM-DDTHH:mm for datetime-local input
      const formatted = date.toISOString().slice(0, 16);
      console.log(`Formatting date: ${isoDate} -> ${formatted}`);
      return formatted;
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  const [formData, setFormData] = useState<ProductFormData>({
    name: product?.name || '',
    price: product?.price || 0,
    description: product?.description || '',
    category: product?.category._id || '',
    images: product?.images || [],
    salePrice: product?.salePrice || undefined,
    saleStartDate: formatDateForInput(product?.saleStartDate),
    saleEndDate: formatDateForInput(product?.saleEndDate),
    isActive: product?.isActive ?? true,
    variants: []
  });
  
  const [imageUrls, setImageUrls] = useState('');
  const [variantImageUrls, setVariantImageUrls] = useState<{[key: number]: string}>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [colors, setColors] = useState<any[]>([]);
  const [sizes, setSizes] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingColors, setLoadingColors] = useState(false);
  const [loadingSizes, setLoadingSizes] = useState(false);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [activeTab, setActiveTab] = useState<'product' | 'variants'>('product');
  const [showNewColorModal, setShowNewColorModal] = useState(false);
  const [showNewSizeModal, setShowNewSizeModal] = useState(false);
  const [newColorName, setNewColorName] = useState('');
  const [newSizeName, setNewSizeName] = useState('');
  const [creatingColor, setCreatingColor] = useState(false);
  const [creatingSize, setCreatingSize] = useState(false);

  // Fetch required data
  useEffect(() => {
    const fetchData = async () => {
      // Fetch categories
      setLoadingCategories(true);
      try {
        const res = await categoryService.getPublicCategories();
        setCategories(res.data || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }

      // Fetch colors - Use service
      setLoadingColors(true);
      try {
        const colorsData = await colorService.getColors();
        console.log('Colors fetched:', colorsData);
        console.log('Total colors count:', colorsData.length);
        console.log('Colors type:', typeof colorsData);
        console.log('Colors isArray:', Array.isArray(colorsData));
        console.log('Sample colors:', colorsData.slice(0, 3));
        
        if (Array.isArray(colorsData)) {
          setColors(colorsData);
        } else {
          console.warn('Colors data is not an array:', colorsData);
          setColors([]);
        }
      } catch (error) {
        console.error('Error fetching colors:', error);
        setColors([]);
      } finally {
        setLoadingColors(false);
      }

      // Fetch sizes - Use service
      setLoadingSizes(true);
      try {
        const sizesData = await sizeService.getSizes();
        console.log('Sizes fetched:', sizesData);
        console.log('Total sizes count:', sizesData.length);
        console.log('Sizes type:', typeof sizesData);
        console.log('Sizes isArray:', Array.isArray(sizesData));
        console.log('Sample sizes:', sizesData.slice(0, 3));
        
        if (Array.isArray(sizesData)) {
          setSizes(sizesData);
        } else {
          console.warn('Sizes data is not an array:', sizesData);
          setSizes([]);
        }
      } catch (error) {
        console.error('Error fetching sizes:', error);
        setSizes([]);
      } finally {
        setLoadingSizes(false);
      }
    };

    fetchData();
  }, []);

  // Update form data when product prop changes (for editing)
  useEffect(() => {
    if (product) {
      console.log('Updating form data for product:', product);
      console.log('Product saleStartDate:', product.saleStartDate);
      console.log('Product saleEndDate:', product.saleEndDate);
      
      setFormData({
        name: product.name || '',
        price: product.price || 0,
        description: product.description || '',
        category: product.category._id || '',
        images: product.images || [],
        salePrice: product.salePrice || undefined,
        saleStartDate: formatDateForInput(product.saleStartDate),
        saleEndDate: formatDateForInput(product.saleEndDate),
        isActive: product.isActive ?? true,
        variants: [] // Will be loaded separately
      });
      
      // Update image URLs display
      if (product.images?.length > 0) {
        setImageUrls(product.images.join('\n'));
      }

      // Load existing variants for this product
      loadProductVariants(product._id);
    }
  }, [product?._id]); // Only depend on product ID to prevent infinite loops

  // Function to load variants for a specific product
  const loadProductVariants = async (productId: string) => {
    console.log('🔄 Loading variants for product:', productId);
    setLoadingVariants(true);
    try {
      // Load ALL variants (handles pagination automatically)
      const variants = await productService.getAllProductVariants(productId);
      console.log('✅ Loaded variants:', variants);
      console.log('📊 Total variants loaded:', variants.length);
      
      // Convert variants to form format
      const variantFormData = variants.map((variant: any) => ({
        id: variant._id,
        color: variant.color._id,
        size: variant.size._id,
        stock: variant.stock || 0,
        price: variant.price || 0,
        images: variant.images || []
      }));
      
      setFormData(prev => ({
        ...prev,
        variants: variantFormData
      }));
      
      // Set variant image URLs
      const imageUrls: {[key: number]: string} = {};
      variantFormData.forEach((variant, index) => {
        if (variant.images.length > 0) {
          imageUrls[index] = variant.images.join('\n');
        }
      });
      setVariantImageUrls(imageUrls);
      
      console.log('✅ Variants loaded successfully:', variantFormData.length, 'variants');
    } catch (error) {
      console.error('❌ Error loading variants:', error);
      // Keep empty variants array on error
    } finally {
      setLoadingVariants(false);
    }
  };

  // Handle image URLs parsing
  const handleImageUrlsChange = (value: string) => {
    setImageUrls(value);
    const urls = value.split('\n').map(url => url.trim()).filter(url => url);
    setFormData(prev => ({ ...prev, images: urls }));
  };

  const handleVariantImageUrlsChange = (variantIndex: number, value: string) => {
    setVariantImageUrls(prev => ({ ...prev, [variantIndex]: value }));
    const urls = value.split('\n').map(url => url.trim()).filter(url => url);
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((variant, idx) => 
        idx === variantIndex ? { ...variant, images: urls } : variant
      )
    }));
  };

  // Add new variant
  const addVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, {
        color: '',
        size: '',
        stock: 0,
        price: prev.price, // Default to product price
        images: []
      }]
    }));
  };

  // Remove variant
  const removeVariant = (index: number) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, idx) => idx !== index)
    }));
    // Also remove variant image URLs
    setVariantImageUrls(prev => {
      const newState = { ...prev };
      delete newState[index];
      return newState;
    });
  };

  // Update variant
  const updateVariant = (index: number, field: keyof ProductVariantFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((variant, idx) => 
        idx === index ? { ...variant, [field]: value } : variant
      )
    }));
  };

  // Create new color
  const createNewColor = async () => {
    if (!newColorName.trim()) {
      alert('Vui lòng nhập tên màu sắc');
      return;
    }

    setCreatingColor(true);
    try {
      const newColor = await colorService.createColor({ name: newColorName.trim() });
      
      // Add new color to the list
      setColors(prev => [...prev, newColor]);
      
      // Reset modal
      setNewColorName('');
      setShowNewColorModal(false);
      
      alert(`Màu sắc "${newColor.name}" đã được tạo thành công!`);
    } catch (error: any) {
      console.error('Error creating color:', error);
      alert(`Lỗi: ${error.message || 'Không thể tạo màu sắc mới'}`);
    } finally {
      setCreatingColor(false);
    }
  };

  // Create new size
  const createNewSize = async () => {
    if (!newSizeName.trim()) {
      alert('Vui lòng nhập tên kích thước');
      return;
    }

    setCreatingSize(true);
    try {
      const newSize = await sizeService.createSize({ name: newSizeName.trim() });
      
      // Add new size to the list
      setSizes(prev => [...prev, newSize]);
      
      // Reset modal
      setNewSizeName('');
      setShowNewSizeModal(false);
      
      alert(`Kích thước "${newSize.name}" đã được tạo thành công!`);
    } catch (error: any) {
      console.error('Error creating size:', error);
      alert(`Lỗi: ${error.message || 'Không thể tạo kích thước mới'}`);
    } finally {
      setCreatingSize(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate product info
    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên sản phẩm');
      return;
    }

    if (formData.price <= 0) {
      alert('Vui lòng nhập giá hợp lệ');
      return;
    }

    if (!formData.category) {
      alert('Vui lòng chọn danh mục');
      return;
    }

    // Validate variants
    if (formData.variants.length === 0) {
      alert('Vui lòng thêm ít nhất một phiên bản sản phẩm (màu sắc + kích thước)');
      return;
    }

    for (let i = 0; i < formData.variants.length; i++) {
      const variant = formData.variants[i];
      if (!variant.color || !variant.size) {
        alert(`Phiên bản ${i + 1}: Vui lòng chọn màu sắc và kích thước`);
        return;
      }
      if (variant.stock < 0) {
        alert(`Phiên bản ${i + 1}: Số lượng không được âm`);
        return;
      }
      if (variant.price <= 0) {
        alert(`Phiên bản ${i + 1}: Vui lòng nhập giá hợp lệ`);
        return;
      }
    }

    // Check for duplicate variants
    const variantCombos = formData.variants.map(v => `${v.color}-${v.size}`);
    const uniqueCombos = new Set(variantCombos);
    if (variantCombos.length !== uniqueCombos.size) {
      alert('Không được có phiên bản trùng lặp (cùng màu sắc và kích thước)');
      return;
    }

    // Sale price validation
    if (formData.salePrice && formData.salePrice >= formData.price) {
      alert('Giá khuyến mãi phải nhỏ hơn giá gốc');
      return;
    }

    console.log('📤 Submitting form data:', {
      ...formData,
      variants: formData.variants.map(v => ({
        color: v.color,
        size: v.size,
        stock: v.stock,
        price: v.price
      }))
    });

    onSubmit(formData);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.newProductFormContainer}>
        <button onClick={onCancel} className={styles.modalCloseButton}>×</button>
        
        <div className={styles.formHeader}>
          <h2>{product ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}</h2>
          <div className={styles.formTabs}>
            <button 
              type="button"
              className={`${styles.tabButton} ${activeTab === 'product' ? styles.active : ''}`}
              onClick={() => setActiveTab('product')}
            >
              📦 Thông tin sản phẩm
            </button>
            <button 
              type="button"
              className={`${styles.tabButton} ${activeTab === 'variants' ? styles.active : ''}`}
              onClick={() => setActiveTab('variants')}
            >
              🎨 Phiên bản ({formData.variants.length})
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className={styles.productForm}>
          {/* Product Information Tab */}
          {activeTab === 'product' && (
            <div className={styles.tabContent}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Tên sản phẩm *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className={styles.formInput}
                    placeholder="Nhập tên sản phẩm"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Giá gốc *</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) || 0 }))}
                    className={styles.formInput}
                    placeholder="Nhập giá sản phẩm"
                    min="0"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Giá khuyến mãi</label>
                  <input
                    type="number"
                    value={formData.salePrice || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      salePrice: e.target.value ? Number(e.target.value) : undefined 
                    }))}
                    className={styles.formInput}
                    placeholder="Nhập giá khuyến mãi (tùy chọn)"
                    min="0"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Danh mục *</label>
                  <SearchableSelect
                    options={Array.isArray(categories) ? categories : []}
                    value={formData.category}
                    onChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                    placeholder="Chọn danh mục..."
                    disabled={loadingCategories}
                    className={styles.formSelect}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Mô tả sản phẩm</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className={styles.formTextarea}
                  placeholder="Nhập mô tả chi tiết về sản phẩm"
                  rows={4}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Hình ảnh sản phẩm</label>
                <textarea
                  value={imageUrls}
                  onChange={(e) => handleImageUrlsChange(e.target.value)}
                  className={styles.formTextarea}
                  placeholder="Nhập các URL hình ảnh, mỗi URL một dòng&#10;Ví dụ:&#10;https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                  rows={4}
                />
                <div className={styles.formHint}>
                  Mỗi URL một dòng. Ảnh đầu tiên sẽ là ảnh chính.
                </div>
                {formData.images.length > 0 && (
                  <div className={styles.imagePreviewGrid}>
                    {formData.images.map((url, idx) => (
                      <div key={idx} className={styles.imagePreviewItem}>
                        <img src={url} alt={`Preview ${idx + 1}`} className={styles.imagePreview} />
                        <div className={styles.imageIndex}>{idx + 1}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Thời gian khuyến mãi bắt đầu</label>
                  <input
                    type="datetime-local"
                    value={formData.saleStartDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, saleStartDate: e.target.value }))}
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Thời gian khuyến mãi kết thúc</label>
                  <input
                    type="datetime-local"
                    value={formData.saleEndDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, saleEndDate: e.target.value }))}
                    className={styles.formInput}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formCheckbox}>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  />
                  <span>Sản phẩm hoạt động (hiển thị trên website)</span>
                </label>
              </div>
            </div>
          )}

          {/* Variants Section */}
          {activeTab === 'variants' && (
            <div className={styles.tabContent}>
              <div className={styles.variantsHeader}>
                <h3>Phiên bản sản phẩm</h3>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  {loadingColors ? 'Đang tải màu sắc...' : `${colors.length} màu sắc`} | {' '}
                  {loadingSizes ? 'Đang tải kích thước...' : `${sizes.length} kích thước`}
                  {loadingVariants && ' | Đang tải variants...'}
                </div>
                <button type="button" onClick={addVariant} className={styles.addVariantButton}>
                  + Thêm phiên bản
                </button>
              </div>

              {loadingVariants ? (
                <div className={styles.emptyVariants}>
                  <p>🔄 Đang tải các phiên bản hiện có...</p>
                </div>
              ) : formData.variants.length === 0 ? (
                <div className={styles.emptyVariants}>
                  <p>Chưa có phiên bản nào. Hãy thêm phiên bản đầu tiên!</p>
                </div>
              ) : (
                <div className={styles.variantsList}>
                  {formData.variants.map((variant, index) => (
                    <div key={index} className={styles.variantItem}>
                      <div className={styles.variantHeader}>
                        <h4>Phiên bản {index + 1}</h4>
                        <button 
                          type="button" 
                          onClick={() => removeVariant(index)}
                          className={styles.removeVariantButton}
                        >
                          🗑️ Xóa
                        </button>
                      </div>

                      <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                          <div className={styles.formFieldWithButton}>
                            <label className={styles.formLabel}>Màu sắc *</label>
                            <div className={styles.selectWithButton}>
                              <SearchableSelect
                                options={Array.isArray(colors) ? colors : []}
                                value={variant.color}
                                onChange={(value) => updateVariant(index, 'color', value)}
                                placeholder="Chọn màu sắc..."
                                disabled={loadingColors}
                                className={styles.formSelect}
                              />
                              <button 
                                type="button" 
                                onClick={() => setShowNewColorModal(true)}
                                className={styles.addNewButton}
                                title="Tạo màu sắc mới"
                              >
                                + Tạo mới
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className={styles.formGroup}>
                          <div className={styles.formFieldWithButton}>
                            <label className={styles.formLabel}>Kích thước *</label>
                            <div className={styles.selectWithButton}>
                              <SearchableSelect
                                options={Array.isArray(sizes) ? sizes : []}
                                value={variant.size}
                                onChange={(value) => updateVariant(index, 'size', value)}
                                placeholder="Chọn kích thước..."
                                disabled={loadingSizes}
                                className={styles.formSelect}
                              />
                              <button 
                                type="button" 
                                onClick={() => setShowNewSizeModal(true)}
                                className={styles.addNewButton}
                                title="Tạo kích thước mới"
                              >
                                + Tạo mới
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>Số lượng *</label>
                          <input
                            type="number"
                            value={variant.stock}
                            onChange={(e) => updateVariant(index, 'stock', Number(e.target.value) || 0)}
                            className={styles.formInput}
                            placeholder="Số lượng tồn kho"
                            min="0"
                            required
                          />
                        </div>

                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>Giá phiên bản *</label>
                          <input
                            type="number"
                            value={variant.price}
                            onChange={(e) => updateVariant(index, 'price', Number(e.target.value) || 0)}
                            className={styles.formInput}
                            placeholder="Giá của phiên bản này"
                            min="0"
                            required
                          />
                        </div>
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Hình ảnh phiên bản</label>
                        <textarea
                          value={variantImageUrls[index] || ''}
                          onChange={(e) => handleVariantImageUrlsChange(index, e.target.value)}
                          className={styles.formTextarea}
                          placeholder="Nhập các URL hình ảnh riêng cho phiên bản này, mỗi URL một dòng"
                          rows={3}
                        />
                        {variant.images.length > 0 && (
                          <div className={styles.imagePreviewGrid}>
                            {variant.images.map((url, imgIdx) => (
                              <div key={imgIdx} className={styles.imagePreviewItem}>
                                <img src={url} alt={`Variant ${index + 1} - ${imgIdx + 1}`} className={styles.imagePreview} />
                                <div className={styles.imageIndex}>{imgIdx + 1}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className={styles.formActions}>
            <button type="button" className={styles.cancelButton} onClick={onCancel}>
              Hủy
            </button>
            <button type="submit" className={styles.submitButton}>
              {product ? 'Cập nhật sản phẩm' : 'Tạo sản phẩm'}
            </button>
          </div>
        </form>

        {/* New Color Modal */}
        {showNewColorModal && (
          <div className={styles.miniModalOverlay}>
            <div className={styles.miniModal}>
              <h3>Tạo màu sắc mới</h3>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Tên màu sắc *</label>
                <input
                  type="text"
                  value={newColorName}
                  onChange={(e) => setNewColorName(e.target.value)}
                  className={styles.formInput}
                  placeholder="Ví dụ: Xanh Navy, Hồng Pastel..."
                  maxLength={10}
                />
                <div className={styles.formHint}>
                  Tối đa 10 ký tự. Chỉ được chứa chữ, số và dấu gạch ngang.
                </div>
              </div>
              <div className={styles.miniModalActions}>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowNewColorModal(false);
                    setNewColorName('');
                  }}
                  className={styles.cancelButton}
                  disabled={creatingColor}
                >
                  Hủy
                </button>
                <button 
                  type="button" 
                  onClick={createNewColor}
                  className={styles.submitButton}
                  disabled={creatingColor || !newColorName.trim()}
                >
                  {creatingColor ? 'Đang tạo...' : 'Tạo màu sắc'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* New Size Modal */}
        {showNewSizeModal && (
          <div className={styles.miniModalOverlay}>
            <div className={styles.miniModal}>
              <h3>Tạo kích thước mới</h3>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Tên kích thước *</label>
                <input
                  type="text"
                  value={newSizeName}
                  onChange={(e) => setNewSizeName(e.target.value)}
                  className={styles.formInput}
                  placeholder="Ví dụ: XL, 42, 28cm..."
                  maxLength={20}
                />
                <div className={styles.formHint}>
                  Tối đa 20 ký tự. Chỉ được chứa chữ, số và dấu gạch ngang.
                </div>
              </div>
              <div className={styles.miniModalActions}>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowNewSizeModal(false);
                    setNewSizeName('');
                  }}
                  className={styles.cancelButton}
                  disabled={creatingSize}
                >
                  Hủy
                </button>
                <button 
                  type="button" 
                  onClick={createNewSize}
                  className={styles.submitButton}
                  disabled={creatingSize || !newSizeName.trim()}
                >
                  {creatingSize ? 'Đang tạo...' : 'Tạo kích thước'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
