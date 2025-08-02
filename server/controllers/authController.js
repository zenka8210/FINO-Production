const BaseController = require('./baseController');
const AuthService = require('../services/authService');
const ResponseHandler = require('../services/responseHandler');
const { userMessages } = require('../config/constants');

class AuthController extends BaseController {
  constructor() {
    super(new AuthService());
  }

  /**
   * @route POST /api/auth/register
   * @description Đăng ký người dùng mới. (Register a new user.)
   * @access Public
   */
  register = async (req, res, next) => {
    try {
      const user = await this.service.register(req.body);
      ResponseHandler.success(res, userMessages.REGISTER_SUCCESS, { user }, 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * @route POST /api/auth/login
   * @description Đăng nhập người dùng. (Log in an existing user.)
   * @access Public
   */
  login = async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const result = await this.service.login(email, password);
      ResponseHandler.success(res, userMessages.LOGIN_SUCCESS, result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * @route POST /api/auth/check-email
   * @description Kiểm tra email có tồn tại trong hệ thống không (Check if email exists in system)
   * @access Public
   */
  checkEmail = async (req, res, next) => {
    try {
      const { email } = req.body;
      const result = await this.service.checkEmail(email);
      ResponseHandler.success(res, 'Email đã được đăng ký trong hệ thống', result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * @route POST /api/auth/forgot-password
   * @description Gửi email reset password (Send password reset email)
   * @access Public
   */
  forgotPassword = async (req, res, next) => {
    try {
      const { email } = req.body;
      const result = await this.service.forgotPassword(email);
      ResponseHandler.success(res, 'Email đặt lại mật khẩu đã được gửi', result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * @route POST /api/auth/reset-password
   * @description Reset password với token (Reset password with token)
   * @access Public
   */
  resetPassword = async (req, res, next) => {
    try {
      const { token, newPassword } = req.body;
      const result = await this.service.resetPassword(token, newPassword);
      ResponseHandler.success(res, 'Mật khẩu đã được đặt lại thành công', result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * @route GET /api/auth/verify-reset-token/:token
   * @description Verify reset token validity (Kiểm tra token reset hợp lệ)
   * @access Public
   */
  verifyResetToken = async (req, res, next) => {
    try {
      const { token } = req.params;
      const result = await this.service.verifyResetToken(token);
      ResponseHandler.success(res, 'Token hợp lệ', result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * @route POST /api/auth/google
   * @description Đăng ký/đăng nhập với Google OAuth
   * @access Public
   */
  googleAuth = async (req, res, next) => {
    try {
      const { credential } = req.body;
      const result = await this.service.googleAuth(credential);
      ResponseHandler.success(res, 'Đăng nhập Google thành công', result);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = AuthController;
