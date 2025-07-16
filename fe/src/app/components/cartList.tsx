'use client';
import styles from '../cart/cart.module.css';

interface CartItem {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    size?: string;
    image: string;
    quantity: number;
}

interface CartListProps {
    items: CartItem[];
    onIncrease: (id: string, size?: string) => void;
    onDecrease: (id: string, size?: string) => void;
    onRemove: (id: string, size?: string) => void;
}

export default function CartList({ items, onIncrease, onDecrease, onRemove }: CartListProps) {
    if (items.length === 0) {
        return (
            <div style={{ 
                textAlign: 'center', 
                padding: '40px 20px', 
                fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                color: '#666',
                fontSize: '1.1rem'
            }}>
                <p>Giỏ hàng trống</p>
            </div>
        );
    }

    return (        <div className={styles.cartList}>
            {items.map((item, index) => (
                <div key={`${item.id}-${item.size || 'default'}-${index}`} className={styles.cartItem}>
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
                        {item.size && (
                            <p style={{ color: '#666', fontSize: '14px', margin: '4px 0' }}>
                                Size: <strong>{item.size}</strong>
                            </p>
                        )}
                        <p>Giá: <strong>{item.price.toLocaleString('vi-VN')} VNĐ</strong></p>
                        {item.originalPrice && item.originalPrice !== item.price && (
                            <p style={{ fontSize: '12px', color: '#999', textDecoration: 'line-through' }}>
                                Giá gốc: {item.originalPrice.toLocaleString('vi-VN')} VNĐ
                            </p>
                        )}
                        <p>Số lượng: <strong>{item.quantity}</strong></p>
                        <p>Tổng: <strong>{(item.price * item.quantity).toLocaleString('vi-VN')} VNĐ</strong></p>
                    </div>

                    <div className={styles.itemActions}>
                        <div className={styles.quantityControl}>
                            <button onClick={() => onDecrease(item.id, item.size)}>-</button>
                            <span>{item.quantity}</span>
                            <button onClick={() => onIncrease(item.id, item.size)}>+</button>
                        </div>
                        <button className={styles.removeBtn} onClick={() => onRemove(item.id, item.size)}>Xóa</button>
                    </div>
                </div>
            ))}
        </div>
    );
}