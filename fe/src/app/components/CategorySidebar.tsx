'use client';
import { useState } from 'react';
import styles from './CategorySidebar.module.css';
import { FiMenu, FiHeart, FiGift, FiStar, FiTrendingUp, FiUser, FiPackage } from 'react-icons/fi';

const categories = [
  { id: 'clothing', name: 'Quần áo', icon: <FiUser />, color: '#FF6B6B' },
  { id: 'boy', name: 'Thời trang nam', icon: <FiHeart />, color: '#FF8E8E' },
  { id: 'girl', name: 'Thời trang nữ', icon: <FiUser />, color: '#4ECDC4' },
  { id: 'promo', name: 'Khuyến mãi', icon: <FiHeart />, color: '#DDA0DD' },
  { id: 'couple', name: 'Đồ đôi', icon: <FiGift />, color: '#F39C12' }
];

export default function CategorySidebar() {
  const [isOpen, setIsOpen] = useState(false);

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
      {isOpen && <div className={styles.overlay} onClick={() => setIsOpen(false)} />}      {/* Sidebar */}
      <div 
        className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}
      >
        <div className={styles.header}>
          <FiMenu className={styles.headerIcon} />
          <span>DANH MỤC SẢN PHẨM</span>
        </div>
        
        <div className={styles.categoryList}>
          {categories.map((category) => (
            <a 
              key={category.id} 
              href={`/products?category=${category.id}`}
              className={styles.categoryItem}
              onClick={() => setIsOpen(false)}
            >
              <div 
                className={styles.categoryIcon}
                style={{ backgroundColor: category.color }}
              >
                {category.icon}
              </div>
              <span className={styles.categoryName}>{category.name}</span>
            </a>
          ))}
        </div>
      </div>
    </>
  );
}
