import { useState, useCallback } from 'react';
import { reviewService } from '@/services/reviewService';
import { ReviewWithRefs, PaginatedResponse } from '@/types';

interface ReviewFilters {
  page?: number;
  limit?: number;
  search?: string;
  rating?: string;
  productId?: string;
  userId?: string;
  sortBy?: string;
  sortOrder?: string;
}

interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  pendingReviews: number;
  approvedReviews: number;
  ratingDistribution: { rating: number; count: number }[];
  topProducts: { productId: string; productName: string; averageRating: number; reviewCount: number }[];
}

export const useAdminReviews = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get all reviews with filters
  const getReviews = useCallback(async (filters: ReviewFilters = {}): Promise<PaginatedResponse<ReviewWithRefs>> => {
    setLoading(true);
    setError(null);
    try {
      const {
        page = 1,
        limit = 20,
        search,
        rating,
        productId,
        userId,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = filters;

      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      
      if (search) params.append('search', search);
      if (rating && rating !== 'all') params.append('rating', rating);
      if (productId) params.append('productId', productId);
      if (userId) params.append('userId', userId);
      if (sortBy) params.append('sortBy', sortBy);
      if (sortOrder) params.append('sortOrder', sortOrder);

      const response = await reviewService.getAllReviews(page, limit, {
        search,
        rating,
        productId,
        userId,
        sortBy,
        sortOrder
      });
      return response;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch reviews';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get review statistics
  const getReviewStatistics = useCallback(async (): Promise<ReviewStats> => {
    setLoading(true);
    setError(null);
    try {
      const stats = await reviewService.getReviewStats();
      return stats;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch review statistics';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete review (admin)
  const deleteReview = useCallback(async (reviewId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await reviewService.adminDeleteReview(reviewId);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete review';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Approve review (admin)
  const approveReview = useCallback(async (reviewId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await reviewService.approveReview(reviewId);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to approve review';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get pending reviews
  const getPendingReviews = useCallback(async (page: number = 1, limit: number = 20): Promise<PaginatedResponse<ReviewWithRefs>> => {
    setLoading(true);
    setError(null);
    try {
      const response = await reviewService.getPendingReviews(page, limit);
      return response;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch pending reviews';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    getReviews,
    getReviewStatistics,
    deleteReview,
    approveReview,
    getPendingReviews,
    clearError
  };
};
