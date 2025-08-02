'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Category } from '@/types';
import { useCategories } from '@/hooks/useCategories';
import { PageHeader } from '@/app/components/ui';
import styles from './page.module.css';
import { FaLayerGroup, FaStore, FaSpinner } from 'react-icons/fa';

export default function CategoriesPage() {
  const { getParentCategories, loading, error } = useCategories();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getParentCategories();
        const activeCategories = response.filter(cat => cat.isActive);
        setCategories(activeCategories);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };

    fetchCategories();
  }, [getParentCategories]);

  if (loading) {
    return (
      <div className="container">
        <div className={styles.loadingContainer}>
          <FaSpinner className={styles.spinner} />
          <h2>Đang tải danh mục...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <PageHeader
        title="Tất cả danh mục sản phẩm"
        subtitle="Khám phá các danh mục sản phẩm đa dạng của chúng tôi"
        icon={FaLayerGroup}
        backLink={{
          href: "/",
          label: "Quay lại trang chủ"
        }}
      />

      <div className={styles.categoriesGrid}>
        {categories.map((category) => (
          <Link
            key={category._id}
            href={`/products?category=${category._id}`}
            className={styles.categoryCard}
          >
            <div className={styles.categoryIcon}>
              <FaStore />
            </div>
            <h3 className={styles.categoryName}>{category.name}</h3>
            {category.description && (
              <p className={styles.categoryDescription}>
                {category.description}
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
