'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { postService } from '@/services';
import { Post } from '@/types';
import styles from './BlogSection.module.css';

interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  image: string;
  date: string;
  category: string;
  slug: string;
}

const blogPosts: BlogPost[] = [];

function BlogSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [itemsPerSlide, setItemsPerSlide] = useState(3);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBlogPosts();
  }, []);

  const loadBlogPosts = async () => {
    try {
      const posts = await postService.getFeaturedPosts(6);
      
      const formattedPosts = posts.map((item) => ({
        id: parseInt(item._id),
        title: item.title,
        excerpt: item.content ? item.content.substring(0, 150) + '...' : '',
        image: item.image || '/images/placeholder.jpg',
        date: new Date(item.createdAt).toLocaleDateString('vi-VN'),
        category: 'Tin tức',
        slug: item._id
      }));
      
      setPosts(formattedPosts);
    } catch (error) {
      console.error('Error loading blog posts:', error);
      // Fallback to mock data if API fails
      setPosts([
        {
          id: 1,
          title: "Fan 'anh Long' khiếp kinh khi thấy SVĐ Mỹ Đình thành fashion week thật rồi!",
          excerpt: "Sự kiện thời trang đặc biệt diễn ra tại SVĐ Mỹ Đình đã thu hút sự chú ý của hàng nghìn người hâm mộ. Không gian thể thao được biến thành sàn diễn thời trang hoành tráng.",
          image: "/images/anh1.jpg",
          date: "25/06/2025",
          category: "Xu hướng",
          slug: "fan-anh-long-svd-my-dinh-fashion-week"
        },
        {
          id: 2,
          title: "DEPA Fashion Show: Người Việt làm show thời trang thế này hay chưa!",
          excerpt: "Sự kiện thời trang DEPA đã mang đến những màn trình diễn ấn tượng với công nghệ ánh sáng hiện đại. Các nhà thiết kế Việt Nam đã chứng minh tài năng trên sân khấu quốc tế.",
          image: "/images/anh2.jpg", 
          date: "24/06/2025",
          category: "Sự kiện",
          slug: "depa-fashion-show-nguoi-viet-lam-show"
        },
        {
          id: 3,
          title: "Lấy làm mới thấy thầm thì trang 'chất' thế này: Đẹp tự tin thả dáng, ít có phải chê",
          excerpt: "Xu hướng thời trang 'chất lừ' đang được giới trẻ yêu thích. Phong cách tự tin, cá tính giúp bạn thể hiện bản thân một cách hoàn hảo nhất.",
          image: "/images/anh3.jpg",
          date: "23/06/2025", 
          category: "Phong cách",
          slug: "lay-lam-moi-thay-tham-thi-trang-chat"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setItemsPerSlide(1);
      } else if (window.innerWidth <= 992) {
        setItemsPerSlide(2);
      } else {
        setItemsPerSlide(3);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const totalSlides = Math.ceil(posts.length / itemsPerSlide);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const getCurrentPosts = () => {
    const startIndex = currentSlide * itemsPerSlide;
    return posts.slice(startIndex, startIndex + itemsPerSlide);
  };

  if (loading) {
    return (
      <section className={styles.blogSection}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Tiêu Điểm Tuần</h2>
          </div>
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Đang tải tin tức...</p>
          </div>
        </div>
      </section>
    );
  }

  if (posts.length === 0) {
    return (
      <section className={styles.blogSection}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Tiêu Điểm Tuần</h2>
          </div>
          <div className={styles.noContent}>
            <p>Chưa có tin tức nào được đăng</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.blogSection}>
      <div className="container">
        {/* Header */}
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Tiêu Điểm Tuần</h2>
        </div>

        {/* Carousel Container */}
        <div className={styles.carouselContainer}>
          <button className={styles.navButton} onClick={prevSlide}>
            <i className="fas fa-chevron-left"></i>
          </button>

          <div className={styles.carouselTrack}>
            <div 
              className={styles.carouselInner}
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {Array.from({ length: totalSlides }).map((_, slideIndex) => (
                <div key={`slide-${slideIndex}`} className={styles.slide}>
                  {posts
                    .slice(slideIndex * itemsPerSlide, (slideIndex + 1) * itemsPerSlide)
                    .map((post, postIndex) => (
                      <div key={`${slideIndex}-${post.id}-${postIndex}`} className={styles.newsCard}>
                        <Link href={`/news/${post.slug}`} className={styles.cardLink}>
                          <div className={styles.imageWrapper}>
                            <Image
                              src={post.image}
                              alt={post.title}
                              width={300}
                              height={200}
                              className={styles.newsImage}
                            />
                          </div>
                          <div className={styles.newsContent}>
                            <h3 className={styles.newsTitle}>{post.title}</h3>
                          </div>
                        </Link>
                      </div>
                    ))}
                </div>
              ))}
            </div>
          </div>

          <button className={styles.navButton} onClick={nextSlide}>
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>

        {/* Dots Navigation */}
        <div className={styles.dotsContainer}>
          {Array.from({ length: totalSlides }).map((_, index) => (
            <button
              key={index}
              className={`${styles.dot} ${index === currentSlide ? styles.activeDot : ''}`}
              onClick={() => goToSlide(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default BlogSection;
