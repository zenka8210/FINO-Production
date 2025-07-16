import { useEffect, useState } from "react";
import { Product } from "../components/interface";
import ProductItem from "../components/ProductItem";
import styles from "./product.module.css";

export default function AoThunNuPage() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetch("/data.json")
      .then((res) => res.json())
      .then((data) => {
        let all = data.product || data.products || [];
        // Lọc sản phẩm category 2 (Áo thun nữ)
        const filtered = all.filter((p: Product) => String(p.category) === "2");
        setProducts(filtered);
      });
  }, []);

  if (products.length === 0) {
    return <div style={{ minHeight: 300, textAlign: "center", padding: 40 }}>Loading...</div>;
  }

  return (
    <div className={styles.productSection}>
      <h1 className={styles.title}>Áo thun nữ</h1>
      <div className={styles.productGrid}>
        {products.map((product) => (
          <ProductItem product={product} key={product.id} />
        ))}
      </div>
    </div>
  );
}
