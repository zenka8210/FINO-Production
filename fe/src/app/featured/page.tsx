"use client";

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useProducts, useProductStats } from '@/hooks';
import { productService } from '@/services';
import { ProductWithCategory } from '@/types';
import ProductItem from '../components/ProductItem';
import { LoadingSpinner, Button, Pagination } from '../components/ui';
import { isProductOnSale } from '@/lib/productUtils';
import FilterSidebar from '../components/FilterSidebar';
import styles from './featured.module.css';

export default function FeaturedProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getProducts, loading, error } = useProducts();
  
  // State management
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductWithCategory[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('popularity-desc');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [selectedCategory, setSelectedCategory] = useState('');

  const productsPerPage = 12;

  // Get real product statistics
  const productIds = products.map(p => p._id);
  const { stats: productStats, loading: statsLoading } = useProductStats(productIds);

  // Debug logs
  console.log('🔍 FeaturedPage Debug:', {
    productsCount: products.length,
    productIdsCount: productIds.length,
    statsLoading,
    statsKeysCount: Object.keys(productStats).length,
    firstFewProducts: products.slice(0, 3).map(p => ({ id: p._id, name: p.name })),
    statsEntries: Object.entries(productStats).slice(0, 3)
  });

  useEffect(() => {
    // Get URL parameters
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
    const search = searchParams.get('search') || '';
    const sort = searchParams.get('sort') || 'popularity-desc';
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
    const fetchFeaturedProducts = async () => {
      try {
        // Use REAL featured products API instead of simulating data
        console.log('🎯 FeaturedPage: Fetching REAL featured products from backend API...');
        const response = await productService.getFeaturedProducts(500); // Get many to allow filtering
        console.log('✅ Real featured products response:', response);
        
        // Handle response structure
        const featuredProductsData = Array.isArray(response) ? response : 
                                    (response as any)?.data || [];
        
        console.log(`📊 FeaturedPage: Received ${featuredProductsData.length} real featured products`);
        
        // Set products directly - no need for complex calculation since backend handles it
        setProducts(featuredProductsData);
        
        // Extract unique categories from real featured products
        const categories = Array.from(new Set(
          featuredProductsData.map((product: ProductWithCategory) => {
            const categoryName = typeof product.category === 'object' && product.category?.name 
              ? product.category.name 
              : typeof product.category === 'string' 
                ? product.category 
                : '';
            return categoryName.toLowerCase();
          }).filter(Boolean)
        )) as string[];
        
        setAvailableCategories(categories);
      } catch (err) {
        console.error('❌ Failed to fetch featured products:', err);
        // Fallback to regular getProducts if API fails
        console.log('⚠️ Falling back to regular products API...');
        try {
          const fallbackResponse = await getProducts({ limit: 500 });
          const productsArray = Array.isArray(fallbackResponse.data) ? fallbackResponse.data : 
                               (fallbackResponse.data && Array.isArray((fallbackResponse.data as any).data)) ? 
                               (fallbackResponse.data as any).data : [];
          
          // Basic filtering for featured products
          const featuredProducts = productsArray.filter((product: ProductWithCategory) => 
            product.isActive !== false
          );
          
          setProducts(featuredProducts);
          
          const categories = Array.from(new Set(
            featuredProducts.map((product: ProductWithCategory) => {
              const categoryName = typeof product.category === 'object' && product.category?.name 
                ? product.category.name 
                : typeof product.category === 'string' 
                  ? product.category 
                  : '';
              return categoryName.toLowerCase();
            }).filter(Boolean)
          )) as string[];
          
          setAvailableCategories(categories);
        } catch (fallbackErr) {
          console.error('❌ Fallback also failed:', fallbackErr);
        }
      }
    };

    fetchFeaturedProducts();
  }, []); // Remove getProducts dependency since we're using productService directly

  useEffect(() => {
    // Apply filters and sorting
    let filtered = [...products];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(product => {
        const categoryName = typeof product.category === 'object' && product.category?.name ? 
          product.category.name : typeof product.category === 'string' ? product.category : '';
        return categoryName.toLowerCase().includes(selectedCategory.toLowerCase());
      });
    }

    // Price range filter
    if (priceRange.min) {
      filtered = filtered.filter(product => product.price >= parseInt(priceRange.min));
    }
    if (priceRange.max) {
      filtered = filtered.filter(product => product.price <= parseInt(priceRange.max));
    }

    // Sorting using real product statistics
    filtered.sort((a: any, b: any) => {
      const aStats = productStats[a._id];
      const bStats = productStats[b._id];

      switch (sortBy) {
        case 'popularity-desc':
          // Calculate popularity based on real review data, with bonus for products that have reviews
          const aPopularity = (aStats?.reviewCount || 0) * (aStats?.averageRating || 1) * 5 + // Review bonus
                              (a.categoryBoost || 1) + (a.priceScore || 0) + (a.saleBoost || 1);
          const bPopularity = (bStats?.reviewCount || 0) * (bStats?.averageRating || 1) * 5 + // Review bonus
                              (b.categoryBoost || 1) + (b.priceScore || 0) + (b.saleBoost || 1);
          return bPopularity - aPopularity;
        case 'popularity-asc':
          const aPopularityAsc = (aStats?.reviewCount || 0) * (aStats?.averageRating || 1) * 5 +
                                 (a.categoryBoost || 1) + (a.priceScore || 0) + (a.saleBoost || 1);
          const bPopularityAsc = (bStats?.reviewCount || 0) * (bStats?.averageRating || 1) * 5 +
                                 (b.categoryBoost || 1) + (b.priceScore || 0) + (b.saleBoost || 1);
          return aPopularityAsc - bPopularityAsc;
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'rating-desc':
          return (bStats?.averageRating || 0) - (aStats?.averageRating || 0);
        default:
          const aPopularityDefault = (aStats?.reviewCount || 0) * (aStats?.averageRating || 1) * 5 +
                                     (a.categoryBoost || 1) + (a.priceScore || 0) + (a.saleBoost || 1);
          const bPopularityDefault = (bStats?.reviewCount || 0) * (bStats?.averageRating || 1) * 5 +
                                     (b.categoryBoost || 1) + (b.priceScore || 0) + (b.saleBoost || 1);
          return bPopularityDefault - aPopularityDefault;
      }
    });

    setFilteredProducts(filtered);
    setTotalPages(Math.ceil(filtered.length / productsPerPage));
  }, [products, searchTerm, sortBy, selectedCategory, priceRange, productStats]); // Add productStats dependency

  const getCurrentPageProducts = () => {
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    return filteredProducts.slice(startIndex, endIndex);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateURL({ page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateURL = (params: Record<string, any>) => {
    const urlParams = new URLSearchParams(searchParams);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value && value !== '') {
        urlParams.set(key, value.toString());
      } else {
        urlParams.delete(key);
      }
    });

    router.push(`/featured?${urlParams.toString()}`, { scroll: false });
  };

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
    setCurrentPage(1);
    updateURL({ sort: newSort, page: 1 });
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
    updateURL({ category, page: 1 });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSortBy('popularity-desc');
    setSelectedCategory('');
    setPriceRange({ min: '', max: '' });
    setCurrentPage(1);
    router.push('/featured');
  };

  if (loading || statsLoading) {
    return <LoadingSpinner fullscreen text="Đang tải sản phẩm nổi bật..." />;
  }

  if (error) {
    return (
      <div className="container">
        <div className={styles.errorContainer}>
          <h2>Có lỗi xảy ra</h2>
          <p>Không thể tải sản phẩm nổi bật. Vui lòng thử lại sau.</p>
          <button onClick={() => window.location.reload()} className={styles.retryButton}>
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  const currentPageProducts = getCurrentPageProducts();

  return (
    <div className="container">
      <div className={styles.pageContainer}>
        {/* Page Header */}
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>
            <span className={styles.featuredIcon}>⭐</span>
            Sản Phẩm Nổi Bật
          </h1>
          <p className={styles.pageSubtitle}>
            Tìm thấy {filteredProducts.length} sản phẩm được yêu thích nhất
          </p>
        </div>

        <div className={styles.contentWrapper}>
          {/* Filters Sidebar */}
          <FilterSidebar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            sortBy={sortBy}
            sortOptions={[
              { value: 'popularity-desc', label: 'Phổ biến nhất' },
              { value: 'popularity-asc', label: 'Ít phổ biến' },
              { value: 'rating-desc', label: 'Đánh giá cao nhất' },
              { value: 'price-asc', label: 'Giá thấp đến cao' },
              { value: 'price-desc', label: 'Giá cao đến thấp' },
              { value: 'name-asc', label: 'Tên A-Z' },
              { value: 'name-desc', label: 'Tên Z-A' }
            ]}
            onSortChange={handleSortChange}
            availableCategories={availableCategories}
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
            priceRange={priceRange}
            onPriceRangeChange={setPriceRange}
            onClearFilters={clearFilters}
          />

          {/* Products Grid */}
          <div className={styles.productsContainer}>
            {currentPageProducts.length > 0 ? (
              <div className={styles.productsGrid}>
                {currentPageProducts.map((product: any) => (
                  <div key={product._id} className={styles.productWrapper}>
                    <ProductItem 
                      product={product} 
                      layout="grid"
                    />
                    {/* Show real product statistics */}
                    {productStats[product._id] && productStats[product._id].reviewCount > 0 && (
                      <div className={styles.popularityBadge}>
                        ⭐ {productStats[product._id].averageRating.toFixed(1)} ({productStats[product._id].reviewCount} đánh giá)
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.noResults}>
                <div className={styles.noResultsIcon}>📦</div>
                <h3>Không tìm thấy sản phẩm nào</h3>
                <p>Hãy thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm</p>
                <Button onClick={clearFilters} className={styles.resetFiltersBtn}>
                  Xem tất cả sản phẩm nổi bật
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
  );
}
