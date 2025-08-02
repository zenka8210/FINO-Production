import { apiClient } from '@/lib/api';
import { 
  PopulatedWishList, 
  PopulatedWishListItem, 
  ApiResponse,
  PaginatedResponse
} from '@/types';

interface WishListFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface WishListStatistics {
  totalWishListItems: number;
  totalUsers: number;
  topProducts: Array<{
    productId: string;
    productName: string;
    totalUsers: number;
  }>;
}

export class WishlistService {
  private static instance: WishlistService;

  private constructor() {}

  public static getInstance(): WishlistService {
    if (!WishlistService.instance) {
      WishlistService.instance = new WishlistService();
    }
    return WishlistService.instance;
  }

  // ========== PUBLIC/GUEST ROUTES ==========

  /**
   * Get user's wishlist (with optional auth for guest session support)
   */
  async getWishlist(): Promise<PopulatedWishList> {
    try {
      const response = await apiClient.get<PopulatedWishList>('/api/wishlist');
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch wishlist');
    }
  }

  /**
   * Get wishlist count
   */
  async getWishlistCount(): Promise<{ count: number }> {
    try {
      const response = await apiClient.get<{ count: number }>('/api/wishlist/count');
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get wishlist count');
    }
  }

  /**
   * Check if product is in wishlist
   */
  async checkInWishlist(productId: string): Promise<{ inWishlist: boolean }> {
    try {
      const response = await apiClient.get<{ inWishlist: boolean }>(`/api/wishlist/check/${productId}`);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to check wishlist status');
    }
  }

  /**
   * Add product to wishlist
   */
  async addToWishlist(productId: string): Promise<WishList> {
    try {
      const response = await apiClient.post<WishList>('/api/wishlist', { productId });
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to add item to wishlist');
    }
  }

  /**
   * Toggle product in wishlist
   */
  async toggleWishlist(productId: string): Promise<{ added: boolean; wishlist: WishList }> {
    try {
      const response = await apiClient.post<{ added: boolean; wishlist: WishList }>('/api/wishlist/toggle', { productId });
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to toggle wishlist item');
    }
  }

  /**
   * Remove product from wishlist
   */
  async removeFromWishlist(productId: string): Promise<WishList> {
    try {
      const response = await apiClient.delete<WishList>(`/api/wishlist/${productId}`);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to remove item from wishlist');
    }
  }

  /**
   * Clear wishlist
   */
  async clearWishlist(): Promise<ApiResponse<any>> {
    try {
      return await apiClient.delete('/api/wishlist/clear');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to clear wishlist');
    }
  }

  // ========== AUTHENTICATED USER ROUTES ==========

  /**
   * Sync session wishlist to database after login
   */
  async syncWishlistFromSession(sessionWishlist: string[]): Promise<WishList> {
    try {
      const response = await apiClient.post<WishList>('/api/wishlist/sync', { sessionWishlist });
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to sync wishlist from session');
    }
  }

  /**
   * Add multiple products to wishlist
   */
  async addMultipleToWishlist(productIds: string[]): Promise<WishList> {
    try {
      const response = await apiClient.post<WishList>('/api/wishlist/multiple', { productIds });
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to add multiple items to wishlist');
    }
  }

  // ========== ADMIN ROUTES ==========

  /**
   * Get wishlist statistics (Admin)
   */
  async getWishlistStats(limit?: number): Promise<WishListStatistics> {
    try {
      const params = limit ? { limit } : {};
      const response = await apiClient.get<WishListStatistics>('/api/wishlist/admin/stats', params);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch wishlist statistics');
    }
  }

  /**
   * Get all wishlists (Admin)
   */
  async getAllWishlists(filters?: WishListFilters): Promise<PaginatedResponse<WishList>> {
    try {
      const response = await apiClient.getPaginated<WishList>('/api/wishlist/admin/all', filters);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch all wishlists');
    }
  }

  /**
   * Get user's wishlist by admin
   */
  async getUserWishlistByAdmin(userId: string): Promise<WishList> {
    try {
      const response = await apiClient.get<WishList>(`/api/wishlist/admin/user/${userId}`);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch user wishlist');
    }
  }

  // ========== UTILITY METHODS ==========

  /**
   * Check if item is in wishlist (local utility)
   */
  isItemInWishlist(wishlist: WishList, productId: string): boolean {
    return wishlist.items.some(item => item.product === productId);
  }

  /**
   * Get wishlist items count (local utility)
   */
  getWishlistItemsCount(wishlist: WishList): number {
    return wishlist.items.length;
  }
}

// Export singleton instance
export const wishlistService = WishlistService.getInstance();
export default wishlistService;
