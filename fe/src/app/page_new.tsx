import Image from "next/image";
import styles from "./page.module.css";
import ProductList from "./components/ProductList";
import BannerSlider from "./components/BannerSlider";
import { Product } from './components/interface';

export default async function Home() {
  let products: Product[] = await getProduct("http://localhost:3000/product");
  const featuredProducts = products.slice(0, 4); 

  return (
    <>
      {/* Hero Section with Sidebar and Banner */}
      <div className={styles.heroSection}>
        <div className="container">
          <div className="row">
            {/* Sidebar Categories */}
            <div className="col-3 col-lg-4 col-md-12 col-sm-12">
              <div className={styles.categorySidebar}>
                <div className={styles.categoryHeader}>
                  <h3>🏪 Danh Mục Sản Phẩm</h3>
                </div>                <div className={styles.categoryList}>
                  <a href="/products/aothunnam" className={styles.categoryItem}>
                    <span className={styles.categoryIcon}>👕</span>
                    <span>Áo thun nam</span>
                  </a>
                  <a href="/products/aothunnu" className={styles.categoryItem}>
                    <span className={styles.categoryIcon}>👚</span>
                    <span>Áo thun nữ</span>
                  </a>
                  <a href="/products/setquanao" className={styles.categoryItem}>
                    <span className={styles.categoryIcon}>👖</span>
                    <span>Quần áo</span>
                  </a>
                  <a href="/products/phukien" className={styles.categoryItem}>
                    <span className={styles.categoryIcon}>👜</span>
                    <span>Phụ kiện</span>
                  </a>
                  <div className={styles.categoryItem}>
                    <span className={styles.categoryIcon}>👟</span>
                    <span>Giày dép</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Banner */}
            <div className="col-9 col-lg-8 col-md-12 col-sm-12">
              <div className={styles.bannerContainer}>
                <BannerSlider />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Products */}
      <div className="container">
        <div className="row">
          <div className="col-12">
            <ProductList props={{
              title:"Sản Phẩm Nổi Bật", 
              products: featuredProducts
            }}/>
          </div>
        </div>
      </div>

      {/* New Products */}
      <div className="container">
        <div className="row">
          <div className="col-12">
            <ProductList props={{
              title:"Sản Phẩm Mới", 
              products: products
            }}/>
          </div>
        </div>
      </div>
    </>
  );
}

async function getProduct(url:string) {
  let res = await fetch(url);
  let data = await res.json();
  let products = data.map((p: Product) => {
    return {
      id: p.id,
      name: p.name,
      price: p.price,
      image: p.image,
      description: p.description,
      category: p.category
    };
  });
  return products;
}
