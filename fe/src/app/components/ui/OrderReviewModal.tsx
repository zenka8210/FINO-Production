'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts';
import { useApiNotification } from '@/hooks';
import { reviewService } from '@/services/reviewService';
import { OrderWithRefs } from '@/types';
import { Button, Modal } from '@/app/components/ui';
import { FaStar, FaTimes } from 'react-icons/fa';
import styles from './OrderReviewModal.module.css';

interface OrderReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderWithRefs;
  onSuccess?: () => void;
}

interface ReviewForm {
  productId: string;
  productName: string;
  productImage: string;
  rating: number;
  comment: string;
}

export default function OrderReviewModal({ 
  isOpen, 
  onClose, 
  order, 
  onSuccess 
}: OrderReviewModalProps) {
  const { user } = useAuth();
  const { showSuccess, showError } = useApiNotification();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize review forms for each product in the order
  const [reviewForms, setReviewForms] = useState<ReviewForm[]>(() => {
    return order.items?.map((item: any) => ({
      productId: item.productVariant?.product?._id || '',
      productName: item.productVariant?.product?.name || 'Sản phẩm',
      productImage: item.productVariant?.product?.images?.[0] || '/images/placeholder.jpg',
      rating: 5,
      comment: ''
    })) || [];
  });

  const handleRatingChange = (productIndex: number, rating: number) => {
    setReviewForms(prev => prev.map((form, index) => 
      index === productIndex ? { ...form, rating } : form
    ));
  };

  const handleCommentChange = (productIndex: number, comment: string) => {
    setReviewForms(prev => prev.map((form, index) => 
      index === productIndex ? { ...form, comment } : form
    ));
  };

  const handleSubmitAllReviews = async () => {
    if (!user) {
      showError('Vui lòng đăng nhập để đánh giá');
      return;
    }

    // Validate all forms
    const invalidForms = reviewForms.filter(form => !form.comment.trim());
    if (invalidForms.length > 0) {
      showError('Vui lòng nhập nội dung đánh giá cho tất cả sản phẩm');
      return;
    }

    setIsSubmitting(true);
    try {
      let successCount = 0;
      let errorCount = 0;

      // Submit all reviews in parallel
      const reviewPromises = reviewForms.map(async (form) => {
        try {
          await reviewService.createReview({
            product: form.productId,
            order: order._id,
            rating: form.rating,
            comment: form.comment.trim()
          });
          successCount++;
        } catch (error) {
          errorCount++;
          console.error(`Failed to review ${form.productName}:`, error);
        }
      });

      await Promise.all(reviewPromises);

      if (successCount > 0) {
        showSuccess(`Đã đánh giá thành công ${successCount}/${reviewForms.length} sản phẩm`);
        onSuccess?.();
        onClose();
      } else {
        showError('Không thể đánh giá sản phẩm nào');
      }

    } catch (error) {
      showError('Có lỗi xảy ra khi đánh giá', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStarRating = (productIndex: number, currentRating: number) => {
    return (
      <div className={styles.starRating}>
        {[1, 2, 3, 4, 5].map((star) => (
          <FaStar
            key={star}
            className={`${styles.star} ${star <= currentRating ? styles.starActive : styles.starInactive}`}
            onClick={() => handleRatingChange(productIndex, star)}
          />
        ))}
        <span className={styles.ratingText}>({currentRating}/5)</span>
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            Đánh giá đơn hàng #{order.orderCode}
          </h2>
          <button 
            className={styles.closeButton}
            onClick={onClose}
            type="button"
          >
            <FaTimes />
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.reviewForms}>
            {reviewForms.map((form, index) => (
              <div key={form.productId} className={styles.productReviewForm}>
                <div className={styles.productInfo}>
                  <img 
                    src={form.productImage} 
                    alt={form.productName}
                    className={styles.productImage}
                  />
                  <div className={styles.productDetails}>
                    <h4 className={styles.productName}>{form.productName}</h4>
                    <div className={styles.ratingSection}>
                      <label className={styles.ratingLabel}>Đánh giá của bạn:</label>
                      {renderStarRating(index, form.rating)}
                    </div>
                  </div>
                </div>

                <div className={styles.commentSection}>
                  <label className={styles.commentLabel}>
                    Chia sẻ trải nghiệm của bạn:
                  </label>
                  <textarea
                    className={styles.commentTextarea}
                    placeholder="Hãy chia sẻ cảm nhận của bạn về sản phẩm này..."
                    value={form.comment}
                    onChange={(e) => handleCommentChange(index, e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.modalFooter}>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Hủy
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmitAllReviews}
            disabled={isSubmitting}
            isLoading={isSubmitting}
          >
            {isSubmitting ? 'Đang gửi...' : `Đánh giá ${reviewForms.length} sản phẩm`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
