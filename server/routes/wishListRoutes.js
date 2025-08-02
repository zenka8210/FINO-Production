const express = require('express');
const router = express.Router();
const WishListController = require('../controllers/wishListController');
const authenticateToken = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const validateObjectId = require('../middlewares/validateObjectId');
const { queryParserMiddleware } = require('../middlewares/queryMiddleware');
const { ROLES } = require('../config/constants');

const wishListController = new WishListController();

// Optional authentication middleware (không throw error nếu không có token)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Không có token - cho phép tiếp tục với req.user = null
    req.user = null;
    return next();
  }

  // Có token - verify như bình thường
  try {
    authenticateToken(req, res, next);
  } catch (error) {
    // Nếu token không hợp lệ, vẫn cho phép tiếp tục với req.user = null
    req.user = null;
    next();
  }
};

// ============= PUBLIC ROUTES (with optional auth for session handling) =============

// GET /api/wishlist - Get user's wishlist (database) or session wishlist (guest)
router.get('/', optionalAuth, wishListController.getUserWishList);

// GET /api/wishlist/count - Get wishlist count
router.get('/count', optionalAuth, wishListController.getWishListCount);

// GET /api/wishlist/check/:productId - Check if product is in wishlist
router.get('/check/:productId', optionalAuth, validateObjectId('productId'), wishListController.checkInWishList);

// POST /api/wishlist - Add product to wishlist
router.post('/', optionalAuth, wishListController.addToWishList);

// POST /api/wishlist/toggle - Toggle product in wishlist  
router.post('/toggle', optionalAuth, wishListController.toggleWishList);

// DELETE /api/wishlist/clear - Clear wishlist
router.delete('/clear', optionalAuth, wishListController.clearWishList);

// DELETE /api/wishlist/:productId - Remove product from wishlist
router.delete('/:productId', optionalAuth, validateObjectId('productId'), wishListController.removeFromWishList);

// ============= AUTHENTICATED USER ROUTES =============

// POST /api/wishlist/sync - Sync session wishlist to database after login
router.post('/sync', authenticateToken, wishListController.syncWishListFromSession);

// POST /api/wishlist/multiple - Add multiple products to wishlist (authenticated only)
router.post('/multiple', authenticateToken, wishListController.addMultipleToWishList);

// ============= ADMIN ROUTES (read-only access) =============

// GET /api/wishlist/admin/stats - Get wishlist statistics with optional limit parameter (admin)
// Query params: ?limit=N (default: 10) for top N products
router.get('/admin/stats', authenticateToken, adminMiddleware, wishListController.getWishListStats);

// GET /api/wishlist/admin/all - Get all wishlist items (admin)
router.get('/admin/all', authenticateToken, adminMiddleware, queryParserMiddleware(), wishListController.getAllWishLists);

// GET /api/wishlist/admin/user/:userId - Get specific user's wishlist (admin)
router.get('/admin/user/:userId', authenticateToken, adminMiddleware, validateObjectId('userId'), wishListController.getUserWishListByAdmin);

module.exports = router;
