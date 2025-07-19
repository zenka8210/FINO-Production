'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useReviews } from '@/hooks';
import { useNotification } from '@/contexts/NotificationContext';
import { FaStar, FaUser, FaThumbsUp, FaRegThumbsUp, FaQuoteLeft, FaStarHalfAlt, FaRegStar, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import styles from './ReviewSection.module.css';
import Button from './ui/Button';
import WriteReviewForm from './WriteReviewForm';
import { ReviewWithRefs, CanReviewResponse } from '@/types';

interface ReviewSectionProps {
  productId: string;
}

export default function ReviewSection({ productId }: ReviewSectionProps) {
  const { user } = useAuth();
  const { success, warning, error } = useNotification();
  const { 
    reviews, 
    loading, 
    error: reviewError, 
    loadProductReviews, 
    checkCanReview, 
    createReview 
  } = useReviews();
  
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('newest');
  const itemsPerPage = 5;

  // Load reviews when component mounts - available to all users
  useEffect(() => {
    const loadReviews = async () => {
      try {
        console.log('Loading reviews for product:', productId);
        await loadProductReviews(productId);
      } catch (err) {
        console.error('Failed to load reviews:', err);
      }
    };
    if (productId) {
      loadReviews();
    }
  }, [productId, loadProductReviews]);

  // Log when reviews state updates
  useEffect(() => {
    console.log('Reviews state updated:', {
      reviewsCount: reviews?.length || 0,
      loading,
      reviewError,
      reviews: reviews
    });
  }, [reviews, loading, reviewError]);

  // Get sorted and paginated reviews
  const getSortedReviews = () => {
    if (!reviews || !Array.isArray(reviews)) return [];
    
    let sortedReviews = [...reviews];
    switch (sortBy) {
      case 'newest':
        sortedReviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        sortedReviews.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'highest':
        sortedReviews.sort((a, b) => b.rating - a.rating);
        break;
      case 'lowest':
        sortedReviews.sort((a, b) => a.rating - b.rating);
        break;
    }
    return sortedReviews;
  };

  const sortedReviews = getSortedReviews();
  const totalPages = Math.ceil(sortedReviews.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedReviews = sortedReviews.slice(startIndex, startIndex + itemsPerPage);

  // Pagination handlers
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  // Handle submit review from WriteReviewForm
  const handleSubmitReview = async (reviewData: { rating: number; comment: string }) => {
    console.log('🔍 ReviewSection handleSubmitReview called!', { reviewData, user });
    
    if (!user) {
      console.log('❌ No user logged in, redirecting...');
      window.location.href = '/login';
      return;
    }

    if (!reviewData.comment.trim()) {
      console.log('❌ Empty comment validation');
      warning('Nội dung bị thiếu', 'Vui lòng nhập nội dung đánh giá!');
      return;
    }

    if (reviewData.comment.trim().length < 5) {
      console.log('❌ Comment too short validation');
      warning('Nội dung quá ngắn', 'Vui lòng nhập ít nhất 5 ký tự!');
      return;
    }

    console.log('✅ Validation passed, setting submitting to true');
    setSubmitting(true);
    try {
      console.log('🔍 Checking if user can review...');
      // Check if user can review first
      const reviewCheck: CanReviewResponse = await checkCanReview(productId);
      console.log('🔍 Can review check result:', reviewCheck);
      
      if (!reviewCheck.canReview) {
        // Show appropriate message based on the reason from backend
        if (reviewCheck.reason) {
          warning('Không thể đánh giá', reviewCheck.reason);
        } else {
          warning('Không thể đánh giá', 'Bạn chỉ có thể đánh giá sản phẩm đã mua!');
        }
        return;
      }

      // For successful canReview, we need to find the orderId
      let orderId;
      if (reviewCheck.order) {
        // Single order case
        orderId = reviewCheck.order._id;
      } else if (reviewCheck.availableOrders && reviewCheck.availableOrders.length > 0) {
        // Multiple available orders, use the first one
        orderId = reviewCheck.availableOrders[0]._id;
      } else {
        error('Lỗi đơn hàng', 'Không tìm thấy đơn hàng phù hợp để đánh giá!');
        return;
      }

      const reviewPayload = {
        product: productId,
        order: orderId,
        rating: reviewData.rating,
        comment: reviewData.comment.trim()
      };

      await createReview(reviewPayload);
      
      // Reload reviews
      await loadProductReviews(productId);
      
      success('Thành công', 'Đánh giá của bạn đã được gửi thành công!');
    } catch (error: any) {
      console.error('Error submitting review:', error);
      // Show user-friendly error message
      const errorMessage = error.message || 'Có lỗi xảy ra khi gửi đánh giá. Vui lòng thử lại!';
      error('Gửi đánh giá thất bại', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Render stars component
  const renderStars = (rating: number, interactive: boolean = false, onRatingChange?: (rating: number) => void) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(
          <FaStar
            key={i}
            className={`${styles.star} ${styles.filled} ${interactive ? styles.interactive : ''}`}
            onClick={interactive && onRatingChange ? () => onRatingChange(i) : undefined}
          />
        );
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <FaStarHalfAlt
            key={i}
            className={`${styles.star} ${styles.filled} ${interactive ? styles.interactive : ''}`}
            onClick={interactive && onRatingChange ? () => onRatingChange(i) : undefined}
          />
        );
      } else {
        stars.push(
          <FaRegStar
            key={i}
            className={`${styles.star} ${styles.empty} ${interactive ? styles.interactive : ''}`}
            onClick={interactive && onRatingChange ? () => onRatingChange(i) : undefined}
          />
        );
      }
    }
    
    return <div className={styles.stars}>{stars}</div>;
  };

  // Get average rating
  const getAverageRating = () => {
    if (!reviews || !Array.isArray(reviews) || reviews.length === 0) return 0;
    const total = reviews.reduce((sum: number, review: any) => sum + review.rating, 0);
    return total / reviews.length;
  };

  // Get rating distribution
  const getRatingDistribution = () => {
    if (!reviews || !Array.isArray(reviews)) return [0, 0, 0, 0, 0];
    const distribution = [0, 0, 0, 0, 0]; // Index 0-4 for 1-5 stars
    reviews.forEach((review: any) => {
      if (review.rating >= 1 && review.rating <= 5) {
        distribution[review.rating - 1]++;
      }
    });
    return distribution.reverse(); // Reverse to show 5 stars first
  };

  // Render pagination
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className={styles.paginationContainer}>
        <div className={styles.pagination}>
          <button
            className={`${styles.paginationButton} ${currentPage === 1 ? styles.disabled : ''}`}
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <FaChevronLeft />
          </button>
          
          {pageNumbers.map((page) => (
            <button
              key={page}
              className={`${styles.paginationButton} ${currentPage === page ? styles.active : ''}`}
              onClick={() => handlePageChange(page)}
            >
              {page}
            </button>
          ))}
          
          <button
            className={`${styles.paginationButton} ${currentPage === totalPages ? styles.disabled : ''}`}
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <FaChevronRight />
          </button>
        </div>
        
        <div className={styles.paginationInfo}>
          Trang {currentPage} / {totalPages} - Hiển thị {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sortedReviews.length)} trong {sortedReviews.length} đánh giá
        </div>
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className={styles.reviewSection}>
        <div className={styles.container}>
          <div className={styles.loadingState}>
            <div className={styles.loadingSpinner}></div>
            <p>Đang tải đánh giá...</p>
          </div>
        </div>
      </div>
    );
  }

  const averageRating = getAverageRating();
  const ratingDistribution = getRatingDistribution();
  const reviewCount = Array.isArray(reviews) ? reviews.length : 0;

  console.log('ReviewSection render - reviews:', reviews, 'count:', reviewCount, 'loading:', loading);

  return (
    <div className={styles.reviewSection}>
      <div className={styles.container}>
        {/* Header - Following Typography Rules */}
        <div className={styles.sectionHeader}>
          <h2 className={styles.title}>
            <FaQuoteLeft className={styles.titleIcon} />
            Đánh giá từ khách hàng
          </h2>
          <p className={styles.subtitle}>
            Chia sẻ trải nghiệm thực tế từ những người đã sử dụng sản phẩm
          </p>
        </div>

        {/* Review Summary - 12 Grid System */}
        <div className={styles.reviewSummary}>
          <div className={styles.summaryGrid}>
            {/* Overall Rating - 4 columns */}
            <div className={styles.overallRating}>
              <div className={styles.ratingDisplay}>
                <span className={styles.ratingNumber}>
                  {averageRating > 0 ? averageRating.toFixed(1) : '0.0'}
                </span>
                <div className={styles.ratingDetails}>
                  {renderStars(averageRating)}
                  <span className={styles.reviewCount}>
                    Dựa trên {reviewCount} đánh giá
                  </span>
                </div>
              </div>
            </div>

            {/* Rating Distribution - 8 columns */}
            <div className={styles.ratingDistribution}>
              {ratingDistribution.map((count, index) => {
                const starLevel = 5 - index;
                const percentage = reviewCount > 0 ? (count / reviewCount) * 100 : 0;
                
                return (
                  <div key={starLevel} className={styles.distributionRow}>
                    <span className={styles.starLabel}>{starLevel} sao</span>
                    <div className={styles.progressBar}>
                      <div 
                        className={styles.progressFill} 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className={styles.countLabel}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Write Review Form - Modern Separated Component */}
        <WriteReviewForm
          onSubmit={handleSubmitReview}
          isSubmitting={submitting}
          isLoggedIn={!!user}
          onLoginRedirect={() => window.location.href = '/login'}
        />

        {/* Reviews List - 12 Grid System */}
        <div className={styles.reviewsList}>
          <div className={styles.listHeader}>
            <h3>Tất cả đánh giá ({reviewCount})</h3>
            {reviewCount > 0 && (
              <div className={styles.sortOptions}>
                <select 
                  className={styles.sortSelect}
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                >
                  <option value="newest">Mới nhất</option>
                  <option value="oldest">Cũ nhất</option>
                  <option value="highest">Đánh giá cao nhất</option>
                  <option value="lowest">Đánh giá thấp nhất</option>
                </select>
              </div>
            )}
          </div>
          
          {reviewCount === 0 ? (
            <div className={styles.noReviews}>
              <div className={styles.noReviewsIcon}>⭐</div>
              <h4>Chưa có đánh giá nào</h4>
              <p>Hãy là người đầu tiên chia sẻ trải nghiệm về sản phẩm này!</p>
            </div>
          ) : (
            <>
              <div className={styles.reviewsGrid}>
                {paginatedReviews.map((review: ReviewWithRefs) => (
                  <div key={review._id} className={styles.reviewCard}>
                    <div className={styles.reviewHeader}>
                      <div className={styles.reviewUser}>
                        <div className={styles.userAvatar}>
                          <FaUser className={styles.userIcon} />
                        </div>
                        <div className={styles.userInfo}>
                          <span className={styles.username}>
                            {review.user?.name || 'Khách hàng'}
                          </span>
                          <span className={styles.reviewDate}>
                            {new Date(review.createdAt).toLocaleDateString('vi-VN', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                      <div className={styles.reviewRating}>
                        {renderStars(review.rating)}
                      </div>
                    </div>
                    
                    <div className={styles.reviewContent}>
                      <p className={styles.reviewComment}>{review.comment}</p>
                    </div>
                    
                    <div className={styles.reviewActions}>
                      <button className={styles.helpfulButton}>
                        <FaRegThumbsUp />
                        Hữu ích
                      </button>
                      <span className={styles.reviewId}>
                        #{review._id.slice(-6)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Pagination */}
              {renderPagination()}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
