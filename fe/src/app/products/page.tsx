'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ProductWithCategory, ProductFilters, PaginatedResponse } from '@/types';
import { useProducts, useProductStats } from '@/hooks';
import ProductItem from '@/app/components/ProductItem';
import FilterSidebar from '@/app/components/FilterSidebar';
import { LoadingSpinner, Button, Pagination, PageHeader } from '@/app/components/ui';
import { FaShoppingBag } from 'react-icons/fa';
import styles from './products.module.css';

// Sort options following design system - Including sale filter as sort option
const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất', sort: 'createdAt' as const, order: 'desc' as const },
  { value: 'rating-desc', label: 'Đánh giá cao nhất', sort: 'rating' as const, order: 'desc' as const },
  { value: 'price-asc', label: 'Giá: Thấp đến Cao', sort: 'price' as const, order: 'asc' as const },
  { value: 'price-desc', label: 'Giá: Cao đến Thấp', sort: 'price' as const, order: 'desc' as const },
  { value: 'name-asc', label: 'Tên: A-Z', sort: 'name' as const, order: 'asc' as const },
  { value: 'name-desc', label: 'Tên: Z-A', sort: 'name' as const, order: 'desc' as const },
  { value: 'on-sale', label: 'Đang giảm giá', sort: 'createdAt' as const, order: 'desc' as const }, // Special filter for sale items
] as const;

function ProductsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getProducts, loading, error } = useProducts();
  
  // State management
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductWithCategory[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [selectedCategory, setSelectedCategory] = useState('');

  const productsPerPage = 12;

  // Helper function to get all child category IDs for a given parent category ID
  const getAllChildCategoryIds = (parentCategoryId: string, allProducts: ProductWithCategory[]): string[] => {
    const childCategoryIds = new Set<string>();
    
    // Get all categories from products
    const allCategories = allProducts
      .map(product => product.category)
      .filter((category): category is NonNullable<typeof category> => 
        category !== null && category !== undefined && typeof category === 'object'
      );
    
    // Find child categories that have this parent
    allCategories.forEach(category => {
      if (category.parent === parentCategoryId) {
        childCategoryIds.add(category._id);
        // Recursively find children of children
        const grandChildren = getAllChildCategoryIds(category._id, allProducts);
        grandChildren.forEach(id => childCategoryIds.add(id));
      }
    });
    
    return Array.from(childCategoryIds);
  };

  // Get real product statistics
  const productIds = products.map(p => p._id);
  const { stats: productStats, loading: statsLoading } = useProductStats(productIds);

  useEffect(() => {
    // Get URL parameters
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
    const search = searchParams.get('search') || '';
    const sort = searchParams.get('sort') || 'newest';
    const category = searchParams.get('category') || '';
    const minPrice = searchParams.get('minPrice') || '';
    const maxPrice = searchParams.get('maxPrice') || '';

    setCurrentPage(page);
    setSearchTerm(search);
    setSortBy(sort);
    setSelectedCategory(category);
    setPriceRange({ min: minPrice, max: maxPrice });
  }, [searchParams]);

  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        console.log('🛒 Products Page: Fetching all products...');
        
        // Always fetch all products - filtering will be done client-side
        const response = await getProducts({
          limit: 1000,          // High limit to get all products
          sort: 'createdAt',    
          order: 'desc'         
        });
        
        console.log('📦 Products Page: Raw response:', {
          responseType: typeof response,
          isArray: Array.isArray(response),
          hasData: response && typeof response === 'object' && 'data' in response,
          responseKeys: response ? Object.keys(response) : 'no response'
        });
        
        const productsArray = Array.isArray(response.data) ? response.data : 
                             (response.data && Array.isArray((response.data as any).data)) ? (response.data as any).data : [];
        
        console.log('📦 Products Page: Raw products received:', productsArray.length);
        
        // Filter active products
        const activeProducts = productsArray.filter((product: ProductWithCategory) => 
          product.isActive !== false
        );

        console.log('📦 Products Page: Active products:', activeProducts.length);
        setProducts(activeProducts);
      } catch (err: any) {
        console.error('❌ Failed to fetch products:', err);
        setProducts([]);
      }
    };

    fetchAllProducts();
  }, [getProducts]); // Only fetch once - all filtering/sorting done client-side

  // Filter and sort products based on current filters
  useEffect(() => {
    let filtered = [...products];
    
    console.log('🔍 Products Page: Starting filter/sort with', products.length, 'products');

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (typeof product.category === 'object' && product.category?.name?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply "on-sale" filter first (if sortBy is 'on-sale', treat it as a filter)
    if (sortBy === 'on-sale') {
      filtered = filtered.filter(product => 
        product.salePrice && 
        product.salePrice < product.price && 
        product.isActive !== false
      );
    }

    // Apply category filter - include products from child categories too
    if (selectedCategory) {
      // Get all child category IDs for the selected category
      const childCategoryIds = getAllChildCategoryIds(selectedCategory, products);
      const allTargetCategoryIds = [selectedCategory, ...childCategoryIds];
      
      filtered = filtered.filter(product => {
        if (typeof product.category === 'object' && product.category?._id) {
          const productCategoryId = product.category._id;
          return allTargetCategoryIds.includes(productCategoryId);
        }
        return false;
      });
    }

    // Apply price filter
    if (priceRange.min) {
      const minPrice = parseFloat(priceRange.min);
      filtered = filtered.filter(product => {
        const price = product.salePrice || product.price;
        return price >= minPrice;
      });
    }
    if (priceRange.max) {
      const maxPrice = parseFloat(priceRange.max);
      filtered = filtered.filter(product => {
        const price = product.salePrice || product.price;
        return price <= maxPrice;
      });
    }

    // Apply sorting (no need to filter sale products again, already done at fetch level)
    const sortOption = SORT_OPTIONS.find(opt => opt.value === sortBy) || SORT_OPTIONS[0];
    
    if (sortBy !== 'on-sale') {
      // Only sort for non-sale options (sale products are already sorted by newest at fetch level)
      filtered.sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (sortOption.sort) {
          case 'rating':
            // Sort by average rating descending, prioritize products with actual reviews
            const aStats = productStats[a._id];
            const bStats = productStats[b._id];
            const aRating = aStats?.averageRating || 0;
            const bRating = bStats?.averageRating || 0;
            const aReviews = aStats?.reviewCount || 0;
            const bReviews = bStats?.reviewCount || 0;
            
            // If one has reviews and other doesn't, prioritize the one with reviews
            if (aReviews > 0 && bReviews === 0) return -1;
            if (bReviews > 0 && aReviews === 0) return 1;
            
            // If both have reviews or both don't have reviews, sort by rating
            if (bRating !== aRating) return bRating - aRating;
            
            // If ratings are equal, use review count as tiebreaker
            return bReviews - aReviews;
          case 'price':
            aValue = a.salePrice || a.price;
            bValue = b.salePrice || b.price;
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
        
        // Apply sorting order
        if (sortOption.order === 'desc') {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        } else {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        }
      });
    }

    setFilteredProducts(filtered);
    console.log('✅ Products Page: Final filtered products count:', filtered.length);
    setCurrentPage(1); // Reset to first page when filters change
  }, [products, searchTerm, selectedCategory, priceRange, sortBy, productStats]);

  // Calculate pagination
  useEffect(() => {
    const total = Math.ceil(filteredProducts.length / productsPerPage);
    setTotalPages(total);
  }, [filteredProducts.length, productsPerPage]);

  // Get current page products
  const getCurrentPageProducts = () => {
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    return filteredProducts.slice(startIndex, endIndex);
  };

  // Update URL when filters change
  const updateURL = (newFilters: any) => {
    const params = new URLSearchParams();
    
    if (newFilters.page && newFilters.page > 1) params.set('page', newFilters.page.toString());
    if (newFilters.search) params.set('search', newFilters.search);
    if (newFilters.sort && newFilters.sort !== 'newest') params.set('sort', newFilters.sort);
    if (newFilters.category) params.set('category', newFilters.category);
    if (newFilters.minPrice) params.set('minPrice', newFilters.minPrice);
    if (newFilters.maxPrice) params.set('maxPrice', newFilters.maxPrice);

    const newURL = params.toString() ? `/products?${params.toString()}` : '/products';
    router.push(newURL, { scroll: false });
  };

  // Handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateURL({ page, search: searchTerm, sort: sortBy, category: selectedCategory, 
               minPrice: priceRange.min, maxPrice: priceRange.max });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchChange = (search: string) => {
    setSearchTerm(search);
    setCurrentPage(1); // Reset to first page
    // Don't update URL immediately to prevent reload
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
    setCurrentPage(1); // Reset to first page
    // Don't update URL immediately to prevent reload
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1); // Reset to first page
    // Don't update URL immediately to prevent reload
  };

  const handlePriceRangeChange = (range: { min: string; max: string }) => {
    setPriceRange(range);
    updateURL({ search: searchTerm, sort: sortBy, category: selectedCategory, 
               minPrice: range.min, maxPrice: range.max });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSortBy('newest');
    setSelectedCategory('');
    setPriceRange({ min: '', max: '' });
    setCurrentPage(1);
    router.push('/products', { scroll: false });
  };

  if (loading) {
    return <LoadingSpinner fullscreen text="Đang tải sản phẩm..." />;
  }

  if (error) {
    return (
      <div className="container">
        <div className={styles.errorContainer}>
          <h2>Có lỗi xảy ra</h2>
          <p>Không thể tải sản phẩm. Vui lòng thử lại sau.</p>
          <Button onClick={() => window.location.reload()} className={styles.retryButton}>
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  const currentPageProducts = getCurrentPageProducts();

  return (
    <div className="container">
      <div className={styles.pageContainer}>
        {/* Page Header */}
        <PageHeader
          title="Tất Cả Sản Phẩm"
          subtitle={`Tìm thấy ${filteredProducts.length} sản phẩm`}
          icon={FaShoppingBag}
          breadcrumbs={[
            { label: 'Trang chủ', href: '/' },
            { label: 'Sản phẩm', href: '/products' }
          ]}
        />

        <div className={styles.contentWrapper}>
          <div className="row">
            {/* Filters Sidebar - 3 columns */}
            <div className="col-3">
              <div className={styles.sidebarColumn}>
                <FilterSidebar
                  searchTerm={searchTerm}
                  onSearchChange={handleSearchChange}
                  sortBy={sortBy}
                  sortOptions={SORT_OPTIONS.map(opt => ({
                    value: opt.value,
                    label: opt.label
                  }))}
                  onSortChange={handleSortChange}
                  selectedCategory={selectedCategory}
                  onCategoryChange={handleCategoryChange}
                  priceRange={priceRange}
                  onPriceRangeChange={handlePriceRangeChange}
                  onClearFilters={clearFilters}
                />
              </div>
            </div>

            {/* Products Container - 9 columns */}
            <div className="col-9">
              <div className={styles.productsColumn}>
                <div className={styles.productsContainer}>
                  {currentPageProducts.length > 0 ? (
                    <div className={styles.productsGrid}>
                      {currentPageProducts.map((product: ProductWithCategory) => {
                        // Get real stats for this product
                        const productStatsData = productStats[product._id];
                        
                        return (
                          <div key={product._id} className={styles.productWrapper}>
                            <ProductItem 
                              product={product} 
                              layout="grid"
                              averageRating={productStatsData?.averageRating || 0}
                              reviewCount={productStatsData?.reviewCount || 0}
                              showRatingBadge={true}
                            />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className={styles.noResults}>
                      <div className={styles.noResultsIcon}>📦</div>
                      <h3>Không tìm thấy sản phẩm nào</h3>
                      <p>Hãy thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm</p>
                      <Button 
                        onClick={clearFilters} 
                        variant="primary" 
                        size="md"
                      >
                        Xem tất cả sản phẩm
                      </Button>
                    </div>
                  )}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <Pagination
                      pagination={{
                        page: currentPage,
                        limit: productsPerPage,
                        totalPages: totalPages,
                        totalProducts: filteredProducts.length,
                        hasNextPage: currentPage < totalPages,
                        hasPrevPage: currentPage > 1
                      }}
                      onPageChange={handlePageChange}
                      className={styles.paginationComponent}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">Đang tải sản phẩm...</p>
        </div>
      </div>
    }>
      <ProductsPageContent />
    </Suspense>
  );
}
