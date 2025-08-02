"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Category } from '@/types';
import CategoryCacheService from '@/services/categoryCacheService';
import { Button } from './ui';
import styles from './FilterSidebar.module.css';

// Extend Category interface for hierarchical structure
interface HierarchicalCategory extends Category {
  children?: Category[];
}

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
  
  // Categories - now supports hierarchical
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  
  // Price Range
  priceRange: { min: string; max: string };
  onPriceRangeChange: (range: { min: string; max: string }) => void;
  
  // Sale Filter
  isOnSale?: boolean;
  onSaleFilterChange?: (isOnSale: boolean) => void;
  
  // Clear filters
  onClearFilters: () => void;
  
  // Optional customization
  showPriceFilter?: boolean;
  showCategoryFilter?: boolean;
  showSaleFilter?: boolean;
  className?: string;
}

export default React.memo(function FilterSidebar({
  searchTerm,
  onSearchChange,
  sortBy,
  sortOptions,
  onSortChange,
  selectedCategory,
  onCategoryChange,
  priceRange,
  onPriceRangeChange,
  isOnSale = false,
  onSaleFilterChange,
  onClearFilters,
  showPriceFilter = true,
  showCategoryFilter = true,
  showSaleFilter = false,
  className = ''
}: FilterSidebarProps) {
  
  // State for hierarchical categories
  const [categories, setCategories] = useState<Category[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Get category cache service instance
  const categoryCache = CategoryCacheService.getInstance();

  // Memoize hierarchical categories to prevent re-computation
  const hierarchicalCategories = useMemo(() => {
    if (categories.length === 0) return [];
    
    const parentCategories = categories.filter(cat => !cat.parent);
    const childCategories = categories.filter(cat => cat.parent);
    
    return parentCategories.map(parent => ({
      ...parent,
      children: childCategories.filter(child => 
        child.parent && child.parent.toString() === parent._id.toString()
      )
    }));
  }, [categories]);

  // Fetch categories on mount - memoized to prevent re-fetching
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        // Use CategoryCacheService to get categories with caching
        const allCategories = await categoryCache.getCategories();
        
        // Filter only active categories
        const activeCategories = allCategories.filter((cat: Category) => cat.isActive);
        
        setCategories(activeCategories);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      } finally {
        setCategoriesLoading(false);
      }
    };
    
    // Only fetch if we don't have categories yet
    if (categories.length === 0) {
      fetchCategories();
    }
  }, []); // Empty dependency array - only run once

  // Category toggle handler - memoized to prevent re-creation
  const handleCategoryToggle = useMemo(() => (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  }, []);
  
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
            {/* All Categories Option */}
            <label className={`${styles.filterOption} ${selectedCategory === '' ? styles.checked : ''}`}>
              <input
                type="radio"
                name="category"
                checked={selectedCategory === ''}
                onChange={() => onCategoryChange('')}
              />
              <span>Tất cả</span>
            </label>
            
            {/* Hierarchical Categories */}
            {categoriesLoading ? (
              <div className={styles.categoryLoading}>Đang tải danh mục...</div>
            ) : (
              hierarchicalCategories.map(parentCategory => (
                <div key={parentCategory._id} className={styles.categoryGroup}>
                  {/* Parent Category */}
                  <div className={styles.parentCategory}>
                    <label className={`${styles.filterOption} ${selectedCategory === parentCategory._id ? styles.checked : ''}`}>
                      <input
                        type="radio"
                        name="category"
                        checked={selectedCategory === parentCategory._id}
                        onChange={() => onCategoryChange(parentCategory._id)}
                      />
                      <span>{parentCategory.name}</span>
                    </label>
                    {/* Expand/Collapse Button */}
                    {parentCategory.children && parentCategory.children.length > 0 && (
                      <button
                        type="button"
                        className={styles.expandButton}
                        onClick={() => handleCategoryToggle(parentCategory._id)}
                      >
                        {expandedCategories.has(parentCategory._id) ? '−' : '+'}
                      </button>
                    )}
                  </div>
                  
                  {/* Child Categories */}
                  {expandedCategories.has(parentCategory._id) && parentCategory.children && (
                    <div className={styles.childCategories}>
                      {parentCategory.children.map(childCategory => (
                        <label key={childCategory._id} className={`${styles.filterOption} ${selectedCategory === childCategory._id ? styles.checked : ''}`}>
                          <input
                            type="radio"
                            name="category"
                            checked={selectedCategory === childCategory._id}
                            onChange={() => onCategoryChange(childCategory._id)}
                          />
                          <span>{childCategory.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
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

      {/* Sale Filter */}
      {showSaleFilter && onSaleFilterChange && (
        <div className={styles.filterSection}>
          <h3 className={styles.filterTitle}>Khuyến mãi</h3>
          <label className={styles.saleFilterLabel}>
            <input
              type="checkbox"
              checked={isOnSale}
              onChange={(e) => onSaleFilterChange(e.target.checked)}
              className={styles.saleCheckbox}
            />
            <span className={styles.saleFilterText}>Chỉ sản phẩm đang giảm giá</span>
          </label>
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
});
