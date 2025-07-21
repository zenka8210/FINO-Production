"use client";

import { Button } from './ui';
import styles from './FilterSidebar.module.css';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterSidebarProps {
  // Search
  searchTerm: string;
  onSearchChange: (value: string) => void;
  
  // Sort
  sortBy: string;
  sortOptions: FilterOption[];
  onSortChange: (value: string) => void;
  
  // Categories
  availableCategories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  
  // Price Range
  priceRange: { min: string; max: string };
  onPriceRangeChange: (range: { min: string; max: string }) => void;
  
  // Clear filters
  onClearFilters: () => void;
  
  // Optional customization
  showPriceFilter?: boolean;
  showCategoryFilter?: boolean;
  className?: string;
}

export default function FilterSidebar({
  searchTerm,
  onSearchChange,
  sortBy,
  sortOptions,
  onSortChange,
  availableCategories,
  selectedCategory,
  onCategoryChange,
  priceRange,
  onPriceRangeChange,
  onClearFilters,
  showPriceFilter = true,
  showCategoryFilter = true,
  className = ''
}: FilterSidebarProps) {
  
  const handlePriceMinChange = (value: string) => {
    // Ensure positive values only
    const numValue = parseFloat(value);
    if (value === '' || (numValue >= 0 && !isNaN(numValue))) {
      onPriceRangeChange({ ...priceRange, min: value });
    }
  };

  const handlePriceMaxChange = (value: string) => {
    // Ensure positive values only
    const numValue = parseFloat(value);
    if (value === '' || (numValue >= 0 && !isNaN(numValue))) {
      onPriceRangeChange({ ...priceRange, max: value });
    }
  };

  return (
    <div className={`${styles.filterSidebar} ${className}`}>
      {/* Search Section */}
      <div className={styles.filterSection}>
        <h3 className={styles.filterTitle}>Tìm kiếm</h3>
        <div className={styles.searchForm}>
          <input
            type="text"
            placeholder="Tìm sản phẩm..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      {/* Sort Section */}
      <div className={styles.filterSection}>
        <h3 className={styles.filterTitle}>Sắp xếp</h3>
        <select 
          value={sortBy} 
          onChange={(e) => onSortChange(e.target.value)}
          className={styles.filterSelect}
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Category Filter */}
      {showCategoryFilter && (
        <div className={styles.filterSection}>
          <h3 className={styles.filterTitle}>Danh mục</h3>
          <div className={styles.categoryFilters}>
            <button 
              className={`${styles.categoryBtn} ${selectedCategory === '' ? styles.active : ''}`}
              onClick={() => onCategoryChange('')}
            >
              Tất cả
            </button>
            {availableCategories.map((category) => (
              <button 
                key={category}
                className={`${styles.categoryBtn} ${selectedCategory === category ? styles.active : ''}`}
                onClick={() => onCategoryChange(category)}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Price Range Filter */}
      {showPriceFilter && (
        <div className={styles.filterSection}>
          <h3 className={styles.filterTitle}>Khoảng giá</h3>
          <div className={styles.priceRange}>
            <input
              type="number"
              min="0"
              step="1000"
              placeholder="Giá thấp nhất"
              value={priceRange.min}
              onChange={(e) => handlePriceMinChange(e.target.value)}
              className={styles.priceInput}
            />
            <span className={styles.priceSeparator}>-</span>
            <input
              type="number"
              min="0"
              step="1000"
              placeholder="Giá cao nhất"
              value={priceRange.max}
              onChange={(e) => handlePriceMaxChange(e.target.value)}
              className={styles.priceInput}
            />
          </div>
        </div>
      )}

      {/* Clear Filters Button */}
      <Button 
        onClick={onClearFilters} 
        variant="secondary"
        size="md"
        className={styles.clearFiltersBtn}
      >
        Xóa bộ lọc
      </Button>
    </div>
  );
}
