const express = require('express');
const router = express.Router();
const voucherController = require('../controllers/voucherController');
const validateRequest = require('../middlewares/validateRequest');
const { voucherSchemas } = require('../middlewares/validationSchemas');
const authenticateToken = require('../middlewares/authMiddleware');
const checkAdminRole = require('../middlewares/adminMiddleware');

// Public routes
// GET /api/vouchers/available - Lấy voucher khả dụng
router.get('/available', voucherController.getAvailableVouchers);

// GET /api/vouchers/check/:code - Kiểm tra voucher theo mã code
router.get('/check/:code', voucherController.checkVoucherByCode);

// Protected routes - Yêu cầu authentication
router.use(authenticateToken);

// Admin only routes
router.use(checkAdminRole);

// GET /api/vouchers - Lấy tất cả voucher (Admin)
router.get('/', voucherController.getAllVouchers);

// GET /api/vouchers/:id - Lấy voucher theo ID
router.get('/:id', voucherController.getVoucherById);

// POST /api/vouchers - Tạo voucher mới (Admin)
router.post('/', 
  validateRequest(voucherSchemas.create), 
  voucherController.createVoucher
);

// PUT /api/vouchers/:id - Cập nhật voucher (Admin)
router.put('/:id', 
  validateRequest(voucherSchemas.create), 
  voucherController.updateVoucher
);

// DELETE /api/vouchers/:id - Xóa voucher (Admin)
router.delete('/:id', voucherController.deleteVoucher);

module.exports = router;
