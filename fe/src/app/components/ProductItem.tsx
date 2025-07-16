"use client";
import { useState, useEffect } from "react";
import { Product } from "./interface";
import styles from "../page.module.css";
import { FaHeart } from "react-icons/fa";
import { formatPriceVND } from "../utils/formatPrice";
import Link from "next/link";

export default function ProductItem({ product }: { product: Product }) {
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const favs = JSON.parse(localStorage.getItem("favorites") || "[]");
      setIsLiked(favs.includes(product.id));
    }
  }, [product.id]);

  const toggleLike = () => {
  const user = localStorage.getItem("user");
  if (!user) {
    alert("Vui lòng đăng nhập để sử dụng chức năng yêu thích!");
    return;
  }
  let favs = JSON.parse(localStorage.getItem("favorites") || "[]");
  if (isLiked) {
    favs = favs.filter((id: any) => id !== product.id);
  } else {
    favs.push(product.id);
  }
  localStorage.setItem("favorites", JSON.stringify(favs));
  setIsLiked(!isLiked);
};

  return (
    <div className={styles.productItem}>      <div className={styles.imageContainer}>
        <Link href={`/products/${product.id}`}>
          <img 
            src={product.image || "/images/anh1.jpg"} 
            alt={product.name}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/images/anh1.jpg";
            }}
            loading="lazy"
          />
        </Link>        {/* Nút thả tim */}
        <button 
          className={styles.heartButton} 
          onClick={toggleLike} 
          title={isLiked ? "Bỏ yêu thích" : "Yêu thích"}
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            boxShadow: 'none'
          }}
        >
          <FaHeart color={isLiked ? "#e11d48" : "#d1d5db"} size={24} />
        </button>
      </div><div className={styles.productInfo}>
        <h3>{product.name}</h3>
        <p className={styles.description}>{product.description}</p>
        <p className={styles.price}>{formatPriceVND(product.price)}</p>        <div style={{display:'flex', gap:6, marginTop:6}}>
          <button 
            className="btn-cart-primary" 
            style={{
              width: '100%',
              fontSize: '0.9rem', 
              fontWeight: 'normal', 
              padding: '10px 16px', 
              height: '42px',
              textTransform: 'none',
              background: '#fff',
              color: 'var(--brand-color, #FF9800)',
              border: '2px solid var(--brand-color, #FF9800)',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }} 
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--brand-color, #FF9800)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#fff';
              e.currentTarget.style.color = 'var(--brand-color, #FF9800)';
            }}
            onClick={() => {
            const cart = JSON.parse(localStorage.getItem('cart') || '[]');
            const existingItem = cart.find((item:any) => item.id === product.id);
            if (existingItem) {
              existingItem.quantity += 1;
            } else {
              cart.push({ 
                id: product.id, 
                name: product.name, 
                price: product.price,
                image: product.image, 
                quantity: 1 
              });
            }
            localStorage.setItem('cart', JSON.stringify(cart));
            alert('Đã thêm vào giỏ hàng!');
          }}>
            <span style={{position: 'relative', zIndex: 10}}>Thêm vào giỏ hàng</span>
          </button>
        </div>
      </div>
    </div>
  );
}