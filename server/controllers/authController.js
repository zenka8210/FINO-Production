const BaseController = require('./baseController');
const UserService = require('../services/userService');
const ResponseHandler = require('../services/responseHandler');
const { MESSAGES } = require('../config/constants');

class AuthController extends BaseController {
  constructor() {
    super();
    this.userService = UserService; // UserService đã là instance
  }
  // Đăng ký người dùng mới
  register = async (req, res, next) => {
    try {
      const userData = req.body;
      const user = await this.userService.createUser(userData);
      
      ResponseHandler.created(res, 'Đăng ký tài khoản thành công', {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          full_name: user.full_name
        }
      });
    } catch (error) {
      next(error);
    }
  };
  // Đăng nhập người dùng
  login = async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const result = await this.userService.loginUser(email, password);
      
      ResponseHandler.success(res, 'Đăng nhập thành công', {
        token: result.token,
        user: result.user
      });
    } catch (error) {
      next(error);
    }
  };

  // Làm mới token
  refreshToken = async (req, res, next) => {
    try {
      const { refreshToken } = req.body;
      const result = await this.userService.refreshToken(refreshToken);
      
      ResponseHandler.success(res, MESSAGES.SUCCESS.TOKEN_REFRESHED, {
        token: result.token,
        refreshToken: result.refreshToken
      });
    } catch (error) {
      next(error);
    }
  };

  // Đăng xuất
  logout = async (req, res, next) => {
    try {
      const userId = req.user.id;
      await this.userService.logout(userId);
      
      ResponseHandler.success(res, MESSAGES.SUCCESS.LOGOUT);
    } catch (error) {
      next(error);
    }
  };

  // Quên mật khẩu
  forgotPassword = async (req, res, next) => {
    try {
      const { email } = req.body;
      await this.userService.requestPasswordReset(email);
      
      ResponseHandler.success(res, MESSAGES.SUCCESS.PASSWORD_RESET_SENT);
    } catch (error) {
      next(error);
    }
  };

  // Đặt lại mật khẩu
  resetPassword = async (req, res, next) => {
    try {
      const { token, newPassword } = req.body;
      await this.userService.resetPassword(token, newPassword);
      
      ResponseHandler.success(res, MESSAGES.SUCCESS.PASSWORD_RESET);
    } catch (error) {
      next(error);
    }
  };

  // Xác thực email
  verifyEmail = async (req, res, next) => {
    try {
      const { token } = req.params;
      await this.userService.verifyEmail(token);
      
      ResponseHandler.success(res, MESSAGES.SUCCESS.EMAIL_VERIFIED);
    } catch (error) {
      next(error);
    }
  };

  // Gửi lại email xác thực
  resendVerification = async (req, res, next) => {
    try {
      const { email } = req.body;
      await this.userService.resendVerificationEmail(email);
      
      ResponseHandler.success(res, MESSAGES.SUCCESS.VERIFICATION_SENT);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new AuthController();
