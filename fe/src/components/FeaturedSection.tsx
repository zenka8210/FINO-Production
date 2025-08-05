"use client";
import { useState, useEffect } from 'react';
import styles from './FeaturedSection.module.css';

interface Product {
  _id: string;
  name: string;
  price: number;
  salePrice?: number;
  images: string[];
  category: {
    _id: string;
    name: string;
  };
  slug: string;
  rating?: number;
  reviewCount?: number;
  isFeatured?: boolean;
  isOnSale?: boolean;
}

interface FeaturedSectionProps {
  userId?: string;
  maxProducts?: number;
  showUserRecommendations?: boolean;
}

const FeaturedSection: React.FC<FeaturedSectionProps> = ({
  userId,
  maxProducts = 8,
  showUserRecommendations = true
}) => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [userRecommendations, setUserRecommendations] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'featured' | 'recommendations'>('featured');

  useEffect(() => {
    fetchFeaturedProducts();
    if (userId && showUserRecommendations) {
      fetchUserRecommendations();
    }
  }, [userId, maxProducts]);

  const fetchFeaturedProducts = async () => {
    setLoading(true);
    try {
      const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(
        `${BASE_URL}/api/products?featured=true&limit=${maxProducts}&sort=-createdAt`
      );
      const data = await response.json();
      
      if (data.success && data.data) {
        setFeaturedProducts(data.data);
      }
    } catch (error) {
      console.error('Error fetching featured products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRecommendations = async () => {
    if (!userId) return;
    
    try {
      const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(
        `${BASE_URL}/api/products/recommendations/${userId}?limit=${maxProducts}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      const data = await response.json();
      
      if (data.success && data.data) {
        setUserRecommendations(data.data);
      } else {
        // Fallback to popular products if no recommendations
        const popularResponse = await fetch(
          `${BASE_URL}/api/products?sort=-rating,-reviewCount&limit=${maxProducts}`
        );
        const popularData = await popularResponse.json();
        if (popularData.success && popularData.data) {
          setUserRecommendations(popularData.data);
        }
      }
    } catch (error) {
      console.error('Error fetching user recommendations:', error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const calculateDiscountPercent = (originalPrice: number, salePrice: number) => {
    return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
  };

  const handleProductClick = (product: Product) => {
    window.location.href = `/products/${product.slug}`;
  };

  const currentProducts = activeTab === 'featured' ? featuredProducts : userRecommendations;

  return (
    <div className={styles.featuredSection}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h2 className={styles.title}>
            ⭐ {activeTab === 'featured' ? 'Sản phẩm nổi bật' : 'Dành riêng cho bạn'}
          </h2>
          <p className={styles.subtitle}>
            {activeTab === 'featured' 
              ? 'Những sản phẩm được yêu thích nhất' 
              : 'Gợi ý sản phẩm phù hợp với sở thích của bạn'}
          </p>
        </div>

        {/* Tab Switcher */}
        {userId && showUserRecommendations && (
          <div className={styles.tabSwitcher}>
            <button
              onClick={() => setActiveTab('featured')}
              className={`${styles.tabButton} ${activeTab === 'featured' ? styles.active : ''}`}
            >
              ⭐ Nổi bật
            </button>
            <button
              onClick={() => setActiveTab('recommendations')}
              className={`${styles.tabButton} ${activeTab === 'recommendations' ? styles.active : ''}`}
            >
              💡 Cho bạn
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className={styles.content}>
        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <span>Đang tải sản phẩm...</span>
          </div>
        ) : currentProducts.length > 0 ? (
          <div className={styles.productGrid}>
            {currentProducts.map((product) => (
              <div
                key={product._id}
                className={styles.productCard}
                onClick={() => handleProductClick(product)}
              >
                {/* Product Badge */}
                {product.salePrice && (
                  <div className={styles.badge}>
                    -{calculateDiscountPercent(product.price, product.salePrice)}%
                  </div>
                )}
                
                {product.isFeatured && activeTab === 'featured' && (
                  <div className={`${styles.badge} ${styles.featuredBadge}`}>
                    ⭐ HOT
                  </div>
                )}

                {/* Product Image */}
                <div className={styles.imageContainer}>
                  <img
                    src={product.images[0] || '/images/placeholder.jpg'}
                    alt={product.name}
                    className={styles.productImage}
                    loading="lazy"
                  />
                  <div className={styles.imageOverlay}>
                    <button className={styles.quickViewButton}>
                      👁️ Xem nhanh
                    </button>
                  </div>
                </div>

                {/* Product Info */}
                <div className={styles.productInfo}>
                  <div className={styles.category}>
                    📁 {product.category.name}
                  </div>
                  
                  <h3 className={styles.productName}>{product.name}</h3>

                  {/* Rating */}
                  {product.rating && (
                    <div className={styles.rating}>
                      <div className={styles.stars}>
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className={`${styles.star} ${i < Math.floor(product.rating!) ? styles.filled : ''}`}
                          >
                            ⭐
                          </span>
                        ))}
                      </div>
                      <span className={styles.reviewCount}>
                        ({product.reviewCount || 0})
                      </span>
                    </div>
                  )}

                  {/* Price */}
                  <div className={styles.priceContainer}>
                    {product.salePrice ? (
                      <>
                        <span className={styles.salePrice}>
                          {formatPrice(product.salePrice)}
                        </span>
                        <span className={styles.originalPrice}>
                          {formatPrice(product.price)}
                        </span>
                      </>
                    ) : (
                      <span className={styles.price}>
                        {formatPrice(product.price)}
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className={styles.actions}>
                    <button 
                      className={styles.addToCartButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        // Add to cart logic
                        console.log('Add to cart:', product._id);
                      }}
                    >
                      🛒 Thêm vào giỏ
                    </button>
                    <button 
                      className={styles.wishlistButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        // Add to wishlist logic
                        console.log('Add to wishlist:', product._id);
                      }}
                      title="Thêm vào yêu thích"
                    >
                      ❤️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              {activeTab === 'featured' ? '⭐' : '💡'}
            </div>
            <h3>
              {activeTab === 'featured' 
                ? 'Chưa có sản phẩm nổi bật' 
                : 'Chưa có gợi ý cho bạn'}
            </h3>
            <p>
              {activeTab === 'featured' 
                ? 'Các sản phẩm nổi bật sẽ hiển thị ở đây' 
                : 'Hãy mua sắm thêm để nhận được gợi ý cá nhân hóa'}
            </p>
          </div>
        )}
      </div>

      {/* View More Button */}
      {currentProducts.length >= maxProducts && (
        <div className={styles.footer}>
          <button 
            className={styles.viewMoreButton}
            onClick={() => {
              if (activeTab === 'featured') {
                window.location.href = '/products?featured=true';
              } else {
                window.location.href = '/products?recommendations=true';
              }
            }}
          >
            Xem thêm {activeTab === 'featured' ? 'sản phẩm nổi bật' : 'gợi ý'} →
          </button>
        </div>
      )}
    </div>
  );
};

export default FeaturedSection;
