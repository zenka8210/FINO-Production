import { ProductVariantWithRefs } from '@/types';
import { ProductService } from '@/services/productService';

/**
 * Cached variant fetching to avoid duplicate API calls
 * This improves performance when multiple ProductItem components need variants
 */
class VariantCacheService {
  private static instance: VariantCacheService;
  private cache = new Map<string, ProductVariantWithRefs[]>();
  private loadingPromises = new Map<string, Promise<ProductVariantWithRefs[]>>();
  private productService = ProductService.getInstance();

  private constructor() {}

  public static getInstance(): VariantCacheService {
    if (!VariantCacheService.instance) {
      VariantCacheService.instance = new VariantCacheService();
    }
    return VariantCacheService.instance;
  }

  /**
   * Get variants for a product with caching
   */
  async getProductVariants(productId: string): Promise<ProductVariantWithRefs[]> {
    // Check cache first
    if (this.cache.has(productId)) {
      return this.cache.get(productId)!;
    }

    // Check if already loading
    if (this.loadingPromises.has(productId)) {
      return await this.loadingPromises.get(productId)!;
    }

    // Start new request
    console.log(`🔍 Fetching variants for product ${productId}`);
    const promise = this.productService.getProductVariants(productId);
    this.loadingPromises.set(productId, promise);

    try {
      const variants = await promise;
      
      // Cache the result
      this.cache.set(productId, variants);
      
      return variants;
    } catch (error) {
      console.error(`❌ Failed to fetch variants for product ${productId}:`, error);
      throw error;
    } finally {
      // Clean up loading promise
      this.loadingPromises.delete(productId);
    }
  }

  /**
   * Preload variants for multiple products (optional optimization)
   */
  async preloadVariants(productIds: string[]): Promise<void> {
    const promises = productIds
      .filter(id => !this.cache.has(id) && !this.loadingPromises.has(id))
      .map(id => this.getProductVariants(id).catch(error => {
        console.warn(`Failed to preload variants for product ${id}:`, error);
        return [];
      }));

    if (promises.length > 0) {
      console.log(`🚀 Preloading variants for ${promises.length} products`);
      await Promise.all(promises);
    }
  }

  /**
   * Clear cache (useful for testing or memory management)
   */
  clearCache(): void {
    this.cache.clear();
    this.loadingPromises.clear();
    console.log('🗑️ Variant cache cleared');
  }

  /**
   * Get cache stats
   */
  getCacheStats() {
    return {
      cachedProducts: this.cache.size,
      loadingProducts: this.loadingPromises.size,
      totalVariants: Array.from(this.cache.values()).reduce((sum, variants) => sum + variants.length, 0)
    };
  }
}

export default VariantCacheService;
