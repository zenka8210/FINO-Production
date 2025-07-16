'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaStar, FaUser, FaThumbsUp, FaRegThumbsUp, FaQuoteLeft } from 'react-icons/fa';
import styles from './ReviewSection.module.css';

interface Review {
  id: string;
  productId: string;
  userId: string;
  username: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface ReviewSectionProps {
  productId: string;
}

export default function ReviewSection({ productId }: ReviewSectionProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReview, setNewReview] = useState({
    rating: 5,
    comment: ''
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Load reviews
  useEffect(() => {
    loadReviews();
  }, [productId]);

  const loadReviews = async () => {
    try {
      const response = await fetch(`/api/reviews?productId=${productId}`);
      const data = await response.json();
      if (data.success) {
        setReviews(data.reviews || []);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }

    if (!newReview.comment.trim()) {
      alert('Vui lòng nhập nội dung đánh giá!');
      return;
    }

    setSubmitting(true);
    try {
      const reviewPayload = {
        productId,
        userId: user.id || user.username, // Fallback to username if id is not available
        username: user.username,
        rating: newReview.rating,
        comment: newReview.comment.trim()
      };

      console.log('Sending review data:', reviewPayload); // Debug log

      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewPayload),
      });

      const data = await response.json();
      console.log('Response from API:', data); // Debug log
      
      if (data.success) {
        setNewReview({ rating: 5, comment: '' });
        loadReviews(); // Reload reviews
        alert('Đánh giá của bạn đã được gửi thành công!');
      } else {
        console.error('API Error:', data.error);
        alert(`Có lỗi xảy ra: ${data.error || 'Không thể gửi đánh giá'}`);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Có lỗi xảy ra khi gửi đánh giá!');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number, interactive: boolean = false, onRatingChange?: (rating: number) => void) => {
    return (
      <div className={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <FaStar
            key={star}
            className={`${styles.star} ${star <= rating ? styles.filled : styles.empty} ${interactive ? styles.interactive : ''}`}
            onClick={interactive && onRatingChange ? () => onRatingChange(star) : undefined}
          />
        ))}
      </div>
    );
  };

  const getAverageRating = () => {
    if (reviews.length === 0) return 0;
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return (total / reviews.length).toFixed(1);
  };

  const getRatingDistribution = () => {
    const distribution = [0, 0, 0, 0, 0]; // Index 0-4 for 1-5 stars
    reviews.forEach(review => {
      distribution[review.rating - 1]++;
    });
    return distribution.reverse(); // Reverse to show 5 stars first
  };

  if (!user && !loading) {
    return (
      <div className={styles.reviewSection}>
        <h3 className={styles.title}>Đánh giá sản phẩm</h3>
        <div className={styles.loginPrompt}>
          <p>Vui lòng đăng nhập để xem và viết đánh giá sản phẩm</p>
          <a href="/login" className="btn-brand">
            Đăng nhập ngay
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.reviewSection}>
        <h3 className={styles.title}>Đánh giá sản phẩm</h3>
        <div className={styles.loading}>Đang tải đánh giá...</div>
      </div>
    );
  }

  return (
    <div className={styles.reviewSection}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.title}>
          <FaQuoteLeft className={styles.titleIcon} />
          Đánh giá từ khách hàng
        </h3>
        <p className={styles.subtitle}>Chia sẻ trải nghiệm thực tế từ những người đã sử dụng sản phẩm</p>
      </div>
      
      {/* Enhanced Review Summary */}
      <div className={styles.reviewSummary}>
        <div className={styles.overallRating}>
          <div className={styles.ratingDisplay}>
            <span className={styles.ratingNumber}>{getAverageRating()}</span>
            <div className={styles.ratingDetails}>
              {renderStars(parseFloat(getAverageRating().toString()))}
              <span className={styles.reviewCount}>Dựa trên {reviews.length} đánh giá</span>
            </div>
          </div>
        </div>
        
        <div className={styles.ratingDistribution}>
          {getRatingDistribution().map((count, index) => {
            const starLevel = 5 - index;
            const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
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

      {/* Enhanced Write Review Form */}
      {user && (
        <div className={styles.writeReview}>
          <div className={styles.formHeader}>
            <h4>Chia sẻ đánh giá của bạn</h4>
            <p>Giúp khách hàng khác có thêm thông tin hữu ích về sản phẩm</p>
          </div>
          
          <form onSubmit={handleSubmitReview} className={styles.reviewForm}>
            <div className={styles.ratingSection}>
              <div className={styles.ratingInput}>
                <label>Đánh giá của bạn:</label>
                <div className={styles.starsContainer}>
                  {renderStars(newReview.rating, true, (rating) => 
                    setNewReview(prev => ({ ...prev, rating }))
                  )}
                  <span className={styles.ratingText}>
                    {newReview.rating === 5 && "Tuyệt vời"}
                    {newReview.rating === 4 && "Rất tốt"}
                    {newReview.rating === 3 && "Tốt"}
                    {newReview.rating === 2 && "Khá"}
                    {newReview.rating === 1 && "Cần cải thiện"}
                  </span>
                </div>
              </div>
            </div>
            
            <div className={styles.commentSection}>
              <div className={styles.commentInput}>
                <label htmlFor="comment">Chia sẻ trải nghiệm của bạn:</label>
                <textarea
                  id="comment"
                  value={newReview.comment}
                  onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                  placeholder="Hãy chia sẻ những điều bạn thích về sản phẩm này, chất lượng, thiết kế, hoặc bất kỳ góp ý nào khác..."
                  rows={5}
                  required
                  className={styles.commentTextarea}
                />
                <div className={styles.characterCount}>
                  {newReview.comment.length}/500 ký tự
                </div>
              </div>
            </div>
            
            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={submitting || newReview.comment.length < 10}
            >
              {submitting ? (
                <>
                  <span className={styles.loading}></span>
                  Đang gửi...
                </>
              ) : (
                'Gửi đánh giá'
              )}
            </button>
          </form>
        </div>
      )}

      {/* Enhanced Reviews List */}
      <div className={styles.reviewsList}>
        <div className={styles.listHeader}>
          <h4>Tất cả đánh giá ({reviews.length})</h4>
          {reviews.length > 0 && (
            <div className={styles.sortOptions}>
              <select className={styles.sortSelect}>
                <option value="newest">Mới nhất</option>
                <option value="oldest">Cũ nhất</option>
                <option value="highest">Đánh giá cao nhất</option>
                <option value="lowest">Đánh giá thấp nhất</option>
              </select>
            </div>
          )}
        </div>
        
        {reviews.length === 0 ? (
          <div className={styles.noReviews}>
            <div className={styles.noReviewsIcon}>⭐</div>
            <h5>Chưa có đánh giá nào</h5>
            <p>Hãy là người đầu tiên chia sẻ trải nghiệm về sản phẩm này!</p>
          </div>
        ) : (
          <div className={styles.reviewsGrid}>
            {reviews.map((review) => (
              <div key={review.id} className={styles.reviewCard}>
                <div className={styles.reviewHeader}>
                  <div className={styles.reviewUser}>
                    <div className={styles.userAvatar}>
                      <FaUser className={styles.userIcon} />
                    </div>
                    <div className={styles.userInfo}>
                      <span className={styles.username}>{review.username}</span>
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
                  <span className={styles.reviewId}>#{review.id.slice(-6)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
