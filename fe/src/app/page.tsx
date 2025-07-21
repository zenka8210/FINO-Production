"use client";

import Image from "next/image";
import styles from "./page.module.css";
import ProductList from "./components/ProductList";
import BannerSlider from "./components/BannerSlider";
import CategorySidebar from "./components/CategorySidebar";
import FlashSale from "./components/FlashSale";
import CategoryCards from "./components/CategoryCards";
import MiddleBanner from "./components/MiddleBanner";
import News from "./components/News";
import { LoadingSpinner } from "./components/ui";
import ProductItem from "./components/ProductItem";
import { isProductOnSale, getDiscountPercent } from '@/lib/productUtils';
import { useProducts } from "@/hooks";
import { productService } from "@/services";
import { useEffect, useState } from "react";
import { ProductWithCategory } from "@/types";

export default function Home() {
  const { getProducts, loading, error } = useProducts();
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<ProductWithCategory[]>([]);
  const [saleProducts, setSaleProducts] = useState<ProductWithCategory[]>([]);
  const [newProducts, setNewProducts] = useState<ProductWithCategory[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Fetch regular products for sale and new products
        const response = await getProducts({ 
          limit: 50 // Increase limit to get more products
        });
        console.log('Products response:', response);
        console.log('Response data type:', typeof response.data);
        console.log('Response data:', response.data);
        
        // Extract products array from response.data.data
        const productsArray = Array.isArray(response.data) ? response.data : 
                             (response.data && Array.isArray((response.data as any).data)) ? (response.data as any).data : [];
        
        setProducts(productsArray);
        
        // 1. Sale Products - Currently on sale with best discounts first
        const saleProducts = productsArray
          .filter((product: ProductWithCategory) => isProductOnSale(product))
          .sort((a: ProductWithCategory, b: ProductWithCategory) => getDiscountPercent(b) - getDiscountPercent(a))
          .slice(0, 6);
        setSaleProducts(saleProducts);
        
        // 2. Featured Products - Use REAL backend API with business metrics
        console.log('🎯 Homepage: Fetching REAL featured products from API...');
        const featuredResponse = await productService.getFeaturedProducts(6);
        console.log('✅ Real featured products:', featuredResponse);
        
        // Handle response structure
        const featuredProductsData = Array.isArray(featuredResponse) ? featuredResponse : 
                                    (featuredResponse as any)?.data || [];
        setFeaturedProducts(featuredProductsData);
        
        // 3. New Products - Most recently added 
        const newProducts = productsArray
          .filter((product: ProductWithCategory) => 
            product.isActive !== false &&
            !isProductOnSale(product)
          )
          .slice(-8) // Take last 8 as "newest"
          .reverse() // Reverse to show newest first
          .slice(0, 6); // Limit to 6 for display
        setNewProducts(newProducts);
      } catch (err) {
        console.error('Failed to fetch products:', err);
      }
    };

    fetchProducts();
  }, [getProducts]);

  if (loading) {
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
          <CategorySidebar />
          <div className={styles.bannerContainer}>
            <BannerSlider />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container">
        {/* Flash Sale Section - Real-time data sync */}
                {/* Flash Sale Section */}
        <FlashSale /> {/* Removed aggressive refresh to prevent infinite loops */}

        {/* Category Cards */}
        <CategoryCards />

        {/* Sale Products Section */}
        {saleProducts.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                🔥 Sản Phẩm Giảm Giá
              </h2>
              <p className={styles.sectionSubtitle}>Ưu đãi hấp dẫn, tiết kiệm ngay hôm nay</p>
            </div>
            <div className={styles.productGrid}>
              {saleProducts.map((product) => (
                <ProductItem key={product._id} product={product} layout="grid" />
              ))}
            </div>
            <div className={styles.sectionFooter}>
              <a href="/sale" className={styles.viewMoreBtn}>
                Xem thêm sản phẩm khác
                <span className={styles.viewMoreArrow}>→</span>
              </a>
            </div>
          </section>
        )}

        {/* Featured Products */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>⭐ Sản Phẩm Nổi Bật</h2>
            <p className={styles.sectionSubtitle}>Được yêu thích và lựa chọn nhiều nhất</p>
          </div>
          <div className={styles.productGrid}>
            {featuredProducts.map((product) => (
              <ProductItem key={product._id} product={product} layout="grid" />
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
              <ProductItem key={product._id} product={product} layout="grid" />
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
      <News />
    </>
  );
}