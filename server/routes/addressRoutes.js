const express = require('express');
const router = express.Router();
const AddressController = require('../controllers/addressController');
const protect = require('../middlewares/authMiddleware'); // Corrected import
const validateObjectId = require('../middlewares/validateObjectId');

const addressController = new AddressController();
// const { restrictToAdmin } = require('../middlewares/adminMiddleware'); // Not used for now as routes are user-specific

/**
 * @swagger
 * tags:
 *   name: Addresses
 *   description: Quản lý địa chỉ người dùng (Người dùng chỉ quản lý địa chỉ của chính mình)
 */

// Public endpoints (no authentication required)
// GET /api/addresses/cities - Lấy danh sách tỉnh/thành phố hợp lệ (public endpoint)
router.get('/cities', addressController.getValidCities);

// GET /api/addresses/guidance - Lấy hướng dẫn nhập địa chỉ (public endpoint)
router.get('/guidance', addressController.getInputGuidance);

// POST /api/addresses/validate - Validate và preview địa chỉ trước khi lưu (public endpoint)
router.post('/validate', addressController.validateAndPreview);

/**
 * @swagger
 * /api/addresses:
 *   post:
 *     summary: Tạo một địa chỉ mới cho người dùng hiện tại
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddressInput'
 *     responses:
 *       201:
 *         description: Tạo địa chỉ thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Address'
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc đã đạt giới hạn số lượng địa chỉ
 *       401:
 *         description: Chưa đăng nhập
 *   get:
 *     summary: Lấy danh sách tất cả địa chỉ của người dùng hiện tại
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách địa chỉ
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Address'
 *       401:
 *         description: Chưa đăng nhập
 */
router.route('/')
  .post(protect, addressController.createAddress)
  .get(protect, addressController.getUserAddresses);

/**
 * @swagger
 * /api/addresses/{id}:
 *   get:
 *     summary: Lấy thông tin chi tiết một địa chỉ của người dùng hiện tại
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của địa chỉ
 *     responses:
 *       200:
 *         description: Thông tin chi tiết địa chỉ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Address'
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập địa chỉ này
 *       404:
 *         description: Không tìm thấy địa chỉ
 *   put:
 *     summary: Cập nhật thông tin một địa chỉ của người dùng hiện tại
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của địa chỉ
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddressUpdateInput'
 *     responses:
 *       200:
 *         description: Cập nhật địa chỉ thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Address'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập địa chỉ này
 *       404:
 *         description: Không tìm thấy địa chỉ
 *   delete:
 *     summary: Xóa một địa chỉ của người dùng hiện tại
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của địa chỉ
 *     responses:
 *       200:
 *         description: Xóa địa chỉ thành công
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập địa chỉ này
 *       404:
 *         description: Không tìm thấy địa chỉ
 */
router.route('/:id')
  .get(protect, validateObjectId('id'), addressController.getAddressById) // Corrected usage
  .put(protect, validateObjectId('id'), addressController.updateAddress) // Corrected usage
  .delete(protect, validateObjectId('id'), addressController.deleteAddress); // Corrected usage

/**
 * @swagger
 * /api/addresses/{id}/set-default:
 *   patch:
 *     summary: Đặt một địa chỉ làm địa chỉ mặc định cho người dùng hiện tại
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của địa chỉ cần đặt làm mặc định
 *     responses:
 *       200:
 *         description: Đặt làm địa chỉ mặc định thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Address'
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập địa chỉ này
 *       404:
 *         description: Không tìm thấy địa chỉ
 */
router.patch('/:id/set-default', protect, validateObjectId('id'), addressController.setDefaultAddress); // Corrected usage

// DELETE with replacement - Xóa địa chỉ với chỉ định địa chỉ thay thế
router.delete('/:id/with-replacement', protect, validateObjectId('id'), addressController.deleteAddressWithReplacement);

// Admin routes for addresses (e.g., listing all addresses for all users) are not implemented here
// as the current focus is on user-specific address management.
// If admin routes are needed, they would typically be under an /admin/addresses prefix
// and use `protect` and `restrictToAdmin` middleware.

module.exports = router;
