const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const validateRequest = require('../middlewares/validateRequest');
const { reviewSchemas } = require('../middlewares/validationSchemas');
const authenticateToken = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

// Public routes - Các route công khai

// GET /api/reviews/product/:productId - Lấy đánh giá của sản phẩm
router.get('/product/:productId', reviewController.getProductReviews);

// GET /api/reviews/product/:productId/stats - Lấy thống kê đánh giá sản phẩm
router.get('/product/:productId/stats', reviewController.getProductReviewStats);

// GET /api/reviews/:id - Lấy đánh giá theo ID
router.get('/:id', reviewController.getReviewById);

// Authenticated routes - Các route yêu cầu xác thực

// GET /api/reviews/user/my-reviews - Lấy đánh giá của người dùng hiện tại
router.get('/user/my-reviews', authenticateToken, reviewController.getUserReviews);

// POST /api/reviews - Tạo đánh giá mới
router.post('/', 
  authenticateToken, 
  validateRequest(reviewSchemas.create), 
  reviewController.createReview
);

// PUT /api/reviews/:id - Cập nhật đánh giá
router.put('/:id', 
  authenticateToken, 
  validateRequest(reviewSchemas.create), 
  reviewController.updateReview
);

// DELETE /api/reviews/:id - Xóa đánh giá
router.delete('/:id', authenticateToken, reviewController.deleteReview);

// Admin routes - Các route yêu cầu quyền admin

// GET /api/reviews/admin/all - Lấy tất cả đánh giá (Admin)
router.get('/admin/all', 
  authenticateToken, 
  adminMiddleware, 
  reviewController.getAllReviews
);

// GET /api/reviews/admin/pending - Lấy đánh giá chờ duyệt (Admin)
router.get('/admin/pending', 
  authenticateToken, 
  adminMiddleware, 
  reviewController.getPendingReviews
);

// PUT /api/reviews/admin/:id/approve - Duyệt đánh giá (Admin)
router.put('/admin/:id/approve', 
  authenticateToken, 
  adminMiddleware, 
  reviewController.approveReview
);

// DELETE /api/reviews/admin/:id - Xóa đánh giá (Admin)
router.delete('/admin/:id', 
  authenticateToken, 
  adminMiddleware, 
  reviewController.adminDeleteReview
);

module.exports = router;