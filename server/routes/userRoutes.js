const express = require('express');
const UserController = require('../controllers/userController');
const userController = new UserController();
const protect = require('../middlewares/authMiddleware'); // Corrected: authMiddleware is the protect middleware
const restrictToAdmin = require('../middlewares/adminMiddleware'); // Corrected: restrictToAdmin is from adminMiddleware
const validateObjectId = require('../middlewares/validateObjectId');
const { queryParserMiddleware } = require('../middlewares/queryMiddleware');
const { adminSortForModel } = require('../middlewares/adminSortMiddleware');

const router = express.Router();

// === Admin User Management Routes ===

/**
 * @route POST /api/users
 * @description Tạo người dùng mới (chỉ dành cho quản trị viên).
 * @access Private (Admin)
 * @body {String} email - Email của người dùng.
 * @body {String} password - Mật khẩu của người dùng.
 * @body {String} [name] - Tên người dùng.
 * @body {String} [phone] - Số điện thoại người dùng.
 * @body {String} [role] - Vai trò ('customer', 'admin'). Mặc định là 'customer'.
 * @body {Boolean} [isActive] - Trạng thái hoạt động. Mặc định là true.
 */
router.post(
  '/',
  protect,
  restrictToAdmin,
  userController.createUser
);

/**
 * @route GET /api/users
 * @description Lấy danh sách tất cả người dùng với tùy chọn lọc và phân trang (chỉ dành cho quản trị viên).
 * @access Private (Admin)
 * @query {Number} [page] - Trang hiện tại.
 * @query {Number} [limit] - Số lượng kết quả mỗi trang.
 * @query {String} [sortBy] - Trường để sắp xếp (ví dụ: createdAt, name, email).
 * @query {String} [sortOrder] - Thứ tự sắp xếp ('asc' hoặc 'desc').
 * @query {String} [search] - Từ khóa tìm kiếm (tên, email, điện thoại).
 * @query {String} [role] - Lọc theo vai trò.
 * @query {Boolean} [isActive] - Lọc theo trạng thái hoạt động.
 */
router.get(
  '/',
  protect,
  restrictToAdmin,
  adminSortForModel('User'),
  queryParserMiddleware(),
  userController.getAllUsers
);

/**
 * @route GET /api/users/stats
 * @description Lấy thống kê người dùng hệ thống cho admin dashboard
 * @access Private (Admin)
 * @returns {Object} Statistics including total users, role distribution, monthly registrations, active users
 */
router.get(
  '/stats',
  protect,
  restrictToAdmin,
  userController.getUserStatistics
);

/**
 * @route GET /api/users/:id
 * @description Lấy thông tin chi tiết một người dùng bằng ID (chỉ dành cho quản trị viên).
 * @access Private (Admin)
 * @param {String} id - ID của người dùng.
 */
router.get(
  '/:id',
  protect,
  restrictToAdmin,
  validateObjectId('id'),
  userController.getUserById
);

/**
 * @route PUT /api/users/:id
 * @description Cập nhật thông tin người dùng bằng ID (chỉ dành cho quản trị viên - cập nhật name, phone, isActive).
 * @access Private (Admin)
 * @param {String} id - ID của người dùng.
 * @body {String} [name] - Tên mới.
 * @body {String} [phone] - Số điện thoại mới.
 * @body {Boolean} [isActive] - Trạng thái hoạt động mới.
 */
router.put(
  '/:id',
  protect,
  restrictToAdmin,
  validateObjectId('id'),
  userController.updateUserByAdmin
);

/**
 * @route DELETE /api/users/:id
 * @description Xóa người dùng bằng ID (chỉ dành cho quản trị viên).
 * @access Private (Admin)
 * @param {String} id - ID của người dùng.
 */
router.delete(
  '/:id',
  protect,
  restrictToAdmin,
  validateObjectId('id'),
  userController.deleteUserByAdmin
);

/**
 * @route PATCH /api/users/:id/role
 * @description Cập nhật vai trò của người dùng bằng ID (chỉ dành cho quản trị viên).
 * @access Private (Admin)
 * @param {String} id - ID của người dùng.
 * @body {String} role - Vai trò mới ('customer' hoặc 'admin').
 */
router.patch(
  '/:id/role',
  protect,
  restrictToAdmin,
  validateObjectId('id'),
  userController.updateUserRoleByAdmin
);

/**
 * @route PATCH /api/users/:id/status
 * @description Kích hoạt/Vô hiệu hóa tài khoản người dùng bằng ID (chỉ dành cho quản trị viên).
 * @access Private (Admin)
 * @param {String} id - ID của người dùng.
 */
router.patch(
  '/:id/status',
  protect,
  restrictToAdmin,
  validateObjectId('id'),
  userController.toggleUserActiveStatusByAdmin
);

// === Current User Profile & Address Management Routes ===
// IMPORTANT: These routes must be defined BEFORE the /:userId routes to avoid conflicts

/**
 * @route GET /api/users/me/profile
 * @description Lấy thông tin hồ sơ của người dùng hiện tại đang đăng nhập.
 * @access Private
 */
router.get(
  '/me/profile',
  protect,
  userController.getCurrentUserProfile
);

/**
 * @route PUT /api/users/me/profile
 * @description Cập nhật thông tin hồ sơ của người dùng hiện tại (name, phone).
 * @access Private
 * @body {String} [name] - Tên mới.
 * @body {String} [phone] - Số điện thoại mới.
 */
router.put(
  '/me/profile',
  protect,
  userController.updateCurrentUserProfile
);

/**
 * @route PUT /api/users/me/password
 * @description Thay đổi mật khẩu của người dùng hiện tại.
 * @access Private
 * @body {String} currentPassword - Mật khẩu hiện tại.
 * @body {String} newPassword - Mật khẩu mới.
 */
router.put(
  '/me/password',
  protect,
  userController.changeCurrentUserPassword
);

// --- User Addresses ---

/**
 * @route POST /api/users/me/addresses
 * @description Thêm địa chỉ mới cho người dùng hiện tại.
 * @access Private
 * @body {String} fullName - Họ tên người nhận.
 * @body {String} phone - Số điện thoại người nhận.
 * @body {String} addressLine - Địa chỉ chi tiết (số nhà, đường).
 * @body {String} city - Tỉnh/Thành phố.
 * @body {String} district - Quận/Huyện.
 * @body {String} ward - Phường/Xã.
 * @body {Boolean} [isDefault] - Đặt làm địa chỉ mặc định.
 */
router.post(
  '/me/addresses',
  protect,
  (req, res, next) => {
    console.log('[DEBUG] userRoutes /me/addresses called');
    next();
  },
  userController.addUserAddress
);

// Test route để debug
router.post(
  '/me/addresses-debug',
  protect,
  userController.debugAddUserAddress
);

/**
 * @route GET /api/users/me/addresses
 * @description Lấy tất cả địa chỉ của người dùng hiện tại.
 * @access Private
 */
router.get(
  '/me/addresses',
  protect,
  userController.getUserAddresses
);

/**
 * @route GET /api/users/me/addresses/:addressId
 * @description Lấy chi tiết một địa chỉ bằng ID của người dùng hiện tại.
 * @access Private
 * @param {String} addressId - ID của địa chỉ.
 */
router.get(
  '/me/addresses/:addressId',
  protect,
  validateObjectId('addressId'),
  userController.getUserAddressById
);

/**
 * @route PUT /api/users/me/addresses/:addressId
 * @description Cập nhật một địa chỉ bằng ID cho người dùng hiện tại.
 * @access Private
 * @param {String} addressId - ID của địa chỉ.
 * @body {String} [fullName] - Họ tên người nhận.
 * @body {String} [phone] - Số điện thoại người nhận.
 * @body {String} [addressLine] - Địa chỉ chi tiết.
 * @body {String} [city] - Tỉnh/Thành phố.
 * @body {String} [district] - Quận/Huyện.
 * @body {String} [ward] - Phường/Xã.
 * @body {Boolean} [isDefault] - Đặt làm địa chỉ mặc định.
 */
router.put(
  '/me/addresses/:addressId',
  protect,
  validateObjectId('addressId'),
  userController.updateUserAddress
);

/**
 * @route DELETE /api/users/me/addresses/:addressId
 * @description Xóa một địa chỉ bằng ID cho người dùng hiện tại.
 * @access Private
 * @param {String} addressId - ID của địa chỉ.
 */
router.delete(
  '/me/addresses/:addressId',
  protect,
  validateObjectId('addressId'),
  userController.deleteUserAddress
);

/**
 * @route PATCH /api/users/me/addresses/:addressId/set-default
 * @description Đặt một địa chỉ làm địa chỉ mặc định cho người dùng hiện tại.
 * @access Private
 * @param {String} addressId - ID của địa chỉ.
 */
router.patch(
  '/me/addresses/:addressId/set-default',
  protect,
  validateObjectId('addressId'),
  userController.setDefaultUserAddress
);

/**
 * @route GET /api/users/:userId/addresses
 * @description Lấy danh sách địa chỉ của người dùng cụ thể (chỉ dành cho quản trị viên).
 * @access Private (Admin)
 * @param {String} userId - ID của người dùng.
 */
router.get(
  '/:userId/addresses',
  protect,
  restrictToAdmin,
  validateObjectId('userId'),
  userController.getUserAddressesByAdmin
);

module.exports = router;