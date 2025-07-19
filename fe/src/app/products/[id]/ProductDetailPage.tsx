'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { FaStar, FaHeart, FaRegHeart, FaShoppingCart, FaCheck, FaPlus, FaMinus, FaShare, FaTruck, FaShieldAlt, FaUndoAlt, FaPhoneAlt } from 'react-icons/fa';

// Import contexts and hooks
import { useAuth, useNotification } from '@/contexts';
import { useProduct, useCart, useWishlist, useReviews } from '@/hooks';
import { ProductVariantWithRefs } from '@/types';
import { formatPrice } from '@/utils/formatPrice';

// Import UI components
import Button from '@/app/components/ui/Button';
import LoadingSpinner from '@/app/components/ui/LoadingSpinner';
import Modal from '@/app/components/ui/Modal';

// Import components
import ReviewSection from '../../components/ReviewSection';
import RelatedProducts from '../../components/RelatedProducts';

// Import styles
import styles from './ProductDetailPage.module.css';

interface ProductDetailPageProps {
  productId: string;
}

export default function ProductDetailPage({ productId }: ProductDetailPageProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { success, error: showError } = useNotification();
  
  // Hooks
  const { product, loading: productLoading, error: productError } = useProduct(productId);
  const { addToCart, isLoading: cartLoading } = useCart();
  const { toggleWishlist, isInWishlist, loading: wishlistLoading } = useWishlist();
  
  // Local state
  const [selectedVariant, setSelectedVariant] = useState<ProductVariantWithRefs | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Set default variant when product loads
  useEffect(() => {
    if (product && product.variants && product.variants.length > 0) {
      const firstVariant = product.variants[0] as any;
      setSelectedVariant(firstVariant);
      if (firstVariant.color?._id) setSelectedColor(firstVariant.color._id);
      if (firstVariant.size?._id) setSelectedSize(firstVariant.size._id);
    }
  }, [product]);

  // Handle variant selection
  const handleVariantChange = useCallback((colorId: string, sizeId: string) => {
    if (!product?.variants) return;
    
    const variant = product.variants.find((v: any) => 
      v.color?._id === colorId && v.size?._id === sizeId
    ) as any;
    
    if (variant) {
      setSelectedVariant(variant);
      setSelectedColor(colorId);
      setSelectedSize(sizeId);
      setSelectedImageIndex(0); // Reset to first image of new variant
    }
  }, [product]);

  // Handle add to cart
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

    if (selectedVariant.stock < quantity) {
      showError('Số lượng sản phẩm không đủ');
      return;
    }

    try {
      await addToCart(selectedVariant._id, quantity);
      success('Đã thêm sản phẩm vào giỏ hàng');
    } catch (error) {
      showError('Lỗi khi thêm vào giỏ hàng');
    }
  };

  // Handle buy now
  const handleBuyNow = async () => {
    if (!user) {
      showError('Vui lòng đăng nhập để mua hàng');
      router.push('/login');
      return;
    }

    if (!selectedVariant) {
      showError('Vui lòng chọn màu sắc và kích thước');
      return;
    }

    try {
      await addToCart(selectedVariant._id, quantity);
      router.push('/cart');
    } catch (error) {
      showError('Lỗi khi thêm vào giỏ hàng');
    }
  };

  // Handle wishlist toggle
  const handleToggleWishlist = async () => {
    if (!user) {
      showError('Vui lòng đăng nhập để thêm vào yêu thích');
      router.push('/login');
      return;
    }

    if (!product) return;

    try {
      // Let WishlistContext handle all notifications
      await toggleWishlist(product._id);
    } catch (error) {
      // Error notifications are handled by WishlistContext
      console.error('Wishlist toggle error:', error);
    }
  };

  // Handle quantity change
  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1) return;
    if (selectedVariant && newQuantity > selectedVariant.stock) {
      showError(`Chỉ còn ${selectedVariant.stock} sản phẩm`);
      return;
    }
    setQuantity(newQuantity);
  };

  // Get available colors and sizes
  const availableColors = product?.variants 
    ? [...new Map(product.variants.map((v: any) => [v.color?._id, v.color])).values()].filter(Boolean)
    : [];
  
  const availableSizes = product?.variants
    ? [...new Map(product.variants.map((v: any) => [v.size?._id, v.size])).values()].filter(Boolean)
    : [];

  // Debug logging
  console.log('🔍 Product variants:', product?.variants);
  console.log('🎨 Available colors:', availableColors);
  console.log('📏 Available sizes:', availableSizes);

  // Get sizes available for selected color
  const availableSizesForColor = product?.variants
    ? product.variants
        .filter((v: any) => v.color?._id === selectedColor)
        .map((v: any) => v.size)
    : [];

  // Share functionality
  const handleShare = () => {
    if (navigator.share && product) {
      navigator.share({
        title: product.name,
        text: product.description || `Check out ${product.name}`,
        url: window.location.href
      });
    } else {
      setShowShareModal(true);
    }
  };

  const shareToFacebook = () => {
    if (!product) return;
    
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(`${product.name} - Chỉ ${formatPrice(currentPrice)}`);
    const description = encodeURIComponent(
      product.description 
        ? `${product.description.substring(0, 200)}...` 
        : `Sản phẩm chất lượng với giá ưu đại chỉ ${formatPrice(currentPrice)}. Xem ngay!`
    );
    const imageUrl = product.images?.[0] ? encodeURIComponent(product.images[0]) : '';
    
    // Facebook Share Dialog API with pre-filled content
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${title}&hashtag=%23fashion&description=${description}${imageUrl ? `&picture=${imageUrl}` : ''}`;
    
    window.open(fbUrl, '_blank', 'width=626,height=436');
    setShowShareModal(false);
  };

  const shareToTwitter = () => {
    if (!product) return;
    
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`🔥 ${product.name} - Chỉ ${formatPrice(currentPrice)} ⚡ ${product.description ? product.description.substring(0, 100) + '...' : 'Sản phẩm chất lượng!'} #fashion #sale`);
    const twitterUrl = `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
    
    window.open(twitterUrl, '_blank', 'width=550,height=420');
    setShowShareModal(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    success('Đã copy link sản phẩm');
    setShowShareModal(false);
  };

  if (productLoading) {
    return (
      <div className={styles.loading}>
        <LoadingSpinner size="lg" />
        <p>Đang tải thông tin sản phẩm...</p>
      </div>
    );
  }

  if (productError || !product) {
    return (
      <div className={styles.error}>
        <h2>Không tìm thấy sản phẩm</h2>
        <p>{productError || 'Sản phẩm không tồn tại hoặc đã bị xóa'}</p>
        <Button onClick={() => router.push('/products')}>
          Quay lại danh sách sản phẩm
        </Button>
      </div>
    );
  }

  const currentPrice = selectedVariant?.price || product.currentPrice || product.price;
  const originalPrice = product.price;
  const isOnSale = product.isOnSale && product.salePrice;
  const discountPercent = isOnSale ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0;
  const currentImages = selectedVariant?.images || product.images || [];
  const inWishlist = isInWishlist(product._id);

  return (
    <div className={styles.productDetail}>
      {/* Breadcrumb */}
      <div className={styles.breadcrumb}>
        <span onClick={() => router.push('/')}>Trang chủ</span>
        <span>/</span>
        <span onClick={() => router.push('/products')}>Sản phẩm</span>
        <span>/</span>
        <span onClick={() => router.push(`/categories/${product.category?._id}`)}>
          {product.category?.name}
        </span>
        <span>/</span>
        <span className={styles.current}>{product.name}</span>
      </div>

      <div className={styles.container}>
        <div className={styles.productMain}>
          {/* Image Gallery */}
          <div className={styles.imageSection}>
            <div className={styles.mainImage}>
              <Image
                src={currentImages[selectedImageIndex] || '/images/placeholder.jpg'}
                alt={product.name}
                width={600}
                height={600}
                className={styles.productImage}
              />
              {isOnSale && (
                <div className={styles.saleTag}>
                  -{discountPercent}%
                </div>
              )}
            </div>
            
            {currentImages.length > 1 && (
              <div className={styles.thumbnails}>
                {currentImages.map((image: string, index: number) => (
                  <Image
                    key={index}
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    width={80}
                    height={80}
                    className={`${styles.thumbnail} ${selectedImageIndex === index ? styles.active : ''}`}
                    onClick={() => setSelectedImageIndex(index)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className={styles.infoSection}>
            <div className={styles.productHeader}>
              <h1 className={styles.productName}>{product.name}</h1>
              <div className={styles.productMeta}>
                  <div className={styles.rating}>
                    <div className={styles.stars}>
                      {[...Array(5)].map((_, i) => (
                        <FaStar
                          key={i}
                          className={i < Math.floor((product as any).averageRating || 0) ? styles.filled : styles.empty}
                        />
                      ))}
                    </div>
                    <span className={styles.ratingText}>
                      ({((product as any).averageRating)?.toFixed(1) || '0.0'} - {(product as any).reviewCount || 0} đánh giá)
                    </span>
                  </div>
                <div className={styles.actions}>
                  <button 
                    className={`${styles.wishlistBtn} ${inWishlist ? styles.active : ''}`}
                    onClick={handleToggleWishlist}
                    disabled={wishlistLoading}
                  >
                    <span className={styles.wishlistIcon}>
                      {inWishlist ? <FaHeart /> : <FaRegHeart />}
                    </span>
                    <span className={styles.wishlistText}>
                      {inWishlist ? 'Đã yêu thích' : 'Yêu thích'}
                    </span>
                  </button>
                  <button className={styles.shareBtn} onClick={handleShare}>
                    <span className={styles.shareIcon}>
                      <FaShare />
                    </span>
                    <span className={styles.shareText}>Chia sẻ</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Price */}
            <div className={styles.priceSection}>
              <div className={styles.priceGroup}>
                <span className={styles.currentPrice}>
                  {formatPrice(currentPrice)}
                </span>
                {isOnSale && (
                  <span className={styles.originalPrice}>
                    {formatPrice(originalPrice)}
                  </span>
                )}
              </div>
              {isOnSale && (
                <div className={styles.savings}>
                  Tiết kiệm {formatPrice(originalPrice - currentPrice)}
                </div>
              )}
            </div>

            {/* Color Selection */}
            {availableColors.length > 0 ? (
              <div className={styles.variantSection}>
                <h4>Màu sắc:</h4>
                <div className={styles.colorOptions}>
                  {availableColors.map((color: any) => (
                    <button
                      key={color._id}
                      className={`${styles.colorOption} ${selectedColor === color._id ? styles.selected : ''}`}
                      onClick={() => handleVariantChange(color._id, selectedSize)}
                    >
                      <span>{color.name}</span>
                      {selectedColor === color._id && <FaCheck className={styles.checkIcon} />}
                    </button>
                  ))}
                </div>
              </div>
            ) : product?.variants && product.variants.length > 0 ? (
              <div className={styles.variantSection}>
                <h4>Màu sắc:</h4>
                <div className={styles.noVariants}>
                  <span>Sản phẩm này chỉ có một màu</span>
                </div>
              </div>
            ) : null}

            {/* Size Selection */}
            {availableSizes.length > 0 ? (
              <div className={styles.variantSection}>
                <div className={styles.sectionHeader}>
                  <h4>Kích thước:</h4>
                  <button 
                    className={styles.sizeGuideBtn}
                    onClick={() => setShowSizeGuide(true)}
                  >
                    Hướng dẫn chọn size
                  </button>
                </div>
                <div className={styles.sizeOptions}>
                  {availableSizes.map((size: any) => {
                    const isAvailable = availableSizesForColor.some((s: any) => s._id === size._id);
                    return (
                      <button
                        key={size._id}
                        className={`${styles.sizeOption} ${selectedSize === size._id ? styles.selected : ''} ${!isAvailable ? styles.disabled : ''}`}
                        onClick={() => isAvailable && handleVariantChange(selectedColor, size._id)}
                        disabled={!isAvailable}
                      >
                        {size.name}
                        {selectedSize === size._id && <FaCheck className={styles.checkIcon} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : product?.variants && product.variants.length > 0 ? (
              <div className={styles.variantSection}>
                <h4>Kích thước:</h4>
                <div className={styles.noVariants}>
                  <span>Sản phẩm này chỉ có một kích thước</span>
                </div>
              </div>
            ) : null}

            {/* Stock & Quantity */}
            {selectedVariant && (
              <div className={styles.stockSection}>
                <div className={styles.stockInfo}>
                  <span className={`${styles.stockStatus} ${selectedVariant.stock > 10 ? styles.inStock : styles.lowStock}`}>
                    {selectedVariant.stock > 0 ? (
                      selectedVariant.stock > 10 ? 'Còn hàng' : `Chỉ còn ${selectedVariant.stock} sản phẩm`
                    ) : 'Hết hàng'}
                  </span>
                </div>

                {selectedVariant.stock > 0 && (
                  <div className={styles.quantitySection}>
                    <h4>Số lượng:</h4>
                    <div className={styles.quantityControl}>
                      <button
                        className={styles.quantityBtn}
                        onClick={() => handleQuantityChange(quantity - 1)}
                        disabled={quantity <= 1}
                      >
                        <FaMinus />
                      </button>
                      <input
                        type="number"
                        value={quantity}
                        onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                        min={1}
                        max={selectedVariant.stock}
                        className={styles.quantityInput}
                      />
                      <button
                        className={styles.quantityBtn}
                        onClick={() => handleQuantityChange(quantity + 1)}
                        disabled={quantity >= selectedVariant.stock}
                      >
                        <FaPlus />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className={styles.actionButtons}>
              {selectedVariant && selectedVariant.stock > 0 ? (
                <>
                  {/* Primary CTA - Following "1 view = 1 action" principle */}
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleBuyNow}
                    disabled={cartLoading}
                    className={styles.buyNowBtn}
                  >
                    Mua ngay
                  </Button>
                  {/* Secondary Action */}
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleAddToCart}
                    disabled={cartLoading}
                    className={styles.addToCartBtn}
                  >
                    <FaShoppingCart />
                    {cartLoading ? 'Đang thêm...' : 'Thêm vào giỏ'}
                  </Button>
                </>
              ) : (
                <Button variant="secondary" size="lg" disabled>
                  Hết hàng
                </Button>
              )}
            </div>

            {/* Features */}
            <div className={styles.features}>
              <div className={styles.feature}>
                <FaTruck className={styles.featureIcon} />
                <div>
                  <h5>Giao hàng miễn phí</h5>
                  <p>Đơn hàng từ 500.000đ</p>
                </div>
              </div>
              <div className={styles.feature}>
                <FaShieldAlt className={styles.featureIcon} />
                <div>
                  <h5>Bảo hành chính hãng</h5>
                  <p>12 tháng bảo hành</p>
                </div>
              </div>
              <div className={styles.feature}>
                <FaUndoAlt className={styles.featureIcon} />
                <div>
                  <h5>Đổi trả dễ dàng</h5>
                  <p>30 ngày đổi trả</p>
                </div>
              </div>
              <div className={styles.feature}>
                <FaPhoneAlt className={styles.featureIcon} />
                <div>
                  <h5>Hỗ trợ 24/7</h5>
                  <p>Tư vấn mọi lúc</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.description}>
          <h3>Mô tả sản phẩm</h3>
          <div className={styles.descriptionContent}>
            {(product.description || 'Chưa có mô tả cho sản phẩm này.').split('\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </div>

        {/* Related Products */}
        <RelatedProducts currentId={product._id} category={product.category?._id} />
      </div>

      {/* Size Guide Modal */}
      <Modal
        isOpen={showSizeGuide}
        onClose={() => setShowSizeGuide(false)}
        title="Hướng dẫn chọn size"
      >
        <div className={styles.sizeGuideContent}>
          {/* Check product category to show appropriate size guide */}
          {product?.category?.name?.toLowerCase().includes('giày') || 
           product?.category?.name?.toLowerCase().includes('dép') || 
           product?.category?.name?.toLowerCase().includes('sandal') || 
           product?.category?.name?.toLowerCase().includes('boot') ? (
            // Footwear size guide
            <>
              <h4>Bảng size giày dép chuẩn</h4>
              <table className={styles.sizeTable}>
                <thead>
                  <tr>
                    <th>Size VN</th>
                    <th>Size US</th>
                    <th>Size EU</th>
                    <th>Chiều dài chân (cm)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>35</td><td>5</td><td>35</td><td>22.5</td></tr>
                  <tr><td>36</td><td>5.5</td><td>36</td><td>23.0</td></tr>
                  <tr><td>37</td><td>6</td><td>37</td><td>23.5</td></tr>
                  <tr><td>38</td><td>6.5</td><td>38</td><td>24.0</td></tr>
                  <tr><td>39</td><td>7</td><td>39</td><td>24.5</td></tr>
                  <tr><td>40</td><td>7.5</td><td>40</td><td>25.0</td></tr>
                  <tr><td>41</td><td>8</td><td>41</td><td>25.5</td></tr>
                  <tr><td>42</td><td>8.5</td><td>42</td><td>26.0</td></tr>
                  <tr><td>43</td><td>9</td><td>43</td><td>26.5</td></tr>
                  <tr><td>44</td><td>9.5</td><td>44</td><td>27.0</td></tr>
                  <tr><td>45</td><td>10</td><td>45</td><td>27.5</td></tr>
                </tbody>
              </table>
              <div className={styles.sizeGuideNotes}>
                <h5>💡 Cách đo chân chuẩn xác:</h5>
                <ul>
                  <li>Đo chân vào buổi tối khi chân to nhất</li>
                  <li>Đặt chân lên giấy, đánh dấu đầu ngón chân cái và gót chân</li>
                  <li>Đo khoảng cách giữa 2 điểm đánh dấu</li>
                  <li>Chọn size lớn hơn 0.5cm so với chiều dài chân</li>
                  <li>Nếu chân bè rộng, nên chọn size lớn hơn 1 size</li>
                </ul>
              </div>
            </>
          ) : (
            // Clothing size guide (original)
            <>
              <h4>Bảng size quần áo chuẩn</h4>
              <table className={styles.sizeTable}>
                <thead>
                  <tr>
                    <th>Size</th>
                    <th>Ngực (cm)</th>
                    <th>Eo (cm)</th>
                    <th>Mông (cm)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>S</td><td>84-88</td><td>64-68</td><td>88-92</td></tr>
                  <tr><td>M</td><td>88-92</td><td>68-72</td><td>92-96</td></tr>
                  <tr><td>L</td><td>92-96</td><td>72-76</td><td>96-100</td></tr>
                  <tr><td>XL</td><td>96-100</td><td>76-80</td><td>100-104</td></tr>
                  <tr><td>XXL</td><td>100-104</td><td>80-84</td><td>104-108</td></tr>
                </tbody>
              </table>
              <div className={styles.sizeGuideNotes}>
                <h5>💡 Cách đo cơ thể chuẩn xác:</h5>
                <ul>
                  <li><strong>Ngực:</strong> Đo vòng quanh phần rộng nhất của ngực</li>
                  <li><strong>Eo:</strong> Đo vòng quanh phần nhỏ nhất của eo</li>
                  <li><strong>Mông:</strong> Đo vòng quanh phần rộng nhất của mông</li>
                  <li>Đo khi mặc nội y mỏng, giữ thước đo ngang và vừa khít</li>
                  <li>Nếu số đo nằm giữa 2 size, chọn size lớn hơn</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Share Modal */}
      <Modal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="Chia sẻ sản phẩm"
      >
        <div className={styles.shareContent}>
          <Button onClick={shareToFacebook} className={styles.shareBtn}>
            📘 Chia sẻ lên Facebook
          </Button>
          <Button onClick={shareToTwitter} className={styles.shareBtn}>
            🐦 Chia sẻ lên Twitter
          </Button>
          <Button onClick={copyToClipboard} className={styles.shareBtn}>
            📋 Copy link
          </Button>
        </div>
      </Modal>

      {/* Review Section */}
      <ReviewSection productId={productId} />


    </div>
  );
}
