'use client'
import { Product } from '../../components/interface';
import { getDetail } from '../../services/ProductServices';
import styles from './id.module.css';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import RelatedProducts from '../../components/RelatedProducts';
import ReviewSection from '../../components/ReviewSection';


export default function ProductDetail() {
    const params = useParams();
    const id = params?.id as string;    const [product, setProduct] = useState<Product | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [isLiked, setIsLiked] = useState(false);
    const [selectedSize, setSelectedSize] = useState<string>('L'); // Size mặc định là L

    const sizes = [
        { label: 'S', priceMultiplier: 0.97 }, // Giảm 3%
        { label: 'L', priceMultiplier: 1.0 },  // Giữ nguyên
        { label: 'XL', priceMultiplier: 1.03 }, // Tăng 3%
        { label: 'XXL', priceMultiplier: 1.03 }, // Tăng 3%
        { label: 'XXXL', priceMultiplier: 1.03 } // Tăng 3%
    ];

    // Tính giá theo size
    const getCurrentPrice = () => {
        if (!product) return 0;
        const sizeData = sizes.find(s => s.label === selectedSize);
        const multiplier = sizeData ? sizeData.priceMultiplier : 1.0;
        return Math.round(product.price * multiplier);
    };

    useEffect(() => {
        if (!id) return;

        const fetchProduct = async () => {
            try {
                const data = await getDetail(`http://localhost:3000/product/${id}`);
                setProduct(data);
            } catch (err) {
                console.error("Lỗi khi fetch chi tiết sản phẩm:", err);
            }
        };

        fetchProduct();
    }, [id]);    const handleAddToCart = () => {
        if (!product) return;

        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const currentPrice = getCurrentPrice();
        const existingItem = cart.find((item: any) => item.id === product.id && item.size === selectedSize);

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                price: currentPrice,
                originalPrice: product.price,
                size: selectedSize,
                image: product.image,
                quantity
            });
        }        localStorage.setItem('cart', JSON.stringify(cart));
        alert(`Đã thêm vào giỏ hàng! Size: ${selectedSize}, Số lượng: ${quantity}`);
    };

    const handleBuyNow = () => {
        handleAddToCart();
        window.location.href = '/checkout';
    };

    const toggleLike = () => {
        setIsLiked(!isLiked);
    };

    if (!product) return <div>Loading...</div>;    return (
        <div className="container">
            <div className="row">
                <div className="col-12">
                    <div className={styles.productDetail}>
                        <div className={styles.imageContainer}>
                            <Image
                                src={product.image}
                                alt={product.name}
                                width={600}
                                height={600}
                                className={styles.productImage}
                                unoptimized
                            />                        </div>
                        <div className={styles.info}>
                            <h1 className={styles.title}>{product.name}</h1>
                            <p className={styles.description}>{product.description}</p>
                            <p className={styles.price}>
                                {getCurrentPrice().toLocaleString('vi-VN')}đ
                                {selectedSize !== 'L' && (
                                    <span style={{ fontSize: '14px', color: '#666', marginLeft: '8px' }}>
                                        (Size {selectedSize})
                                    </span>
                                )}
                            </p>
                    
                    {/* Size Selection - Style giống F1GENZ */}
                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#333' }}>
                            Size
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {sizes.map((size) => (
                                <button
                                    key={size.label}
                                    onClick={() => setSelectedSize(size.label)}
                                    style={{
                                        padding: '8px 16px',
                                        border: selectedSize === size.label ? '2px solid #FF6B35' : '1px solid #ddd',
                                        borderRadius: '4px',
                                        backgroundColor: selectedSize === size.label ? '#FF6B35' : '#fff',
                                        color: selectedSize === size.label ? '#fff' : '#333',
                                        fontSize: '14px',
                                        fontWeight: selectedSize === size.label ? '600' : '400',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease',
                                        minWidth: '45px',
                                        outline: 'none',
                                        userSelect: 'none',
                                        WebkitUserSelect: 'none',
                                        boxShadow: selectedSize === size.label ? '0 2px 4px rgba(255, 107, 53, 0.3)' : 'none'
                                    }}
                                    onMouseDown={(e) => e.preventDefault()}
                                    onMouseEnter={(e) => {
                                        if (selectedSize !== size.label) {
                                            e.currentTarget.style.borderColor = '#FF6B35';
                                            e.currentTarget.style.color = '#FF6B35';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (selectedSize !== size.label) {
                                            e.currentTarget.style.borderColor = '#ddd';
                                            e.currentTarget.style.color = '#333';
                                        }
                                    }}
                                >
                                    {size.label}
                                </button>
                            ))}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>                            * Size S: giảm 3% | Size L: giá gốc | Size XL, XXL, XXXL: tăng 3%
                        </div>
                    </div>

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

                    <div className={styles.actionButtons}>
                        <button className="btn-brand btn-lg add-to-cart-primary" style={{flex: 1, fontSize: '1.1rem', fontWeight: 'bold', marginRight: '8px', padding: '16px 24px', height: '56px'}} onClick={handleAddToCart}>
                            Thêm vào giỏ hàng
                        </button>
                        <button className="btn-secondary" style={{flex: 1, fontSize: '1.1rem', padding: '16px 24px', height: '56px'}} onClick={handleBuyNow}>
                            Mua ngay
                        </button>
                        <button
                            className={isLiked ? styles.likedButton : styles.likeButton}
                            onClick={toggleLike}
                            aria-label="Yêu thích"
                        >
                            {isLiked ? '❤️' : '🤍'}
                        </button>
                    </div>
                    <div className={styles.extraInfo}>
                        <div className={styles.badge}>Miễn phí đổi trả 7 ngày</div>
                        <div className={styles.badge}>Giao hàng toàn quốc</div>
                        <div className={styles.badge}>Hỗ trợ 24/7</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
            
            {/* Related Products Section */}
            <div className="row">
                <div className="col-12">
                    <div className={styles.relatedSection}>
                        <h2 className={styles.relatedTitle}>Sản phẩm liên quan</h2>
                        <RelatedProducts currentId={product.id} category={product.category} />
                    </div>
                </div>
            </div>
            
            {/* Review Section - Full Width */}
            <div className="row">
                <div className="col-12">
                    <ReviewSection productId={product.id.toString()} />
                </div>
            </div>
        </div>
    );
}