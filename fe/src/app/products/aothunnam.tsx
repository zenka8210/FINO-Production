import ProductList from "../components/ProductList";
import { Product } from "../components/interface";
import { useEffect, useState } from "react";

export default function AoThunNamPage() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function fetchProducts() {
      let res = await fetch("http://localhost:3000/product");
      let data = await res.json();
      const filtered = data.filter((p: Product) => String(p.category) === "1");
      setProducts(filtered);
    }
    fetchProducts();
  }, []);

  return (
    <div>
      <ProductList props={{
        title: "Áo thun nam",
        products: products
      }} />
    </div>
  );
}
