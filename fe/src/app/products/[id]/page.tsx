'use client'
import { ProductWithCategory, ProductVariantWithRefs } from '@/types';
import styles from './id.module.css';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProducts, useCart, useWishlist, useNotifications } from '@/hooks';
import { useAuth } from '@/contexts';
import RelatedProducts from '../../components/RelatedProducts';
import ReviewSection from '../../components/ReviewSection';
import { formatPrice } from '@/utils/formatPrice';

export default function ProductDetail() {
    const params = useParams();
    const id = params?.id as string;
    const router = useRouter();
    
    const [product, setProduct] = useState<ProductWithCategory | null>(null);
    const [selectedVariant, setSelectedVariant] = useState<ProductVariantWithRefs | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [selectedColor, setSelectedColor] = useState<string>('');
    const [selectedSize, setSelectedSize] = useState<string>('');

    const { getProductById, loading: productLoading, error: productError } = useProducts();
    const { addToCart, isLoading: cartLoading } = useCart();
    const { toggleWishlist, isInWishlist, loading: wishlistLoading } = useWishlist();
    const { success: showSuccess, error: showError } = useNotifications();
    const { user } = useAuth();

    // Fetch product data
    useEffect(() => {
        const fetchProduct = async () => {
            if (!id) return;
            
            try {
                const productData = await getProductById(id);
                if (productData) {
                    setProduct(productData);
                    // Set default variant if available (product variants chỉ có _id, không phải full object)
                    if (productData.variants && productData.variants.length > 0) {
                        const firstVariant = productData.variants[0] as any;
                        setSelectedVariant(firstVariant);
                        if (firstVariant.color?._id) setSelectedColor(firstVariant.color._id);
                        if (firstVariant.size?._id) setSelectedSize(firstVariant.size._id);
                    }
                }
            } catch (error) {
                console.error('Error fetching product:', error);
                showError('Không thể tải thông tin sản phẩm');
            }
        };

        fetchProduct();
    }, [id, getProductById, showError]);

    // Handle variant selection
    const handleVariantChange = (colorId: string, sizeId: string) => {
        if (!product?.variants) return;
        
        const variant = product.variants.find((v: any) => 
            v.color?._id === colorId && v.size?._id === sizeId
        ) as any;
        
        if (variant) {
            setSelectedVariant(variant);
            setSelectedColor(colorId);
            setSelectedSize(sizeId);
        }
    };

    const handleAddToCart = async () => {
        if (!user) {
            showError('Vui lòng đăng nhập để thêm vào giỏ hàng');
            router.push('/login');
            return;
        }

        if (!selectedVariant) {
            showError('Vui lòng chọn màu sắc và kích thước');
            return;
        }

        try {
            await addToCart(selectedVariant._id, quantity);
            showSuccess('Đã thêm sản phẩm vào giỏ hàng');
        } catch (error) {
            showError('Lỗi khi thêm vào giỏ hàng');
        }
    };

    const handleToggleWishlist = async () => {
        if (!user) {
            showError('Vui lòng đăng nhập để thêm vào yêu thích');
            router.push('/login');
            return;
        }

        if (!product) return;

        try {
            await toggleWishlist(product._id);
            const inWishlist = isInWishlist(product._id);
            showSuccess(
                inWishlist ? 'Đã thêm vào yêu thích' : 'Đã xóa khỏi yêu thích'
            );
        } catch (error) {
            showError('Lỗi khi cập nhật yêu thích');
        }
    };

    // Get available colors and sizes
    const availableColors = product?.variants 
        ? [...new Set(product.variants.map((v: any) => v.color))]
        : [];
    
    const availableSizes = product?.variants
        ? [...new Set(product.variants.map((v: any) => v.size))]
        : [];

    if (productLoading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Đang tải thông tin sản phẩm...</p>
            </div>
        );
    }

    if (productError || !product) {
        return (
            <div className={styles.error}>
                <h2>Không tìm thấy sản phẩm</h2>
                <p>{productError || 'Sản phẩm không tồn tại hoặc đã bị xóa'}</p>
                <button onClick={() => router.push('/products')} className={styles.backButton}>
                    Quay lại danh sách sản phẩm
                </button>
            </div>
        );
    }

    const currentPrice = selectedVariant?.price || product.currentPrice || product.price;
    const originalPrice = product.price;
    const isOnSale = product.isOnSale && product.salePrice;

    return (
        <div className={styles.productDetail}>
            <div className={styles.container}>
                <div className={styles.productInfo}>
                    <div className={styles.imageSection}>
                        <div className={styles.mainImage}>
                            <Image
                                src={selectedVariant?.images?.[0] || product.images?.[0] || '/images/placeholder.jpg'}
                                alt={product.name}
                                width={500}
                                height={500}
                                className={styles.productImage}
                            />
                        </div>
                        {(selectedVariant?.images || product.images) && (
                            <div className={styles.thumbnails}>
                                {(selectedVariant?.images || product.images)?.map((image: string, index: number) => (
                                    <Image
                                        key={index}
                                        src={image}
                                        alt={`${product.name} ${index + 1}`}
                                        width={80}
                                        height={80}
                                        className={styles.thumbnail}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    <div className={styles.details}>
                        <div className={styles.header}>
                            <h1 className={styles.productName}>{product.name}</h1>
                            <button 
                                onClick={handleToggleWishlist}
                                className={`${styles.wishlistBtn} ${isInWishlist(product._id) ? styles.liked : ''}`}
                                disabled={wishlistLoading}
                            >
                                ❤️
                            </button>
                        </div>

                        <div className={styles.category}>
                            <span>Danh mục: {product.category.name}</span>
                        </div>

                        <div className={styles.pricing}>
                            {isOnSale ? (
                                <>
                                    <span className={styles.salePrice}>
                                        {formatPrice(product.salePrice!)}
                                    </span>
                                    <span className={styles.originalPrice}>
                                        {formatPrice(originalPrice)}
                                    </span>
                                </>
                            ) : (
                                <span className={styles.price}>
                                    {formatPrice(currentPrice)}
                                </span>
                            )}
                        </div>

                        {product.description && (
                            <div className={styles.description}>
                                <h3>Mô tả sản phẩm</h3>
                                <p>{product.description}</p>
                            </div>
                        )}

                        {/* Color Selection */}
                        {availableColors.length > 0 && (
                            <div className={styles.colorSelection}>
                                <h3>Màu sắc:</h3>
                                <div className={styles.colorOptions}>
                                    {availableColors.map((color: any) => (
                                        <button
                                            key={color._id}
                                            onClick={() => handleVariantChange(color._id, selectedSize)}
                                            className={`${styles.colorOption} ${selectedColor === color._id ? styles.selected : ''}`}
                                        >
                                            {color.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Size Selection */}
                        {availableSizes.length > 0 && (
                            <div className={styles.sizeSelection}>
                                <h3>Kích thước:</h3>
                                <div className={styles.sizeOptions}>
                                    {availableSizes.map((size: any) => (
                                        <button
                                            key={size._id}
                                            onClick={() => handleVariantChange(selectedColor, size._id)}
                                            className={`${styles.sizeOption} ${selectedSize === size._id ? styles.selected : ''}`}
                                        >
                                            {size.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Stock Info */}
                        {selectedVariant && (
                            <div className={styles.stockInfo}>
                                <span className={selectedVariant.isInStock ? styles.inStock : styles.outOfStock}>
                                    {selectedVariant.isInStock 
                                        ? `Còn ${selectedVariant.stock} sản phẩm`
                                        : 'Hết hàng'
                                    }
                                </span>
                            </div>
                        )}

                        {/* Quantity and Add to Cart */}
                        <div className={styles.actions}>
                            <div className={styles.quantitySelector}>
                                <label>Số lượng:</label>
                                <div className={styles.quantityControls}>
                                    <button 
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        disabled={quantity <= 1}
                                    >
                                        -
                                    </button>
                                    <span>{quantity}</span>
                                    <button 
                                        onClick={() => setQuantity(quantity + 1)}
                                        disabled={selectedVariant ? quantity >= selectedVariant.stock : false}
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={handleAddToCart}
                                disabled={
                                    cartLoading || 
                                    !selectedVariant || 
                                    !selectedVariant.isInStock ||
                                    quantity > selectedVariant.stock
                                }
                                className={styles.addToCartBtn}
                            >
                                {cartLoading ? 'Đang thêm...' : 'Thêm vào giỏ hàng'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Related Products */}
                <RelatedProducts currentId={product._id} category={product.category._id} />

                {/* Reviews */}
                <ReviewSection productId={product._id} />
            </div>
        </div>
    );
}