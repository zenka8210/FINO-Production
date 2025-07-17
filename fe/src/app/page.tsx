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
    return (
      <div className="container">
        <div style={{ padding: 40, textAlign: 'center' }}>
          <div>Đang tải...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div style={{ padding: 40, textAlign: 'center', color: 'red' }}>
          <div>Lỗi: {error}</div>
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
        <div className="row">
          <div className="col-12">
            <ProductList props={{
              title:"Sản Phẩm Nổi Bật", 
              products: featuredProducts
            }}/>
          </div>
        </div>

        {/* Middle Banner */}
        <MiddleBanner />

        {/* New Products */}
        <div className="row">
          <div className="col-12">
            <div className={styles.newProductsSection}>
              <ProductList props={{
                title:"Sản Phẩm Mới", 
                products: products
              }}/>
            </div>
          </div>
        </div>
      </div>

      {/* Blog Section */}
      <BlogSection />
    </>
  );
}