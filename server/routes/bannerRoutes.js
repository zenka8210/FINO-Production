const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/bannerController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const validateRequest = require('../middlewares/validateRequest');
const { bannerSchemas } = require('../middlewares/validationSchemas');

// Routes công khai
/**
 * @route GET /api/banners/public/position/:position
 * @desc Lấy banner đang hoạt động theo vị trí
 * @access Public
 */
router.get('/public/position/:position', bannerController.getActiveBannersByPosition);

/**
 * @route GET /api/banners/position/:position
 * @desc Lấy banner theo vị trí (bao gồm cả không hoạt động)
 * @access Public
 */
router.get('/position/:position', bannerController.getBannersByPosition);

// Routes yêu cầu xác thực admin
/**
 * @route GET /api/banners
 * @desc Lấy tất cả banner với phân trang và lọc
 * @access Admin
 */
router.get('/', 
  authMiddleware, 
  adminMiddleware, 
  bannerController.getAllBanners
);

/**
 * @route GET /api/banners/:id
 * @desc Lấy banner theo ID
 * @access Admin
 */
router.get('/:id', 
  authMiddleware, 
  adminMiddleware, 
  bannerController.getBannerById
);

/**
 * @route POST /api/banners
 * @desc Tạo banner mới
 * @access Admin
 */
router.post('/',
  authMiddleware,
  adminMiddleware,
  validateRequest(bannerSchemas.createBanner),
  bannerController.createBanner
);

/**
 * @route PUT /api/banners/:id
 * @desc Cập nhật banner
 * @access Admin
 */
router.put('/:id',
  authMiddleware,
  adminMiddleware,
  validateRequest(bannerSchemas.updateBanner),
  bannerController.updateBanner
);

/**
 * @route DELETE /api/banners/:id
 * @desc Xóa banner
 * @access Admin
 */
router.delete('/:id',
  authMiddleware,
  adminMiddleware,
  bannerController.deleteBanner
);

/**
 * @route PATCH /api/banners/:id/status
 * @desc Cập nhật trạng thái banner
 * @access Admin
 */
router.patch('/:id/status',
  authMiddleware,
  adminMiddleware,
  validateRequest(bannerSchemas.updateBannerStatus),
  bannerController.updateBannerStatus
);

/**
 * @route PATCH /api/banners/:id/order
 * @desc Cập nhật thứ tự banner
 * @access Admin
 */
router.patch('/:id/order',
  authMiddleware,
  adminMiddleware,
  validateRequest(bannerSchemas.updateBannerOrder),
  bannerController.updateBannerOrder
);

/**
 * @route POST /api/banners/reorder
 * @desc Sắp xếp lại thứ tự banner
 * @access Admin
 */
router.post('/reorder',
  authMiddleware,
  adminMiddleware,
  validateRequest(bannerSchemas.reorderBanners),
  bannerController.reorderBanners
);

module.exports = router;
