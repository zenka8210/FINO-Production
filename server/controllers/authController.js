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
}

module.exports = AuthController;
