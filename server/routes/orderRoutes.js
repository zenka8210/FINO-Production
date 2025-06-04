const express = require('express');
const router = express.Router();

const orderController = require('../controllers/orderController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

// Tạo đơn hàng mới - chỉ user đã đăng nhập
// POST http://localhost:5000/api/orders/
router.post('/', authMiddleware, orderController.createOrder);

// Lấy danh sách đơn hàng (chỉ admin có quyền)
// GET http://localhost:5000/api/orders/
router.get('/', authMiddleware, adminMiddleware, orderController.getOrders);

// Lấy đơn hàng theo ID (admin hoặc user đó xem)
// GET http://localhost:5000/api/orders/:id
router.get('/:id', authMiddleware, async (req, res, next) => {
  const orderId = req.params.id;
  const userId = req.user._id;

  const Order = require('../models/orderSchema');
  try {
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });

    if (req.user.role === 'admin' || order.user.toString() === userId.toString()) {
      next();
    } else {
      return res.status(403).json({ message: 'Truy cập bị từ chối' });
    }
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi kiểm tra quyền truy cập', error: error.message });
  }
}, orderController.getOrderById);

// Cập nhật địa chỉ giao hàng (chỉ admin)
// PUT http://localhost:5000/api/orders/:id/shipping-address
router.put('/:id/shipping-address', authMiddleware, adminMiddleware, orderController.updateShippingAddress);

// Cập nhật trạng thái đơn hàng (chỉ admin)
// PUT http://localhost:5000/api/orders/:id/status
router.put('/:id/status', authMiddleware, adminMiddleware, orderController.updateOrderStatus);

// Cập nhật tổng tiền và giảm giá, voucher (chỉ admin)
// PUT http://localhost:5000/api/orders/:id/total-discount
router.put('/:id/total-discount', authMiddleware, adminMiddleware, orderController.updateTotalAndDiscount);

// Cập nhật phương thức thanh toán và thông tin thanh toán (chỉ admin)
// PUT http://localhost:5000/api/orders/:id/payment-info
router.put('/:id/payment-info', authMiddleware, adminMiddleware, orderController.updatePaymentInfo);

// Cập nhật trạng thái thanh toán (chỉ admin)
// PUT http://localhost:5000/api/orders/:id/payment-status
router.put('/:id/payment-status', authMiddleware, adminMiddleware, orderController.updatePaymentStatus);

// Xóa đơn hàng (chỉ admin)
// DELETE http://localhost:5000/api/orders/:id
router.delete('/:id', authMiddleware, adminMiddleware, orderController.deleteOrder);

// Lấy lịch sử đơn hàng cá nhân (user xem đơn hàng của chính mình)
// GET http://localhost:5000/api/orders/user/:userId
router.get('/user/:userId', authMiddleware, (req, res, next) => {
  if (req.user.role === 'admin' || req.user._id.toString() === req.params.userId) {
    next();
  } else {
    return res.status(403).json({ message: 'Truy cập bị từ chối' });
  }
}, orderController.getOrdersByUser);

module.exports = router;
