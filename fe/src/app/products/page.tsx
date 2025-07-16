"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import ProductList from "../components/ProductList";
import { Product } from "../components/interface";
import styles from "./product.module.css";

export default function Home() {
  const searchParams = useSearchParams();
  const search = searchParams.get("search") || "";
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);

  useEffect(() => {
    fetch("/data.json")
      .then((res) => res.json())
      .then((data) => {
        let all = data.product || data.products || [];
        setProducts(all);
      });
  }, []);

  useEffect(() => {
    if (!search) {
      setFiltered(products);
    } else {
      setFiltered(
        products.filter((p: Product) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
        )
      );
    }
  }, [search, products]);
  return (
    <div className="container">
      <div className="row">
        <div className="col-12">
          <div className={styles.productSection}>
            <h1 className={styles.title}>
              {search ? `Kết quả tìm kiếm cho "${search}"` : "Tất cả sản phẩm"}
            </h1>
            <ProductList props={{ title: "", products: filtered }} />
            {filtered.length === 0 && (
              <div style={{padding:40, textAlign:'center', width:'100%'}}>Không tìm thấy sản phẩm phù hợp.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}