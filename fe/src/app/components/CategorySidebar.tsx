'use client';
import { useState, useEffect } from 'react';
import styles from './CategorySidebar.module.css';
import { FiMenu, FiHeart, FiGift, FiStar, FiTrendingUp, FiUser, FiPackage } from 'react-icons/fi';
import { useCategories } from '@/hooks';
import { Category } from '@/types';

export default function CategorySidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const { getCategories, loading, error } = useCategories();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getCategories();
        console.log('Categories response:', response);
        
        // getCategories() returns { data: Category[], pagination: {} }
        // We need the data property which contains the actual Category array
        let categoriesArray: Category[] = [];
        
        if (Array.isArray(response)) {
          // Direct array
          categoriesArray = response;
        } else if (response && typeof response === 'object' && 'data' in response && Array.isArray((response as any).data)) {
          // Paginated response with data property
          categoriesArray = (response as any).data;
        } else {
          console.warn('Unexpected categories response format:', response);
          categoriesArray = [];
        }
        
        setCategories(categoriesArray);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
        // Fallback categories
        setCategories([
          { 
            _id: '1', 
            name: 'Quần áo', 
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          { 
            _id: '2', 
            name: 'Thời trang nam', 
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          { 
            _id: '3', 
            name: 'Thời trang nữ', 
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]);
      }
    };

    fetchCategories();
  }, [getCategories]);

  const getCategoryIcon = (index: number) => {
    const icons = [<FiUser key="user" />, <FiHeart key="heart" />, <FiGift key="gift" />, <FiStar key="star" />, <FiTrendingUp key="trending" />, <FiPackage key="package" />];
    return icons[index % icons.length];
  };

  const getCategoryColor = (index: number) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#F39C12', '#9B59B6', '#3498DB', '#E74C3C'];
    return colors[index % colors.length];
  };

  return (
    <>
      {/* Mobile toggle button */}
      <button 
        className={styles.mobileToggle}
        onClick={() => setIsOpen(!isOpen)}
      >
        <FiMenu />
        <span>Danh mục</span>
      </button>

      {/* Overlay for mobile */}
      {isOpen && <div className={styles.overlay} onClick={() => setIsOpen(false)} />}

      {/* Sidebar */}
      <div 
        className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}
      >
        <div className={styles.header}>
          <FiMenu className={styles.headerIcon} />
          <span>DANH MỤC SẢN PHẨM</span>
        </div>
        
        <div className={styles.categoryList}>
          {loading ? (
            <div className={styles.categoryItem}>
              <span>Đang tải...</span>
            </div>
          ) : (
            categories.map((category, index) => (
              <a 
                key={category._id} 
                href={`/products?category=${category._id}`}
                className={styles.categoryItem}
                onClick={() => setIsOpen(false)}
              >
                <div 
                  className={styles.categoryIcon}
                  style={{ backgroundColor: getCategoryColor(index) }}
                >
                  {getCategoryIcon(index)}
                </div>
                <span className={styles.categoryName}>{category.name}</span>
              </a>
            ))
          )}
        </div>
      </div>
    </>
  );
}
