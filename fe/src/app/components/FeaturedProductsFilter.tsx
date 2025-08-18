"use client";

import { useState } from 'react';
import styles from './FeaturedProductsFilter.module.css';

export type FeaturedFilterType = 'combined' | 'topRated' | 'mostWishlisted' | 'bestSelling';

interface FeaturedProductsFilterProps {
  activeFilter: FeaturedFilterType;
  onFilterChange: (filter: FeaturedFilterType) => void;
  loading?: boolean;
}

const filterOptions = [
  {
    key: 'combined' as FeaturedFilterType,
    label: 'Tổng hợp',
    description: 'Kết hợp tất cả tiêu chí'
  },
  {
    key: 'topRated' as FeaturedFilterType,
    label: 'Đánh giá cao',
    description: 'Sản phẩm có điểm đánh giá cao nhất'
  },
  {
    key: 'mostWishlisted' as FeaturedFilterType,
    label: 'Yêu thích nhiều',
    description: 'Được thêm vào wishlist nhiều nhất'
  },
  {
    key: 'bestSelling' as FeaturedFilterType,
    label: 'Bán chạy',
    description: 'Sản phẩm bán được nhiều nhất'
  }
];

export default function FeaturedProductsFilter({ 
  activeFilter, 
  onFilterChange, 
  loading = false 
}: FeaturedProductsFilterProps) {
  
  // Handle filter click with proper event handling
  const handleFilterClick = (filterKey: FeaturedFilterType, event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault(); // Prevent default button behavior
    event.stopPropagation(); // Stop event bubbling
    
    if (loading || filterKey === activeFilter) {
      return; // Don't change if loading or same filter
    }
    
    onFilterChange(filterKey);
  };

  return (
    <div className={styles.filterContainer}>
      <div className={styles.filterTabs}>
        {filterOptions.map((option) => (
          <button
            key={option.key}
            type="button" // Explicitly set type to prevent form submission
            className={`${styles.filterTab} ${
              activeFilter === option.key ? styles.active : ''
            } ${loading ? styles.loading : ''}`}
            onClick={(e) => handleFilterClick(option.key, e)}
            disabled={loading}
            title={option.description}
            aria-pressed={activeFilter === option.key}
            aria-label={`Filter by ${option.label}: ${option.description}`}
          >
            <span className={styles.filterLabel}>{option.label}</span>
            {loading && activeFilter === option.key && (
              <div className={styles.loadingSpinner}></div>
            )}
          </button>
        ))}
      </div>
      
      {/* Filter description */}
      <div className={styles.filterDescription}>
        {filterOptions.find(opt => opt.key === activeFilter)?.description}
      </div>
    </div>
  );
}
