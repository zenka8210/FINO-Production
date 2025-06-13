const express = require('express');
const router = express.Router();
const ColorController = require('../controllers/colorController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const validateObjectId = require('../middlewares/validateObjectId');

const colorController = new ColorController();

// --- Tuyến đường công khai ---

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

module.exports = router;
