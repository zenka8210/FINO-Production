'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaNewspaper, FaCalendarAlt, FaUser, FaSearch } from 'react-icons/fa';
import { PageHeader, LoadingSpinner, Pagination } from '@/app/components/ui';
import { usePosts } from '@/hooks';
import { postService } from '@/services';
import { PostWithAuthor } from '@/types';
import styles from './news.module.css';

export default function NewsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const { posts, loading, error, pagination, refetch } = usePosts();

  // For search functionality - filter current page posts
  const filteredPosts = useMemo(() => {
    if (!searchTerm.trim()) return posts;
    
    return posts.filter(post => 
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.describe.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [posts, searchTerm]);

  // For featured posts, we need the latest posts (separate fetch)
  const [featuredPosts, setFeaturedPosts] = useState<PostWithAuthor[]>([]);
  
  useEffect(() => {
    // Fetch latest posts for featured section
    const fetchFeaturedPosts = async () => {
      try {
        const response = await postService.getPublishedPosts(1, 3);
        setFeaturedPosts(response.data);
      } catch (error) {
        console.error('Error fetching featured posts:', error);
      }
    };
    
    fetchFeaturedPosts();
  }, []);

  // Posts for "All posts" section - exclude featured posts to avoid duplication
  const postsForAllSection = useMemo(() => {
    if (searchTerm.trim()) {
      return filteredPosts; // When searching, show search results
    }
    
    // When not searching, exclude featured posts from the current page
    const featuredIds = featuredPosts.map(post => post._id);
    return posts.filter(post => !featuredIds.includes(post._id));
  }, [posts, featuredPosts, filteredPosts, searchTerm]);

  useEffect(() => {
    // Reset to first page when searching
    if (searchTerm.trim()) {
      setCurrentPage(1);
    }
  }, [searchTerm]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    refetch(page, 9);
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

  const getExcerpt = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  // Transform pagination data for Pagination component
  const paginationInfo = {
    page: pagination.current || 1,
    limit: pagination.limit || 9,
    totalPages: pagination.totalPages || 1,
    totalProducts: pagination.total || 0,
    hasNextPage: (pagination.current || 1) < (pagination.totalPages || 1),
    hasPrevPage: (pagination.current || 1) > 1
  };

  return (
    <div className="container">
      <div className={styles.pageContainer}>
        {/* Page Header */}
        <PageHeader
          title="Tin tức & Bài viết"
          subtitle="Cập nhật những thông tin mới nhất từ Fino Store"
          icon={FaNewspaper}
          breadcrumbs={[
            { label: 'Trang chủ', href: '/' },
            { label: 'Tin tức', href: '/news' }
          ]}
        />

        {/* Main Content */}
        <div className={styles.mainContent}>
          {/* Search Section */}
          <div className={styles.searchSection}>
            <div className={styles.searchCard}>
              <div className={styles.searchInputGroup}>
                <FaSearch className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Tìm kiếm bài viết..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles.searchInput}
                />
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className={styles.contentArea}>
            {loading ? (
              <div className={styles.loadingContainer}>
                <LoadingSpinner size="lg" />
                <p className={styles.loadingText}>Đang tải tin tức...</p>
              </div>
            ) : error ? (
              <div className={styles.errorContainer}>
                <div className={styles.errorCard}>
                  <h3>Có lỗi xảy ra</h3>
                  <p>{error}</p>
                  <button 
                    onClick={() => refetch(currentPage)} 
                    className={styles.retryButton}
                  >
                    Thử lại
                  </button>
                </div>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className={styles.emptyContainer}>
                <div className={styles.emptyCard}>
                  <FaNewspaper className={styles.emptyIcon} />
                  <h3>{searchTerm ? 'Không tìm thấy bài viết phù hợp' : 'Chưa có bài viết nào'}</h3>
                  <p>{searchTerm ? `Không có bài viết nào khớp với từ khóa "${searchTerm}"` : 'Hiện tại chưa có bài viết nào được đăng tải.'}</p>
                </div>
              </div>
            ) : (
              <>
                {/* Featured Posts - Latest 3 articles */}
                {!searchTerm && featuredPosts.length > 0 && (
                  <div className={styles.featuredSection}>
                    <h2 className={styles.sectionTitle}>Bài mới lên</h2>
                    <div className={styles.featuredGrid}>
                      {featuredPosts.map((post: PostWithAuthor, index) => (
                        <article key={post._id} className={`${styles.featuredCard} ${index === 0 ? styles.featuredMain : ''}`}>
                          <Link href={`/news/${post._id}`} className={styles.featuredLink}>
                            <div className={styles.featuredImageWrap}>
                              <Image
                                src={post.image}
                                alt={post.title}
                                width={400}
                                height={250}
                                className={styles.featuredImage}
                                priority={index === 0}
                              />
                              <div className={styles.featuredImageOverlay}>
                                <span className={styles.featuredReadMore}>Đọc ngay</span>
                              </div>
                            </div>
                            <div className={styles.featuredContent}>
                              <h3 className={styles.featuredTitle}>{post.title}</h3>
                              <p className={styles.featuredDescription}>
                                {getExcerpt(post.describe, index === 0 ? 120 : 80)}
                              </p>
                              <div className={styles.featuredMeta}>
                                <span className={styles.metaItem}>
                                  <FaUser /> {post.author.name || 'Ẩn danh'}
                                </span>
                                <span className={styles.metaItem}>
                                  <FaCalendarAlt /> {formatDate(post.createdAt)}
                                </span>
                              </div>
                            </div>
                          </Link>
                        </article>
                      ))}
                    </div>
                  </div>
                )}

                {/* Posts Grid */}
                <div className={styles.postsSection}>
                  <h2 className={styles.sectionTitle}>
                    {searchTerm ? `Kết quả tìm kiếm: "${searchTerm}"` : 'Tất cả bài viết'}
                  </h2>
                  <div className={styles.postsGrid}>
                    {/* Show posts excluding featured ones, or search results */}
                    {postsForAllSection.map((post: PostWithAuthor) => (
                      <article key={post._id} className={styles.postCard}>
                        <Link href={`/news/${post._id}`} className={styles.postLink}>
                          <div className={styles.postImageWrap}>
                            <Image
                              src={post.image}
                              alt={post.title}
                              width={300}
                              height={200}
                              className={styles.postImage}
                            />
                            <div className={styles.postImageOverlay}>
                              <span className={styles.readMore}>Đọc thêm</span>
                            </div>
                          </div>
                          <div className={styles.postContent}>
                            <h3 className={styles.postTitle}>{post.title}</h3>
                            <p className={styles.postDescription}>
                              {getExcerpt(post.describe)}
                            </p>
                            <div className={styles.postMeta}>
                              <span className={styles.metaItem}>
                                <FaUser /> {post.author.name || 'Ẩn danh'}
                              </span>
                              <span className={styles.metaItem}>
                                <FaCalendarAlt /> {formatDate(post.createdAt)}
                              </span>
                            </div>
                          </div>
                        </Link>
                      </article>
                    ))}
                  </div>
                </div>

                {/* Pagination - show when not searching and has multiple pages */}
                {!searchTerm && pagination.totalPages > 1 && (
                  <div className={styles.paginationSection}>
                    <Pagination
                      pagination={paginationInfo}
                      onPageChange={handlePageChange}
                      showInfo={true}
                    />
                  </div>
                )}

                {/* Search Results Info */}
                {searchTerm && (
                  <div className={styles.searchResultsInfo}>
                    <p>Tìm thấy {filteredPosts.length} bài viết khớp với từ khóa "{searchTerm}"</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
