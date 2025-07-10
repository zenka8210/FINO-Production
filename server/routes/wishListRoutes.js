const express = require('express');
const router = express.Router();
const WishListController = require('../controllers/wishListController');
const authenticateToken = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const validateObjectId = require('../middlewares/validateObjectId');

const wishListController = new WishListController();

// User routes - require authentication
router.use(authenticateToken);

// GET /api/wishlist - Get current user's wishlist
router.get('/', wishListController.getUserWishList);

// GET /api/wishlist/count - Get wishlist count
router.get('/count', wishListController.getWishListCount);

// POST /api/wishlist - Add product to wishlist
router.post('/', wishListController.addToWishList);

// POST /api/wishlist/multiple - Add multiple products to wishlist
router.post('/multiple', wishListController.addMultipleToWishList);

// POST /api/wishlist/toggle - Toggle product in wishlist
router.post('/toggle', wishListController.toggleWishList);

// DELETE /api/wishlist/:id - Remove item from wishlist
router.delete('/:id', validateObjectId('id'), wishListController.removeFromWishList);

// DELETE /api/wishlist/clear - Clear user's wishlist
router.delete('/clear', wishListController.clearWishList);

// GET /api/wishlist/check/:productId - Check if product is in wishlist
router.get('/check/:productId', validateObjectId('productId'), wishListController.checkInWishList);

// Admin routes
router.use(adminMiddleware);

// GET /api/wishlist/admin/stats - Get wishlist statistics (admin)
router.get('/admin/stats', wishListController.getWishListStats);

// GET /api/wishlist/admin/all - Get all wishlist items (admin)
router.get('/admin/all', wishListController.getAllWishLists);

module.exports = router;
