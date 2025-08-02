import { apiClient } from '@/lib/api';

interface HomePageData {
  categories: any[];
  banners: any[];
  featuredProducts: any[];
  newProducts: any[];
  saleProducts: any[];
  posts: any[];
  lastUpdated: string;
}

class HomePageService {
  private readonly baseUrl = '/api/home';

  /**
   * Get complete home page data (SSR optimized)
   */
  async getHomePageData(): Promise<HomePageData> {
    try {
      console.log('🏠 HomePageService: Fetching complete home data...');
      const response = await apiClient.get<{
        success: boolean;
        data: HomePageData;
        message: string;
      }>(this.baseUrl);
      
      console.log('✅ HomePageService: Home data fetched successfully');
      return response.data.data;
    } catch (error) {
      console.error('❌ HomePageService: Error fetching home data:', error);
      throw error;
    }
  }

  /**
   * Get categories only
   */
  async getCategories() {
    try {
      const response = await apiClient.get(`${this.baseUrl}/categories`);
      return response.data.data;
    } catch (error) {
      console.error('❌ HomePageService: Error fetching categories:', error);
      throw error;
    }
  }

  /**
   * Get banners only
   */
  async getBanners() {
    try {
      const response = await apiClient.get(`${this.baseUrl}/banners`);
      return response.data.data;
    } catch (error) {
      console.error('❌ HomePageService: Error fetching banners:', error);
      throw error;
    }
  }

  /**
   * Get featured products only
   */
  async getFeaturedProducts(limit: number = 6) {
    try {
      const response = await apiClient.get(`${this.baseUrl}/featured`, {
        params: { limit }
      });
      return response.data.data;
    } catch (error) {
      console.error('❌ HomePageService: Error fetching featured products:', error);
      throw error;
    }
  }

  /**
   * Get new products only
   */
  async getNewProducts(limit: number = 6) {
    try {
      const response = await apiClient.get(`${this.baseUrl}/new`, {
        params: { limit }
      });
      return response.data.data;
    } catch (error) {
      console.error('❌ HomePageService: Error fetching new products:', error);
      throw error;
    }
  }

  /**
   * Get sale products only
   */
  async getSaleProducts(limit: number = 20) {
    try {
      const response = await apiClient.get(`${this.baseUrl}/sale`, {
        params: { limit }
      });
      return response.data.data;
    } catch (error) {
      console.error('❌ HomePageService: Error fetching sale products:', error);
      throw error;
    }
  }

  /**
   * Get recent posts only
   */
  async getPosts(limit: number = 6) {
    try {
      const response = await apiClient.get(`${this.baseUrl}/posts`, {
        params: { limit }
      });
      return response.data.data;
    } catch (error) {
      console.error('❌ HomePageService: Error fetching posts:', error);
      throw error;
    }
  }

  /**
   * Clear cache (admin function)
   */
  async clearCache(cacheKey?: string) {
    try {
      await apiClient.delete(`${this.baseUrl}/cache`, {
        params: cacheKey ? { cacheKey } : undefined
      });
      console.log('🗑️ Cache cleared successfully');
    } catch (error) {
      console.error('❌ HomePageService: Error clearing cache:', error);
      throw error;
    }
  }

  /**
   * Preload cache (admin function)
   */
  async preloadCache() {
    try {
      await apiClient.post(`${this.baseUrl}/cache/preload`);
      console.log('🔥 Cache preloaded successfully');
    } catch (error) {
      console.error('❌ HomePageService: Error preloading cache:', error);
      throw error;
    }
  }
}

export const homePageService = new HomePageService();
