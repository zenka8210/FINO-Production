import Image from "next/image";
import styles from "./page.module.css";
import ProductList from "./components/ProductList";
import BannerSlider from "./components/BannerSlider";
import CategorySidebar from "./components/CategorySidebar";
import FlashSale from "./components/FlashSale";
import MiddleBanner from "./components/MiddleBanner";
import News from "./components/News";
import { LoadingSpinner } from "./components/ui";
import ProductItem from "./components/ProductItem";
import { ProductWithCategory } from "@/types";
import { homePageService } from '@/services/homePageService';

interface HomePageData {
  categories: any[];
  banners: any[];
  featuredProducts: ProductWithCategory[];
  newProducts: ProductWithCategory[];
  saleProducts: ProductWithCategory[];
  posts: any[];
  lastUpdated: string;
}

// This is now a Server Component with ISR
async function getHomeData(): Promise<{ homeData?: HomePageData; error?: string }> {
  try {
    console.log('🏗️  SSR: Fetching home page data...');
    const homeData = await homePageService.getHomePageData();
    console.log('✅ SSR: Home data fetched successfully');
    console.log('📊 SSR Data summary:', {
      categories: homeData.categories?.length || 0,
      banners: homeData.banners?.length || 0,
      featuredProducts: homeData.featuredProducts?.length || 0,
      newProducts: homeData.newProducts?.length || 0,
      saleProducts: homeData.saleProducts?.length || 0,
      posts: homeData.posts?.length || 0
    });
    return { homeData };
  } catch (error) {
    console.error('❌ SSR: Error fetching home data:', error);
    return {
      homeData: {
        categories: [],
        banners: [],
        featuredProducts: [],
        newProducts: [],
        saleProducts: [],
        posts: [],
        lastUpdated: new Date().toISOString()
      },
      error: 'Failed to load page data'
    };
  }
}

// Add revalidation for ISR
export const revalidate = 900; // 15 minutes

export default async function Home() {
  const { homeData, error } = await getHomeData();
  
  if (!homeData) {
    return (
      <div className="container">
        <div className={styles.errorContainer}>
          <div className={styles.errorContent}>
            <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <h2>Có lỗi xảy ra</h2>
            <p>Không thể tải dữ liệu trang. Vui lòng thử lại sau.</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className={styles.errorContainer}>
          <div className={styles.errorContent}>
            <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <h2>Có lỗi xảy ra</h2>
            <p>Không thể tải sản phẩm. Vui lòng thử lại sau.</p>
            <a href="/" className={styles.retryButton}>
              Thử lại
            </a>
          </div>
        </div>
      </div>
    );
  }

  const { featuredProducts, newProducts, saleProducts, banners, categories, posts } = homeData;

  return (
    <>
      {/* Hero Section - Sidebar và Banner nằm cùng hàng */}
      <div className="container">
        <div className={styles.heroSection}>
          <CategorySidebar initialCategories={categories} />
          <div className={styles.bannerContainer}>
            <BannerSlider initialBanners={banners} />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container">
        {/* Flash Sale Section - Sử dụng dữ liệu sale products từ SSR */}
        <FlashSale initialProducts={saleProducts} />

        {/* Featured Products */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>⭐ Sản Phẩm Nổi Bật</h2>
            <p className={styles.sectionSubtitle}>Được yêu thích và lựa chọn nhiều nhất</p>
          </div>
          <div className={styles.productGrid}>
            {featuredProducts.map((product) => (
              <ProductItem 
                key={product._id} 
                product={product} 
                layout="grid"
                showRatingBadge={true}
              />
            ))}
          </div>
          <div className={styles.sectionFooter}>
            <a href="/featured" className={styles.viewMoreBtn}>
              Xem thêm sản phẩm khác
              <span className={styles.viewMoreArrow}>→</span>
            </a>
          </div>
        </section>

        {/* Middle Banner */}
        <MiddleBanner />

        {/* New Products */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>🆕 Sản Phẩm Mới</h2>
            <p className={styles.sectionSubtitle}>Bộ sưu tập thời trang mới nhất</p>
          </div>
          <div className={styles.productGrid}>
            {newProducts.map((product) => (
              <ProductItem 
                key={product._id} 
                product={product} 
                layout="grid"
                showRatingBadge={true}
              />
            ))}
          </div>
          <div className={styles.sectionFooter}>
            <a href="/new" className={styles.viewMoreBtn}>
              Xem thêm sản phẩm khác
              <span className={styles.viewMoreArrow}>→</span>
            </a>
          </div>
        </section>
      </div>

      {/* Blog Section */}
      <News initialPosts={posts} />
    </>
  );
}
