const express = require('express');
const router = express.Router();
const ColorController = require('../controllers/colorController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const validateObjectId = require('../middlewares/validateObjectId');
const { queryParserMiddleware } = require('../middlewares/queryMiddleware');

const colorController = new ColorController();

// ============= PUBLIC ROUTES =============

/**
 * @route GET /api/colors/suggestions
 * @description Lấy danh sách màu gợi ý
 * @access Public
 */
router.get('/suggestions', colorController.getSuggestedColors);

/**
 * @route GET /api/colors/search
 * @description Tìm kiếm màu theo tên hoặc lấy gợi ý (Business Logic: hỗ trợ tái sử dụng)
 * @access Public
 * @query {String} name - Tên màu cần tìm
 */
router.get('/search', colorController.findByNameOrSuggest);

/**
 * @route GET /api/colors/public
 * @description Lấy danh sách màu sắc cho client (không cần auth)
 * @access Public
 */
router.get('/public', queryParserMiddleware(), colorController.getAllColors);

/**
 * @route GET /api/colors/public/:id
 * @description Lấy chi tiết màu sắc cho client (không cần auth)
 * @access Public
 */
router.get('/public/:id', validateObjectId('id'), colorController.getColorById);

/**
 * @route POST /api/colors/validate-name
 * @description Validate tên màu (Business Logic: tên phải duy nhất và hợp lệ)
 * @access Public
 * @body {String} name - Tên màu cần validate
 * @body {String} [excludeId] - ID màu loại trừ khi update
 */
router.post('/validate-name', colorController.validateColorName);

// ============= ADMIN ROUTES (Require Authentication) =============

/**
 * @route GET /api/colors
 * @description Lấy tất cả màu sắc với phân trang và tìm kiếm
 * @access Private (Admin)
 */
router.get('/', authMiddleware, adminMiddleware, queryParserMiddleware(), colorController.getAllColors);

/**
 * @route GET /api/colors/:id
 * @description Lấy chi tiết màu sắc theo ID
 * @access Private (Admin)
 */
router.get('/:id', authMiddleware, adminMiddleware, validateObjectId('id'), colorController.getColorById);

/**
 * @route POST /api/colors
 * @description Tạo màu sắc mới (Business Logic: validate name uniqueness)
 * @access Private (Admin)
 */
router.post('/', authMiddleware, adminMiddleware, colorController.createColor);

/**
 * @route PUT /api/colors/:id
 * @description Cập nhật màu sắc (Business Logic: validate name uniqueness)
 * @access Private (Admin)
 */
router.put('/:id', authMiddleware, adminMiddleware, validateObjectId('id'), colorController.updateColor);

/**
 * @route DELETE /api/colors/:id
 * @description Xóa màu sắc (Business Logic: check reusability - không xóa nếu đang được sử dụng)
 * @access Private (Admin)
 */
router.delete('/:id', authMiddleware, adminMiddleware, validateObjectId('id'), colorController.deleteColor);

// ============= BUSINESS LOGIC ROUTES =============

/**
 * @route GET /api/colors/:id/can-delete
 * @description Kiểm tra màu có thể xóa không (Business Logic: reusability check)
 * @access Private (Admin)
 */
router.get(
  '/:id/can-delete',
  authMiddleware,
  adminMiddleware,
  validateObjectId('id'),
  colorController.canDeleteColor
);

/**
 * @route GET /api/colors/:id/usage-stats
 * @description Lấy thống kê sử dụng màu sắc
 * @access Private (Admin)
 */
router.get(
  '/:id/usage-stats',
  authMiddleware,
  adminMiddleware,
  validateObjectId('id'),
  colorController.getColorUsageStats
);

/**
 * @route GET /api/colors/:id/validate-for-use
 * @description Validate màu có thể sử dụng không
 * @access Private (Admin)
 */
router.get(
  '/:id/validate-for-use',
  authMiddleware,
  adminMiddleware,
  validateObjectId('id'),
  colorController.validateColorForUse
);

module.exports = router;
