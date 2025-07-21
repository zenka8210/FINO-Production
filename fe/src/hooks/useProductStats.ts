/**
 * Hook to get real product statistics from database
 * Includes actual review count, average rating, and other metrics
 */

import { useState, useEffect } from 'react';
import { ReviewService } from '@/services';

export interface ProductStats {
  reviewCount: number;
  averageRating: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  totalReviews: number;
}

export interface ProductStatsMap {
  [productId: string]: ProductStats;
}

export function useProductStats(productIds: string[]) {
  const [stats, setStats] = useState<ProductStatsMap>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productIds || productIds.length === 0) {
      setStats({});
      return;
    }

    const fetchProductStats = async () => {
      setLoading(true);
      setError(null);

      try {
        const statsMap: ProductStatsMap = {};
        const reviewService = ReviewService.getInstance();

        // Fetch stats for each product
        await Promise.all(
          productIds.map(async (productId) => {
            try {
              const response = await reviewService.getProductReviews(productId, 1, 100); // Get all reviews
              const reviews = response?.data || [];

              if (reviews.length === 0) {
                statsMap[productId] = {
                  reviewCount: 0,
                  averageRating: 0,
                  ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
                  totalReviews: 0
                };
                return;
              }

              // Calculate statistics
              const totalReviews = reviews.length;
              const ratings = reviews.map((review: any) => review.rating || 0);
              const averageRating = ratings.reduce((sum: number, rating: number) => sum + rating, 0) / totalReviews;

              // Calculate rating distribution
              const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
              ratings.forEach((rating: number) => {
                if (rating >= 1 && rating <= 5) {
                  ratingDistribution[rating as keyof typeof ratingDistribution]++;
                }
              });

              statsMap[productId] = {
                reviewCount: totalReviews,
                averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
                ratingDistribution,
                totalReviews
              };

            } catch (reviewError) {
              console.error(`Error fetching stats for product ${productId}:`, reviewError);
              // Set default stats for products with errors
              statsMap[productId] = {
                reviewCount: 0,
                averageRating: 0,
                ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
                totalReviews: 0
              };
            }
          })
        );

        setStats(statsMap);
      } catch (error) {
        console.error('Error fetching product stats:', error);
        setError('Không thể tải thống kê sản phẩm');
      } finally {
        setLoading(false);
      }
    };

    fetchProductStats();
  }, [productIds.join(',')]); // Re-run when product IDs change

  return { stats, loading, error };
}

export default useProductStats;
