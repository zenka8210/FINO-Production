const express = require('express');
const router = express.Router();
const tagController = require('../controllers/tagController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const validateRequest = require('../middlewares/validateRequest');
const { tagSchemas } = require('../middlewares/validationSchemas');

// Routes công khai
/**
 * @route GET /api/tags
 * @desc Lấy tất cả tag với phân trang và tìm kiếm
 * @access Public
 */
router.get('/', tagController.getAllTags);

/**
 * @route GET /api/tags/search
 * @desc Tìm kiếm tag
 * @access Public
 */
router.get('/search', tagController.searchTags);

/**
 * @route GET /api/tags/popular
 * @desc Lấy tag phổ biến
 * @access Public
 */
router.get('/popular', tagController.getPopularTags);

/**
 * @route GET /api/tags/name/:name
 * @desc Lấy tag theo tên
 * @access Public
 */
router.get('/name/:name', tagController.getTagByName);

/**
 * @route GET /api/tags/:id
 * @desc Lấy tag theo ID
 * @access Public
 */
router.get('/:id', tagController.getTagById);

// Routes yêu cầu quyền admin
/**
 * @route POST /api/tags
 * @desc Tạo tag mới
 * @access Admin
 */
router.post('/',
  authMiddleware,
  adminMiddleware,
  validateRequest(tagSchemas.createTag),
  tagController.createTag
);

/**
 * @route POST /api/tags/bulk
 * @desc Tạo tag hàng loạt
 * @access Admin
 */
router.post('/bulk',
  authMiddleware,
  adminMiddleware,
  validateRequest(tagSchemas.createBulkTags),
  tagController.createBulkTags
);

/**
 * @route PUT /api/tags/:id
 * @desc Cập nhật tag
 * @access Admin
 */
router.put('/:id',
  authMiddleware,
  adminMiddleware,
  validateRequest(tagSchemas.updateTag),
  tagController.updateTag
);

/**
 * @route DELETE /api/tags/:id
 * @desc Xóa tag
 * @access Admin
 */
router.delete('/:id',
  authMiddleware,
  adminMiddleware,
  tagController.deleteTag
);

/**
 * @route GET /api/tags/:id/usage
 * @desc Kiểm tra tag có đang được sử dụng không
 * @access Admin
 */
router.get('/:id/usage',
  authMiddleware,
  adminMiddleware,
  tagController.checkTagUsage
);

/**
 * @route GET /api/tags/admin/statistics
 * @desc Lấy thống kê tag
 * @access Admin
 */
router.get('/admin/statistics',
  authMiddleware,
  adminMiddleware,
  tagController.getTagStatistics
);

module.exports = router;
