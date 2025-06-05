const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const validateRequest = require('../middlewares/validateRequest');
const { userSchemas, authSchemas } = require('../middlewares/validationSchemas');
const authenticateToken = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const validateObjectId = require('../middlewares/validateObjectId');

// Authenticated user routes - Các route yêu cầu xác thực

// GET /api/users/me - Lấy thông tin người dùng hiện tại
router.get('/me', authenticateToken, userController.getCurrentUser);

// PUT /api/users/me - Cập nhật thông tin người dùng hiện tại
router.put('/me', 
  authenticateToken, 
  validateRequest(userSchemas.update), 
  userController.updateCurrentUser
);

// PUT /api/users/me/password - Thay đổi mật khẩu
router.put('/me/password', 
  authenticateToken, 
  userController.changePassword
);

// PUT /api/users/me/avatar - Cập nhật avatar
router.put('/me/avatar', 
  authenticateToken, 
  userController.updateAvatar
);

// POST /api/users/me/delete - Xóa tài khoản người dùng hiện tại (cho phép body)
router.post('/me/delete', 
  authenticateToken, 
  userController.deleteCurrentUser
);

// Admin routes - Các route yêu cầu quyền admin

// GET /api/users - Lấy tất cả người dùng (Admin)
router.get('/', 
  authenticateToken, 
  adminMiddleware, 
  userController.getAllUsers
);

// GET /api/users/search - Tìm kiếm người dùng (Admin)
router.get('/search', 
  authenticateToken, 
  adminMiddleware, 
  userController.searchUsers
);

// GET /api/users/stats - Lấy thống kê người dùng (Admin)
router.get('/stats', 
  authenticateToken, 
  adminMiddleware, 
  userController.getUserStats
);

// GET /api/users/export - Xuất danh sách người dùng (Admin)
router.get('/export', 
  authenticateToken, 
  adminMiddleware, 
  userController.exportUsers
);

// POST /api/users - Tạo người dùng mới (Admin)
router.post('/', 
  authenticateToken, 
  adminMiddleware, 
  validateRequest(userSchemas.register), 
  userController.createUser
);


// GET /api/users/:id - Lấy người dùng theo ID (Admin)
router.get('/:id', 
  authenticateToken, 
  adminMiddleware, 
  validateObjectId,
  userController.getUserById
);

// PUT /api/users/:id - Cập nhật người dùng (Admin)
router.put('/:id', 
  authenticateToken, 
  adminMiddleware, 
  validateObjectId,
  validateRequest(userSchemas.update), 
  userController.updateUser
);

// PUT /api/users/:id/status - Cập nhật trạng thái người dùng (Admin)
router.put('/:id/status', 
  authenticateToken, 
  adminMiddleware, 
  validateObjectId,
  userController.updateUserStatus
);

// PUT /api/users/:id/role - Cập nhật vai trò người dùng (Admin)
router.put('/:id/role', 
  authenticateToken, 
  adminMiddleware, 
  validateObjectId,
  userController.updateUserRole
);

// PUT /api/users/:id/reset-password - Đặt lại mật khẩu người dùng (Admin)
router.put('/:id/reset-password', 
  authenticateToken, 
  adminMiddleware, 
  validateObjectId,
  userController.resetUserPassword
);

// DELETE /api/users/:id - Xóa người dùng (Admin)
router.delete('/:id', 
  authenticateToken, 
  adminMiddleware, 
  validateObjectId,
  userController.deleteUser
);

module.exports = router;