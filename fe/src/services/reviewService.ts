import { apiClient } from '@/lib/api';
import { 
  Review, 
  ReviewWithRefs, 
  CreateReviewRequest, 
  PaginatedResponse, 
  ApiResponse 
} from '@/types';

export class ReviewService {
  private static instance: ReviewService;

  private constructor() {}

  public static getInstance(): ReviewService {
    if (!ReviewService.instance) {
      ReviewService.instance = new ReviewService();
    }
    return ReviewService.instance;
  }

  /**
   * Get reviews for a product
   */
  async getProductReviews(productId: string, page: number = 1, limit: number = 10): Promise<PaginatedResponse<ReviewWithRefs>> {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const response = await apiClient.getPaginated<ReviewWithRefs>(`/api/reviews/product/${productId}`, params);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch product reviews');
    }
  }

  /**
   * Get user's reviews
   */
  async getUserReviews(page: number = 1, limit: number = 10): Promise<PaginatedResponse<ReviewWithRefs>> {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const response = await apiClient.getPaginated<ReviewWithRefs>('/api/reviews', params);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch user reviews');
    }
  }

  /**
   * Create a review
   */
  async createReview(reviewData: CreateReviewRequest): Promise<Review> {
    try {
      const response = await apiClient.post<Review>('/api/reviews', reviewData);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create review');
    }
  }

  /**
   * Update a review
   */
  async updateReview(reviewId: string, reviewData: Partial<CreateReviewRequest>): Promise<Review> {
    try {
      const response = await apiClient.put<Review>(`/api/reviews/${reviewId}`, reviewData);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update review');
    }
  }

  /**
   * Delete a review
   */
  async deleteReview(reviewId: string): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.delete(`/api/reviews/${reviewId}`);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete review');
    }
  }

  /**
   * Check if user can review a product
   */
  async canReviewProduct(productId: string): Promise<{ canReview: boolean; orderId?: string }> {
    try {
      const response = await apiClient.get(`/api/reviews/can-review/${productId}`);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to check review eligibility');
    }
  }

  /**
   * Get review statistics for a product
   */
  async getProductReviewStats(productId: string): Promise<{
    averageRating: number;
    totalReviews: number;
    ratingDistribution: Record<number, number>;
  }> {
    try {
      const response = await apiClient.get(`/api/reviews/product/${productId}/stats`);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch review statistics');
    }
  }

  // ========== ADMIN METHODS ==========

  /**
   * Get all reviews (Admin only)
   */
  async getAllReviews(page: number = 1, limit: number = 10): Promise<PaginatedResponse<ReviewWithRefs>> {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const response = await apiClient.getPaginated<ReviewWithRefs>('/api/reviews/admin/all', params);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch all reviews');
    }
  }

  /**
   * Get review statistics (Admin)
   * GET /api/reviews/admin/stats
   */
  async getReviewStats(): Promise<{
    totalReviews: number;
    averageRating: number;
    pendingReviews: number;
    approvedReviews: number;
    ratingDistribution: { rating: number; count: number }[];
    topProducts: { productId: string; productName: string; averageRating: number; reviewCount: number }[];
  }> {
    try {
      const response = await apiClient.get('/api/reviews/admin/stats');
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch review statistics');
    }
  }

  /**
   * Get pending reviews (Admin)
   * GET /api/reviews/admin/pending
   */
  async getPendingReviews(page: number = 1, limit: number = 10): Promise<PaginatedResponse<ReviewWithRefs>> {
    try {
      const response = await apiClient.getPaginated<ReviewWithRefs>('/api/reviews/admin/pending', { page, limit });
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch pending reviews');
    }
  }

  /**
   * Approve review (Admin)
   * PUT /api/reviews/admin/:id/approve
   */
  async approveReview(reviewId: string): Promise<Review> {
    try {
      const response = await apiClient.put<Review>(`/api/reviews/admin/${reviewId}/approve`);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to approve review');
    }
  }

  /**
   * Admin delete review (Admin)
   * DELETE /api/reviews/admin/:id
   */
  async adminDeleteReview(reviewId: string): Promise<ApiResponse<any>> {
    try {
      return await apiClient.delete(`/api/reviews/admin/${reviewId}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete review');
    }
  }

}

// Export singleton instance
export const reviewService = ReviewService.getInstance();
export default reviewService;
