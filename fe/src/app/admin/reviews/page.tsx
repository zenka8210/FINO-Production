"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import ActionButtons from "../../components/ActionButtons";
import styles from "./review-admin.module.css";

interface Review {
  id: string;
  productId: string;
  userId: string;
  username: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

interface Product {
  id: string;
  name: string;
}

export default function ReviewsAdminPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Form states for editing
  const [formRating, setFormRating] = useState(5);
  const [formComment, setFormComment] = useState("");

  useEffect(() => {
    if (user && user.role === "admin") {
      fetchReviews();
      fetchProducts();
    }
  }, [user]);

  const fetchReviews = async () => {
    try {
      const response = await fetch("/api/reviews?admin=true");
      const data = await response.json();
      if (data.success) {
        setReviews(data.reviews);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products");
      const data = await response.json();
      if (data.success) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product ? product.name : `Sản phẩm #${productId}`;
  };

  const handleEditReview = (review: Review) => {
    setEditingReview(review);
    setFormRating(review.rating);
    setFormComment(review.comment);
    setShowModal(true);
  };

  const handleSaveReview = async () => {
    if (!editingReview) return;

    try {
      const response = await fetch("/api/reviews", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingReview.id,
          rating: formRating,
          comment: formComment,
          userId: user?.id,
          isAdmin: true,
        }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchReviews();
        setShowModal(false);
        setEditingReview(null);
        alert("Cập nhật đánh giá thành công!");
      } else {
        alert(data.error || "Có lỗi xảy ra");
      }
    } catch (error) {
      console.error("Error updating review:", error);
      alert("Có lỗi xảy ra khi cập nhật đánh giá");
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa đánh giá này?")) return;

    try {
      const response = await fetch(`/api/reviews?id=${reviewId}&isAdmin=true`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (data.success) {
        await fetchReviews();
        alert("Xóa đánh giá thành công!");
      } else {
        alert(data.error || "Có lỗi xảy ra");
      }
    } catch (error) {
      console.error("Error deleting review:", error);
      alert("Có lỗi xảy ra khi xóa đánh giá");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN");
  };

  const renderStars = (rating: number) => {
    return "★".repeat(rating) + "☆".repeat(5 - rating);
  };

  // Filter reviews based on rating and search term
  const filteredReviews = reviews.filter(review => {
    const matchesRating = filterRating === null || review.rating === filterRating;
    const matchesSearch = searchTerm === "" || 
      review.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getProductName(review.productId).toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesRating && matchesSearch;
  });

  if (!user || user.role !== "admin") {
    return (
      <div className={styles.container}>
        <div className={styles.unauthorizedMessage}>
          Bạn không có quyền truy cập trang này.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingMessage}>Đang tải...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Quản lý đánh giá</h1>
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{reviews.length}</span>
            <span className={styles.statLabel}>Tổng đánh giá</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>
              {reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : "0"}
            </span>
            <span className={styles.statLabel}>Điểm trung bình</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label>Lọc theo điểm:</label>
          <select 
            value={filterRating || ""} 
            onChange={(e) => setFilterRating(e.target.value ? parseInt(e.target.value) : null)}
            className={styles.filterSelect}
          >
            <option value="">Tất cả</option>
            <option value="5">5 sao</option>
            <option value="4">4 sao</option>
            <option value="3">3 sao</option>
            <option value="2">2 sao</option>
            <option value="1">1 sao</option>
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label>Tìm kiếm:</label>
          <input
            type="text"
            placeholder="Tìm theo nội dung, tên người dùng, sản phẩm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      {/* Reviews List */}
      <div className={styles.reviewsList}>
        {filteredReviews.length === 0 ? (
          <div className={styles.emptyMessage}>
            {searchTerm || filterRating ? "Không tìm thấy đánh giá nào phù hợp." : "Chưa có đánh giá nào."}
          </div>
        ) : (
          filteredReviews.map((review) => (
            <div key={review.id} className={styles.reviewCard}>
              <div className={styles.reviewHeader}>
                <div className={styles.reviewInfo}>
                  <h3 className={styles.productName}>{getProductName(review.productId)}</h3>
                  <div className={styles.reviewMeta}>
                    <span className={styles.username}>@{review.username}</span>
                    <span className={styles.date}>{formatDate(review.createdAt)}</span>
                    <span className={styles.rating}>{renderStars(review.rating)}</span>
                  </div>
                </div>
                <ActionButtons 
                  customActions={[
                    {
                      label: "Chỉnh sửa",
                      action: () => handleEditReview(review),
                      type: "primary",
                      icon: "fas fa-edit"
                    },
                    {
                      label: "Xóa",
                      action: () => handleDeleteReview(review.id),
                      type: "danger",
                      icon: "fas fa-trash"
                    }
                  ]}
                />
              </div>
              <div className={styles.reviewContent}>
                <p>{review.comment}</p>
              </div>
              {review.updatedAt !== review.createdAt && (
                <div className={styles.updatedInfo}>
                  Cập nhật lần cuối: {formatDate(review.updatedAt)}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Edit Modal */}
      {showModal && editingReview && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Chỉnh sửa đánh giá</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingReview(null);
                }}
                className={styles.closeBtn}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>Sản phẩm:</label>
                <p className={styles.productInfo}>{getProductName(editingReview.productId)}</p>
              </div>
              <div className={styles.formGroup}>
                <label>Người đánh giá:</label>
                <p className={styles.userInfo}>@{editingReview.username}</p>
              </div>
              <div className={styles.formGroup}>
                <label>Điểm đánh giá:</label>
                <select
                  value={formRating}
                  onChange={(e) => setFormRating(parseInt(e.target.value))}
                  className={styles.formSelect}
                >
                  <option value={1}>1 sao</option>
                  <option value={2}>2 sao</option>
                  <option value={3}>3 sao</option>
                  <option value={4}>4 sao</option>
                  <option value={5}>5 sao</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Nội dung đánh giá:</label>
                <textarea
                  value={formComment}
                  onChange={(e) => setFormComment(e.target.value)}
                  rows={4}
                  className={styles.formTextarea}
                  placeholder="Nhập nội dung đánh giá..."
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingReview(null);
                }}
                className={`${styles.modalBtn} ${styles.cancelBtn}`}
              >
                Hủy
              </button>
              <button
                onClick={handleSaveReview}
                className={`${styles.modalBtn} ${styles.saveBtn}`}
                disabled={!formComment.trim()}
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
