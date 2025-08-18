'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { FaNewspaper, FaCalendarAlt, FaUser } from 'react-icons/fa';
import { PageHeader, LoadingSpinner } from '@/app/components/ui';
import { postService } from '@/services';
import { PostWithAuthor } from '@/types';
import styles from './news-detail.module.css';

export default function NewsDetailPage() {
  const params = useParams();
  const [news, setNews] = useState<PostWithAuthor | null>(null);
  const [relatedNews, setRelatedNews] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.slug) {
      loadNews(params.slug as string);
    }
  }, [params.slug]);

  const loadNews = async (slug: string) => {
    setLoading(true);
    setError(null);

    try {
      // Get specific post by ID
      const post = await postService.getPostById(slug);
      setNews(post);
      
      // Load related posts
      const relatedResponse = await postService.getPublishedPosts(1, 5);
      const relatedPosts = relatedResponse.data.filter(p => p._id !== post._id).slice(0, 4);
      setRelatedNews(relatedPosts);
    } catch (error) {
      console.error('Error loading news:', error);
      setError('Không thể tải bài viết. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="container">
        <div className={styles.pageContainer}>
          <div className={styles.loadingContainer}>
            <LoadingSpinner size="lg" />
            <p className={styles.loadingText}>Đang tải bài viết...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !news) {
    return (
      <div className="container">
        <div className={styles.pageContainer}>
          <PageHeader
            title="Tin tức & Bài viết"
            subtitle="Cập nhật những thông tin mới nhất từ Fino Store"
            icon={FaNewspaper}
            breadcrumbs={[
              { label: 'Trang chủ', href: '/' },
              { label: 'Tin tức', href: '/news' }
            ]}
          />
          
          <div className={styles.mainContent}>
            <div className={styles.errorContainer}>
              <div className={styles.errorCard}>
                <div className={styles.errorIcon}>📰</div>
                <h2>Không tìm thấy bài viết</h2>
                <p>{error || 'Bài viết bạn tìm kiếm không tồn tại hoặc đã bị xóa.'}</p>
                <Link href="/news" className={styles.backBtn}>
                  ← Trở về trang tin tức
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className={styles.pageContainer}>
        {/* Page Header with Breadcrumb */}
        <PageHeader
          title={news.title}
          subtitle="Tin tức & Bài viết"
          icon={FaNewspaper}
          breadcrumbs={[
            { label: 'Trang chủ', href: '/' },
            { label: 'Tin tức', href: '/news' },
            { label: news.title, href: `/news/${news._id}` }
          ]}
        />

        {/* Main Content */}
        <div className={styles.mainContent}>
          <div className="row">
            {/* Article Content - 8 columns */}
            <div className="col-8">
              <article className={styles.article}>
                {/* Article Header */}
                <header className={styles.articleHeader}>
                  <div className={styles.categoryBadge}>
                    Tin tức
                  </div>
                  
                  <div className={styles.metadata}>
                    <div className={styles.metaItem}>
                      <FaCalendarAlt className={styles.metaIcon} />
                      <span className={styles.metaValue}>{formatDate(news.createdAt)}</span>
                    </div>
                    <div className={styles.metaItem}>
                      <FaUser className={styles.metaIcon} />
                      <span className={styles.metaValue}>{news.author.name}</span>
                    </div>
                  </div>
                </header>

                {/* Featured Image */}
                <div className={styles.featuredImage}>
                  <Image
                    src={news.image}
                    alt={news.title}
                    width={800}
                    height={400}
                    className={styles.image}
                    priority
                  />
                </div>

                {/* Excerpt */}
                <div className={styles.excerpt}>
                  {news.describe}
                </div>

                {/* Content */}
                <div 
                  className={styles.content}
                  dangerouslySetInnerHTML={{ __html: news.content }}
                />

                {/* Social Share */}
                <div className={styles.socialShare}>
                  <h4>Chia sẻ bài viết:</h4>
                  <div className={styles.shareButtons}>
                    <button 
                      className={`${styles.shareBtn} ${styles.facebook}`}
                      onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${window.location.href}`, '_blank')}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      Facebook
                    </button>
                    <button 
                      className={`${styles.shareBtn} ${styles.twitter}`}
                      onClick={() => window.open(`https://twitter.com/intent/tweet?url=${window.location.href}&text=${news.title}`, '_blank')}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                      </svg>
                      Twitter
                    </button>
                    <button 
                      className={`${styles.shareBtn} ${styles.copy}`}
                      onClick={() => navigator.clipboard.writeText(window.location.href)}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                      </svg>
                      Sao chép link
                    </button>
                  </div>
                </div>
              </article>
            </div>

            {/* Sidebar - 4 columns */}
            <div className="col-4">
              <div className={styles.sidebar}>
                {/* Related News */}
                {relatedNews.length > 0 && (
                  <section className={styles.relatedSection}>
                    <h3 className={styles.relatedTitle}>Bài viết liên quan</h3>
                    <div className={styles.relatedList}>
                      {relatedNews.map(item => (
                        <Link 
                          key={item._id}
                          href={`/news/${item._id}`}
                          className={styles.relatedCard}
                        >
                          <div className={styles.relatedImage}>
                            <Image
                              src={item.image}
                              alt={item.title}
                              fill
                              sizes="(max-width: 768px) 100vw, 33vw"
                              className={styles.relatedImg}
                            />
                          </div>
                          <div className={styles.relatedContent}>
                            <h4 className={styles.relatedCardTitle}>{item.title}</h4>
                            <p className={styles.relatedExcerpt}>{item.describe}</p>
                            <div className={styles.relatedMeta}>
                              <span>{formatDate(item.createdAt)}</span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}

                {/* Navigation */}
                <div className={styles.navigation}>
                  <Link href="/news" className={styles.backToList}>
                    ← Trở về danh sách tin tức
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
