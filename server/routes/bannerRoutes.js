const express = require('express');
const router = express.Router();
const BannerController = require('../controllers/bannerController');
const bannerController = new BannerController();
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const validateObjectId = require('../middlewares/validateObjectId');

// @route GET /api/banners/active
// @desc Lấy tất cả banner đang hoạt động (public cho client)
// @access Public
router.get('/active', bannerController.getActiveClientBanners);

// @route GET /api/banners/admin/status
// @desc Lấy tất cả banner với thông tin trạng thái chi tiết (cho admin)
// @access Private (Admin)
router.get('/admin/status', authMiddleware, adminMiddleware, bannerController.getBannersWithStatus);

// @route POST /api/banners/validate-link
// @desc Kiểm tra tính hợp lệ của link banner
// @access Private (Admin)
router.post('/validate-link', authMiddleware, adminMiddleware, bannerController.validateBannerLink);

// @route GET /api/banners
// @desc Lấy tất cả banner (cho admin, có phân trang, tìm kiếm)
// @access Private (Admin)
router.get('/', authMiddleware, adminMiddleware, bannerController.getAllBanners);

// @route GET /api/banners/:id
// @desc Lấy chi tiết banner bằng ID (cho admin)
// @access Private (Admin)
router.get('/:id', authMiddleware, adminMiddleware, validateObjectId('id'), bannerController.getBannerById);

// @route POST /api/banners
// @desc Tạo banner mới (cho admin)
// @access Private (Admin)
router.post('/', authMiddleware, adminMiddleware, bannerController.createBanner);

// @route PUT /api/banners/:id
// @desc Cập nhật banner bằng ID (cho admin)
// @access Private (Admin)
router.put('/:id', authMiddleware, adminMiddleware, validateObjectId('id'), bannerController.updateBanner);

// @route DELETE /api/banners/:id
// @desc Xóa banner bằng ID (cho admin)
// @access Private (Admin)
router.delete('/:id', authMiddleware, adminMiddleware, validateObjectId('id'), bannerController.deleteBanner);

module.exports = router;
