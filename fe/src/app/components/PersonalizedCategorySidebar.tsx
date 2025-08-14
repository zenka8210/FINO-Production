'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePersonalization } from '@/hooks/usePersonalization';
import { personalizationService, PersonalizedCategory } from '@/services/personalizationService';
import { useAuth } from '@/contexts';
import styles from './PersonalizedCategorySidebar.module.css';
import { 
  FaTags, 
  FaChevronRight, 
  FaChevronDown,
  FaSpinner,
  FaExclamationTriangle,
  FaLayerGroup,
  FaHeart,
  FaEye,
  FaClock,
  FaStar,
  FaFire,
  FaLightbulb
} from 'react-icons/fa';

interface PersonalizedCategorySidebarProps {
  maxCategories?: number;
  showAllCategoriesLink?: boolean;
  showPersonalizationInfo?: boolean;
  initialCategories?: PersonalizedCategory[]; // Support for SSR
}

export default function PersonalizedCategorySidebar({ 
  maxCategories = 10,
  showAllCategoriesLink = true,
  showPersonalizationInfo = false,
  initialCategories
}: PersonalizedCategorySidebarProps) {
  const { user } = useAuth();
  const { 
    categories, 
    userBehaviorSummary, 
    loading, 
    error, 
    autoExpandedCategories,
    getBadgeStyle,
    getPersonalizationLevel,
    getPersonalizationDescription,
    refetch 
  } = usePersonalization({ 
    limit: maxCategories, 
    includeSubcategories: true 
  });

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // Auto-expand categories based on personalization on mount - FIXED: Use JSON.stringify to prevent infinite loop
  useEffect(() => {
    if (autoExpandedCategories.length > 0) {
      console.log('🎯 PersonalizedCategorySidebar: Auto-expanding categories:', autoExpandedCategories);
      setExpandedCategories(prev => {
        const newSet = new Set(autoExpandedCategories);
        // Only update if actually different to prevent infinite re-renders
        if (prev.size !== newSet.size || [...prev].some(id => !newSet.has(id))) {
          return newSet;
        }
        return prev;
      });
    }
  }, [JSON.stringify(autoExpandedCategories)]); // Use JSON.stringify for deep comparison

  // Use initial categories if provided (SSR case)
  const displayCategories = initialCategories && initialCategories.length > 0 
    ? initialCategories 
    : categories;

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

  const getBadgeIcon = (badgeType: PersonalizedCategory['badge']['type']) => {
    const iconProps = { className: styles.badgeIcon, size: 10 };
    
    switch (badgeType) {
      case 'favorite': return <FaHeart {...iconProps} />;
      case 'interested': return <FaEye {...iconProps} />;
      case 'pending': return <FaClock {...iconProps} />;
      case 'recommended': return <FaStar {...iconProps} />;
      case 'hot': return <FaFire {...iconProps} />;
      case 'suggested': return <FaLightbulb {...iconProps} />;
      case 'none': return null;
      default: return null;
    }
  };

  const getPersonalizationIndicatorClass = () => {
    const level = getPersonalizationLevel();
    return `${styles.personalizationIndicator} ${styles[level]}`;
  };

  // Loading State
  if (loading && !initialCategories) {
    return (
      <div className={styles.sidebar}>
        <div className={styles.header}>
          <FaTags className={styles.headerIcon} />
          <h3 className={styles.headerTitle}>Danh mục</h3>
        </div>
        <div className={styles.loadingContainer}>
          <FaSpinner className={styles.spinner} />
          <span className={styles.loadingText}>Đang tải danh mục cá nhân hóa...</span>
        </div>
      </div>
    );
  }

  // Error State
  if (error && !initialCategories) {
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
            <p className={styles.errorText}>Không thể tải danh mục cá nhân hóa</p>
            <button 
              onClick={refetch}
              className={styles.retryButton}
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Empty State
  if (displayCategories.length === 0) {
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

  const renderCategory = (category: PersonalizedCategory, isChild = false) => {
    const isExpanded = expandedCategories.has(category._id);
    const hasChildren = category.children && category.children.length > 0;
    const badgeStyle = getBadgeStyle(category._id);
    const shouldAutoExpand = autoExpandedCategories.includes(category._id);
    
    return (
      <div 
        key={category._id} 
        className={`${styles.categoryGroup} ${shouldAutoExpand ? styles.autoExpand : ''}`}
      >
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
                <span className={styles.categoryName}>{category.name}</span>
                
                {/* Personalization Badge */}
                {category.badge && category.badge.type !== 'default' && category.badge.type !== 'none' && (
                  <span 
                    className={`${styles.categoryBadge} ${styles[category.badge.type]}`}
                    title={badgeStyle?.label}
                  >
                    {getBadgeIcon(category.badge.type)}
                    {/* FIXED: Hiển thị badge text (Hot) thay vì count */}
                    {category.badge.text || category.badge.count}
                  </span>
                )}
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
      {/* Header with Personalization Indicator */}
      <div className={styles.header}>
        <FaTags className={styles.headerIcon} />
        <h3 className={styles.headerTitle}>
          {user ? 'Danh mục' : 'Danh mục'}
        </h3>
        <span className={styles.headerBadge}>{displayCategories.length}</span>
        
        {/* Personalization Level Indicator */}
        {user && userBehaviorSummary && (
          <div 
            className={getPersonalizationIndicatorClass()}
            title={getPersonalizationDescription()}
          />
        )}
      </div>

      {/* Personalization Info (Optional) */}
      {showPersonalizationInfo && user && userBehaviorSummary && (
        <div className={styles.personalizationInfo}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Mức cá nhân hóa:</span>
            <span className={styles.infoValue}>
              {getPersonalizationDescription()}
            </span>
          </div>
          {userBehaviorSummary.totalOrders > 0 && (
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Đơn hàng gần đây:</span>
              <span className={styles.infoValue}>{userBehaviorSummary.totalOrders}</span>
            </div>
          )}
          {userBehaviorSummary.wishlistItems > 0 && (
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Sản phẩm yêu thích:</span>
              <span className={styles.infoValue}>{userBehaviorSummary.wishlistItems}</span>
            </div>
          )}
        </div>
      )}

      {/* Categories List */}
      <div className={styles.categoryList}>
        {displayCategories.map(category => renderCategory(category))}
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
