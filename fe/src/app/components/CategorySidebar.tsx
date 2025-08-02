'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Category } from '@/types';
import { useCategories } from '@/hooks/useCategories';
import { categoryService } from '@/services';
import styles from './CategorySidebar.module.css';
import { 
  FaTags, 
  FaChevronRight, 
  FaChevronDown,
  FaSpinner,
  FaExclamationTriangle,
  FaLayerGroup,
  FaStore,
  FaFolder,
  FaFolderOpen
} from 'react-icons/fa';

interface CategoryWithChildren extends Category {
  children?: Category[];
  productCount?: number;
}

interface CategorySidebarProps {
  maxCategories?: number;
  showAllCategoriesLink?: boolean;
  showHierarchy?: boolean;
  initialCategories?: Category[]; // Add support for SSR data
}

export default function CategorySidebar({ 
  maxCategories = 10,
  showAllCategoriesLink = true,
  showHierarchy = true,
  initialCategories // Add initial data prop
}: CategorySidebarProps) {
  const { loading, error } = useCategories();
  const [hierarchicalCategories, setHierarchicalCategories] = useState<CategoryWithChildren[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    // Use initial data if provided (SSR case)
    if (initialCategories && initialCategories.length > 0) {
      console.log('📦 CategorySidebar: Using SSR initial categories');
      if (showHierarchy) {
        // Build hierarchical structure from initial categories
        const activeCategories = initialCategories.filter((cat: Category) => cat.isActive);
        
        const parentCategories = activeCategories.filter((cat: Category) => !cat.parent);
        const childCategories = activeCategories.filter((cat: Category) => cat.parent);

        const hierarchical = parentCategories.map((parent: Category) => {
          const children = childCategories
            .filter((child: Category) => child.parent === parent._id)
            .slice(0, 10); // Limit children per parent

          return {
            ...parent,
            children: children.length > 0 ? children : undefined
          };
        }).slice(0, maxCategories);

        setHierarchicalCategories(hierarchical);
      } else {
        // Non-hierarchical - just take first maxCategories
        const flatCategories = initialCategories
          .filter((cat: Category) => cat.isActive)
          .slice(0, maxCategories)
          .map((cat: Category) => ({ ...cat, children: undefined }));
        
        setHierarchicalCategories(flatCategories);
      }
      return; // Don't fetch if we have initial data
    }

    // Fallback to API fetch if no initial data
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        setFetchError(null);
        
        // Get ALL categories by setting high limit
        const response = await categoryService.getPublicCategories({ limit: 100 });
        const allCategories = response.data || [];
        
        if (showHierarchy) {
          // Build hierarchical structure from ALL categories
          const activeCategories = allCategories.filter((cat: Category) => cat.isActive);
          
          const parentCategories = activeCategories.filter((cat: Category) => !cat.parent);
          const childCategories = activeCategories.filter((cat: Category) => cat.parent);

          const hierarchical = parentCategories.map((parent: Category) => {
            const children = childCategories
              .filter((child: Category) => child.parent === parent._id)
              .slice(0, 10); // Limit children per parent

            return {
              ...parent,
              children: children.length > 0 ? children : undefined
            };
          }).slice(0, maxCategories);

          setHierarchicalCategories(hierarchical);
          
          // DO NOT auto-expand - keep collapsed for cleaner UI
          // const categoriesWithChildren = new Set(
          //   hierarchical
          //     .filter((cat: CategoryWithChildren) => cat.children && cat.children.length > 0)
          //     .map((cat: CategoryWithChildren) => cat._id as string)
          // );
          // setExpandedCategories(categoriesWithChildren);
          
        } else {
          // Show only parent categories (original behavior)
          const activeCategories = allCategories
            .filter((cat: Category) => cat.isActive && !cat.parent)
            .slice(0, maxCategories)
            .map((cat: Category) => ({ ...cat, children: undefined }));
          setHierarchicalCategories(activeCategories);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        setFetchError('Không thể tải danh mục');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, [maxCategories, showHierarchy, initialCategories]); // Add initialCategories to dependencies

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  // Loading State
  if (isLoading) {
    return (
      <div className={styles.sidebar}>
        <div className={styles.header}>
          <FaTags className={styles.headerIcon} />
          <h3 className={styles.headerTitle}>Danh mục</h3>
        </div>
        <div className={styles.loadingContainer}>
          <FaSpinner className={styles.spinner} />
          <span className={styles.loadingText}>Đang tải...</span>
        </div>
      </div>
    );
  }

  // Error State
  if (fetchError) {
    return (
      <div className={styles.sidebar}>
        <div className={styles.header}>
          <FaTags className={styles.headerIcon} />
          <h3 className={styles.headerTitle}>Danh mục</h3>
        </div>
        <div className={styles.errorContainer}>
          <FaExclamationTriangle className={styles.errorIcon} />
          <div className={styles.errorContent}>
            <h4 className={styles.errorTitle}>Có lỗi xảy ra</h4>
            <p className={styles.errorText}>Không thể tải danh mục</p>
          </div>
        </div>
      </div>
    );
  }

  // Empty State
  if (hierarchicalCategories.length === 0) {
    return (
      <div className={styles.sidebar}>
        <div className={styles.header}>
          <FaTags className={styles.headerIcon} />
          <h3 className={styles.headerTitle}>Danh mục</h3>
          <span className={styles.headerBadge}>0</span>
        </div>
        <div className={styles.emptyContainer}>
          <FaLayerGroup className={styles.emptyIcon} />
          <div className={styles.emptyContent}>
            <h4 className={styles.emptyTitle}>Chưa có danh mục</h4>
            <p className={styles.emptyText}>Danh mục sẽ xuất hiện ở đây</p>
          </div>
        </div>
      </div>
    );
  }

  const renderCategory = (category: CategoryWithChildren, isChild = false) => {
    const isExpanded = expandedCategories.has(category._id);
    const hasChildren = category.children && category.children.length > 0;
    
    return (
      <div key={category._id} className={`${styles.categoryGroup} ${isChild ? styles.childCategory : ''}`}>
        <div 
          className={`${styles.categoryItem} ${
            hoveredCategory === category._id ? styles.categoryItemHovered : ''
          } ${isChild ? styles.categoryItemChild : styles.categoryItemParent}`}
          onMouseEnter={() => setHoveredCategory(category._id)}
          onMouseLeave={() => setHoveredCategory(null)}
        >
          {/* Expandable button for parent categories with children */}
          {hasChildren && !isChild && (
            <button
              className={styles.expandButton}
              onClick={(e) => {
                e.preventDefault();
                toggleCategory(category._id);
              }}
              aria-label={isExpanded ? 'Thu gọn' : 'Mở rộng'}
            >
              {isExpanded ? (
                <FaChevronDown className={styles.expandIcon} />
              ) : (
                <FaChevronRight className={styles.expandIcon} />
              )}
            </button>
          )}

          {/* Category Link */}
          <Link
            href={`/products?category=${category._id}`}
            className={styles.categoryLink}
          >
            <div className={styles.categoryContent}>
              <div className={styles.categoryInfo}>
                {isChild ? (
                  <FaStore className={styles.categoryIcon} />
                ) : hasChildren ? (
                  isExpanded ? (
                    <FaFolderOpen className={styles.categoryIcon} />
                  ) : (
                    <FaFolder className={styles.categoryIcon} />
                  )
                ) : (
                  <FaStore className={styles.categoryIcon} />
                )}
                <span className={styles.categoryName}>{category.name}</span>
              </div>
              <FaChevronRight className={styles.categoryArrow} />
            </div>

            {/* Hover Effect Overlay */}
            <div className={styles.hoverOverlay} />
          </Link>
        </div>

        {/* Child Categories */}
        {hasChildren && isExpanded && (
          <div className={styles.childrenContainer}>
            {category.children!.map(child => renderCategory(child, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.sidebar}>
      {/* Header */}
      <div className={styles.header}>
        <FaTags className={styles.headerIcon} />
        <h3 className={styles.headerTitle}>Danh mục</h3>
        <span className={styles.headerBadge}>{hierarchicalCategories.length}</span>
      </div>

      {/* Categories List */}
      <div className={styles.categoryList}>
        {hierarchicalCategories.map(category => renderCategory(category))}
      </div>

      {/* View All Categories CTA */}
      {showAllCategoriesLink && (
        <div className={styles.footer}>
          <Link href="/categories" className={styles.viewAllLink}>
            <FaLayerGroup className={styles.viewAllIcon} />
            <span>Xem tất cả danh mục</span>
            <FaChevronRight className={styles.viewAllArrow} />
          </Link>
        </div>
      )}
    </div>
  );
}