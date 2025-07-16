import Image from 'next/image';
import Link from 'next/link';
import styles from './blog.module.css';

interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  image: string;
  date: string;
  category: string;
  slug: string;
  readTime: string;
}

const allBlogPosts: BlogPost[] = [
  {
    id: 1,
    title: "Xu hướng thời trang Thu Đông 2025",
    excerpt: "Khám phá những xu hướng thời trang hot nhất mùa Thu Đông 2025. Từ màu sắc earth tone đến các kiểu dáng oversized đang được yêu thích.",
    image: "/images/anh1.jpg",
    date: "25/06/2025",
    category: "Xu hướng",
    slug: "xu-huong-thoi-trang-thu-dong-2025",
    readTime: "5 phút đọc"
  },
  {
    id: 2,
    title: "Cách phối đồ công sở thanh lịch",
    excerpt: "Bí quyết mix & match trang phục công sở vừa chuyên nghiệp vừa thời trang. Tạo nên phong cách riêng cho bản thân trong môi trường làm việc.",
    image: "/images/anh2.jpg",
    date: "24/06/2025",
    category: "Phối đồ",
    slug: "cach-phoi-do-cong-so-thanh-lich",
    readTime: "4 phút đọc"
  },
  {
    id: 3,
    title: "Chăm sóc và bảo quản quần áo đúng cách",
    excerpt: "Những mẹo hay giúp quần áo luôn như mới. Cách giặt, ủi và bảo quản từng loại vải khác nhau để tăng tuổi thọ cho trang phục.",
    image: "/images/anh3.jpg",
    date: "23/06/2025",
    category: "Tips",
    slug: "cham-soc-va-bao-quan-quan-ao",
    readTime: "6 phút đọc"
  },
  {
    id: 4,
    title: "Street style: Phong cách đường phố năng động",
    excerpt: "Tham khảo những outfit street style cực chất từ giới trẻ. Cách kết hợp trang phục để có được look năng động, cá tính.",
    image: "/images/anh4.jpg",
    date: "22/06/2025",
    category: "Street Style",
    slug: "street-style-phong-cach-duong-pho",
    readTime: "4 phút đọc"
  },
  {
    id: 5,
    title: "Màu sắc và tâm lý: Chọn outfit theo tâm trạng",
    excerpt: "Khoa học về màu sắc trong thời trang. Cách chọn màu sắc trang phục phù hợp với tâm trạng và mục đích sử dụng.",
    image: "/images/bannershop.jpg",
    date: "21/06/2025",
    category: "Tâm lý",
    slug: "mau-sac-va-tam-ly-chon-outfit",
    readTime: "7 phút đọc"
  },
  {
    id: 6,
    title: "Accessory 101: Phụ kiện làm nên phong cách",
    excerpt: "Hướng dẫn cách sử dụng phụ kiện để nâng tầm outfit. Từ túi xách, trang sức đến giày dép, mọi thứ đều có thể thay đổi hoàn toàn diện mạo.",
    image: "/images/anh1.jpg",
    date: "20/06/2025",
    category: "Phụ kiện",
    slug: "accessory-101-phu-kien-lam-nen-phong-cach",
    readTime: "5 phút đọc"
  }
];

const categories = [
  "Tất cả",
  "Xu hướng", 
  "Phối đồ",
  "Tips",
  "Street Style",
  "Tâm lý",
  "Phụ kiện"
];

export default function BlogPage() {
  return (
    <div className={styles.blogPage}>
      <div className="container">
        {/* Header */}
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Tin Tức & Blog</h1>
          <p className={styles.pageSubtitle}>
            Khám phá thế giới thời trang cùng FINO SHOP - Từ xu hướng mới nhất đến những mẹo hay trong việc phối đồ
          </p>
        </div>

        {/* Category Filter */}
        <div className={styles.categoryFilter}>
          {categories.map((category) => (
            <button key={category} className={`${styles.categoryBtn} ${category === "Tất cả" ? styles.active : ""}`}>
              {category}
            </button>
          ))}
        </div>

        {/* Blog Grid */}
        <div className={styles.blogGrid}>
          <div className="row">
            {allBlogPosts.map((post) => (
              <div key={post.id} className="col-lg-4 col-md-6 col-sm-12">
                <article className={styles.blogCard}>
                  <Link href={`/blog/${post.slug}`} className={styles.imageLink}>
                    <div className={styles.imageContainer}>
                      <Image
                        src={post.image}
                        alt={post.title}
                        width={400}
                        height={250}
                        className={styles.blogImage}
                      />
                      <div className={styles.categoryBadge}>
                        {post.category}
                      </div>
                    </div>
                  </Link>
                  
                  <div className={styles.blogContent}>
                    <div className={styles.blogMeta}>
                      <span className={styles.blogDate}>
                        <i className="fas fa-calendar-alt"></i>
                        {post.date}
                      </span>
                      <span className={styles.readTime}>
                        <i className="fas fa-clock"></i>
                        {post.readTime}
                      </span>
                    </div>
                    
                    <h3 className={styles.blogTitle}>
                      <Link href={`/blog/${post.slug}`}>
                        {post.title}
                      </Link>
                    </h3>
                    
                    <p className={styles.blogExcerpt}>
                      {post.excerpt}
                    </p>
                    
                    <Link href={`/blog/${post.slug}`} className={styles.readMore}>
                      Đọc thêm
                      <i className="fas fa-arrow-right"></i>
                    </Link>
                  </div>
                </article>
              </div>
            ))}
          </div>
        </div>

        {/* Pagination */}
        <div className={styles.pagination}>
          <button className={styles.pageBtn}>
            <i className="fas fa-chevron-left"></i>
          </button>
          <button className={`${styles.pageBtn} ${styles.active}`}>1</button>
          <button className={styles.pageBtn}>2</button>
          <button className={styles.pageBtn}>3</button>
          <button className={styles.pageBtn}>
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
