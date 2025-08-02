const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');

const authController = new AuthController();// Changed from userController

// POST /api/auth/register - Register new user
router.post('/register', authController.register); // Changed from userController

// POST /api/auth/login - User login
router.post('/login', authController.login); // Changed from userController

// POST /api/auth/check-email - Check if email exists
router.post('/check-email', authController.checkEmail);

// POST /api/auth/forgot-password - Send forgot password email
router.post('/forgot-password', authController.forgotPassword);

// POST /api/auth/reset-password - Reset password with token
router.post('/reset-password', authController.resetPassword);

// GET /api/auth/verify-reset-token/:token - Verify reset token
router.get('/verify-reset-token/:token', authController.verifyResetToken);

// POST /api/auth/google - Google OAuth authentication
router.post('/google', authController.googleAuth);

module.exports = router;
