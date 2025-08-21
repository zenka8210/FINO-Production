/**
 * Product utilities for consistent sale logic across components
 */

import { ProductWithCategory } from '@/types';

/**
 * Check if a product is currently on sale
 * Validates salePrice, price difference, and date range
 * CRITICAL: Trust backend's computed isOnSale field when available
 */
export function isProductOnSale(product: ProductWithCategory): boolean {
  // PRIORITY 1: Trust backend's computed isOnSale field if it exists
  if (typeof (product as any).isOnSale === 'boolean') {
    return (product as any).isOnSale;
  }
  
  // FALLBACK: Frontend validation for cases without backend computation
  // If product has explicit sale fields, use them
  if (product.salePrice && product.salePrice < product.price) {
    // If no date range specified, assume it's on sale
    if (!product.saleStartDate || !product.saleEndDate) {
      return true;
    }
    
    // Check if within date range
    const now = new Date();
    const saleStart = new Date(product.saleStartDate);
    const saleEnd = new Date(product.saleEndDate);
    
    return now >= saleStart && now <= saleEnd;
  }
  
  return false;
}

/**
 * Get the current effective price of a product
 * Returns sale price if on sale, regular price otherwise
 * Handles both database salePrice and dynamic sale prices
 * CRITICAL: Trust backend's computed currentPrice field when available
 */
export function getCurrentPrice(product: ProductWithCategory): number {
  // PRIORITY 1: Trust backend's computed currentPrice if available
  if (typeof (product as any).currentPrice === 'number') {
    return (product as any).currentPrice;
  }
  
  // FALLBACK: Frontend computation
  // Check for explicit sale price first
  if (product.salePrice && isProductOnSale(product)) {
    return product.salePrice;
  }
  
  // Check for dynamically added sale price
  if ((product as any).dynamicSalePrice && (product as any).isOnSale) {
    return (product as any).dynamicSalePrice;
  }
  
  return product.price;
}

/**
 * Calculate discount percentage for a product
 * Returns 0 if not on sale
 * Handles both database sales and dynamic sales
 * CRITICAL: Trust backend's computed discountPercent when available
 */
export function getDiscountPercent(product: ProductWithCategory): number {
  // PRIORITY 1: Trust backend's computed discountPercent if available
  if (typeof (product as any).discountPercent === 'number') {
    return (product as any).discountPercent;
  }
  
  // FALLBACK: Frontend computation
  if (!isProductOnSale(product)) {
    return 0;
  }
  
  // Calculate from price difference
  const currentPrice = getCurrentPrice(product);
  return Math.round((1 - currentPrice / product.price) * 100);
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
