'use client'
import { Product } from '../../component/interface';
import { getDetail } from '../../services/ProductService';
import styles from './id.module.css';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function ProductDetail() {
    const params = useParams();
    const id = params?.id as string;

    const [product, setProduct] = useState<Product | null>(null);
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        if (!id) return;

        const fetchProduct = async () => {
            try {
                const data = await getDetail(`http://localhost:3450/product/${id}`);
                setProduct(data);
            } catch (err) {
                console.error("Lỗi khi fetch chi tiết sản phẩm:", err);
            }
        };

        fetchProduct();
    }, [id]);

    const handleAddToCart = () => {
        if (!product) return;

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
                quantity
            });
        }

        localStorage.setItem('cart', JSON.stringify(cart));
        alert('Đã thêm vào giỏ hàng!');
    };

    if (!product) return <div>Loading...</div>;

    return (
        <div className={styles.container}>
            <div className={styles.productDetail}>
                <div className={styles.imageContainer}>
                    <Image
                        src={product.image}
                        alt={product.name}
                        width={600}
                        height={600}
                        className={styles.productImage}
                        unoptimized 
                    />
                </div>

                <div className={styles.info}>
                    <h1 className={styles.title}>{product.name}</h1>
                    <p className={styles.description}>{product.description}</p>
                    <p className={styles.price}>{product.price.toLocaleString('vi-VN')}đ</p>

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
                        className={styles.buyButton}
                        onClick={handleAddToCart}
                    >
                        Thêm vào giỏ hàng
                    </button>
                </div>
            </div>
        </div>
    );
}
