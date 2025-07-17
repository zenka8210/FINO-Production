'use client';
import styles from './CategoryCards.module.css';
import { useState, useEffect } from 'react';
import { Category } from '@/types';
import { categoryService } from '@/services';

// Category icons mapping
const categoryIcons: Record<string, string> = {
  'quan-ao': '👕',
  'mu-non': '🧢', 
  'giay-dep': '👟',
  'phu-kien': '⌚️',
  'ba-lo': '🎒',
  'default': '📦'
};

// Category colors mapping  
const categoryColors: Record<string, { color: string; bgColor: string }> = {
  'quan-ao': { color: '#87CEEB', bgColor: '#E6F3FF' },
  'mu-non': { color: '#FFB347', bgColor: '#FFF2E6' },
  'giay-dep': { color: '#90EE90', bgColor: '#F0FFF0' },
  'phu-kien': { color: '#FFB6C1', bgColor: '#FFF0F5' },
  'ba-lo': { color: '#98FB98', bgColor: '#F0FFF0' },
  'default': { color: '#D3D3D3', bgColor: '#F5F5F5' }
};

export default function CategoryCards() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fallback categories nếu không load được từ API
  const fallbackCategories: Category[] = [
    { 
      _id: 'quan-ao', 
      name: 'Quần Áo', 
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    { 
      _id: 'mu-non', 
      name: 'Mũ Nón', 
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    { 
      _id: 'giay-dep', 
      name: 'Giày Dép', 
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    { 
      _id: 'phu-kien', 
      name: 'Phụ Kiện', 
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    { 
      _id: 'ba-lo', 
      name: 'Balo', 
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await categoryService.getCategories();
        console.log('CategoryCards response:', response);
        
        // categoryService.getCategories() returns { data: Category[], pagination: {} }
        const categoriesArray = Array.isArray(response) ? response : 
                               (response && typeof response === 'object' && 'data' in response && Array.isArray((response as any).data)) ? (response as any).data : [];
        setCategories(categoriesArray);
      } catch (err: any) {
        setError(err.message);
        console.error('Failed to fetch categories:', err);
        // Sử dụng fallback data
        setCategories(fallbackCategories);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const displayCategories = categories.length > 0 ? categories.slice(0, 5) : fallbackCategories;

  if (loading) {
    return (
      <div className={styles.categoryCardsContainer}>
        <div className={styles.cardsGrid}>
          {[...Array(5)].map((_, index) => (
            <div key={index} className={`${styles.categoryCard} ${styles.loading}`}>
              <div className={styles.cardContent}>
                <div className={styles.bearIcon}>...</div>
                <span className={styles.categoryName}>Đang tải...</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.categoryCardsContainer}>
      <div className={styles.cardsGrid}>
        {displayCategories.map((category) => {
          // Tạo slug từ name cho mapping
          const categorySlug = category.name.toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
          
          const colors = categoryColors[categorySlug] || categoryColors.default;
          const icon = categoryIcons[categorySlug] || categoryIcons.default;
          
          return (
            <a 
              key={category._id}
              href={`/products?category=${category._id}`}
              className={styles.categoryCard}
              style={{ backgroundColor: colors.bgColor }}
            >
              <div className={styles.cardContent}>
                <div 
                  className={styles.bearIcon}
                  style={{ backgroundColor: colors.color }}
                >
                  {icon}
                </div>
                <span className={styles.categoryName}>{category.name}</span>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
