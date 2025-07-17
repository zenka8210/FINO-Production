import { Product, ProductWithCategory } from '@/types';

/**
 * Calculate product's current price (considering sale)
 */
export function getCurrentPrice(product: Product | ProductWithCategory): number {
  if (product.salePrice && isOnSale(product)) {
    return product.salePrice;
  }
  return product.price;
}

/**
 * Check if product is currently on sale
 */
export function isOnSale(product: Product | ProductWithCategory): boolean {
  if (!product.salePrice || !product.saleStartDate || !product.saleEndDate) {
    return false;
  }
  
  const now = new Date();
  const startDate = new Date(product.saleStartDate);
  const endDate = new Date(product.saleEndDate);
  
  return now >= startDate && now <= endDate && product.salePrice < product.price;
}

/**
 * Calculate discount percentage
 */
export function getDiscountPercentage(product: Product | ProductWithCategory): number {
  if (!isOnSale(product) || !product.salePrice) {
    return 0;
  }
  
  return Math.round(((product.price - product.salePrice) / product.price) * 100);
}

/**
 * Get product image URL (first image or placeholder)
 */
export function getProductImageUrl(product: Product | ProductWithCategory, index: number = 0): string {
  if (product.images && product.images.length > index) {
    return product.images[index];
  }
  return '/images/placeholder-product.jpg'; // fallback image
}

/**
 * Get product gallery images
 */
export function getProductGallery(product: Product | ProductWithCategory): string[] {
  return product.images || [];
}

/**
 * Check if product has multiple images
 */
export function hasMultipleImages(product: Product | ProductWithCategory): boolean {
  return product.images && product.images.length > 1;
}

/**
 * Generate product URL slug
 */
export function getProductSlug(product: Product | ProductWithCategory): string {
  return product.name
    .toLowerCase()
    .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
    .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
    .replace(/[ìíịỉĩ]/g, 'i')
    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
    .replace(/[ùúụủũưừứựửữ]/g, 'u')
    .replace(/[ỳýỵỷỹ]/g, 'y')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Generate product URL
 */
export function getProductUrl(product: Product | ProductWithCategory): string {
  const slug = getProductSlug(product);
  return `/products/${product._id}/${slug}`;
}

/**
 * Check if product is new (created within last 7 days)
 */
export function isNewProduct(product: Product | ProductWithCategory): boolean {
  const createdDate = new Date(product.createdAt);
  const now = new Date();
  const daysDiff = (now.getTime() - createdDate.getTime()) / (1000 * 3600 * 24);
  return daysDiff <= 7;
}

/**
 * Get product status label
 */
export function getProductStatus(product: Product | ProductWithCategory): {
  label: string;
  className: string;
} {
  if (!product.isActive) {
    return { label: 'Ngừng bán', className: 'status-inactive' };
  }
  
  if (isOnSale(product)) {
    return { label: 'Đang giảm giá', className: 'status-sale' };
  }
  
  if (isNewProduct(product)) {
    return { label: 'Mới', className: 'status-new' };
  }
  
  return { label: 'Hoạt động', className: 'status-active' };
}

/**
 * Filter products by category
 */
export function filterProductsByCategory(
  products: ProductWithCategory[], 
  categoryId: string
): ProductWithCategory[] {
  return products.filter(product => {
    if (typeof product.category === 'string') {
      return product.category === categoryId;
    }
    return product.category._id === categoryId;
  });
}

/**
 * Search products by name or description
 */
export function searchProducts(
  products: ProductWithCategory[], 
  query: string
): ProductWithCategory[] {
  const searchTerm = query.toLowerCase().trim();
  
  if (!searchTerm) return products;
  
  return products.filter(product => 
    product.name.toLowerCase().includes(searchTerm) ||
    (product.description && product.description.toLowerCase().includes(searchTerm))
  );
}

/**
 * Sort products by various criteria
 */
export function sortProducts(
  products: ProductWithCategory[],
  sortBy: 'name' | 'price' | 'createdAt' | 'popularity',
  order: 'asc' | 'desc' = 'asc'
): ProductWithCategory[] {
  const sorted = [...products].sort((a, b) => {
    let aValue: any;
    let bValue: any;
    
    switch (sortBy) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'price':
        aValue = getCurrentPrice(a);
        bValue = getCurrentPrice(b);
        break;
      case 'createdAt':
        aValue = new Date(a.createdAt);
        bValue = new Date(b.createdAt);
        break;
      default:
        return 0;
    }
    
    if (aValue < bValue) return order === 'asc' ? -1 : 1;
    if (aValue > bValue) return order === 'asc' ? 1 : -1;
    return 0;
  });
  
  return sorted;
}

/**
 * Get price range for a list of products
 */
export function getPriceRange(products: ProductWithCategory[]): {
  min: number;
  max: number;
} {
  if (products.length === 0) {
    return { min: 0, max: 0 };
  }
  
  const prices = products.map(product => getCurrentPrice(product));
  return {
    min: Math.min(...prices),
    max: Math.max(...prices)
  };
}
