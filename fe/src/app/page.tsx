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
import { LoadingSpinner } from "./components/ui";
import ProductItem from "./components/ProductItem";
import { isProductOnSale, getDiscountPercent } from '@/lib/productUtils';
import { useProducts } from "@/hooks";
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
        const response = await getProducts({ limit: 50 }); // Increase limit to get more products
        console.log('Products response:', response);
        console.log('Response data type:', typeof response.data);
        console.log('Response data:', response.data);
        
        // Extract products array from response.data.data
        const productsArray = Array.isArray(response.data) ? response.data : 
                             (response.data && Array.isArray((response.data as any).data)) ? (response.data as any).data : [];
        
        setProducts(productsArray);
        
        // Smart product categorization with realistic business logic
        
        // 1. Sale Products - Currently on sale with best discounts first
        const saleProducts = productsArray
          .filter((product: ProductWithCategory) => isProductOnSale(product))
          .sort((a: ProductWithCategory, b: ProductWithCategory) => getDiscountPercent(b) - getDiscountPercent(a)) // Best discounts first
          .slice(0, 8); // Limit to 8 for optimal display
        setSaleProducts(saleProducts);
        
        // 2. Featured Products - Based on realistic popularity metrics
        const featuredProducts = productsArray
          .filter((product: ProductWithCategory) => 
            product.isActive !== false && 
            !isProductOnSale(product) // Don't overlap with sale products
          )
          .map((product: ProductWithCategory) => {
            // Simulate realistic popularity score based on common e-commerce metrics
            const priceScore = Math.min(product.price / 100000, 5); // Price factor (higher = more premium)
            const categoryName = typeof product.category === 'object' && product.category?.name ? 
              product.category.name : 
              typeof product.category === 'string' ? product.category : '';
            
            const categoryBoost = ['Giày Nam', 'Giày Nữ', 'Áo Nam', 'Áo Nữ'].some(cat => 
              categoryName.includes(cat.split(' ')[1])
            ) ? 2 : 1; // Boost popular categories
            
            // Simulate engagement metrics (would come from real data)
            const simulatedViews = Math.floor(Math.random() * 1000) + 100;
            const simulatedSales = Math.floor(Math.random() * 50) + 10;
            const simulatedWishlist = Math.floor(Math.random() * 200) + 20;
            const simulatedReviews = Math.floor(Math.random() * 30) + 5;
            const avgRating = 3.5 + Math.random() * 1.5; // 3.5-5.0 rating
            
            // Calculate popularity score (realistic algorithm)
            const popularityScore = 
              (simulatedViews * 0.1) + 
              (simulatedSales * 2) + 
              (simulatedWishlist * 0.5) + 
              (simulatedReviews * avgRating * 3) + 
              (priceScore * categoryBoost);
            
            return {
              ...product,
              popularityScore,
              simulatedMetrics: {
                views: simulatedViews,
                sales: simulatedSales,
                wishlist: simulatedWishlist,
                reviews: simulatedReviews,
                rating: Math.round(avgRating * 10) / 10
              }
            };
          })
          .sort((a: any, b: any) => b.popularityScore - a.popularityScore) // Highest popularity first
          .slice(0, 8);
        setFeaturedProducts(featuredProducts);
        
        // 3. New Products - Most recently added (simulate with createdAt or last in array)
        const newProducts = productsArray
          .filter((product: ProductWithCategory) => 
            product.isActive !== false &&
            !isProductOnSale(product) &&
            !featuredProducts.some((fp: ProductWithCategory) => fp._id === product._id) // Avoid overlap
          )
          .slice(-12) // Take last 12 as "newest"
          .reverse(); // Reverse to show newest first
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
                Sản Phẩm Giảm Giá
              </h2>
            </div>
            <div className={styles.productGrid}>
              {saleProducts.map((product) => (
                <ProductItem key={product._id} product={product} layout="grid" />
              ))}
            </div>
          </section>
        )}

        {/* Featured Products */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Sản Phẩm Nổi Bật</h2>
          <div className={styles.productGrid}>
            {featuredProducts.map((product) => (
              <ProductItem key={product._id} product={product} layout="grid" />
            ))}
          </div>
        </section>

        {/* Middle Banner */}
        <MiddleBanner />

        {/* New Products */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Sản Phẩm Mới</h2>
          <div className={styles.productGrid}>
            {newProducts.map((product) => (
              <ProductItem key={product._id} product={product} layout="grid" />
            ))}
          </div>
        </section>
      </div>

      {/* Blog Section */}
      <BlogSection />
    </>
  );
}