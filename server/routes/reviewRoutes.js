const express = require('express');
const router = express.Router();
const ReviewController = require('../controllers/reviewController');
const authenticateToken = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const validateObjectId = require('../middlewares/validateObjectId');

const reviewController = new ReviewController();

// Public routes
// GET /api/reviews/product/:productId - Get reviews for a product
router.get('/product/:productId', validateObjectId('productId'), reviewController.getProductReviews);

// GET /api/reviews/product/:productId/stats - Get product rating statistics
router.get('/product/:productId/stats', validateObjectId('productId'), reviewController.getProductReviewStats);

// User routes - require authentication
router.use(authenticateToken);

// GET /api/reviews - Get current user's reviews
router.get('/', reviewController.getUserReviews);

// GET /api/reviews/can-review/:productId - Check if user can review a product
router.get('/can-review/:productId', validateObjectId('productId'), reviewController.canReviewProduct);

// POST /api/reviews - Create new review
router.post('/', reviewController.createReview);

// PUT /api/reviews/:id - Update review (with 48h limit)
router.put('/:id', validateObjectId('id'), reviewController.updateReview);

// DELETE /api/reviews/:id - Delete review (with 48h limit)
router.delete('/:id', validateObjectId('id'), reviewController.deleteReview);

// Admin routes
router.use(adminMiddleware);

// GET /api/reviews/admin/all - Get all reviews (admin)
router.get('/admin/all', reviewController.getAllReviews);

// GET /api/reviews/admin/stats - Get review statistics (admin)
router.get('/admin/stats', reviewController.getReviewStats);

// GET /api/reviews/admin/pending - Get pending reviews (admin)
router.get('/admin/pending', reviewController.getPendingReviews);

// PUT /api/reviews/admin/:id/approve - Approve review (admin)
router.put('/admin/:id/approve', validateObjectId('id'), reviewController.approveReview);

// DELETE /api/reviews/admin/:id - Delete any review (admin)
router.delete('/admin/:id', validateObjectId('id'), reviewController.adminDeleteReview);

module.exports = router;
