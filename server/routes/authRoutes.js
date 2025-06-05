const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const validateRequest = require('../middlewares/validateRequest');
const { authSchemas } = require('../middlewares/validationSchemas');
const authenticateToken = require('../middlewares/authMiddleware');

// POST /api/auth/register - Đăng ký tài khoản mới
router.post('/register', 
  validateRequest(authSchemas.register), 
  authController.register
);

// POST /api/auth/login - Đăng nhập
router.post('/login', 
  validateRequest(authSchemas.login), 
  authController.login
);

// POST /api/auth/refresh-token - Làm mới token
router.post('/refresh-token', 
  validateRequest(authSchemas.refreshToken), 
  authController.refreshToken
);

// POST /api/auth/logout - Đăng xuất (yêu cầu xác thực)
router.post('/logout', 
  authenticateToken, 
  authController.logout
);

// POST /api/auth/forgot-password - Quên mật khẩu
router.post('/forgot-password', 
  validateRequest(authSchemas.forgotPassword), 
  authController.forgotPassword
);

// POST /api/auth/reset-password - Đặt lại mật khẩu
router.post('/reset-password', 
  validateRequest(authSchemas.resetPassword), 
  authController.resetPassword
);

// GET /api/auth/verify-email/:token - Xác thực email
router.get('/verify-email/:token', 
  authController.verifyEmail
);

// POST /api/auth/resend-verification - Gửi lại email xác thực
router.post('/resend-verification', 
  validateRequest(authSchemas.resendVerification), 
  authController.resendVerification
);

module.exports = router;
