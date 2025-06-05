const BaseController = require('./baseController');
const UserService = require('../services/userService');
const ResponseHandler = require('../services/responseHandler');
const { MESSAGES } = require('../config/constants');

class UserController extends BaseController {
  constructor() {
    super();
    this.userService = new UserService();
  }

  /**
   * Lấy thông tin người dùng hiện tại
   */
  getCurrentUser = async (req, res, next) => {
    try {
      const userId = req.user.id;
      const result = await this.userService.getUserById(userId);
      
      ResponseHandler.success(res, result.message, {
        user: result.user
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Cập nhật thông tin người dùng hiện tại
   */
  updateCurrentUser = async (req, res, next) => {
    try {
      const userId = req.user.id;
      const updateData = req.body;
      
      const user = await this.userService.updateUser(userId, updateData, req.user);
      ResponseHandler.success(res, 'Cập nhật thành công', { user });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Thay đổi mật khẩu
   */
  changePassword = async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;
      
      const result = await this.userService.changePassword(userId, currentPassword, newPassword);
      
      ResponseHandler.success(res, result.message);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Cập nhật avatar
   */
  updateAvatar = async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { avatar } = req.body;
      
      const result = await this.userService.updateUser(userId, { avatar });
      
      ResponseHandler.success(res, result.message, {
        user: result.user
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Xóa tài khoản người dùng hiện tại
   */
  deleteCurrentUser = async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { password } = req.body;
      // Lấy user kèm password để xác thực
      const user = await this.userService.getUserWithPassword(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
      }
      const isValid = await require('bcrypt').compare(password, user.password);
      if (!isValid) {
        return res.status(400).json({ success: false, message: 'Mật khẩu không đúng' });
      }
      await this.userService.deleteUser(userId, req.user);
      ResponseHandler.success(res, 'Xóa tài khoản thành công');
    } catch (error) {
      next(error);
    }
  };

  // Admin methods

  /**
   * Lấy tất cả người dùng (Admin)
   */
  getAllUsers = async (req, res, next) => {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        search: req.query.search,
        role: req.query.role,
        status: req.query.status,
        sortBy: req.query.sortBy || 'createdAt',
        sortOrder: req.query.sortOrder || 'desc'
      };

      const result = await this.userService.getUsers({}, options);
      ResponseHandler.success(res, 'Lấy danh sách user thành công', {
        users: result.users,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Lấy người dùng theo ID (Admin)
   */
  getUserById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const user = await this.userService.getUserById(id);
      ResponseHandler.success(res, 'Lấy user thành công', { user });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Tạo người dùng mới (Admin)
   */
  createUser = async (req, res, next) => {
    try {
      const userData = req.body;
      const result = await this.userService.createUser(userData);
      
      ResponseHandler.created(res, result.message, {
        user: result.user
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Cập nhật người dùng (Admin)
   */
  updateUser = async (req, res, next) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const user = await this.userService.updateUser(id, updateData, req.user);
      ResponseHandler.success(res, 'Cập nhật thành công', { user });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Cập nhật trạng thái người dùng (Admin)
   */
  updateUserStatus = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const result = await this.userService.updateUserStatus(id, status);
      
      ResponseHandler.success(res, result.message, {
        user: result.user
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Cập nhật vai trò người dùng (Admin)
   */
  updateUserRole = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { role } = req.body;
      
      const result = await this.userService.updateUserRole(id, role);
      
      ResponseHandler.success(res, result.message, {
        user: result.user
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Xóa người dùng (Admin)
   */
  deleteUser = async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await this.userService.deleteUser(id, req.user);
      ResponseHandler.success(res, 'Xóa user thành công', { deletedUser: result });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Đặt lại mật khẩu người dùng (Admin)
   */
  resetUserPassword = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;
      
      const result = await this.userService.adminResetPassword(id, newPassword);
      
      ResponseHandler.success(res, result.message);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Tìm kiếm người dùng (Admin)
   */
  searchUsers = async (req, res, next) => {
    try {
      const { q } = req.query;
      const options = {
        limit: parseInt(req.query.limit) || 20
      };

      const result = await this.userService.searchUsers(q, options);
      
      ResponseHandler.success(res, result.message, {
        users: result.users,
        searchTerm: q
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Lấy thống kê người dùng (Admin)
   */
  getUserStats = async (req, res, next) => {
    try {
      const stats = await this.userService.getUserStats();
      
      ResponseHandler.success(res, MESSAGES.SUCCESS.DATA_RETRIEVED, {
        stats
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Xuất danh sách người dùng (Admin)
   */
  exportUsers = async (req, res, next) => {
    try {
      const options = {
        format: req.query.format || 'csv',
        filters: {
          role: req.query.role,
          status: req.query.status,
          dateFrom: req.query.dateFrom,
          dateTo: req.query.dateTo
        }
      };

      const result = await this.userService.exportUsers(options);
      
      // Set appropriate headers for file download
      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.send(result.data);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new UserController();