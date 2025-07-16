import Image from "next/image";
import styles from "./page.module.css";
import ProductList from "./components/ProductList";
import BannerSlider from "./components/BannerSlider";
import CategorySidebar from "./components/CategorySidebar";
import FlashSale from "./components/FlashSale";
import CategoryCards from "./components/CategoryCards";
import MiddleBanner from "./components/MiddleBanner";
import BlogSection from "./components/BlogSection";
import { Product } from './components/interface';

export default async function Home() {
  let products: Product[] = await getProduct("http://localhost:3000/product");
  const featuredProducts = products.slice(0, 4); 

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

async function getProduct(url:string) {
  let res = await fetch(url);
  let data = await res.json();
  let products = data.map((p: Product) => {
    return {
      id: p.id, // Thêm dòng này để đảm bảo có id
      name: p.name,
      price: p.price,
      image: p.image,
      description: p.description,
      category: p.category
    };
  });
  return products;
}