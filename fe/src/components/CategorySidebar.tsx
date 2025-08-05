"use client";
import { useState, useEffect } from 'react';
import styles from './CategorySidebar.module.css';

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  productCount?: number;
}

interface CategorySidebarProps {
  onCategorySelect: (categoryId: string | null) => void;
  selectedCategory: string | null;
  isFeatured?: boolean;
  userId?: string;
}

const CategorySidebar: React.FC<CategorySidebarProps> = ({
  onCategorySelect,
  selectedCategory,
  isFeatured = false,
  userId = null
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${BASE_URL}/api/categories`);
      const data = await response.json();
      
      if (data.success && data.data) {
        // Get product count for each category
        const categoriesWithCount = await Promise.all(
          data.data.map(async (category: Category) => {
            try {
              const productResponse = await fetch(
                `${BASE_URL}/api/products?category=${category._id}&limit=1`
              );
              const productData = await productResponse.json();
              return {
                ...category,
                productCount: productData.pagination?.total || 0
              };
            } catch (error) {
              return { ...category, productCount: 0 };
            }
          })
        );
        
        setCategories(categoriesWithCount.filter(cat => cat.isActive));
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (categoryId: string | null) => {
    onCategorySelect(categoryId);
  };

  return (
    <div className={`${styles.sidebar} ${!isExpanded ? styles.collapsed : ''}`}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h3 className={styles.title}>
            🗂️ Danh mục sản phẩm
          </h3>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={styles.toggleButton}
            title={isExpanded ? 'Thu gọn' : 'Mở rộng'}
          >
            {isExpanded ? '◀' : '▶'}
          </button>
        </div>
        {isExpanded && (
          <p className={styles.subtitle}>
            Lọc sản phẩm theo danh mục
          </p>
        )}
      </div>

      {/* Content */}
      {isExpanded && (
        <div className={styles.content}>
          {loading ? (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <span>Đang tải...</span>
            </div>
          ) : (
            <div className={styles.categoryList}>
              {/* All Products Option */}
              <button
                onClick={() => handleCategoryClick(null)}
                className={`${styles.categoryItem} ${!selectedCategory ? styles.active : ''}`}
              >
                <div className={styles.categoryIcon}>🛍️</div>
                <div className={styles.categoryInfo}>
                  <span className={styles.categoryName}>Tất cả sản phẩm</span>
                  <span className={styles.categoryCount}>
                    {categories.reduce((sum, cat) => sum + (cat.productCount || 0), 0)} sản phẩm
                  </span>
                </div>
              </button>

              {/* Featured Categories (if applicable) */}
              {isFeatured && (
                <button
                  onClick={() => handleCategoryClick('featured')}
                  className={`${styles.categoryItem} ${styles.featured} ${selectedCategory === 'featured' ? styles.active : ''}`}
                >
                  <div className={styles.categoryIcon}>⭐</div>
                  <div className={styles.categoryInfo}>
                    <span className={styles.categoryName}>Sản phẩm nổi bật</span>
                    <span className={styles.categoryCount}>Được đề xuất</span>
                  </div>
                </button>
              )}

              {/* Category List */}
              {categories.map((category) => (
                <button
                  key={category._id}
                  onClick={() => handleCategoryClick(category._id)}
                  className={`${styles.categoryItem} ${selectedCategory === category._id ? styles.active : ''}`}
                >
                  <div className={styles.categoryIcon}>📁</div>
                  <div className={styles.categoryInfo}>
                    <span className={styles.categoryName}>{category.name}</span>
                    <span className={styles.categoryCount}>
                      {category.productCount || 0} sản phẩm
                    </span>
                  </div>
                </button>
              ))}

              {categories.length === 0 && !loading && (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>📂</div>
                  <p>Chưa có danh mục nào</p>
                </div>
              )}
            </div>
          )}

          {/* User-specific section (if userId provided) */}
          {userId && isExpanded && (
            <div className={styles.userSection}>
              <div className={styles.sectionTitle}>👤 Dành cho bạn</div>
              <button
                onClick={() => handleCategoryClick('recommendations')}
                className={`${styles.categoryItem} ${styles.recommendation} ${selectedCategory === 'recommendations' ? styles.active : ''}`}
              >
                <div className={styles.categoryIcon}>💡</div>
                <div className={styles.categoryInfo}>
                  <span className={styles.categoryName}>Gợi ý cho bạn</span>
                  <span className={styles.categoryCount}>Cá nhân hóa</span>
                </div>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CategorySidebar;
