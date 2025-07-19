'use client';

import { useState, useMemo } from 'react';
import { ProductWithCategory, ProductFilters } from '@/types';
import { useProducts } from '@/hooks';
import ProductItem from './ProductItem';
import { LoadingSpinner } from './ui';
import { getCurrentPrice } from '@/lib/productUtils';
import styles from './ProductList.module.css';

interface ProductListProps {
  products?: ProductWithCategory[];
  layout?: 'grid' | 'list';
  itemsPerPage?: number;
  showFilters?: boolean;
  showPagination?: boolean;
  showLayoutToggle?: boolean;
  showDescription?: boolean;
  className?: string;
  emptyMessage?: string;
  categoryId?: string;
  filters?: ProductFilters;
}

export default function ProductList({
  products: propProducts,
  layout = 'grid', // Use prop directly, no state needed
  itemsPerPage = 12,
  showFilters = false,
  showPagination = true,
  showLayoutToggle = true,
  showDescription = true,
  className = '',
  emptyMessage = 'Không tìm thấy sản phẩm nào.',
  categoryId,
  filters
}: ProductListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc' | 'name'>('newest');
  
  // Use products hook if no products provided
  const { loading, error } = useProducts();

  // Use provided products or empty array - ensure it's always an array
  const products = Array.isArray(propProducts) ? propProducts : [];

  // Sort products
  const sortedProducts = useMemo(() => {
    if (!products || !Array.isArray(products)) {
      return [];
    }
    
    const sorted = [...products];
    
    switch (sortBy) {
      case 'price-asc':
        return sorted.sort((a, b) => {
          const priceA = getCurrentPrice(a);
          const priceB = getCurrentPrice(b);
          return priceA - priceB;
        });
      case 'price-desc':
        return sorted.sort((a, b) => {
          const priceA = getCurrentPrice(a);
          const priceB = getCurrentPrice(b);
          return priceB - priceA;
        });
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name, 'vi', { sensitivity: 'base' }));
      case 'newest':
      default:
        return sorted.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
    }
  }, [products, sortBy]);

  // Pagination
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = sortedProducts.slice(startIndex, endIndex);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of product list
    document.getElementById('product-list-top')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle sort change
  const handleSortChange = (newSort: typeof sortBy) => {
    setSortBy(newSort);
    setCurrentPage(1); // Reset to first page
  };

  // Loading state
  if (loading && !propProducts) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner size="lg" />
        <p className={styles.loadingText}>Đang tải sản phẩm...</p>
      </div>
    );
  }

  // Error state
  if (error && !propProducts) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorContent}>
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <h3>Có lỗi xảy ra</h3>
          <p>{error}</p>
          <button className={styles.retryButton} onClick={() => window.location.reload()}>
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  const containerClass = `${styles.productListContainer} ${className}`;

  return (
    <div className={containerClass}>
      <div id="product-list-top" />
      
      {/* Header with Controls */}
      {(showLayoutToggle || products.length > 0) && (
        <div className={styles.listHeader}>
          <div className={styles.listInfo}>
            <span className={styles.productCount}>
              Hiển thị {currentProducts.length} trong tổng số {products.length} sản phẩm
            </span>
          </div>

          <div className={styles.listControls}>
            {/* Sort Dropdown */}
            <div className={styles.sortControl}>
              <label htmlFor="sort-select" className={styles.sortLabel}>
                Sắp xếp:
              </label>
              <select
                id="sort-select"
                className={styles.sortSelect}
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value as typeof sortBy)}
              >
                <option value="newest">Mới nhất</option>
                <option value="price-asc">Giá tăng dần</option>
                <option value="price-desc">Giá giảm dần</option>
                <option value="name">Tên A-Z</option>
              </select>
            </div>

            {/* Layout Toggle */}
            {showLayoutToggle && (
              <div className={styles.layoutToggle}>
                <button
                  className={`${styles.layoutBtn} ${layout === 'grid' ? styles.active : ''}`}
                  onClick={() => {/* Layout controlled by parent */}}
                  title="Xem dạng lưới"
                  aria-label="Chuyển sang hiển thị dạng lưới"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                  </svg>
                </button>
                <button
                  className={`${styles.layoutBtn} ${layout === 'list' ? styles.active : ''}`}
                  onClick={() => {/* Layout controlled by parent */}}
                  title="Xem dạng danh sách"
                  aria-label="Chuyển sang hiển thị dạng danh sách"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="3" y="6" width="18" height="4" />
                    <rect x="3" y="14" width="18" height="4" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Product Grid/List */}
      {currentProducts.length > 0 ? (
        <div className={`${styles.productGrid} ${styles[layout]}`}>
          {currentProducts.map((product) => (
            <ProductItem
              key={product._id}
              product={product}
              layout={layout}
              showDescription={showDescription && layout === 'list'}
            />
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <div className={styles.emptyContent}>
            <svg
              width="80"
              height="80"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <h3>Không có sản phẩm nào</h3>
            <p>{emptyMessage}</p>
          </div>
        </div>
      )}

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={`${styles.pageBtn} ${styles.prevBtn}`}
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
            aria-label="Trang trước"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15,18 9,12 15,6" />
            </svg>
            Trước
          </button>

          <div className={styles.pageNumbers}>
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
                  className={`${styles.pageBtn} ${currentPage === pageNum ? styles.active : ''}`}
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            className={`${styles.pageBtn} ${styles.nextBtn}`}
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
            aria-label="Trang sau"
          >
            Sau
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9,18 15,12 9,6" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
