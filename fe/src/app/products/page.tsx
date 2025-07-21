'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ProductWithCategory, ProductFilters, PaginatedResponse, Category } from '@/types';
import { useProducts, useCategories } from '@/hooks';
import ProductList from '@/app/components/ProductList';
import { LoadingSpinner, Button, Pagination } from '@/app/components/ui';
import SearchBar from '@/app/components/ui/SearchBar';
import { formatCurrency } from '@/lib/utils';
import styles from './page.module.css';

// Sort options following design system
const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất', sort: 'createdAt', order: 'desc' as const },
  { value: 'price-asc', label: 'Giá: Thấp đến Cao', sort: 'price', order: 'asc' as const },
  { value: 'price-desc', label: 'Giá: Cao đến Thấp', sort: 'price', order: 'desc' as const },
  { value: 'name-asc', label: 'Tên: A-Z', sort: 'name', order: 'asc' as const },
  { value: 'name-desc', label: 'Tên: Z-A', sort: 'name', order: 'desc' as const },
] as const;

const ITEMS_PER_PAGE_OPTIONS = [12, 24, 36];
const PRICE_RANGES = [
  { label: 'Dưới 100k', min: 0, max: 100000 },
  { label: '100k - 300k', min: 100000, max: 300000 },
  { label: '300k - 500k', min: 300000, max: 500000 },
  { label: '500k - 1tr', min: 500000, max: 1000000 },
  { label: 'Trên 1tr', min: 1000000, max: undefined },
];

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Hooks
  const { getProducts, loading, error } = useProducts();
  const { getCategories, loading: categoriesLoading } = useCategories();
  
  // State
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    totalPages: 1,
    totalProducts: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [jumpToPageValue, setJumpToPageValue] = useState('1');
  
  // Local state for real-time search
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Parse URL params to filters
  const filters = useMemo((): ProductFilters => {
    const result = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '12'),
      category: searchParams.get('category') || undefined,
      minPrice: searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!) : undefined,
      maxPrice: searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!) : undefined,
      search: searchParams.get('search') || undefined,
      sort: (searchParams.get('sort') as ProductFilters['sort']) || 'createdAt',
      order: (searchParams.get('order') as ProductFilters['order']) || 'desc',
      isOnSale: searchParams.get('isOnSale') === 'true' || undefined,
    };
    console.log('🔍 Current filters from URL:', result);
    return result;
  }, [searchParams]);

  // Update URL with new filters
  const updateFilters = useCallback((newFilters: Partial<ProductFilters>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Update params
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, value.toString());
      } else {
        params.delete(key);
      }
    });

    // Reset to page 1 when filters change (except page itself)
    if (!newFilters.hasOwnProperty('page')) {
      params.set('page', '1');
    }

    router.push(`/products?${params.toString()}`);
  }, [searchParams, router]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Update URL when debounced search term changes (avoid loop)
  useEffect(() => {
    // Only update if user is actually typing, not syncing from URL
    const currentUrlSearch = searchParams.get('search') || '';
    if (debouncedSearchTerm !== currentUrlSearch && 
        searchTerm === debouncedSearchTerm) { // Only if debounce is complete
      updateFilters({ 
        search: debouncedSearchTerm || undefined,
        page: 1 // Reset to page 1 when searching
      });
    }
  }, [debouncedSearchTerm]); // Remove searchParams, updateFilters from dependencies to avoid loop

  // Sync search term with URL on load (one-time sync)
  useEffect(() => {
    const urlSearchTerm = searchParams.get('search') || '';
    setSearchTerm(urlSearchTerm);
    setDebouncedSearchTerm(urlSearchTerm);
  }, []); // Empty dependency to run once on mount

  // Sync when URL changes externally (like back/forward navigation)
  useEffect(() => {
    const urlSearchTerm = searchParams.get('search') || '';
    if (urlSearchTerm !== debouncedSearchTerm) {
      setSearchTerm(urlSearchTerm);
      setDebouncedSearchTerm(urlSearchTerm);
    }
  }, [searchParams]); // Only depend on searchParams

  // Fetch products
  const fetchProducts = useCallback(async () => {
    console.log('🚀 Starting fetchProducts with filters:', filters);
    try {
      // Handle isOnSale filter with frontend logic (same as FlashSale.tsx)
      if (filters.isOnSale) {        
        // Fetch products without isOnSale filter, then apply frontend filtering
        const backendFilters = { ...filters };
        delete (backendFilters as any).isOnSale;
        
        const result: PaginatedResponse<ProductWithCategory> = await getProducts({
          ...backendFilters,
          limit: 100 // Get more products to filter from
        });
        
        // Handle different response structures like new page
        const productsArray = Array.isArray(result.data) ? result.data : 
                             (result.data && Array.isArray((result.data as any).data)) ? (result.data as any).data : [];
        
        if (productsArray && productsArray.length > 0) {
          // Only show products with explicit sale price in database
          const saleProducts = productsArray.filter((product: ProductWithCategory) => 
            product.salePrice && product.salePrice < product.price
          );
          
          console.log('✅ Products Page Sale filter: Found', saleProducts.length, 'sale products');
          
          // Apply frontend sorting to sale products
          if (filters.sort && saleProducts.length > 0) {
            saleProducts.sort((a: ProductWithCategory, b: ProductWithCategory) => {
              let aValue: any, bValue: any;
              
              switch (filters.sort) {
                case 'price':
                  // Use sale price if available, otherwise regular price
                  aValue = (a as any).dynamicSalePrice || a.salePrice || a.price;
                  bValue = (b as any).dynamicSalePrice || b.salePrice || b.price;
                  break;
                case 'name':
                  aValue = a.name.toLowerCase();
                  bValue = b.name.toLowerCase();
                  break;
                case 'createdAt':
                  aValue = new Date(a.createdAt).getTime();
                  bValue = new Date(b.createdAt).getTime();
                  break;
                default:
                  return 0;
              }
              
              if (filters.order === 'desc') {
                return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
              } else {
                return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
              }
            });
          }
          
          setProducts(saleProducts);
          
          // Set simple pagination for frontend-filtered results
          setPagination({
            page: 1,
            limit: saleProducts.length,
            totalPages: 1,
            totalProducts: saleProducts.length,
            hasNextPage: false,
            hasPrevPage: false
          });
        } else {
          setProducts([]);
        }
        return;
      }
      
      // Normal flow for non-sale filters      
      const result: PaginatedResponse<ProductWithCategory> = await getProducts(filters);
      
      // Handle different response structures like new page
      const productsArray = Array.isArray(result.data) ? result.data : 
                           (result.data && Array.isArray((result.data as any).data)) ? (result.data as any).data : [];
      
      // Ensure we have valid data
      if (productsArray && productsArray.length > 0) {
        setProducts(productsArray);
      } else {
        setProducts([]);
      }
      
      // Safely handle pagination
      if (result && result.pagination) {
        const currentPage = result.pagination.current || 1;
        const totalPages = result.pagination.totalPages || 1;
        
        setPagination({
          page: currentPage,
          limit: result.pagination.limit || 12,
          totalPages: totalPages,
          totalProducts: result.pagination.total || 0,
          hasNextPage: currentPage < totalPages,
          hasPrevPage: currentPage > 1
        });
      } else {
        // Default pagination if none provided
        setPagination({
          page: 1,
          limit: 12,
          totalPages: 1,
          totalProducts: productsArray.length,
          hasNextPage: false,
          hasPrevPage: false
        });
      }
    } catch (err: any) {
      console.error('Failed to fetch products:', err);
      setProducts([]);
      setPagination({
        page: 1,
        limit: 12,
        totalPages: 1,
        totalProducts: 0,
        hasNextPage: false,
        hasPrevPage: false
      });
    }
  }, [getProducts, filters]);

  // Effects
  useEffect(() => {
    fetchProducts().catch(err => {
      console.error('ProductsPage: fetchProducts error:', err);
    });
  }, [fetchProducts]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const result = await getCategories();
        setCategories(result);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    
    fetchCategories();
  }, [getCategories]);

  // Update jump to page value when pagination changes
  useEffect(() => {
    setJumpToPageValue(pagination.page.toString());
  }, [pagination.page]);

  // Filter handlers
  const handleSortChange = (value: string) => {
    console.log('🔄 Sort change triggered:', value);
    const option = SORT_OPTIONS.find(opt => opt.value === value);
    console.log('🎯 Found option:', option);
    if (option) {
      console.log('✅ Updating filters with sort:', option.sort, 'order:', option.order);
      updateFilters({
        sort: option.sort,
        order: option.order
      });
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    updateFilters({ 
      category: categoryId === 'all' ? undefined : categoryId 
    });
  };

  const handlePriceRangeChange = (range: typeof PRICE_RANGES[0]) => {
    updateFilters({
      minPrice: range.min,
      maxPrice: range.max
    });
  };

  const handlePageChange = (page: number) => {
    // Immediate UI update for better UX
    setPagination(prev => ({
      ...prev,
      page
    }));
    
    updateFilters({ page });
    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLimitChange = (limit: number) => {
    updateFilters({ limit });
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    router.push('/products');
  };

  const toggleSaleFilter = () => {
    console.log('Toggling sale filter. Current:', filters.isOnSale);
    updateFilters({
      isOnSale: filters.isOnSale ? undefined : true
    });
  };

  const handleSearch = (query: string) => {
    // Update local search term for real-time search
    setSearchTerm(query);
  };

  // Handle immediate search input change for real-time
  const handleSearchChange = (query: string) => {
    setSearchTerm(query);
  };

  // Get current sort option
  const currentSortOption = SORT_OPTIONS.find(
    opt => opt.sort === filters.sort && opt.order === filters.order
  ) || SORT_OPTIONS[0];

  // Get selected category
  const selectedCategory = categories?.find(cat => cat._id === filters.category);

  // Loading states
  if (loading && products.length === 0) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner size="lg" />
        <p>Đang tải sản phẩm...</p>
      </div>
    );
  }

  return (
    <div className={styles.productsPage}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.container}>
          <h1 className={styles.pageTitle}>Sản phẩm</h1>
          <p className={styles.pageDescription}>
            Khám phá bộ sưu tập thời trang GenZ với phong cách năng động, 
            xu hướng mới nhất và chất lượng tuyệt vời
          </p>
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.productsMain}>
          {/* Filters Sidebar */}
          <aside className={`${styles.filtersSidebar} ${isFiltersOpen ? styles.filtersOpen : ''}`}>
            <div className={styles.filtersHeader}>
              <h3>Bộ lọc</h3>
              <button 
                className={styles.filtersClose}
                onClick={() => setIsFiltersOpen(false)}
                aria-label="Đóng bộ lọc"
              >
                ×
              </button>
            </div>

            <div className={styles.filtersContent}>
              {/* Categories */}
              <div className={styles.filterGroup}>
                <h4>Danh mục</h4>
                <div className={styles.filterOptions}>
                  <label className={styles.filterOption}>
                    <input
                      type="radio"
                      name="category"
                      checked={!filters.category}
                      onChange={() => handleCategoryChange('all')}
                    />
                    <span>Tất cả</span>
                  </label>
                  {categories?.map(category => (
                    <label key={category._id} className={styles.filterOption}>
                      <input
                        type="radio"
                        name="category"
                        checked={filters.category === category._id}
                        onChange={() => handleCategoryChange(category._id)}
                      />
                      <span>{category.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className={styles.filterGroup}>
                <h4>Khoảng giá</h4>
                <div className={styles.filterOptions}>
                  <label className={styles.filterOption}>
                    <input
                      type="radio"
                      name="priceRange"
                      checked={!filters.minPrice && !filters.maxPrice}
                      onChange={() => updateFilters({ minPrice: undefined, maxPrice: undefined })}
                    />
                    <span>Tất cả</span>
                  </label>
                  {PRICE_RANGES.map((range, index) => (
                    <label key={index} className={styles.filterOption}>
                      <input
                        type="radio"
                        name="priceRange"
                        checked={filters.minPrice === range.min && filters.maxPrice === range.max}
                        onChange={() => handlePriceRangeChange(range)}
                      />
                      <span>{range.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* On Sale */}
              <div className={styles.filterGroup}>
                <label className={styles.filterOption}>
                  <input
                    type="checkbox"
                    checked={!!filters.isOnSale}
                    onChange={toggleSaleFilter}
                  />
                  <span>Đang giảm giá</span>
                </label>
              </div>

              {/* Clear Filters */}
              <Button
                variant="secondary"
                onClick={clearAllFilters}
                className={styles.clearFiltersBtn}
              >
                Xóa tất cả bộ lọc
              </Button>
            </div>
          </aside>

          {/* Main Content */}
          <main className={styles.productsContent}>
            {/* Search Bar */}
            <div className={styles.searchSection}>
              <div className={styles.searchHeader}>
                <h2 className={styles.searchTitle}>Tìm kiếm sản phẩm</h2>
                <p className={styles.searchDescription}>
                  Khám phá bộ sưu tập với từ khóa yêu thích của bạn
                </p>
              </div>
              <SearchBar
                value={searchTerm}
                onChange={handleSearchChange}
                onSearch={handleSearch}
                placeholder="Nhập tên sản phẩm, thương hiệu hoặc từ khóa..."
                className={styles.searchBar}
                showSuggestions={false}
              />
            </div>

            {/* Toolbar */}
            <div className={styles.toolbar}>
              <div className={styles.toolbarLeft}>
                <button
                  className={styles.filtersToggle}
                  onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                  aria-label="Hiển thị bộ lọc"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                  </svg>
                  Bộ lọc
                </button>

                <div className={styles.resultsInfo}>
                  {pagination.totalProducts > 0 ? (
                    <>
                      Hiển thị {((pagination.page - 1) * pagination.limit) + 1}-
                      {Math.min(pagination.page * pagination.limit, pagination.totalProducts)} 
                      trong tổng số <strong>{pagination.totalProducts}</strong> sản phẩm
                      {selectedCategory && (
                        <span className={styles.categoryInfo}>
                          trong danh mục <strong>{selectedCategory.name}</strong>
                        </span>
                      )}
                    </>
                  ) : (
                    'Không tìm thấy sản phẩm nào'
                  )}
                </div>
              </div>

              <div className={styles.toolbarRight}>
                {/* Sort */}
                <select
                  className={styles.sortSelect}
                  value={currentSortOption.value}
                  onChange={(e) => handleSortChange(e.target.value)}
                >
                  {SORT_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                {/* Items per page */}
                <select
                  className={styles.limitSelect}
                  value={filters.limit}
                  onChange={(e) => handleLimitChange(parseInt(e.target.value))}
                >
                  {ITEMS_PER_PAGE_OPTIONS.map(limit => (
                    <option key={limit} value={limit}>
                      {limit} sản phẩm
                    </option>
                  ))}
                </select>

                {/* Layout Toggle */}
                <div className={styles.layoutToggle}>
                  <button
                    className={`${styles.layoutBtn} ${layout === 'grid' ? styles.active : ''}`}
                    onClick={() => {
                      console.log('Switching to grid layout');
                      setLayout('grid');
                    }}
                    aria-label="Hiển thị dạng lưới"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M1 2.5A1.5 1.5 0 012.5 1h3A1.5 1.5 0 017 2.5v3A1.5 1.5 0 015.5 7h-3A1.5 1.5 0 011 5.5v-3zm0 8A1.5 1.5 0 012.5 9h3A1.5 1.5 0 017 10.5v3A1.5 1.5 0 015.5 15h-3A1.5 1.5 0 011 13.5v-3zm8-8A1.5 1.5 0 0110.5 1h3A1.5 1.5 0 0115 2.5v3A1.5 1.5 0 0113.5 7h-3A1.5 1.5 0 019 5.5v-3zm0 8A1.5 1.5 0 0110.5 9h3A1.5 1.5 0 0115 10.5v3A1.5 1.5 0 0113.5 15h-3A1.5 1.5 0 019 13.5v-3z"/>
                    </svg>
                  </button>
                  <button
                    className={`${styles.layoutBtn} ${layout === 'list' ? styles.active : ''}`}
                    onClick={() => {
                      console.log('Switching to list layout');
                      setLayout('list');
                    }}
                    aria-label="Hiển thị dạng danh sách"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path fillRule="evenodd" d="M2.5 12a.5.5 0 01.5-.5h10a.5.5 0 010 1H3a.5.5 0 01-.5-.5zm0-4a.5.5 0 01.5-.5h10a.5.5 0 010 1H3a.5.5 0 01-.5-.5zm0-4a.5.5 0 01.5-.5h10a.5.5 0 010 1H3a.5.5 0 01-.5-.5z"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Active Filters */}
            {(filters.category || filters.minPrice || filters.maxPrice || filters.isOnSale) && (
              <div className={styles.activeFilters}>
                <span className={styles.activeFiltersLabel}>Bộ lọc đang áp dụng:</span>
                <div className={styles.activeFilterTags}>
                  {selectedCategory && (
                    <span className={styles.filterTag}>
                      {selectedCategory.name}
                      <button onClick={() => handleCategoryChange('all')}>×</button>
                    </span>
                  )}
                  {(filters.minPrice || filters.maxPrice) && (
                    <span className={styles.filterTag}>
                      {filters.minPrice && filters.maxPrice
                        ? `${formatCurrency(filters.minPrice)} - ${formatCurrency(filters.maxPrice)}`
                        : filters.minPrice
                        ? `Từ ${formatCurrency(filters.minPrice)}`
                        : `Dưới ${formatCurrency(filters.maxPrice!)}`
                      }
                      <button onClick={() => updateFilters({ minPrice: undefined, maxPrice: undefined })}>×</button>
                    </span>
                  )}
                  {filters.isOnSale && (
                    <span className={styles.filterTag}>
                      Đang giảm giá
                      <button onClick={toggleSaleFilter}>×</button>
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Products Grid/List */}
            {error ? (
              <div className={styles.errorState}>
                <h3>Có lỗi xảy ra</h3>
                <p>{error}</p>
                <Button onClick={fetchProducts}>Thử lại</Button>
              </div>
            ) : products.length === 0 ? (
              <div className={styles.emptyState}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="21 21l-4.35-4.35"/>
                </svg>
                <h3>Không tìm thấy sản phẩm</h3>
                <p>Không có sản phẩm nào phù hợp với tiêu chí tìm kiếm của bạn.</p>
                <Button onClick={clearAllFilters}>Xóa bộ lọc</Button>
              </div>
            ) : (
              <ProductList
                products={products}
                layout={layout}
                itemsPerPage={pagination.limit}
                showPagination={false}
                showLayoutToggle={false}
                showDescription={layout === 'list'}
                className={styles.productsList}
              />
            )}

            {/* Pagination */}
            {products.length > 0 && pagination.totalPages > 1 && (
              <Pagination
                pagination={pagination}
                onPageChange={handlePageChange}
                className={styles.paginationComponent}
              />
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filters Overlay */}
      {isFiltersOpen && (
        <div 
          className={styles.filtersOverlay}
          onClick={() => setIsFiltersOpen(false)}
        />
      )}
    </div>
  );
}
