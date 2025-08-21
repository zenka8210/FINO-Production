'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { FaCheck, FaTimes, FaSpinner } from 'react-icons/fa';
import { ProductVariantWithRefs } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { getCurrentPrice, isOnSale } from '@/utils/product';
import { productService } from '@/services';
import Modal from './ui/Modal';
import Button from './ui/Button';
import styles from './VariantSelectionModal.module.css';

interface VariantSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string; // Changed to productId instead of full product
  currentVariant: ProductVariantWithRefs;
  onVariantChange: (newVariantId: string) => void;
}

export default function VariantSelectionModal({
  isOpen,
  onClose,
  productId,
  currentVariant,
  onVariantChange
}: VariantSelectionModalProps) {
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedVariant, setSelectedVariant] = useState<ProductVariantWithRefs | null>(null);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to get correct price for variant (matches backend logic)
  const getVariantPrice = (variant: ProductVariantWithRefs | null, productData: any): number => {
    if (!productData) {
      return 0;
    }

    console.log('🔍 Modal price calculation:', {
      productName: productData.name,
      isOnSale: productData.isOnSale,
      salePrice: productData.salePrice,
      productPrice: productData.price,
      currentPrice: productData.currentPrice,
      variantId: variant?._id,
      variantPrice: variant?.price
    });

    // Priority 1: Use currentPrice from backend if available (it handles sale date logic)
    if (productData.currentPrice) {
      console.log('💰 Using backend currentPrice:', productData.currentPrice);
      return productData.currentPrice;
    }

    // Priority 2: If product is actively on sale, use product sale price for ALL variants
    if (productData.isOnSale && productData.salePrice) {
      console.log('💰 Using sale price:', productData.salePrice);
      return productData.salePrice;
    }

    // Priority 3: Use variant price if available and greater than 0
    if (variant?.price && variant.price > 0) {
      console.log('💰 Using variant price:', variant.price);
      return variant.price;
    }

    // Priority 4: Fallback to product regular price
    console.log('💰 Using product price:', productData.price);
    return productData.price || 0;
  };

  // Fetch product with variants when modal opens
  useEffect(() => {
    if (isOpen && productId) {
      const fetchProduct = async () => {
        setLoading(true);
        setError(null);
        try {
          console.log('🔍 Fetching product details for modal:', productId);
          const productData = await productService.getPublicProductById(productId);
          console.log('✅ Product data fetched:', productData);
          console.log('🎨 Available variants:', productData.variants);
          setProduct(productData);
        } catch (error: any) {
          console.error('❌ Failed to fetch product for modal:', error);
          setError('Không thể tải thông tin sản phẩm');
        } finally {
          setLoading(false);
        }
      };
      
      fetchProduct();
    }
  }, [isOpen, productId]);

  // Initialize selected values from current variant
  useEffect(() => {
    if (currentVariant) {
      setSelectedColor(currentVariant.color?._id || '');
      setSelectedSize(currentVariant.size?._id || '');
      setSelectedVariant(currentVariant);
    }
  }, [currentVariant]);

  // Get available colors and sizes
  const availableColors = useMemo(() => {
    if (!product?.variants) return [];
    return [...new Map(product.variants.map((v: any) => [v.color?._id, v.color])).values()].filter(Boolean);
  }, [product?.variants]);

  const availableSizes = useMemo(() => {
    if (!product?.variants) return [];
    return [...new Map(product.variants.map((v: any) => [v.size?._id, v.size])).values()].filter(Boolean);
  }, [product?.variants]);

  // Get sizes available for selected color
  const availableSizesForColor = useMemo(() => {
    if (!product?.variants || !selectedColor) return [];
    return product.variants
      .filter((v: any) => v.color?._id === selectedColor)
      .map((v: any) => v.size)
      .filter(Boolean);
  }, [product?.variants, selectedColor]);

  // Handle variant selection
  const handleVariantSelection = (colorId: string, sizeId: string) => {
    if (!product?.variants) return;
    
    const variant = product.variants.find((v: any) => 
      v.color?._id === colorId && v.size?._id === sizeId
    );
    
    if (variant) {
      setSelectedVariant(variant);
    }
  };

  // Handle color change
  const handleColorChange = (colorId: string) => {
    setSelectedColor(colorId);
    
    // Find a size that's available for this color
    const sizesForColor = product?.variants
      ?.filter((v: any) => v.color?._id === colorId)
      ?.map((v: any) => v.size?._id)
      ?.filter(Boolean) || [];
    
    // If current size is not available for new color, select first available size
    if (!sizesForColor.includes(selectedSize) && sizesForColor.length > 0) {
      setSelectedSize(sizesForColor[0]);
      handleVariantSelection(colorId, sizesForColor[0]);
    } else if (selectedSize) {
      handleVariantSelection(colorId, selectedSize);
    }
  };

  // Handle size change
  const handleSizeChange = (sizeId: string) => {
    setSelectedSize(sizeId);
    if (selectedColor) {
      handleVariantSelection(selectedColor, sizeId);
    }
  };

  // Handle confirm selection
  const handleConfirm = () => {
    if (selectedVariant && selectedVariant._id !== currentVariant._id) {
      onVariantChange(selectedVariant._id);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chọn phiên bản sản phẩm">
      <div className={styles.modalContent}>
        {loading ? (
          <div className={styles.loadingContainer}>
            <FaSpinner className={styles.spinner} />
            <p>Đang tải thông tin sản phẩm...</p>
          </div>
        ) : error ? (
          <div className={styles.errorContainer}>
            <p className={styles.errorMessage}>{error}</p>
            <Button variant="secondary" onClick={onClose}>
              Đóng
            </Button>
          </div>
        ) : product ? (
          <>
            {/* Product Overview */}
            <div className={styles.productOverview}>
              <div className={styles.productImage}>
                {product.images && product.images.length > 0 ? (
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    width={120}
                    height={120}
                    className={styles.image}
                  />
                ) : (
                  <div className={styles.noImage}>
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21,15 16,10 5,21"/>
                    </svg>
                  </div>
                )}
              </div>
              
              <div className={styles.productInfo}>
                <h3 className={styles.productName}>{product.name}</h3>
                <div className={styles.priceInfo}>
                  <span className={styles.currentPrice}>
                    {formatCurrency(getVariantPrice(selectedVariant, product))}
                  </span>
                  {isOnSale(product) && (
                    <span className={styles.originalPrice}>{formatCurrency(product.price)}</span>
                  )}
                </div>
                {selectedVariant && (
                  <div className={styles.stockInfo}>
                    <span className={`${styles.stockStatus} ${selectedVariant.stock > 10 ? styles.inStock : selectedVariant.stock > 0 ? styles.lowStock : styles.outOfStock}`}>
                      {selectedVariant.stock > 0 ? (
                        selectedVariant.stock > 10 ? 'Còn hàng' : `Chỉ còn ${selectedVariant.stock} sản phẩm`
                      ) : 'Hết hàng'}
                    </span>
                  </div>
                )}
              </div>
            </div>

        {/* Color Selection */}
        {availableColors.length > 0 && (
          <div className={styles.variantSection}>
            <h4 className={styles.sectionTitle}>Màu sắc:</h4>
            <div className={styles.colorOptions}>
              {availableColors.map((color: any) => (
                <button
                  key={color._id}
                  className={`${styles.colorOption} ${selectedColor === color._id ? styles.selected : ''}`}
                  onClick={() => handleColorChange(color._id)}
                >
                  <span>{color.name}</span>
                  {selectedColor === color._id && <FaCheck className={styles.checkIcon} />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Size Selection */}
        {availableSizes.length > 0 && (
          <div className={styles.variantSection}>
            <h4 className={styles.sectionTitle}>Kích thước:</h4>
            <div className={styles.sizeOptions}>
              {availableSizes.map((size: any) => {
                const isAvailable = availableSizesForColor.some((s: any) => s._id === size._id);
                return (
                  <button
                    key={size._id}
                    className={`${styles.sizeOption} ${selectedSize === size._id ? styles.selected : ''} ${!isAvailable ? styles.disabled : ''}`}
                    onClick={() => isAvailable && handleSizeChange(size._id)}
                    disabled={!isAvailable}
                  >
                    {size.name}
                    {selectedSize === size._id && <FaCheck className={styles.checkIcon} />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className={styles.actionButtons}>
          <Button
            variant="secondary"
            size="md"
            onClick={onClose}
            className={styles.cancelButton}
          >
            Hủy
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleConfirm}
            disabled={!selectedVariant || selectedVariant.stock === 0}
            className={styles.confirmButton}
          >
            Xác nhận
            </Button>
          </div>
          </>
        ) : null}
      </div>
    </Modal>
  );
}