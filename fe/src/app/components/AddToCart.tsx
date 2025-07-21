'use client'
import { useState } from 'react';
import { ProductWithCategory } from '../../types';
import { useCart } from '../../hooks';
import styles from './AddToCart.module.css';

interface AddToCartProps {
    product: ProductWithCategory;
}

export default function AddToCart({ product }: AddToCartProps) {
    const [quantity, setQuantity] = useState(1);
    const { addToCart: addToCartFn, isLoading } = useCart();

    const addToCart = async () => {
        try {
            // Cần product variant ID để add to cart
            // Tạm thời sử dụng product đầu tiên
            if (product.variants && product.variants.length > 0) {
                await addToCartFn(product.variants[0]._id, quantity);
                // Note: CartContext đã hiển thị notification, không cần thêm ở đây
            } else {
                throw new Error('Sản phẩm chưa có variant!');
            }
        } catch (err) {
            // CartContext sẽ hiển thị error notification qua showError
            console.error('Add to cart error:', err);
        }
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
                disabled={isLoading}
                className={styles.addToCartButton}
            >
                {isLoading ? 'Đang thêm...' : 'Thêm vào giỏ hàng'}
            </button>
        </div>
    );
}