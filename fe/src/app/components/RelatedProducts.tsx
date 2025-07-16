import { useEffect, useState } from "react";
import { Product } from "./interface";
import styles from "../products/[id]/id.module.css";
import Link from "next/link";
import { formatPrice } from "../utils/formatPrice";

export default function RelatedProducts({ currentId, category }: { currentId: string | number, category?: string | number }) {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetch("/data.json")
      .then(res => res.json())
      .then(data => {
        let all = data.product || data.products || [];
        // Lọc sản phẩm cùng category, khác id hiện tại
        const related = all.filter((p: Product) => String(p.id) !== String(currentId) && (category ? String(p.category) === String(category) : true));
        setProducts(related.slice(0, 4));
      });
  }, [currentId, category]);

  if (!products.length) return null;

  return (
    <div className={styles.relatedGrid}>
      {products.slice(0, 4).map((p) => (
        <Link href={`/products/${p.id}`} key={p.id} className={styles.relatedCard}>
          <div className={styles.relatedImgWrap}>
            <img
              src={p.image && p.image.startsWith('http') ? p.image : '/images/anh1.jpg'}
              alt={p.name}
              className={styles.relatedImg}
              onError={(e) => { e.currentTarget.src = '/images/anh1.jpg'; }}
            />
          </div>          <div className={styles.relatedName}>{p.name}</div>
          <div className={styles.relatedDesc}>{p.description}</div>
          <div className={styles.relatedPrice}>{formatPrice(p.price)}</div>
        </Link>
      ))}
    </div>
  );
}
