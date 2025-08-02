'use client';

import React, { memo, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaTrash, FaPlus, FaMinus } from 'react-icons/fa';
import { formatCurrency } from '@/lib/utils';
import { CartWithRefs } from '@/types';

// Extract cart item type from CartWithRefs
type CartItemWithRefs = CartWithRefs['items'][0];

interface LazyCartItemProps {
  item: CartItemWithRefs;
  onUpdateQuantity: (productVariantId: string, quantity: number) => Promise<void>;
  onRemoveItem: (productVariantId: string) => Promise<void>;
  isUpdating?: boolean;
}

const LazyCartItem = memo(function LazyCartItem({
  item,
  onUpdateQuantity,
  onRemoveItem,
  isUpdating = false
}: LazyCartItemProps) {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleIncrement = useCallback(async () => {
    if (isUpdating) return;
    await onUpdateQuantity(item.productVariant._id, item.quantity + 1);
  }, [item.productVariant._id, item.quantity, onUpdateQuantity, isUpdating]);

  const handleDecrement = useCallback(async () => {
    if (isUpdating || item.quantity <= 1) return;
    await onUpdateQuantity(item.productVariant._id, item.quantity - 1);
  }, [item.productVariant._id, item.quantity, onUpdateQuantity, isUpdating]);

  const handleRemove = useCallback(async () => {
    if (isUpdating) return;
    await onRemoveItem(item.productVariant._id);
  }, [item.productVariant._id, onRemoveItem, isUpdating]);

  const productName = item.productVariant.product?.name || 'Sản phẩm';
  const colorName = item.productVariant.color?.name || '';
  const sizeName = item.productVariant.size?.name || '';
  const productImage = item.productVariant.product?.images?.[0] || '/placeholder-image.jpg';
  const salePrice = item.productVariant.product?.salePrice;
  const regularPrice = item.price;
  const currentPrice = salePrice || regularPrice;
  const totalPrice = currentPrice * item.quantity;

  return (
    <div className={`cart-item-row ${isUpdating ? 'updating' : ''}`}>
      <div className="cart-item-info">
        <div className="product-image">
          {!isImageLoaded && !imageError && (
            <div className="image-placeholder">
              <div className="loading-skeleton"></div>
            </div>
          )}
          <Image
            src={productImage}
            alt={productName}
            width={80}
            height={80}
            className={`product-image ${isImageLoaded ? 'loaded' : 'loading'}`}
            onLoad={() => setIsImageLoaded(true)}
            onError={() => {
              setImageError(true);
              setIsImageLoaded(true);
            }}
            priority={false}
            loading="lazy"
          />
        </div>
        
        <div className="product-details">
          <Link 
            href={`/products/${item.productVariant._id}`}
            className="product-name"
          >
            {productName}
          </Link>
          
          {(colorName || sizeName) && (
            <div className="product-variant">
              {colorName && <span>Màu: {colorName}</span>}
              {colorName && sizeName && <span> • </span>}
              {sizeName && <span>Size: {sizeName}</span>}
            </div>
          )}
          
          <div className="price-info">
            {salePrice && salePrice < regularPrice ? (
              <>
                <span className="sale-price">{formatCurrency(salePrice)}</span>
                <span className="regular-price">{formatCurrency(regularPrice)}</span>
              </>
            ) : (
              <span className="current-price">{formatCurrency(currentPrice)}</span>
            )}
          </div>
        </div>
      </div>

      <div className="quantity-controls">
        <button
          onClick={handleDecrement}
          disabled={item.quantity <= 1 || isUpdating}
          className="quantity-btn minus"
          aria-label="Giảm số lượng"
        >
          <FaMinus />
        </button>
        
        <span className="quantity-display">{item.quantity}</span>
        
        <button
          onClick={handleIncrement}
          disabled={isUpdating}
          className="quantity-btn plus"
          aria-label="Tăng số lượng"
        >
          <FaPlus />
        </button>
      </div>

      <div className="total-price">
        {formatCurrency(totalPrice)}
      </div>

      <div className="actions">
        <button
          onClick={handleRemove}
          disabled={isUpdating}
          className="remove-btn"
          aria-label="Xóa sản phẩm"
        >
          <FaTrash />
        </button>
      </div>
    </div>
  );
});

export default LazyCartItem;
