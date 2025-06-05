const express = require('express');
const router = express.Router();
const addressController = require('../controllers/addressController');
const validateRequest = require('../middlewares/validateRequest');
const { addressSchemas } = require('../middlewares/validationSchemas');
const authenticateToken = require('../middlewares/authMiddleware');

// Tất cả address routes đều yêu cầu authentication
router.use(authenticateToken);

// GET /api/addresses/default - Lấy địa chỉ mặc định (đặt trước route có tham số)
router.get('/default', addressController.getDefaultAddress);

// GET /api/addresses - Lấy tất cả địa chỉ của người dùng
router.get('/', addressController.getUserAddresses);

// GET /api/addresses/:id - Lấy địa chỉ theo ID
router.get('/:id', addressController.getAddressById);

// POST /api/addresses - Tạo địa chỉ mới
router.post('/', 
  validateRequest(addressSchemas.create), 
  addressController.createAddress
);

// PUT /api/addresses/:id - Cập nhật địa chỉ
router.put('/:id', 
  validateRequest(addressSchemas.update), 
  addressController.updateAddress
);

// PUT /api/addresses/:id/default - Đặt địa chỉ mặc định
router.put('/:id/default', addressController.setDefaultAddress);

// DELETE /api/addresses/:id - Xóa địa chỉ
router.delete('/:id', addressController.deleteAddress);

module.exports = router;
