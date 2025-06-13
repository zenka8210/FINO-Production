const express = require('express');
const router = express.Router();
const SizeController = require('../controllers/sizeController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const validateObjectId = require('../middlewares/validateObjectId');

const sizeController = new SizeController();

// --- Tuyến đường công khai ---

// @route GET /api/sizes/public
// @desc Lấy tất cả kích thước (công khai, có thể phục vụ cho client lựa chọn)
// @access Public
router.get('/public', sizeController.getAllSizes); // Sử dụng getAllSizes, client có thể không truyền pagination params

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

module.exports = router;
