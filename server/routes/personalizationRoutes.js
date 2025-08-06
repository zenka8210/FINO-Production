const express = require('express');
const router = express.Router();
const PersonalizationController = require('../controllers/personalizationController');
const authMiddleware = require('../middlewares/authMiddleware');

const personalizationController = new PersonalizationController();

/**
 * Optional auth middleware - cho phép cả guest và authenticated users
 */
const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    // Không có token - guest user
    req.user = null;
    return next();
  }
  
  try {
    // Có token - thử verify
    authMiddleware(req, res, (error) => {
      if (error) {
        // Token không hợp lệ - vẫn cho guest access
        req.user = null;
      }
      next();
    });
  } catch (error) {
    // Lỗi khi verify token - vẫn cho guest access
    req.user = null;
    next();
  }
};

/**
 * @route GET /api/personalization/categories
 * @description Lấy danh mục được cá nhân hóa dựa trên hành vi user
 * @access Public (supports both guest and authenticated users)
 * @query {number} limit - Số lượng categories tối đa (default: 10)
 * @query {boolean} includeSubcategories - Có bao gồm subcategories không (default: true)
 */
router.get('/categories', optionalAuth, personalizationController.getPersonalizedCategories);

/**
 * @route GET /api/personalization/products
 * @description Lấy sản phẩm được cá nhân hóa dựa trên hành vi user
 * @access Public (supports both guest and authenticated users)
 * @query {number} limit - Số lượng sản phẩm tối đa (default: 12)
 * @query {string} excludeIds - Danh sách ID sản phẩm cần loại trừ (comma-separated)
 * @query {string} categoryFilters - Danh sách ID danh mục để lọc (comma-separated)
 */
router.get('/products', optionalAuth, personalizationController.getPersonalizedProducts);

/**
 * @route GET /api/personalization/user-behavior
 * @description Lấy thông tin phân tích hành vi user (dành cho debugging)
 * @access Private (authenticated users only)
 */
router.get('/user-behavior', authMiddleware, personalizationController.getUserBehaviorAnalysis);

module.exports = router;
