"use client";
import { useState, useEffect } from "react";
import { ProductWithCategory } from "@/types";
import styles from "../page.module.css";
import { FaHeart } from "react-icons/fa";
import Link from "next/link";
import { useWishlist, useCart } from "@/hooks";
import { useAuth } from "@/contexts";

export default function ProductItem({ product }: { product: ProductWithCategory }) {
  const { user } = useAuth();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setIsLiked(isInWishlist(product._id));
    }
  }, [product._id, user, isInWishlist]);

  const toggleLike = async () => {
    if (!user) {
      alert("Vui lòng đăng nhập để sử dụng chức năng yêu thích!");
      return;
    }

    try {
      setIsLoading(true);
      if (isLiked) {
        await removeFromWishlist(product._id);
      } else {
        await addToWishlist(product._id);
      }
      setIsLiked(!isLiked);
    } catch (error) {
      console.error('Lỗi khi cập nhật wishlist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      alert("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!");
      return;
    }

    // Giả sử sản phẩm có variant đầu tiên, hoặc bạn có thể mở modal để chọn variant
    if (product.variants && product.variants.length > 0) {
      try {
        await addToCart(product.variants[0]._id, 1);
        alert("Đã thêm sản phẩm vào giỏ hàng!");
      } catch (error) {
        console.error('Lỗi khi thêm vào giỏ hàng:', error);
        alert("Có lỗi xảy ra khi thêm sản phẩm vào giỏ hàng!");
      }
    } else {
      alert("Sản phẩm này hiện không có sẵn!");
    }
  };

  return (
    <div className={styles.productItem}>
      <div className={styles.imageContainer}>
        <Link href={`/products/${product._id}`}>
          <img 
            src={product.images?.[0] || "/images/anh1.jpg"} 
            alt={product.name}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/images/anh1.jpg";
            }}
            loading="lazy"
          />
        </Link>
        {/* Nút thả tim */}
        <button 
          className={styles.heartButton} 
          onClick={toggleLike} 
          disabled={isLoading}
          title={isLiked ? "Bỏ yêu thích" : "Yêu thích"}
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            boxShadow: 'none',
            opacity: isLoading ? 0.5 : 1
          }}
        >
          <FaHeart color={isLiked ? "#e11d48" : "#d1d5db"} size={24} />
        </button>
      </div>
      <div className={styles.productInfo}>
        <h3>{product.name}</h3>
        <p className={styles.description}>{product.description}</p>
        <p className={styles.price}>{(product.price)}</p>
        <div style={{display:'flex', gap:6, marginTop:6}}>
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
            onClick={handleAddToCart}
          >
            <span style={{position: 'relative', zIndex: 10}}>Thêm vào giỏ hàng</span>
          </button>
        </div>
      </div>
    </div>
  );
}