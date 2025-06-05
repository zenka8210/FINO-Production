const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const validateRequest = require('../middlewares/validateRequest');
const { cartSchemas } = require('../middlewares/validationSchemas');
const authenticateToken = require('../middlewares/authMiddleware');

// Tất cả cart routes đều yêu cầu authentication
router.use(authenticateToken);

// GET /api/cart - Lấy giỏ hàng của người dùng hiện tại
router.get('/', cartController.getCart);

// GET /api/cart/for-order - Lấy giỏ hàng để tạo đơn hàng
router.get('/for-order', cartController.getCartForOrder);

// POST /api/cart/items - Thêm sản phẩm vào giỏ hàng
router.post('/items', 
  validateRequest(cartSchemas.addItem), 
  cartController.addToCart
);

// PUT /api/cart/items/:productId - Cập nhật số lượng sản phẩm trong giỏ hàng
router.put('/items/:productId', 
  validateRequest(cartSchemas.updateItem), 
  cartController.updateCartItem
);

// DELETE /api/cart/items/:productId - Xóa sản phẩm khỏi giỏ hàng
router.delete('/items/:productId', 
  validateRequest(cartSchemas.removeItem), 
  cartController.removeFromCart
);

// PUT /api/cart/sync - Đồng bộ giỏ hàng với tồn kho
router.put('/sync', cartController.syncCart);

// DELETE /api/cart - Xóa toàn bộ giỏ hàng
router.delete('/', cartController.clearCart);

module.exports = router;
