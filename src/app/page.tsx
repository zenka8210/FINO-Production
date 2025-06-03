import Image from "next/image";
import styles from "./page.module.css";
import ProductList from "./component/ProductList";
import { Product } from './component/interface';
import banner from "./img/bnpolo.jpg";

// Fetch từ JSON Server
async function getProducts(): Promise<Product[]> {
  const res = await fetch("http://localhost:3001/product", { cache: 'no-store' });
  const data = await res.json();
  
  return data.map((p: any) => ({
    id: p.product_id,
    name: p.title,
    price: p.price,
    image: p.image,
    description: p.description,
    category: p.category_id
  }));
}

export default async function Home() {
  const products = await getProducts();
  const featuredProducts = products.slice(0, 4);

  return (
    <div>
      {/* Banner */}
      <div className={styles.banner}>
        <Image 
          src={banner}
          alt="Banner quảng cáo"
          fill 
          style={{ objectFit: 'cover' }}
          priority
        />
      </div>

      {/* Danh sách sản phẩm nổi bật */}
      <ProductList props={{
        title: "Sản Phẩm Nổi Bật", 
        products: featuredProducts
      }}/>

      {/* Sản phẩm mới */}
      <div className={styles.newProductsSection}>
        <ProductList props={{
          title: "Sản Phẩm Mới", 
          products: products
        }}/>
      </div>

      {/* Tất cả sản phẩm */}
      <ProductList props={{
        title: "Tất Cả Sản Phẩm", 
        products: products
      }}/>
    </div>
  );
}
