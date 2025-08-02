"use client";

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useProducts, useProductStats } from '@/hooks';
import { ProductWithCategory, Category } from '@/types';
import { categoryService } from '@/services';
import ProductItem from '../components/ProductItem';
import { LoadingSpinner, Button, Pagination, PageHeader } from '../components/ui';
import { isProductOnSale, getDiscountPercent } from '@/lib/productUtils';
import FilterSidebar from '../components/FilterSidebar';
import { FaFire } from 'react-icons/fa';
import styles from './sale.module.css';

export default function SaleProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getProducts, loading, error } = useProducts();
  
  // State management
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductWithCategory[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('discount-desc'); // Default sort by highest discount
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [selectedCategory, setSelectedCategory] = useState('');

  const productsPerPage = 12;

  // Helper function to get all child category IDs for a given parent category ID
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

  useEffect(() => {
    // Get URL parameters
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
    const search = searchParams.get('search') || '';
    const sort = searchParams.get('sort') || 'discount-desc';
    const category = searchParams.get('category') || '';
    const minPrice = searchParams.get('minPrice') || '';
    const maxPrice = searchParams.get('maxPrice') || '';

    setCurrentPage(page);
    setSearchTerm(search);
    setSortBy(sort);
    setSelectedCategory(category);
    setPriceRange({ min: minPrice, max: maxPrice });
  }, [searchParams]);

  // Fetch all categories for proper parent-child relationship
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoryService.getPublicCategories({ limit: 100 });
        const categories = response.data || [];
        const activeCategories = categories.filter((cat: Category) => cat.isActive);
        setAllCategories(activeCategories);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchSaleProducts = async () => {
      try {
        console.log('🔥 Sale page: Starting to fetch sale products...');
        
        // Use EXACT same parameters as FlashSale.tsx that works successfully  
        const response = await getProducts({
          isOnSale: 'true',     // String like backend expects (not boolean)
          limit: 1000,          // Increased limit for all sale products
          sort: 'createdAt',    // Same parameter name as FlashSale.tsx
          order: 'desc'         // Same parameter name as FlashSale.tsx
        });
        
        console.log('📦 Sale Page: API response received:', response);
        console.log('📦 Sale Page: Response structure - success:', response?.success);
        console.log('📦 Sale Page: Response structure - data:', response?.data);
        console.log('📦 Sale Page: Response data type:', typeof response?.data);
        console.log('📦 Sale Page: Is data.data array?:', Array.isArray(response?.data?.data));
        
        // Handle response data same as FlashSale.tsx
        const productsArray = Array.isArray(response.data) ? response.data : 
                             (response.data && Array.isArray((response.data as any).data)) ? (response.data as any).data : [];
        
        console.log('📦 Sale Page: Raw sale products received:', productsArray.length);
        
        // Use EXACT same filtering logic as FlashSale.tsx
        let saleProducts = [];
        
        if (productsArray.length > 0) {
          // Additional frontend filter to ensure products have salePrice - EXACT same as FlashSale.tsx
          saleProducts = productsArray
            .filter((product: ProductWithCategory) => 
              product.salePrice && 
              product.salePrice < product.price && 
              product.isActive !== false
            );
        }

        console.log('✅ Sale Page: Final filtered sale products:', saleProducts.length);
        
        // Set products even if empty to show "no products" message
        setProducts(saleProducts);

        // Extract unique categories from sale products
        const categories = Array.from(new Set(
          saleProducts.map((product: ProductWithCategory) => {
            const categoryName = typeof product.category === 'object' && product.category?.name 
              ? product.category.name 
              : typeof product.category === 'string' 
                ? product.category 
                : '';
            return categoryName.toLowerCase();
          }).filter(Boolean)
        )) as string[];
        setAvailableCategories(categories);
      } catch (err: any) {
        console.error('❌ Sale Page: Failed to fetch sale products:', err);
        console.error('❌ Sale Page: Error details:', err.message);
        // Set empty products array on error to show "no products" message
        setProducts([]);
      }
    };

    fetchSaleProducts();
  }, [getProducts]);

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
      // Get all child category IDs for the selected category
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

    // Price range filter (use current discounted price, not salePrice)
    if (priceRange.min) {
      filtered = filtered.filter(product => {
        const currentPrice = product.salePrice ?? product.price;
        return currentPrice >= parseInt(priceRange.min);
      });
    }
    if (priceRange.max) {
      filtered = filtered.filter(product => {
        const currentPrice = product.salePrice ?? product.price;
        return currentPrice <= parseInt(priceRange.max);
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      const aStats = productStats[a._id];
      const bStats = productStats[b._id];

      switch (sortBy) {
        case 'discount-desc':
          return getDiscountPercent(b) - getDiscountPercent(a);
        case 'discount-asc':
          return getDiscountPercent(a) - getDiscountPercent(b);
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
        case 'price-asc':
          return (a.salePrice || a.price) - (b.salePrice || b.price);
        case 'price-desc':
          return (b.salePrice || b.price) - (a.salePrice || a.price);
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        default:
          return getDiscountPercent(b) - getDiscountPercent(a);
      }
    });

    setFilteredProducts(filtered);
    setTotalPages(Math.ceil(filtered.length / productsPerPage));
  }, [products, searchTerm, sortBy, selectedCategory, priceRange, allCategories, productStats]);

  // Debounced search URL update
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== (searchParams.get('search') || '')) {
        updateURL({ search: searchTerm || undefined, page: 1 });
        setCurrentPage(1);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Debounced price range URL update
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const currentMinPrice = searchParams.get('minPrice') || '';
      const currentMaxPrice = searchParams.get('maxPrice') || '';
      
      if (priceRange.min !== currentMinPrice || priceRange.max !== currentMaxPrice) {
        updateURL({ 
          minPrice: priceRange.min || undefined,
          maxPrice: priceRange.max || undefined,
          page: 1 
        });
        setCurrentPage(1);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [priceRange]);

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

    router.push(`/sale?${urlParams.toString()}`, { scroll: false });
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
    setSortBy('discount-desc');
    setSelectedCategory('');
    setPriceRange({ min: '', max: '' });
    setCurrentPage(1);
    router.push('/sale');
  };

  if (loading) {
    return <LoadingSpinner fullscreen text="Đang tải sản phẩm khuyến mãi..." />;
  }

  if (error) {
    return (
      <div className="container">
        <div className={styles.errorContainer}>
          <h2>Có lỗi xảy ra</h2>
          <p>Không thể tải sản phẩm khuyến mãi. Vui lòng thử lại sau.</p>
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
          title="Sản Phẩm Khuyến Mãi"
          subtitle={`Tìm thấy ${filteredProducts.length} sản phẩm đang khuyến mãi`}
          icon={FaFire}
          breadcrumbs={[
            { label: 'Trang chủ', href: '/' },
            { label: 'Khuyến mãi', href: '/sale' }
          ]}
        />

        <div className={styles.contentWrapper}>
          {/* Filters Sidebar */}
          <FilterSidebar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            sortBy={sortBy}
            sortOptions={[
              { value: 'discount-desc', label: 'Giảm giá nhiều nhất' },
              { value: 'discount-asc', label: 'Giảm giá ít nhất' },
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
                {currentPageProducts.map((product) => {
                  // Get real stats for this product
                  const productStatsData = productStats[product._id];
                  
                  return (
                    <ProductItem 
                      key={product._id} 
                      product={product} 
                      layout="grid"
                      averageRating={productStatsData?.averageRating || 0}
                      reviewCount={productStatsData?.reviewCount || 0}
                      showRatingBadge={true}
                    />
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
                  Xem tất cả sản phẩm sale
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
