import { Category } from '@/types';
import { categoryService } from './categoryService';

/**
 * CategoryCacheService - Singleton để cache categories
 * Tránh việc fetch categories nhiều lần từ FilterSidebar
 */
class CategoryCacheService {
  private static instance: CategoryCacheService;
  private categories: Category[] | null = null;
  private isLoading = false;
  private fetchPromise: Promise<Category[]> | null = null;

  private constructor() {}

  static getInstance(): CategoryCacheService {
    if (!CategoryCacheService.instance) {
      CategoryCacheService.instance = new CategoryCacheService();
    }
    return CategoryCacheService.instance;
  }

  /**
   * Get cached categories or fetch if not available
   */
  async getCategories(): Promise<Category[]> {
    // Return cached if available
    if (this.categories) {
      return this.categories;
    }

    // Return existing promise if already fetching
    if (this.fetchPromise) {
      return this.fetchPromise;
    }

    // Start new fetch
    this.isLoading = true;
    this.fetchPromise = this.fetchCategories();
    
    try {
      const categories = await this.fetchPromise;
      this.categories = categories;
      return categories;
    } finally {
      this.isLoading = false;
      this.fetchPromise = null;
    }
  }

  /**
   * Force refresh categories cache
   */
  async refreshCategories(): Promise<Category[]> {
    this.categories = null;
    this.fetchPromise = null;
    return this.getCategories();
  }

  /**
   * Get cached categories synchronously (returns null if not cached)
   */
  getCachedCategories(): Category[] | null {
    return this.categories;
  }

  /**
   * Check if currently loading
   */
  isLoadingCategories(): boolean {
    return this.isLoading;
  }

  /**
   * Private method to fetch categories from API
   */
  private async fetchCategories(): Promise<Category[]> {
    try {
      console.log('🗂️ CategoryCache: Fetching categories from API...');
      const result = await categoryService.getPublicCategories({ limit: 100 });
      const allCategories = result.data || [];
      
      // Filter only active categories
      const activeCategories = allCategories.filter((cat: Category) => cat.isActive);
      
      console.log(`✅ CategoryCache: Cached ${activeCategories.length} categories`);
      return activeCategories;
    } catch (error) {
      console.error('❌ CategoryCache: Failed to fetch categories:', error);
      throw error;
    }
  }

  /**
   * Clear cache (useful for testing or forced refresh)
   */
  clearCache(): void {
    this.categories = null;
    this.fetchPromise = null;
    this.isLoading = false;
  }
}

export default CategoryCacheService;
