'use client'
import { useState } from 'react';
import { ProductWithCategory } from '../../types';
import { useCart, useNotifications } from '../../hooks';
import styles from './AddToCart.module.css';

interface AddToCartProps {
    product: ProductWithCategory;
}

export default function AddToCart({ product }: AddToCartProps) {
    const [quantity, setQuantity] = useState(1);
    const { addToCart: addToCartFn, isLoading } = useCart();
    const { success, error } = useNotifications();

    const addToCart = async () => {
        try {
            // Cần product variant ID để add to cart
            // Tạm thời sử dụng product đầu tiên
            if (product.variants && product.variants.length > 0) {
                await addToCartFn(product.variants[0]._id, quantity);
                success('Thành công', 'Đã thêm vào giỏ hàng!');
            } else {
                error('Lỗi', 'Sản phẩm chưa có variant!');
            }
        } catch (err) {
            error('Lỗi', 'Có lỗi khi thêm vào giỏ hàng!');
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
            </div>            <button 
                onClick={addToCart}
                disabled={isLoading}
                className="btn-brand btn-lg add-to-cart-primary"
                style={{fontSize: '1.1rem', fontWeight: 'bold', padding: '16px 24px', height: '56px'}}
            >
                {isLoading ? 'Đang thêm...' : 'Thêm vào giỏ hàng'}
            </button>
        </div>
    );
}