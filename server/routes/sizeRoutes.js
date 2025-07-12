const express = require('express');
const router = express.Router();
const SizeController = require('../controllers/sizeController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const validateObjectId = require('../middlewares/validateObjectId');

const sizeController = new SizeController();

// --- Tuyến đường công khai (đặt trước các route có middleware) ---

/**
 * @route GET /api/sizes/suggestions
 * @description Lấy danh sách size đề xuất cho admin UI (tất cả categories)
 * @access Public
 */
router.get('/suggestions', sizeController.getSuggestedSizes);

/**
 * @route GET /api/sizes/suggestions/:category  
 * @description Lấy danh sách size đề xuất theo category
 * @access Public
 */
router.get('/suggestions/:category', sizeController.getSuggestedSizes);

/**
 * @route GET /api/sizes/valid-sizes
 * @description Lấy tất cả kích thước hợp lệ (for validation)
 * @access Public
 */
router.get('/valid-sizes', sizeController.getAllValidSizes);

/**
 * @route GET /api/sizes/valid-sizes/:category
 * @description Lấy danh sách kích thước hợp lệ theo danh mục
 * @access Public
 */
router.get('/valid-sizes/:category', sizeController.getValidSizesByCategory);

// @route GET /api/sizes/public
// @desc Lấy tất cả kích thước (công khai, có thể phục vụ cho client lựa chọn)
// @access Public
router.get('/public', sizeController.getAllSizes);

// @route GET /api/sizes/public/:id
// @desc Lấy chi tiết một kích thước bằng ID (công khai)
// @access Public
router.get('/public/:id', validateObjectId('id'), sizeController.getSizeById);

// --- Tuyến đường cho quản trị viên (Yêu cầu xác thực và quyền admin) ---

// @route GET /api/sizes
// @desc Lấy tất cả kích thước (cho admin, có phân trang, tìm kiếm theo tên)
// @access Private (Admin)
router.get('/', authMiddleware, adminMiddleware, sizeController.getAllSizes);

// @route GET /api/sizes/:id
// @desc Lấy chi tiết kích thước bằng ID (cho admin)
// @access Private (Admin)
router.get('/:id', authMiddleware, adminMiddleware, validateObjectId('id'), sizeController.getSizeById);

// @route POST /api/sizes
// @desc Tạo kích thước mới (cho admin)
// @access Private (Admin)
router.post('/', authMiddleware, adminMiddleware, sizeController.createSize);

// @route PUT /api/sizes/:id
// @desc Cập nhật kích thước bằng ID (cho admin)
// @access Private (Admin)
router.put('/:id', authMiddleware, adminMiddleware, validateObjectId('id'), sizeController.updateSize);

// @route DELETE /api/sizes/:id
// @desc Xóa kích thước bằng ID (cho admin)
// @note Service sẽ kiểm tra xem kích thước có đang được sử dụng không trước khi xóa
// @access Private (Admin)
router.delete('/:id', authMiddleware, adminMiddleware, validateObjectId('id'), sizeController.deleteSize);

// --- Business Rules Endpoints (must come before generic routes) ---

/**
 * @route POST /api/sizes/validate-name
 * @description Kiểm tra tên kích thước có hợp lệ và duy nhất không
 * @access Public
 * @body {String} name - Tên kích thước cần kiểm tra
 * @body {String} [excludeId] - ID kích thước cần loại trừ khi kiểm tra (dùng khi update)
 */
router.post('/validate-name', sizeController.validateSizeName);

/**
 * @route GET /api/sizes/:id/usage-stats
 * @description Lấy thống kê sử dụng của kích thước
 * @access Private (Admin)
 * @param {String} id - ID của kích thước
 */
router.get(
  '/:id/usage-stats',
  authMiddleware,
  adminMiddleware,
  validateObjectId('id'),
  sizeController.getSizeUsageStats
);

/**
 * @route GET /api/sizes/:id/can-delete
 * @description Kiểm tra xem kích thước có thể xóa không
 * @access Private (Admin)
 * @param {String} id - ID của kích thước
 */
router.get(
  '/:id/can-delete',
  authMiddleware,
  adminMiddleware,
  validateObjectId('id'),
  sizeController.checkSizeDeletion
);

module.exports = router;
