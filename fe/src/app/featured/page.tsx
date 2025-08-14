"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useProducts, useProductStats } from '@/hooks';
import { productService, categoryService } from '@/services';
import { ProductWithCategory, Category } from '@/types';
import ProductItem from '../components/ProductItem';
import { LoadingSpinner, Button, Pagination, PageHeader } from '../components/ui';
import { isProductOnSale } from '@/lib/productUtils';
import FilterSidebar from '../components/FilterSidebar';
import { FaStar } from 'react-icons/fa';
import styles from './featured.module.css';

function FeaturedProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getProducts, loading, error } = useProducts();
  
  // State management
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductWithCategory[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]); // Add this for proper category filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('popularity-desc');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [selectedCategory, setSelectedCategory] = useState('');

  const productsPerPage = 12;

  // Helper function to get all child category IDs from complete category list
  const getAllChildCategoryIds = (parentCategoryId: string, categories: Category[]): string[] => {
    const childCategoryIds = new Set<string>();
    
    // Find child categories that have this parent
    categories.forEach(category => {
      if (category.parent === parentCategoryId) {
        childCategoryIds.add(category._id);
        // Recursively find children of children
        const grandChildren = getAllChildCategoryIds(category._id, categories);
        grandChildren.forEach(id => childCategoryIds.add(id));
      }
    });
    
    return Array.from(childCategoryIds);
  };

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

  // Fetch all categories for proper parent-child filtering
  useEffect(() => {
    const fetchAllCategories = async () => {
      try {
        const response = await categoryService.getPublicCategories({ limit: 100 });
        const categories = response.data || [];
        const activeCategories = categories.filter((cat: Category) => cat.isActive);
        setAllCategories(activeCategories);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };

    fetchAllCategories();
  }, []);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        // Use REAL featured products API instead of simulating data
        console.log('🎯 FeaturedPage: Fetching REAL featured products from backend API...');
        const response = await productService.getFeaturedProducts(100); // Increase limit to get more featured products with real metrics
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
          const fallbackResponse = await getProducts({ limit: 50 }); // Limit to 50 featured products
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

    // Category filter - include products from child categories too
    if (selectedCategory) {
      // Get all child category IDs for the selected category using complete category list
      const childCategoryIds = getAllChildCategoryIds(selectedCategory, allCategories);
      const allTargetCategoryIds = [selectedCategory, ...childCategoryIds];
      
      filtered = filtered.filter(product => {
        if (typeof product.category === 'object' && product.category?._id) {
          const productCategoryId = product.category._id;
          return allTargetCategoryIds.includes(productCategoryId);
        }
        return false;
      });
    }

    // Price range filter
    if (priceRange.min) {
      filtered = filtered.filter(product => product.price >= parseInt(priceRange.min));
    }
    if (priceRange.max) {
      filtered = filtered.filter(product => product.price <= parseInt(priceRange.max));
    }

    // Sorting using real backend metrics and product statistics
    filtered.sort((a: any, b: any) => {
      const aStats = productStats[a._id];
      const bStats = productStats[b._id];

      switch (sortBy) {
        case 'popularity-desc':
          // Use backend popularityScore first, then fallback to frontend calculation
          const aPopularityBackend = a.popularityScore || 0;
          const bPopularityBackend = b.popularityScore || 0;
          
          if (aPopularityBackend !== bPopularityBackend) {
            return bPopularityBackend - aPopularityBackend;
          }
          
          // Fallback: Calculate popularity based on real review data
          const aPopularity = (aStats?.reviewCount || 0) * (aStats?.averageRating || 1) * 5 + 
                              (a.wishlistCount || 0) * 3 + (a.salesCount || 0) * 2;
          const bPopularity = (bStats?.reviewCount || 0) * (bStats?.averageRating || 1) * 5 + 
                              (b.wishlistCount || 0) * 3 + (b.salesCount || 0) * 2;
          return bPopularity - aPopularity;
          
        case 'popularity-asc':
          const aPopularityAscBackend = a.popularityScore || 0;
          const bPopularityAscBackend = b.popularityScore || 0;
          
          if (aPopularityAscBackend !== bPopularityAscBackend) {
            return aPopularityAscBackend - bPopularityAscBackend;
          }
          
          const aPopularityAsc = (aStats?.reviewCount || 0) * (aStats?.averageRating || 1) * 5 +
                                 (a.wishlistCount || 0) * 3 + (a.salesCount || 0) * 2;
          const bPopularityAsc = (bStats?.reviewCount || 0) * (bStats?.averageRating || 1) * 5 +
                                 (b.wishlistCount || 0) * 3 + (b.salesCount || 0) * 2;
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
          // Sort by average rating descending, prioritize products with actual reviews
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
        default:
          // Use backend popularityScore for default sorting
          const aPopularityDefault = a.popularityScore || 
                                     ((aStats?.reviewCount || 0) * (aStats?.averageRating || 1) * 5 +
                                     (a.wishlistCount || 0) * 3 + (a.salesCount || 0) * 2);
          const bPopularityDefault = b.popularityScore || 
                                     ((bStats?.reviewCount || 0) * (bStats?.averageRating || 1) * 5 +
                                     (b.wishlistCount || 0) * 3 + (b.salesCount || 0) * 2);
          return bPopularityDefault - aPopularityDefault;
      }
    });

    setFilteredProducts(filtered);
    setTotalPages(Math.ceil(filtered.length / productsPerPage));
  }, [products, searchTerm, sortBy, selectedCategory, priceRange, productStats, allCategories]); // Add allCategories dependency

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
        <PageHeader
          title="Sản Phẩm Nổi Bật"
          subtitle={`Tìm thấy ${filteredProducts.length} sản phẩm được yêu thích nhất`}
          icon={FaStar}
          breadcrumbs={[
            { label: 'Trang chủ', href: '/' },
            { label: 'Sản phẩm nổi bật', href: '/featured' }
          ]}
        />

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
                {currentPageProducts.map((product: any) => {
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

export default function FeaturedProductsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FeaturedProductsContent />
    </Suspense>
  );
}
