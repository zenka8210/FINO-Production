"use client";
import { useEffect, useState } from "react";
import { Product } from "../components/interface";
import listStyles from "./favorite-list.module.css";

export default function FavoritePage() {
  const [favorites, setFavorites] = useState<Product[]>([]);

  useEffect(() => {
    const favIds = JSON.parse(localStorage.getItem("favorites") || "[]");
    fetch("/data.json")
      .then((res) => res.json())
      .then((data) => {
        let all = data.product || data.products || [];
        setFavorites(all.filter((p: Product) => favIds.includes(p.id)));
      });
  }, []);

  const removeFavorite = (id: string | number) => {
    const favIds = JSON.parse(localStorage.getItem("favorites") || "[]").filter((fid: string | number) => fid !== id);
    localStorage.setItem("favorites", JSON.stringify(favIds));
    setFavorites(favorites.filter((p) => p.id !== id));
  };

  const addToCart = (product: Product) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = cart.find((item: any) => item.id === product.id);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    // Hiển thị thông báo
    if (typeof window !== 'undefined') {
      window.alert('Đã thêm vào giỏ hàng!');
    }
  };

  const buyNow = (product: Product) => {
    addToCart(product);
    window.location.href = '/cart';
  };

  return (
    <div style={{ paddingTop: 32 }}>
      <h1 style={{ textAlign: "center", fontSize: "2rem", marginBottom: 24 }}>
        Sản phẩm yêu thích
      </h1>
      <div className={listStyles.favoriteList}>
        {favorites.length === 0 ? (
          <div
            style={{
              padding: 40,
              textAlign: "center",
              width: "100%",
            }}
          >
            Bạn chưa có sản phẩm yêu thích nào.
          </div>
        ) : (
          favorites.map((product) => (
            <div className={listStyles.favoriteItem} key={product.id}>
              <img
                className={listStyles.favoriteImage}
                src={product.image || "/default-image.png"}
                alt={product.name}
              />
              <div className={listStyles.favoriteInfo}>
                <div className={listStyles.favoriteName}>{product.name}</div>
                <div className={listStyles.favoriteDesc}>
                  {product.description}
                </div>
                <div className={listStyles.favoritePrice}>
                  {product.price.toLocaleString("vi-VN")} VNĐ
                </div>                <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                  <button
                    onClick={() => addToCart(product)}
                    className="btn-brand add-to-cart-primary"
                    style={{
                      flex: 1,
                      fontSize: "0.9rem",
                      fontWeight: "bold",
                      padding: "8px 16px",
                      height: "36px",
                    }}
                  >
                    Thêm vào giỏ
                  </button>                  <button
                    onClick={() => buyNow(product)}
                    className="btn-secondary"
                    style={{
                      flex: 1,
                      fontSize: "0.9rem",
                      padding: "8px 16px",
                      height: "36px",
                    }}
                  >
                    Mua ngay
                  </button>
                </div>
              </div>
              <button
                className={listStyles.favoriteRemove}
                title="Xóa khỏi yêu thích"
                onClick={() => removeFavorite(product.id)}
              >
                &times;
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
