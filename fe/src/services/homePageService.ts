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
      return response.data?.data || {} as HomePageData;
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
      return response.data || [];
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
      return response.data || [];
    } catch (error) {
      console.error('❌ HomePageService: Error fetching banners:', error);
      throw error;
    }
  }

  /**
   * Get featured products only - Based on business metrics:
   * 1. Top rated products (highest average rating)
   * 2. Most wishlisted products 
   * 3. Best selling products (completed orders)
   */
  async getFeaturedProducts(limit: number = 6, filterType: string = 'combined') {
    try {
      console.log(`⭐ HomePageService: Fetching featured products with filter ${filterType}, limit ${limit}...`);
      const response = await apiClient.get(`${this.baseUrl}/featured`, {
        params: { limit, filter: filterType }
      });
      console.log('🔍 Featured products response:', response);
      
      // FIXED: ApiClient.get() returns {success, data, message}
      if (response && response.success && response.data) {
        const products = response.data;
        if (Array.isArray(products)) {
          console.log(`✅ HomePageService: Found ${products.length} featured products (${filterType})`);
          return products;
        } else {
          console.warn('⚠️ HomePageService: Featured data is not an array:', typeof products);
          return [];
        }
      } else {
        console.warn('⚠️ HomePageService: Invalid featured products response structure');
        return [];
      }
    } catch (error) {
      console.error('❌ HomePageService: Error fetching featured products:', error);
      return []; // Return empty array instead of throwing
    }
  }

  /**
   * Get new products only
   */
  async getNewProducts(limit: number = 6) {
    try {
      console.log(`🆕 HomePageService: Fetching new products with limit ${limit}...`);
      const response = await apiClient.get(`${this.baseUrl}/new?limit=${limit}`);
      console.log('🔍 HomePageService response:', response);
      console.log('🔍 Response data structure:', typeof response, response);
      
      // FIXED: ApiClient.get() returns the full response {success, data, message}
      // NOT response.data.data, but response.data!
      if (response && response.success && response.data) {
        const products = response.data;
        if (Array.isArray(products)) {
          console.log('✅ HomePageService: Found new products:', products.length);
          return products;
        } else {
          console.warn('⚠️ HomePageService: Data is not an array:', typeof products);
          return [];
        }
      } else {
        console.warn('⚠️ HomePageService: Invalid response structure - Expected {success: true, data: [...]}');
        console.warn('🔍 Actual response:', {
          hasSuccess: !!response?.success,
          hasData: !!response?.data,
          successValue: response?.success,
          dataValue: response?.data
        });
        return [];
      }
    } catch (error) {
      console.error('❌ HomePageService: Error fetching new products:', error);
      return []; // Return empty array instead of throwing
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
      return response.data || [];
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
      return response.data || [];
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
      const url = cacheKey 
        ? `${this.baseUrl}/cache?cacheKey=${encodeURIComponent(cacheKey)}`
        : `${this.baseUrl}/cache`;
      await apiClient.delete(url);
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
