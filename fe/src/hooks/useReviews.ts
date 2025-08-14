"use client";

import { useState, useCallback } from 'react';
import { Review, CreateReviewRequest, ReviewWithRefs } from '@/types';
import { reviewService } from '@/services';
import { useNotifications } from '@/hooks';

export const useReviews = () => {
  const [reviews, setReviews] = useState<ReviewWithRefs[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const { showSuccess, showError } = useNotifications();

  const loadProductReviews = useCallback(async (productId: string, page: number = 1, limit: number = 10) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 useReviews - Loading reviews for product:', productId);
      const response = await reviewService.getProductReviews(productId, page, limit);
      
      console.log('🔍 useReviews - Raw API response:', response);
      
      // Handle multiple possible response structures
      let reviewsData = [];
      let paginationData = { totalPages: 1 };
      
      if (response && response.data) {
        if (Array.isArray(response.data)) {
          // Direct array format
          reviewsData = response.data;
        } else if ((response.data as any).data && Array.isArray((response.data as any).data)) {
          // Nested format: response.data.data (array) and response.data.pagination
          reviewsData = (response.data as any).data;
          paginationData = (response.data as any).pagination || paginationData;
        } else if ((response.data as any).documents && Array.isArray((response.data as any).documents)) {
          // BaseService format: response.data.documents (array) and response.data.pagination  
          reviewsData = (response.data as any).documents;
          paginationData = (response.data as any).pagination || paginationData;
        }
      }
      
      // Validate and filter reviews with valid dates
      const validReviews = reviewsData.filter((review: any) => {
        const createdAt = new Date(review.createdAt);
        const now = new Date();
        
        // Check if date is valid and not in future
        const isValidDate = !isNaN(createdAt.getTime());
        const isNotFuture = createdAt <= now;
        
        if (!isValidDate) {
          console.warn('🚨 Invalid review date found:', review._id, review.createdAt);
          return false;
        }
        
        if (!isNotFuture) {
          console.warn('🚨 Future review date found:', review._id, review.createdAt);
        }
        
        return isValidDate; // Allow future dates for now, just log them
      });
      
      console.log(`🔍 useReviews - Filtered ${validReviews.length}/${reviewsData.length} valid reviews`);
      setReviews(validReviews);
      setTotalPages(paginationData.totalPages || 1);
      setCurrentPage(page);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể tải đánh giá';
      setError(errorMessage);
      setReviews([]);
      setTotalPages(1);
      // Don't show error toast for public reviews - might not be critical
      console.error('Error loading product reviews:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const checkCanReview = useCallback(async (productId: string) => {
    try {
      const response = await reviewService.canReviewProduct(productId);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể kiểm tra quyền đánh giá';
      showError('Lỗi', errorMessage);
      return { canReview: false };
    }
  }, [showError]);

  const createReview = useCallback(async (reviewData: CreateReviewRequest) => {
    try {
      setLoading(true);
      setError(null);
      const newReview = await reviewService.createReview(reviewData);
      
      showSuccess('Thành công', 'Đánh giá của bạn đã được gửi!');
      
      return newReview;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể gửi đánh giá';
      setError(errorMessage);
      showError('Lỗi', errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showSuccess, showError]);

  const updateReview = useCallback(async (reviewId: string, reviewData: Partial<CreateReviewRequest>) => {
    try {
      setLoading(true);
      setError(null);
      const updatedReview = await reviewService.updateReview(reviewId, reviewData);
      
      showSuccess('Thành công', 'Đánh giá đã được cập nhật!');
      return updatedReview;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể cập nhật đánh giá';
      setError(errorMessage);
      showError('Lỗi', errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showSuccess, showError]);

  const deleteReview = useCallback(async (reviewId: string) => {
    try {
      setLoading(true);
      setError(null);
      await reviewService.deleteReview(reviewId);
      
      // Remove review from current list
      setReviews(prev => prev.filter(review => review._id !== reviewId));
      showSuccess('Thành công', 'Đánh giá đã được xóa!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể xóa đánh giá';
      setError(errorMessage);
      showError('Lỗi', errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showSuccess, showError]);

  return {
    // Data
    reviews,
    loading,
    error,
    totalPages,
    currentPage,
    
    // Actions  
    loadProductReviews,
    checkCanReview,
    createReview,
    updateReview,
    deleteReview
  };
};
