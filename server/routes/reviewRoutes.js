const express = require('express');
const router = express.Router();
const ReviewController = require('../controllers/reviewController');
const authenticateToken = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const validateObjectId = require('../middlewares/validateObjectId');

const reviewController = new ReviewController();

// Public routes
// GET /api/reviews/product/:productId - Get reviews for a product
router.get('/product/:productId', validateObjectId, reviewController.getProductReviews);

// User routes - require authentication
router.use(authenticateToken);

// GET /api/reviews - Get current user's reviews
router.get('/', reviewController.getAll);

// POST /api/reviews - Create new review
router.post('/', reviewController.createReview);

// PUT /api/reviews/:id - Update review
router.put('/:id', validateObjectId, reviewController.updateReview);

// DELETE /api/reviews/:id - Delete review
router.delete('/:id', validateObjectId, reviewController.deleteReview);

// Admin routes
router.use(adminMiddleware);

// GET /api/reviews/admin/all - Get all reviews (admin)
router.get('/admin/all', reviewController.getAll);

// DELETE /api/reviews/admin/:id - Delete any review (admin)
router.delete('/admin/:id', validateObjectId, reviewController.deleteById);

module.exports = router;
