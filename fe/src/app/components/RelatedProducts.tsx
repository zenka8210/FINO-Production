"use client";
import { useEffect, useState } from "react";
import { formatPrice } from '../../utils/formatPrice';
import { ProductWithCategory } from '../../types';
import styles from "../products/[id]/id.module.css";
import Link from "next/link";
import { useProducts } from '../../hooks/useProducts';

export default function RelatedProducts({ currentId, category }: { currentId: string, category?: string }) {
  const { getProducts, loading, error } = useProducts();
  const [relatedProducts, setRelatedProducts] = useState<ProductWithCategory[]>([]);

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      try {
        const response = await getProducts({ limit: 20 });
        console.log('RelatedProducts response:', response);
        
        // getProducts() returns PaginatedResponse<ProductWithCategory>
        // Structure: { data: ProductWithCategory[], pagination: {} }
        let productsArray: ProductWithCategory[] = [];
        
        if (Array.isArray(response)) {
          productsArray = response;
        } else if (response && typeof response === 'object' && 'data' in response && Array.isArray((response as any).data)) {
          productsArray = (response as any).data;
        }
        
        if (productsArray.length > 0 && currentId) {
          const filtered = productsArray
            .filter((p: ProductWithCategory) => p._id !== currentId && (!category || p.category?._id === category))
            .slice(0, 4);
          setRelatedProducts(filtered);
        }
      } catch (err) {
        console.error('Error fetching related products:', err);
      }
    };

    fetchRelatedProducts();
  }, [currentId, category, getProducts]);

  if (loading) return <div>Đang tải sản phẩm liên quan...</div>;
  if (error) return <div>Lỗi khi tải sản phẩm liên quan</div>;
  if (relatedProducts.length === 0) return null;

  return (
    <div className={styles.relatedProducts}>
      <h3>Sản phẩm liên quan</h3>
      <div className={styles.productGrid}>
        {relatedProducts.map((product) => (
          <Link 
            key={product._id} 
            href={`/products/${product._id}`}
            className={styles.productItem}
          >
            <div className={styles.productImage}>
              <img 
                src={product.images?.[0] || '/images/placeholder.jpg'} 
                alt={product.name}
              />
            </div>
            <div className={styles.productInfo}>
              <h4>{product.name}</h4>
              <div className={styles.price}>
                {product.salePrice && product.isOnSale ? (
                  <>
                    <span className={styles.originalPrice}>
                      {formatPrice(product.price)}
                    </span>
                    <span className={styles.discountPrice}>
                      {formatPrice(product.salePrice)}
                    </span>
                  </>
                ) : (
                  <span>{formatPrice(product.currentPrice || product.price)}</span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
