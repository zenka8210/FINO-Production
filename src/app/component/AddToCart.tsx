'use client'
import { useState } from 'react';
import { Product } from './interface';
import styles from './AddToCart.module.css';

interface AddToCartProps {
    product: Product;
}

export default function AddToCart({ product }: AddToCartProps) {
    const [quantity, setQuantity] = useState(1);

    const addToCart = () => {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const existingItem = cart.find((item: any) => item.id === product.id);

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                quantity: quantity
            });
        }

        localStorage.setItem('cart', JSON.stringify(cart));
        alert('Đã thêm vào giỏ hàng!');
    };

    return (
        <div className={styles.addToCart}>
            <div className={styles.quantity}>
                <button 
                    onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                    className={styles.quantityBtn}
                >
                    -
                </button>
                <span>{quantity}</span>
                <button 
                    onClick={() => setQuantity(prev => prev + 1)}
                    className={styles.quantityBtn}
                >
                    +
                </button>
            </div>
            <button 
                onClick={addToCart}
                className={styles.addButton}
            >
                Thêm vào giỏ hàng
            </button>
        </div>
    );
}