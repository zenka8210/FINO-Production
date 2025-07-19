"use client";

import Image from "next/image";
import styles from "./page.module.css";
import ProductList from "./components/ProductList";
import BannerSlider from "./components/BannerSlider";
import CategorySidebar from "./components/CategorySidebar";
import FlashSale from "./components/FlashSale";
import CategoryCards from "./components/CategoryCards";
import MiddleBanner from "./components/MiddleBanner";
import BlogSection from "./components/BlogSection";
import { LoadingSpinner, ProductCard } from "./components/ui";
import { useProducts } from "@/hooks";
import { useEffect, useState } from "react";
import { ProductWithCategory } from "@/types";

export default function Home() {
  const { getProducts, loading, error } = useProducts();
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<ProductWithCategory[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await getProducts({ limit: 20 });
        console.log('Products response:', response);
        console.log('Response data type:', typeof response.data);
        console.log('Response data:', response.data);
        
        // Extract products array from response.data.data
        const productsArray = Array.isArray(response.data) ? response.data : 
                             (response.data && Array.isArray((response.data as any).data)) ? (response.data as any).data : [];
        setProducts(productsArray);
        setFeaturedProducts(productsArray.slice(0, 4));
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
        {/* Flash Sale Section */}
        <FlashSale products={products} />

        {/* Category Cards */}
        <CategoryCards />

        {/* Featured Products */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Sản Phẩm Nổi Bật</h2>
          <div className={styles.productGrid}>
            {featuredProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </section>

        {/* Middle Banner */}
        <MiddleBanner />

        {/* New Products */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Sản Phẩm Mới</h2>
          <div className={styles.productGrid}>
            {products.slice(0, 8).map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </section>
      </div>

      {/* Blog Section */}
      <BlogSection />
    </>
  );
}