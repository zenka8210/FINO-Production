const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const validateRequest = require('../middlewares/validateRequest');
const { paymentSchemas } = require('../middlewares/validationSchemas');

// Routes công khai
/**
 * @route GET /api/payments/methods
 * @desc Lấy danh sách phương thức thanh toán
 * @access Public
 */
router.get('/methods', paymentController.getPaymentMethods);

// Webhook routes (không cần authentication)
/**
 * @route POST /api/payments/webhook/vnpay
 * @desc Xử lý webhook từ VNPay
 * @access Public (Webhook)
 */
router.post('/webhook/vnpay', paymentController.handleVNPayWebhook);

/**
 * @route POST /api/payments/webhook/momo
 * @desc Xử lý webhook từ Momo
 * @access Public (Webhook)
 */
router.post('/webhook/momo', paymentController.handleMomoWebhook);

/**
 * @route POST /api/payments/webhook/zalopay
 * @desc Xử lý webhook từ ZaloPay
 * @access Public (Webhook)
 */
router.post('/webhook/zalopay', paymentController.handleZaloPayWebhook);

// Routes yêu cầu xác thực
/**
 * @route POST /api/payments/process
 * @desc Xử lý thanh toán cho đơn hàng
 * @access Private
 */
router.post('/process',
  authMiddleware,
  validateRequest(paymentSchemas.processPayment),
  paymentController.processPayment
);

/**
 * @route GET /api/payments/order/:orderId
 * @desc Lấy thông tin thanh toán theo đơn hàng
 * @access Private
 */
router.get('/order/:orderId',
  authMiddleware,
  paymentController.getPaymentByOrderId
);

// Routes yêu cầu quyền admin
/**
 * @route GET /api/payments/history
 * @desc Lấy lịch sử thanh toán với phân trang
 * @access Admin
 */
router.get('/history',
  authMiddleware,
  adminMiddleware,
  paymentController.getPaymentHistory
);

/**
 * @route PUT /api/payments/:id/status
 * @desc Cập nhật trạng thái thanh toán
 * @access Admin
 */
router.put('/:id/status',
  authMiddleware,
  adminMiddleware,
  validateRequest(paymentSchemas.updatePaymentStatus),
  paymentController.updatePaymentStatus
);

/**
 * @route GET /api/payments/statistics
 * @desc Lấy thống kê thanh toán
 * @access Admin
 */
router.get('/statistics',
  authMiddleware,
  adminMiddleware,
  paymentController.getPaymentStatistics
);

module.exports = router;
