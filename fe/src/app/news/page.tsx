'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './news.module.css';

interface NewsPost {
  id: number;
  title: string;
  excerpt: string;
  image: string;
  date: string;
  category: string;
  slug: string;
  views: number;
  author: string;
}

interface PaginationInfo {
  current: number;
  total: number;
  totalItems: number;
}

export default function NewsPage() {
  const [news, setNews] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState<PaginationInfo>({
    current: 1,
    total: 1,
    totalItems: 0
  });

  useEffect(() => {
    loadNews();
  }, [selectedCategory, searchTerm, pagination.current]);

  const loadNews = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.current.toString(),
        limit: '9',
        status: 'published'
      });

      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(`/api/news?${params}`);
      const data = await response.json();

      if (data.success) {
        setNews(data.data);
        setPagination(data.pagination);
        
        // Extract unique categories
        const allCategories = data.data.map((item: NewsPost) => item.category) as string[];
        setCategories([...new Set(allCategories)]);
      }
    } catch (error) {
      console.error('Error loading news:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, current: page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Đang tải tin tức...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>Tin Tức Thời Trang</h1>
        <p className={styles.pageSubtitle}>
          Cập nhật những xu hướng thời trang mới nhất và các sự kiện đặc biệt
        </p>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.categoryFilter}>
          <button
            className={`${styles.categoryBtn} ${selectedCategory === 'all' ? styles.active : ''}`}
            onClick={() => handleCategoryChange('all')}
          >
            Tất cả
          </button>
          {categories.map(category => (
            <button
              key={category}
              className={`${styles.categoryBtn} ${selectedCategory === category ? styles.active : ''}`}
              onClick={() => handleCategoryChange(category)}
            >
              {category}
            </button>
          ))}
        </div>

        <form className={styles.searchForm} onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Tìm kiếm tin tức..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          <button type="submit" className={styles.searchBtn}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M21 21L16.5 16.5M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </form>
      </div>

      {/* News Grid */}
      {news.length > 0 ? (
        <div className={styles.newsGrid}>
          {news.map(item => (
            <article key={item.id} className={styles.newsCard}>
              <Link href={`/news/${item.slug}`} className={styles.cardLink}>
                <div className={styles.imageContainer}>
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className={styles.newsImage}
                  />
                  <div className={styles.categoryBadge}>
                    {item.category}
                  </div>
                </div>
                <div className={styles.cardContent}>
                  <h3 className={styles.newsTitle}>{item.title}</h3>
                  <p className={styles.newsExcerpt}>{item.excerpt}</p>
                  <div className={styles.newsMetadata}>
                    <span className={styles.date}>{formatDate(item.date)}</span>
                    <span className={styles.views}>{item.views} lượt xem</span>
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <div className={styles.noResults}>
          <div className={styles.noResultsIcon}>📰</div>
          <h3>Không tìm thấy tin tức nào</h3>
          <p>Thử thay đổi từ khóa tìm kiếm hoặc chọn danh mục khác</p>
        </div>
      )}

      {/* Pagination */}
      {pagination.total > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            onClick={() => handlePageChange(pagination.current - 1)}
            disabled={pagination.current === 1}
          >
            ‹ Trước
          </button>
          
          {Array.from({ length: pagination.total }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              className={`${styles.pageBtn} ${page === pagination.current ? styles.active : ''}`}
              onClick={() => handlePageChange(page)}
            >
              {page}
            </button>
          ))}
          
          <button
            className={styles.pageBtn}
            onClick={() => handlePageChange(pagination.current + 1)}
            disabled={pagination.current === pagination.total}
          >
            Sau ›
          </button>
        </div>
      )}
    </div>
  );
}
