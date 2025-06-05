const express = require('express');
const router = express.Router();

const orderController = require('../controllers/orderController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const ownershipMiddleware = require('../middlewares/ownershipMiddleware');
const validateRequest = require('../middlewares/validateRequest');
const { createOrderSchema, updateOrderStatusSchema } = require('../middlewares/validationSchemas');

// ===== ROUTES =====

// Tạo đơn hàng mới - chỉ user đã đăng nhập
// POST http://localhost:5000/api/orders/
router.post('/', 
  authMiddleware, 
  validateRequest(createOrderSchema), 
  orderController.createOrder
);

// Lấy danh sách đơn hàng (chỉ admin có quyền)
// GET http://localhost:5000/api/orders/
router.get('/', 
  authMiddleware, 
  adminMiddleware, 
  orderController.getOrders
);

// Lấy đơn hàng theo ID (admin hoặc user đó xem)
// GET http://localhost:5000/api/orders/:id
router.get('/:id', 
  authMiddleware, 
  ownershipMiddleware({ model: 'Order', ownerField: 'user' }), 
  orderController.getOrderById
);

// Cập nhật trạng thái đơn hàng (chỉ admin)
// PUT http://localhost:5000/api/orders/:id/status
router.put('/:id/status', 
  authMiddleware, 
  adminMiddleware, 
  validateRequest(updateOrderStatusSchema), 
  orderController.updateOrderStatus
);

// Xóa đơn hàng (chỉ admin)
// DELETE http://localhost:5000/api/orders/:id
router.delete('/:id', 
  authMiddleware, 
  adminMiddleware, 
  orderController.deleteOrder
);

// Lấy lịch sử đơn hàng cá nhân (user xem đơn hàng của chính mình)
// GET http://localhost:5000/api/orders/user/:userId
router.get('/user/:userId', 
  authMiddleware, 
  ownershipMiddleware(), // Kiểm tra user chỉ được xem đơn hàng của chính mình
  orderController.getUserOrders
);

// Kiểm tra xem user có thể đánh giá sản phẩm không
// GET http://localhost:5000/api/orders/can-review/:productId
router.get('/can-review/:productId', 
  authMiddleware, 
  orderController.canReviewProduct
);

module.exports = router;
