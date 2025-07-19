/**
 * Product utilities for consistent sale logic across components
 */

import { ProductWithCategory } from '@/types';

/**
 * Check if a product is currently on sale
 * Validates salePrice, price difference, and date range
 */
export function isProductOnSale(product: ProductWithCategory): boolean {
  if (!product.salePrice || product.salePrice >= product.price) {
    return false;
  }
  
  if (!product.saleStartDate || !product.saleEndDate) {
    return false;
  }
  
  const now = new Date();
  const saleStart = new Date(product.saleStartDate);
  const saleEnd = new Date(product.saleEndDate);
  
  return now >= saleStart && now <= saleEnd;
}

/**
 * Get the current effective price of a product
 * Returns sale price if on sale, regular price otherwise
 */
export function getCurrentPrice(product: ProductWithCategory): number {
  return isProductOnSale(product) ? product.salePrice! : product.price;
}

/**
 * Calculate discount percentage for a product
 * Returns 0 if not on sale
 */
export function getDiscountPercent(product: ProductWithCategory): number {
  if (!isProductOnSale(product)) {
    return 0;
  }
  
  return Math.round((1 - product.salePrice! / product.price) * 100);
}

/**
 * Get price info object for a product
 * Includes current price, original price, discount info, and sale status
 */
export function getProductPriceInfo(product: ProductWithCategory) {
  const onSale = isProductOnSale(product);
  const currentPrice = getCurrentPrice(product);
  const discountPercent = getDiscountPercent(product);
  
  return {
    currentPrice,
    originalPrice: product.price,
    salePrice: onSale ? product.salePrice : null,
    isOnSale: onSale,
    discountPercent,
    hasValidSaleDates: !!(product.saleStartDate && product.saleEndDate),
    saleStartDate: product.saleStartDate,
    saleEndDate: product.saleEndDate
  };
}
