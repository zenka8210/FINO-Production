const express = require('express');
const router = express.Router();
const ColorController = require('../controllers/colorController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const validateObjectId = require('../middlewares/validateObjectId');

const colorController = new ColorController();

// --- Tuyến đường công khai (đặt trước các route có middleware) ---

/**
 * @route GET /api/colors/suggestions
 * @description Lấy danh sách màu đề xuất cho admin UI
 * @access Public
 */
router.get('/suggestions', colorController.getSuggestedColors);

// @route GET /api/colors/public
// @desc Lấy tất cả màu sắc (công khai, có thể phục vụ cho client lựa chọn)
// @access Public
router.get('/public', colorController.getAllColors); // Sử dụng getAllColors, có thể client sẽ không truyền pagination params

// @route GET /api/colors/public/:id
// @desc Lấy chi tiết một màu sắc bằng ID (công khai)
// @access Public
router.get('/public/:id', validateObjectId('id'), colorController.getColorById);

// --- Tuyến đường cho quản trị viên (Yêu cầu xác thực và quyền admin) ---

// @route GET /api/colors
// @desc Lấy tất cả màu sắc (cho admin, có phân trang, tìm kiếm theo tên)
// @access Private (Admin)
router.get('/', authMiddleware, adminMiddleware, colorController.getAllColors);

// @route GET /api/colors/:id
// @desc Lấy chi tiết màu sắc bằng ID (cho admin)
// @access Private (Admin)
router.get('/:id', authMiddleware, adminMiddleware, validateObjectId('id'), colorController.getColorById);

// @route POST /api/colors
// @desc Tạo màu sắc mới (cho admin)
// @access Private (Admin)
router.post('/', authMiddleware, adminMiddleware, colorController.createColor);

// @route PUT /api/colors/:id
// @desc Cập nhật màu sắc bằng ID (cho admin)
// @access Private (Admin)
router.put('/:id', authMiddleware, adminMiddleware, validateObjectId('id'), colorController.updateColor);

// @route DELETE /api/colors/:id
// @desc Xóa màu sắc bằng ID (cho admin)
// @note Service sẽ kiểm tra xem màu có đang được sử dụng không trước khi xóa
// @access Private (Admin)
router.delete('/:id', authMiddleware, adminMiddleware, validateObjectId('id'), colorController.deleteColor);

// --- Business Rules Endpoints (must come before generic routes) ---

/**
 * @route POST /api/colors/validate-name
 * @description Kiểm tra tên màu sắc có hợp lệ và duy nhất không
 * @access Public
 * @body {String} name - Tên màu sắc cần kiểm tra
 * @body {String} [excludeId] - ID màu sắc cần loại trừ khi kiểm tra (dùng khi update)
 */
router.post('/validate-name', colorController.validateColorName);

/**
 * @route GET /api/colors/:id/usage-stats
 * @description Lấy thống kê sử dụng của màu sắc
 * @access Private (Admin)
 * @param {String} id - ID của màu sắc
 */
router.get(
  '/:id/usage-stats',
  authMiddleware,
  adminMiddleware,
  validateObjectId('id'),
  colorController.getColorUsageStats
);

/**
 * @route GET /api/colors/:id/can-delete
 * @description Kiểm tra xem màu sắc có thể xóa không
 * @access Private (Admin)
 * @param {String} id - ID của màu sắc
 */
router.get(
  '/:id/can-delete',
  authMiddleware,
  adminMiddleware,
  colorController.checkColorDeletion
);

module.exports = router;
