"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaHeart } from "react-icons/fa";
import styles from "../products/product.module.css";
import { Product } from "./interface";
import style from "../page.module.css";
import ProductList from "./ProductList";

export default function ProductCard({ product }: { product: Product }) {
  const [isLiked, setIsLiked] = useState(false);

  const toggleLike = () => {
    setIsLiked(!isLiked);
  };

  return (
    <>
      <div className={styles.productCard}>
        <div className={style.productItem}>
          <div className={style.imageContainer}>
            <Link
              href={`/products/${product.id}`}
              className={style.productLink}
            >
              <img
                src={product.image || "/default-image.png"}
                alt={product.name}
              />
            </Link>
          </div>
          {/* Nút thả tim */}
          <button className={style.heartButton} onClick={toggleLike}>
            <FaHeart color={isLiked ? "red" : "gray"} size={24} />
          </button>
          <div className={style.productInfo}>
            <h3>{product.name}</h3>
            <p className={style.description}>{product.description}</p>
            <p className={style.price}>${product.price}</p>
            <button className={style.buyButton}>Mua ngay</button>
          </div>
        </div>
      </div>
    </>
  );
}
