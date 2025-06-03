'use client';
import styles from '../cart/cart.module.css';

interface CartItem {
    id: string;
    name: string;
    price: number;
    image: string;
    quantity: number;
}

interface CartListProps {
    items: CartItem[];
    onIncrease: (id: string) => void;
    onDecrease: (id: string) => void;
    onRemove: (id: string) => void;
}

export default function CartList({ items, onIncrease, onDecrease, onRemove }: CartListProps) {
    if (items.length === 0) {
        return <p>Giỏ hàng trống</p>;
    }

    return (
        <div className={styles.cartList}>
            {items.map((item) => (
                <div key={item.id} className={styles.cartItem}>
                    <img
                        src={item.image}
                        alt={item.name}
                        className={styles.itemImage}
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/fallback.jpg';
                            target.alt = 'Hình ảnh không khả dụng';
                        }}
                    />

                    <div className={styles.itemInfo}>
                        <h3>{item.name}</h3>
                        <p>Giá: <strong>{item.price.toLocaleString('vi-VN')} VNĐ</strong></p>
                        <p>Số lượng: <strong>{item.quantity}</strong></p>
                        <p>Tổng: <strong>{(item.price * item.quantity).toLocaleString('vi-VN')} VNĐ</strong></p>
                    </div>

                    <div className={styles.itemActions}>
                        <div className={styles.quantityControl}>
                            <button onClick={() => onDecrease(item.id)}>-</button>
                            <span>{item.quantity}</span>
                            <button onClick={() => onIncrease(item.id)}>+</button>
                        </div>
                        <button className={styles.removeBtn} onClick={() => onRemove(item.id)}>X</button>
                    </div>
                </div>
            ))}
        </div>
    );
}
