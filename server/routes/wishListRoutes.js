const express = require('express');
const router = express.Router();
const WishListController = require('../controllers/wishListController');
const authenticateToken = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const validateObjectId = require('../middlewares/validateObjectId');
const { ROLES } = require('../config/constants');

const wishListController = new WishListController();

// Middleware to restrict admin CRUD operations on wishlist
const restrictAdminWishlistCRUD = (req, res, next) => {
  if (req.user && req.user.role === ROLES.ADMIN) {
    return res.status(403).json({
      success: false,
      message: 'Admin không được phép thực hiện thao tác thêm/sửa/xóa wishlist'
    });
  }
  next();
};

// All routes require authentication
router.use(authenticateToken);

// GET /api/wishlist - Get current user's wishlist
router.get('/', wishListController.getUserWishList);

// GET /api/wishlist/count - Get wishlist count
router.get('/count', wishListController.getWishListCount);

// GET /api/wishlist/check/:productId - Check if product is in wishlist
router.get('/check/:productId', validateObjectId('productId'), wishListController.checkInWishList);

// POST /api/wishlist - Add product to wishlist (restricted for admin)
router.post('/', restrictAdminWishlistCRUD, wishListController.addToWishList);

// POST /api/wishlist/multiple - Add multiple products to wishlist (restricted for admin)
router.post('/multiple', restrictAdminWishlistCRUD, wishListController.addMultipleToWishList);

// POST /api/wishlist/toggle - Toggle product in wishlist (restricted for admin)
router.post('/toggle', restrictAdminWishlistCRUD, wishListController.toggleWishList);

// DELETE /api/wishlist/clear - Clear user's wishlist (restricted for admin)
router.delete('/clear', restrictAdminWishlistCRUD, wishListController.clearWishList);

// DELETE /api/wishlist/:id - Remove item from wishlist (restricted for admin)
router.delete('/:id', restrictAdminWishlistCRUD, validateObjectId('id'), wishListController.removeFromWishList);

// Admin routes - read-only access
router.use(adminMiddleware);

// GET /api/wishlist/admin/stats - Get wishlist statistics (admin)
router.get('/admin/stats', wishListController.getWishListStats);

// GET /api/wishlist/admin/all - Get all wishlist items (admin)
router.get('/admin/all', wishListController.getAllWishLists);

module.exports = router;
