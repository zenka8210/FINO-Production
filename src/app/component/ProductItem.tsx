"use client";
import { useState } from "react";
import { Product } from "./interface";
import styles from "../page.module.css";
import { FaHeart } from "react-icons/fa";

export default function ProductItem({ product }: { product: Product }) {
  const [isLiked, setIsLiked] = useState(false);

  const toggleLike = () => {
    setIsLiked(!isLiked);
  };
  return (
    <div className={styles.productItem}>
      <div className={styles.imageContainer}>
        <img src={product.image || "/default-image.png"} alt={product.name} />
        {/* Nút thả tim */}
        <button className={styles.heartButton} onClick={toggleLike}>
          <FaHeart color={isLiked ? "red" : "white"} size={24} />
        </button>
      </div>
      <div className={styles.productInfo}>
        <h3>{product.name}</h3>
        <p className={styles.description}>{product.description}</p>
        <p className={styles.price}>${product.price}</p>
      </div>
    </div>
  );
}
