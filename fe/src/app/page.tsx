"use client";

import Image from "next/image";
import styles from "./page.module.css";
import ProductList from "./components/ProductList";
import BannerSlider from "./components/BannerSlider";
import CategorySidebar from "./components/CategorySidebar";
import PersonalizedCategorySidebar from "./components/PersonalizedCategorySidebar";
import PersonalizedProductsSection from "./components/PersonalizedProductsSection";
import FlashSale from "./components/FlashSale";
import MiddleBanner from "./components/MiddleBanner";
import News from "./components/News";
import { LoadingSpinner } from "./components/ui";
import ProductItem from "./components/ProductItem";
import FeaturedProductsFilter, { FeaturedFilterType } from "./components/FeaturedProductsFilter";
import { useProducts, useProductStats } from "@/hooks";
import { productService } from "@/services";
import { homePageService } from "@/services/homePageService"; // ADD: Optimized home service
import { useEffect, useState, useCallback } from "react";
import { ProductWithCategory } from "@/types";
import { useAuth } from "@/contexts";

export default function Home() {
  const { user } = useAuth();
  const { getProducts, loading, error } = useProducts();
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<ProductWithCategory[]>([]);
  const [newProducts, setNewProducts] = useState<ProductWithCategory[]>([]);
  
  // ADD: Featured products filter state
  const [featuredFilter, setFeaturedFilter] = useState<FeaturedFilterType>('combined');
  const [featuredLoading, setFeaturedLoading] = useState(false);
  
  // ADD: Optimized loading state
  const [isOptimizedLoading, setIsOptimizedLoading] = useState(true);
  const [hasTriedOptimized, setHasTriedOptimized] = useState(false);

  // Get real product statistics for all products
  const allProductIds = [...featuredProducts, ...newProducts].map(p => p._id);
  const { stats: productStats, loading: statsLoading } = useProductStats(allProductIds);

  useEffect(() => {
    const fetchProducts = async () => {
      // TRY OPTIMIZED APPROACH FIRST - Single API call for all home data
      if (!hasTriedOptimized) {
        try {
          setHasTriedOptimized(true);
          
          const homeData = await homePageService.getHomePageData();
          
          // Set all data from optimized response
          setProducts([...homeData.featuredProducts, ...homeData.newProducts, ...homeData.saleProducts]);
          setFeaturedProducts(homeData.featuredProducts || []);
          setNewProducts(homeData.newProducts || []);
          setIsOptimizedLoading(false);
          return; // SUCCESS - Don't run fallback
        } catch (optimizedError) {
          console.warn('⚠️ OPTIMIZED: Failed, falling back to individual API calls:', optimizedError);
          setIsOptimizedLoading(false);
          // Continue to fallback below
        }
      }

      // FALLBACK - Original logic (KEEPS EXACT SAME BEHAVIOR)
      try {
        // Fetch regular products for sale and new products
        const response = await getProducts({ 
          limit: 50 // Increase limit to get more products
        });
        
        // Extract products array from response.data.data
        const productsArray = Array.isArray(response.data) ? response.data : 
                             (response.data && Array.isArray((response.data as any).data)) ? (response.data as any).data : [];
        
        setProducts(productsArray);
        
        // 1. Featured Products - Use REAL backend API with business metrics
        const featuredResponse = await homePageService.getFeaturedProducts(6, featuredFilter);
        
        // Handle response structure
        const featuredProductsData = Array.isArray(featuredResponse) ? featuredResponse : [];
        setFeaturedProducts(featuredProductsData);
        
        // 2. New Products - Use dedicated backend endpoint (avoid logic duplication)
        const newProductsResponse = await homePageService.getNewProducts(6); // Request 6 products
        
        // Use data directly from optimized backend endpoint
        const newProductsData = Array.isArray(newProductsResponse) ? newProductsResponse : [];
        
        if (newProductsData.length === 0) {
          console.warn('⚠️ No new products found! Check database or backend');
        }
        
        setNewProducts(newProductsData);
      } catch (err) {
        console.error('Failed to fetch products:', err);
      }
    };

    fetchProducts();
  }, [hasTriedOptimized]);

  // Handle featured products filter change with useCallback to prevent re-renders
  const handleFeaturedFilterChange = useCallback(async (newFilter: FeaturedFilterType) => {
    if (newFilter === featuredFilter || featuredLoading) {
      return; // No change needed or already loading
    }
    
    setFeaturedLoading(true);
    
    try {
      const featuredResponse = await homePageService.getFeaturedProducts(6, newFilter);
      
      const featuredProductsData = Array.isArray(featuredResponse) ? featuredResponse : [];
      
      setFeaturedProducts(featuredProductsData);
      setFeaturedFilter(newFilter); // Set filter after successful load
    } catch (error) {
      console.error('❌ Error loading filtered featured products:', error);
      // Don't reset products on error, keep current ones
    } finally {
      setFeaturedLoading(false);
    }
  }, [featuredFilter, featuredLoading]);

  // Show loading while either optimized or fallback is loading
  if (loading || isOptimizedLoading) {
    return <LoadingSpinner fullscreen text="Đang tải sản phẩm..." />;
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
            <button onClick={() => window.location.reload()} className={styles.retryButton}>
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  } 

  return (
    <>
      {/* Hero Section - Sidebar và Banner nằm cùng hàng */}
      <div className="container">
        <div className={styles.heroSection}>
          {/* Use PersonalizedCategorySidebar for enhanced UX */}
          <PersonalizedCategorySidebar 
            maxCategories={10}
            showAllCategoriesLink={true}
            showPersonalizationInfo={false}
          />
          <div className={styles.bannerContainer}>
            <BannerSlider />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container">
        {/* Personalized Products Section - "Có thể bạn thích" */}
        <PersonalizedProductsSection 
          limit={6}
          excludeIds={[...featuredProducts.map(p => p._id), ...newProducts.map(p => p._id)]}
          showPersonalizationInfo={false}
        />

        {/* Flash Sale Section - Synchronized with Sale page */}
        <FlashSale maxProducts={12} /> {/* Show 12 products to match Sale page consistency */}

        {/* Featured Products */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Sản Phẩm Nổi Bật</h2>          </div>
          
          {/* Featured Products Filter */}
          <FeaturedProductsFilter
            activeFilter={featuredFilter}
            onFilterChange={handleFeaturedFilterChange}
            loading={featuredLoading}
          />
          
          <div className={styles.productGrid}>
            {featuredProducts.map((product) => {
              const productStatsData = productStats[product._id];
              return (
                <ProductItem 
                  key={`${product._id}-${featuredFilter}`} // Add filter to key for re-render
                  product={product} 
                  layout="grid"
                  averageRating={productStatsData?.averageRating || 0}
                  reviewCount={productStatsData?.reviewCount || 0}
                  showRatingBadge={true}
                />
              );
            })}
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
            <h2 className={styles.sectionTitle}>Sản Phẩm Mới</h2>
            <p className={styles.sectionSubtitle}>Bộ sưu tập thời trang mới nhất</p>
          </div>
          <div className={styles.productGrid}>
            {newProducts.map((product) => {
              const productStatsData = productStats[product._id];
              return (
                <ProductItem 
                  key={product._id} 
                  product={product} 
                  layout="grid"
                  averageRating={productStatsData?.averageRating || 0}
                  reviewCount={productStatsData?.reviewCount || 0}
                  showRatingBadge={true}
                />
              );
            })}
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
      <News />
    </>
  );
}