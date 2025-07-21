import { ProductVariant, ProductVariantWithRefs } from '@/types';

/**
 * Smart variant selection for e-commerce
 * When user adds to cart without selecting specific variant,
 * automatically choose the best variant using common e-commerce logic
 */

export interface VariantSelectionOptions {
  preferredColorOrder?: string[]; // Common colors like 'black', 'white', 'blue'
  preferredSizeOrder?: string[]; // Common sizes like 'M', 'L', 'XL'
  strategy?: 'first-available' | 'cheapest' | 'most-popular' | 'smart';
}

/**
 * Get the best variant for automatic add-to-cart
 * Following e-commerce best practices:
 * 1. First available variant with stock
 * 2. Prefer common colors (black, white, blue)
 * 3. Prefer common sizes (M, L)
 * 4. Fallback to cheapest variant
 */
export function selectBestVariant(
  variants: (ProductVariant | ProductVariantWithRefs)[],
  options: VariantSelectionOptions = {}
): (ProductVariant | ProductVariantWithRefs) | null {
  if (!variants || variants.length === 0) {
    return null;
  }

  // Filter available variants (stock > 0)
  const availableVariants = variants.filter(variant => 
    variant.stock && variant.stock > 0
  );

  if (availableVariants.length === 0) {
    return null;
  }

  const {
    preferredColorOrder = ['black', 'đen', 'white', 'trắng', 'blue', 'xanh', 'gray', 'xám'],
    preferredSizeOrder = ['M', 'L', 'XL', 'S', 'XXL'],
    strategy = 'smart'
  } = options;

  switch (strategy) {
    case 'first-available':
      return availableVariants[0];

    case 'cheapest':
      return availableVariants.reduce((cheapest, current) => 
        current.price < cheapest.price ? current : cheapest
      );

    case 'most-popular':
      // Sort by stock level (higher stock = more popular)
      return availableVariants.sort((a, b) => (b.stock || 0) - (a.stock || 0))[0];

    case 'smart':
    default:
      // Smart selection: prefer common colors and sizes
      const scoredVariants = availableVariants.map(variant => {
        let score = 0;

        // Color preference score
        if (variant.color && typeof variant.color === 'object' && 'name' in variant.color) {
          const colorName = variant.color.name.toLowerCase();
          const colorIndex = preferredColorOrder.findIndex(color => 
            colorName.includes(color.toLowerCase())
          );
          if (colorIndex !== -1) {
            score += (preferredColorOrder.length - colorIndex) * 10;
          }
        }

        // Size preference score
        if (variant.size && typeof variant.size === 'object' && 'name' in variant.size) {
          const sizeName = variant.size.name.toUpperCase();
          const sizeIndex = preferredSizeOrder.findIndex(size => 
            sizeName === size
          );
          if (sizeIndex !== -1) {
            score += (preferredSizeOrder.length - sizeIndex) * 5;
          }
        }

        // Stock availability score (more stock = better)
        score += Math.min(variant.stock || 0, 50); // Cap at 50 for scoring

        // Price score (cheaper = slightly better)
        const price = variant.price;
        score += Math.max(0, 100 - (price / 10000)); // Lower price = higher score

        return { variant, score };
      });

      // Sort by score descending and return the best
      scoredVariants.sort((a, b) => b.score - a.score);
      return scoredVariants[0]?.variant || availableVariants[0];
  }
}

/**
 * Get default variant for product display (price calculation, etc.)
 */
export function getDefaultVariant(variants: (ProductVariant | ProductVariantWithRefs)[]): (ProductVariant | ProductVariantWithRefs) | null {
  return selectBestVariant(variants, { strategy: 'smart' });
}

/**
 * Check if product has available variants for purchase
 */
export function hasAvailableVariants(variants: (ProductVariant | ProductVariantWithRefs)[]): boolean {
  return variants.some(variant => variant.stock && variant.stock > 0);
}

/**
 * Get variant by specific criteria
 */
export function findVariantByCriteria(
  variants: (ProductVariant | ProductVariantWithRefs)[],
  criteria: {
    colorId?: string;
    sizeId?: string;
    minStock?: number;
  }
): (ProductVariant | ProductVariantWithRefs) | null {
  return variants.find(variant => {
    if (criteria.colorId && variant.color !== criteria.colorId) {
      return false;
    }
    if (criteria.sizeId && variant.size !== criteria.sizeId) {
      return false;
    }
    if (criteria.minStock && (variant.stock || 0) < criteria.minStock) {
      return false;
    }
    return true;
  }) || null;
}

/**
 * Get available color options for variant selection
 */
export function getAvailableColors(variants: (ProductVariant | ProductVariantWithRefs)[]) {
  const availableVariants = variants.filter(v => v.stock && v.stock > 0);
  const colors = new Map();
  
  availableVariants.forEach(variant => {
    if (variant.color && typeof variant.color === 'object' && '_id' in variant.color) {
      colors.set(variant.color._id, variant.color);
    }
  });
  
  return Array.from(colors.values());
}

/**
 * Get available size options for a specific color
 */
export function getAvailableSizes(variants: (ProductVariant | ProductVariantWithRefs)[], colorId?: string) {
  let filteredVariants = variants.filter(v => v.stock && v.stock > 0);
  
  if (colorId) {
    filteredVariants = filteredVariants.filter(v => 
      v.color && (typeof v.color === 'string' ? v.color === colorId : '_id' in v.color && v.color._id === colorId)
    );
  }
  
  const sizes = new Map();
  filteredVariants.forEach(variant => {
    if (variant.size && typeof variant.size === 'object' && '_id' in variant.size) {
      sizes.set(variant.size._id, variant.size);
    }
  });
  
  return Array.from(sizes.values());
}
