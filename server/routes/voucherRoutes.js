const express = require('express');
const router = express.Router();
const VoucherController = require('../controllers/voucherController');
const voucherController = new VoucherController(); // Instantiate controller
const protect = require('../middlewares/authMiddleware'); // Changed: protect is the default export
const admin = require('../middlewares/adminMiddleware'); // Changed: admin is the default export from its file
const validateObjectId = require('../middlewares/validateObjectId');
const { queryParserMiddleware } = require('../middlewares/queryMiddleware');

/**
 * @swagger
 * tags:
 *   name: Vouchers
 *   description: Quản lý phiếu giảm giá
 */

// === Public Routes ===

/**
 * @swagger
 * /api/vouchers:
 *   get:
 *     summary: Lấy danh sách tất cả phiếu giảm giá (Public)
 *     tags: [Vouchers]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số lượng kết quả mỗi trang
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo mã phiếu giảm giá
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           example: createdAt:desc
 *         description: Sắp xếp theo trường (ví dụ: createdAt:asc, discountPercent:desc)
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Lọc theo trạng thái hoạt động (true/false)
 *     responses:
 *       200:
 *         description: Danh sách phiếu giảm giá và thông tin phân trang
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Voucher'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 */
router.get('/', queryParserMiddleware(), voucherController.getAllVouchers);

/**
 * @swagger
 * /api/vouchers/active:
 *   get:
 *     summary: Lấy danh sách phiếu giảm giá đang hoạt động (Public)
 *     tags: [Vouchers]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số lượng kết quả mỗi trang
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo mã phiếu giảm giá
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           example: createdAt:desc
 *         description: Sắp xếp theo trường
 *     responses:
 *       200:
 *         description: Danh sách phiếu giảm giá đang hoạt động
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Voucher'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 */
router.get('/active', voucherController.getActiveVouchers);

/**
 * @swagger
 * /api/vouchers/my-used-voucher:
 *   get:
 *     summary: Lấy thông tin phiếu giảm giá mà user đã sử dụng (User)
 *     tags: [Vouchers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy thông tin phiếu giảm giá đã sử dụng thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hasUsedVoucher:
 *                   type: boolean
 *                 voucherHistory:
 *                   type: object
 *                   properties:
 *                     orderId:
 *                       type: string
 *                     voucherCode:
 *                       type: string
 *                     discountPercent:
 *                       type: number
 *                     discountAmount:
 *                       type: number
 *                     orderDate:
 *                       type: string
 *                     orderStatus:
 *                       type: string
 *                     note:
 *                       type: string
 *       401:
 *         description: Chưa đăng nhập
 */
router.get('/my-used-voucher', protect, voucherController.getUserUsedVoucher);

/**
 * @swagger
 * /api/vouchers/{id}:
 *   get:
 *     summary: Lấy thông tin chi tiết một phiếu giảm giá (Public)
 *     tags: [Vouchers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của phiếu giảm giá
 *     responses:
 *       200:
 *         description: Thông tin chi tiết phiếu giảm giá
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Voucher'
 *       404:
 *         description: Không tìm thấy phiếu giảm giá
 */

// === Admin Routes - MUST BE BEFORE /:id route ===
router.get('/admin/statistics', protect, admin, voucherController.getVoucherStatistics);
router.post('/admin', protect, admin, voucherController.createVoucher);
router.get('/admin', protect, admin, queryParserMiddleware(), voucherController.getAllVouchers);
router.get('/admin/:id', protect, admin, validateObjectId('id'), voucherController.getVoucherById);
router.patch('/admin/:id', protect, admin, validateObjectId('id'), voucherController.updateVoucher);
router.patch('/admin/:id/toggle-status', protect, admin, validateObjectId('id'), voucherController.toggleVoucherStatus);
router.delete('/admin/:id', protect, admin, validateObjectId('id'), voucherController.deleteVoucher);

router.get('/:id', validateObjectId('id'), voucherController.getVoucherById); // Corrected usage

/**
 * @swagger
 * /api/vouchers/code/{code}:
 *   get:
 *     summary: Lấy thông tin một phiếu giảm giá theo mã (Public)
 *     tags: [Vouchers]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Mã phiếu giảm giá
 *     responses:
 *       200:
 *         description: Thông tin phiếu giảm giá
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Voucher'
 *       404:
 *         description: Không tìm thấy phiếu giảm giá
 */
router.get('/code/:code', voucherController.getVoucherByCode); // Get voucher by code for validation/display

/**
 * @swagger
 * /api/vouchers/check-usage/{code}:
 *   get:
 *     summary: Kiểm tra xem user có thể sử dụng voucher không (User)
 *     tags: [Vouchers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Mã phiếu giảm giá
 *     responses:
 *       200:
 *         description: Thông tin có thể sử dụng voucher
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 canUse:
 *                   type: boolean
 *                 reason:
 *                   type: string
 *                 voucher:
 *                   type: object
 *       401:
 *         description: Chưa đăng nhập
 */
router.get('/check-usage/:code', protect, voucherController.checkVoucherUsage);

/**
 * @swagger
 * /api/vouchers/my-used-voucher:
 *   get:
 *     summary: Lấy thông tin voucher mà user đã sử dụng (User)
 *     tags: [Vouchers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin voucher đã sử dụng
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hasUsedVoucher:
 *                   type: boolean
 *                 voucherHistory:
 *                   type: object
 *                   properties:
 *                     orderId:
 *                       type: string
 *                     voucherCode:
 *                       type: string
 *                     discountPercent:
 *                       type: number
 *                     discountAmount:
 *                       type: number
 *                     orderDate:
 *                       type: string
 *                     orderStatus:
 *                       type: string
 *                     note:
 *                       type: string
// === User Specific Routes (Authenticated) ===
/**
 * @swagger
 * /api/vouchers/apply:
 *   post:
 *     summary: Áp dụng phiếu giảm giá cho đơn hàng (User)
 *     tags: [Vouchers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - orderTotal
 *             properties:
 *               code:
 *                 type: string
 *                 description: Mã phiếu giảm giá
 *               orderTotal:
 *                 type: number
 *                 description: Tổng giá trị đơn hàng trước khi áp dụng phiếu giảm giá
 *     responses:
 *       200:
 *         description: Áp dụng phiếu giảm giá thành công, trả về thông tin giảm giá
 *       400:
 *         description: Phiếu giảm giá không hợp lệ, hết hạn, không đủ điều kiện, hoặc tổng đơn hàng không hợp lệ
 *       401:
 *         description: Chưa đăng nhập
 */
router.post('/apply', protect, voucherController.applyVoucher);

module.exports = router;
