const User = require('../models/userSchema');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const logger = require('./loggerService').getLogger('UserService');
const { PAGINATION, MESSAGES, ERROR_CODES, ROLES } = require('../config/constants');

/**
 * Service xử lý logic nghiệp vụ liên quan đến người dùng
 */
class UserService {
  /**
   * Lấy user theo ID kèm password (dùng cho xác thực sensitive)
   * @param {string} userId
   * @returns {Promise<Object>} user (có password)
   */
  async getUserWithPassword(userId) {
    try {
      const user = await User.findById(userId).select('+password').lean();
      return user;
    } catch (error) {
      logger.error('Lỗi khi lấy user kèm password', { error: error.message, userId });
      throw error;
    }
  }
  /**
   * Cập nhật vai trò người dùng (Admin)
   * @param {string} userId - ID user
   * @param {string} role - Vai trò mới
   * @returns {Promise<Object>} - User đã cập nhật
   */
  async updateUserRole(userId, role) {
    try {
      logger.info('Cập nhật vai trò user', { userId, role });
      const user = await User.findById(userId);
      if (!user) {
        const error = new Error('Không tìm thấy người dùng');
        error.statusCode = 404;
        error.errorCode = ERROR_CODES.NOT_FOUND;
        throw error;
      }
      user.role = role;
      user.updatedAt = new Date();
      await user.save();
      logger.info('Cập nhật vai trò user thành công', { userId });
      return { message: 'Cập nhật vai trò thành công', user };
    } catch (error) {
      logger.error('Lỗi khi cập nhật vai trò user', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Cập nhật trạng thái người dùng (Admin)
   * @param {string} userId - ID user
   * @param {string} status - Trạng thái mới
   * @returns {Promise<Object>} - User đã cập nhật
   */
  async updateUserStatus(userId, status) {
    try {
      logger.info('Cập nhật trạng thái user', { userId, status });
      const user = await User.findById(userId);
      if (!user) {
        const error = new Error('Không tìm thấy người dùng');
        error.statusCode = 404;
        error.errorCode = ERROR_CODES.NOT_FOUND;
        throw error;
      }
      user.status = status;
      user.updatedAt = new Date();
      await user.save();
      logger.info('Cập nhật trạng thái user thành công', { userId });
      return { message: 'Cập nhật trạng thái thành công', user };
    } catch (error) {
      logger.error('Lỗi khi cập nhật trạng thái user', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Đặt lại mật khẩu người dùng (Admin)
   * @param {string} userId - ID user
   * @param {string} newPassword - Mật khẩu mới
   * @returns {Promise<Object>} - Kết quả đặt lại mật khẩu
   */
  async adminResetPassword(userId, newPassword) {
    try {
      logger.info('Admin đặt lại mật khẩu user', { userId });
      const user = await User.findById(userId);
      if (!user) {
        const error = new Error('Không tìm thấy người dùng');
        error.statusCode = 404;
        error.errorCode = ERROR_CODES.NOT_FOUND;
        throw error;
      }
      const saltRounds = 12;
      user.password = await bcrypt.hash(newPassword, saltRounds);
      user.updatedAt = new Date();
      await user.save();
      logger.info('Admin đặt lại mật khẩu thành công', { userId });
      return { message: 'Đặt lại mật khẩu thành công', userId };
    } catch (error) {
      logger.error('Lỗi khi admin đặt lại mật khẩu', { error: error.message, userId });
      throw error;
    }
  }
  
  /**
   * Tạo user mới (đăng ký)
   * @param {Object} userData - Dữ liệu user
   * @returns {Promise<Object>} - User vừa tạo (không có password)
   */
  async createUser(userData) {
    try {
      logger.info('Tạo user mới', { email: userData.email });

      // Kiểm tra email đã tồn tại chưa
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        const error = new Error('Email đã được sử dụng');
        error.statusCode = 400;
        error.errorCode = ERROR_CODES.BAD_REQUEST;
        throw error;
      }

      // Tạo user mới, password sẽ được hash tự động ở schema
      const user = new User({
        ...userData,
        role: 'customer', // Luôn ép role là customer khi đăng ký
        isEmailVerified: true, // Cho phép đăng nhập ngay
        emailVerificationToken: undefined
      });

      const savedUser = await user.save();
      
      // Loại bỏ password khỏi response
      const userResponse = savedUser.toObject();
      delete userResponse.password;
      
      logger.info('User được tạo thành công', { userId: savedUser._id, email: userData.email });
      return userResponse;
    } catch (error) {
      logger.error('Lỗi khi tạo user', { error: error.message, email: userData.email });
      throw error;
    }
  }

  /**
   * Đăng nhập user
   * @param {string} email - Email đăng nhập
   * @param {string} password - Mật khẩu
   * @returns {Promise<Object>} - Token và thông tin user
   */
  async loginUser(email, password) {
    try {
      logger.info('Đăng nhập user', { email });


      // Tìm user theo email
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        const error = new Error('Email hoặc mật khẩu không đúng');
        error.statusCode = 401;
        error.errorCode = ERROR_CODES.UNAUTHORIZED;
        throw error;
      }

      // Kiểm tra xác thực email (nếu có field này)
      if (user.isEmailVerified === false) {
        const error = new Error('Tài khoản chưa xác thực email');
        error.statusCode = 401;
        error.errorCode = ERROR_CODES.UNAUTHORIZED;
        throw error;
      }

      // Kiểm tra mật khẩu
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        const error = new Error('Email hoặc mật khẩu không đúng');
        error.statusCode = 401;
        error.errorCode = ERROR_CODES.UNAUTHORIZED;
        throw error;
      }

      // Tạo JWT token
      const token = jwt.sign(
        { 
          userId: user._id, 
          email: user.email, 
          role: user.role 
        },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      // Loại bỏ password khỏi response
      const userResponse = user.toObject();
      delete userResponse.password;

      logger.info('Đăng nhập thành công', { userId: user._id, email });
      return {
        token,
        user: userResponse
      };
    } catch (error) {
      logger.error('Lỗi khi đăng nhập', { error: error.message, email });
      throw error;
    }
  }

  /**
   * Lấy danh sách users (admin)
   * @param {Object} filter - Bộ lọc
   * @param {Object} options - Tùy chọn phân trang và sắp xếp
   * @returns {Promise<Object>} - Danh sách users với thông tin phân trang
   */
  async getUsers(filter = {}, options = {}) {
    try {
      logger.info('Lấy danh sách users', { filter, options });

      const {
        page = PAGINATION.DEFAULT_PAGE,
        limit = PAGINATION.DEFAULT_LIMIT,
        sort = { createdAt: -1 }
      } = options;

      const skip = (page - 1) * limit;

      // Xây dựng query
      const query = { ...filter };
      
      // Nếu có tìm kiếm theo tên hoặc email
      if (filter.search) {
        query.$or = [
          { name: { $regex: filter.search, $options: 'i' } },
          { email: { $regex: filter.search, $options: 'i' } }
        ];
        delete query.search;
      }

      // Thực hiện query (không bao gồm password)
      const [users, total] = await Promise.all([
        User.find(query)
          .select('-password')
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        User.countDocuments(query)
      ]);

      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      const result = {
        users,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          itemsPerPage: limit,
          hasNextPage,
          hasPrevPage
        }
      };

      logger.info('Lấy danh sách users thành công', { 
        totalUsers: users.length, 
        totalItems: total 
      });

      return result;
    } catch (error) {
      logger.error('Lỗi khi lấy danh sách users', { error: error.message, filter });
      throw error;
    }
  }

  /**
   * Lấy user theo ID
   * @param {string} userId - ID user
   * @returns {Promise<Object>} - Thông tin user
   */
  async getUserById(userId) {
    try {
      logger.info('Lấy user theo ID', { userId });

      const user = await User.findById(userId).select('-password').lean();

      if (!user) {
        const error = new Error('Không tìm thấy người dùng');
        error.statusCode = 404;
        error.errorCode = ERROR_CODES.NOT_FOUND;
        throw error;
      }

      logger.info('Lấy user thành công', { userId });
      return user;
    } catch (error) {
      logger.error('Lỗi khi lấy user', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Cập nhật thông tin user
   * @param {string} userId - ID user
   * @param {Object} updateData - Dữ liệu cần cập nhật
   * @param {Object} requester - Thông tin người thực hiện
   * @returns {Promise<Object>} - User đã cập nhật
   */
  async updateUser(userId, updateData, requester) {
    try {
      logger.info('Cập nhật user', { userId, updateData, requesterId: requester._id });

      // Kiểm tra user có tồn tại không
      const existingUser = await User.findById(userId);
      if (!existingUser) {
        const error = new Error('Không tìm thấy người dùng');
        error.statusCode = 404;
        error.errorCode = ERROR_CODES.NOT_FOUND;
        throw error;
      }

      // Kiểm tra quyền: chỉ admin hoặc chính user đó mới được cập nhật
      if (requester.role !== ROLES.ADMIN && requester._id.toString() !== userId) {
        const error = new Error(MESSAGES.ACCESS_DENIED);
        error.statusCode = 403;
        error.errorCode = ERROR_CODES.FORBIDDEN;
        throw error;
      }

      // Kiểm tra email mới có bị trùng không (nếu có thay đổi email)
      if (updateData.email && updateData.email !== existingUser.email) {
        const emailExists = await User.findOne({ 
          email: updateData.email, 
          _id: { $ne: userId } 
        });
        if (emailExists) {
          const error = new Error('Email đã được sử dụng');
          error.statusCode = 400;
          error.errorCode = ERROR_CODES.BAD_REQUEST;
          throw error;
        }
      }

      // Hash password mới nếu có
      if (updateData.password) {
        const saltRounds = 12;
        updateData.password = await bcrypt.hash(updateData.password, saltRounds);
      }

      // Cập nhật user
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          ...updateData,
          updatedAt: new Date()
        },
        { new: true, runValidators: true }
      ).select('-password');

      logger.info('Cập nhật user thành công', { userId });
      return updatedUser;
    } catch (error) {
      logger.error('Lỗi khi cập nhật user', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Xóa user (admin only)
   * @param {string} userId - ID user
   * @param {Object} requester - Thông tin người thực hiện
   * @returns {Promise<Object>} - Kết quả xóa
   */
  async deleteUser(userId, requester) {
    try {
      logger.info('Xóa user', { userId, requesterId: requester._id });

      // Chỉ admin mới được xóa user
      if (requester.role !== ROLES.ADMIN) {
        const error = new Error(MESSAGES.ACCESS_DENIED);
        error.statusCode = 403;
        error.errorCode = ERROR_CODES.FORBIDDEN;
        throw error;
      }

      const user = await User.findById(userId);
      if (!user) {
        const error = new Error('Không tìm thấy người dùng');
        error.statusCode = 404;
        error.errorCode = ERROR_CODES.NOT_FOUND;
        throw error;
      }

      // Không cho phép xóa chính mình
      if (userId === requester._id.toString()) {
        const error = new Error('Không thể xóa chính mình');
        error.statusCode = 400;
        error.errorCode = ERROR_CODES.BAD_REQUEST;
        throw error;
      }

      await User.findByIdAndDelete(userId);
      
      logger.info('Xóa user thành công', { userId });
      return { deleted: true, userId };
    } catch (error) {
      logger.error('Lỗi khi xóa user', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Thay đổi mật khẩu
   * @param {string} userId - ID user
   * @param {string} oldPassword - Mật khẩu cũ
   * @param {string} newPassword - Mật khẩu mới
   * @returns {Promise<Object>} - Kết quả thay đổi
   */
  async changePassword(userId, oldPassword, newPassword) {
    try {
      logger.info('Thay đổi mật khẩu', { userId });

      const user = await User.findById(userId).select('+password');
      if (!user) {
        const error = new Error('Không tìm thấy người dùng');
        error.statusCode = 404;
        error.errorCode = ERROR_CODES.NOT_FOUND;
        throw error;
      }

      // Kiểm tra mật khẩu cũ
      const isValidOldPassword = await bcrypt.compare(oldPassword, user.password);
      if (!isValidOldPassword) {
        const error = new Error('Mật khẩu cũ không đúng');
        error.statusCode = 400;
        error.errorCode = ERROR_CODES.BAD_REQUEST;
        throw error;
      }

      // Hash mật khẩu mới
      const saltRounds = 12;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Cập nhật mật khẩu
      await User.findByIdAndUpdate(userId, { 
        password: hashedNewPassword,
        updatedAt: new Date()
      });

      logger.info('Thay đổi mật khẩu thành công', { userId });
      return { success: true, message: 'Thay đổi mật khẩu thành công' };
    } catch (error) {
      logger.error('Lỗi khi thay đổi mật khẩu', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Lấy profile user hiện tại
   * @param {string} userId - ID user
   * @returns {Promise<Object>} - Thông tin profile
   */
  async getUserProfile(userId) {
    try {
      logger.info('Lấy profile user', { userId });

      const user = await User.findById(userId)
        .select('-password')
        .populate('addresses')
        .lean();

      if (!user) {
        const error = new Error('Không tìm thấy người dùng');
        error.statusCode = 404;
        error.errorCode = ERROR_CODES.NOT_FOUND;
        throw error;
      }

      logger.info('Lấy profile thành công', { userId });
      return user;
    } catch (error) {
      logger.error('Lỗi khi lấy profile', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Làm mới token
   * @param {string} refreshToken - Refresh token hiện tại
   * @returns {Promise<Object>} - Token mới
   */
  async refreshToken(refreshToken) {
    try {
      logger.info('Làm mới token', { refreshToken: refreshToken.substring(0, 10) + '...' });

      if (!refreshToken) {
        const error = new Error('Refresh token không được cung cấp');
        error.statusCode = 400;
        error.errorCode = ERROR_CODES.BAD_REQUEST;
        throw error;
      }

      // Xác thực refreshToken
      let decodedToken;
      try {
        decodedToken = jwt.verify(
          refreshToken,
          process.env.JWT_REFRESH_SECRET || 'refresh-fallback-secret'
        );
      } catch (err) {
        const error = new Error('Refresh token không hợp lệ hoặc đã hết hạn');
        error.statusCode = 401;
        error.errorCode = ERROR_CODES.UNAUTHORIZED;
        throw error;
      }

      // Tìm user từ decoded token
      const userId = decodedToken.userId;
      const user = await User.findById(userId);

      if (!user) {
        const error = new Error('Không tìm thấy người dùng với token này');
        error.statusCode = 404;
        error.errorCode = ERROR_CODES.NOT_FOUND;
        throw error;
      }

      // Tạo token mới
      const newToken = jwt.sign(
        { 
          userId: user._id, 
          email: user.email, 
          role: user.role 
        },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      // Tạo refresh token mới
      const newRefreshToken = jwt.sign(
        { userId: user._id },
        process.env.JWT_REFRESH_SECRET || 'refresh-fallback-secret',
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
      );

      logger.info('Làm mới token thành công', { userId: user._id });
      return {
        token: newToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      logger.error('Lỗi khi làm mới token', { error: error.message });
      throw error;
    }
  }

  /**
   * Đăng xuất người dùng
   * @param {string} userId - ID user đăng xuất
   * @returns {Promise<Object>} - Kết quả đăng xuất
   */
  async logout(userId) {
    try {
      logger.info('Đăng xuất user', { userId });
      
      // Trong trường hợp sử dụng JWT, chúng ta không thực sự có thể "hủy" token
      // Thay vào đó, chúng ta có thể thực hiện các thao tác như:
      // - Lưu token vào blacklist (cần có bảng database riêng)
      // - Cập nhật trạng thái user, etc.
      
      logger.info('Đăng xuất thành công', { userId });
      return { success: true };
    } catch (error) {
      logger.error('Lỗi khi đăng xuất', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Yêu cầu đặt lại mật khẩu
   * @param {string} email - Email của user quên mật khẩu
   * @returns {Promise<Object>} - Kết quả gửi email reset
   */
  async requestPasswordReset(email) {
    try {
      logger.info('Yêu cầu đặt lại mật khẩu', { email });

      const user = await User.findOne({ email });
      if (!user) {
        // Không cần thông báo lỗi, để tránh lộ thông tin email có tồn tại hay không
        logger.info('Email không tồn tại trong hệ thống', { email });
        return { success: true, message: 'Nếu email tồn tại, hướng dẫn đặt lại mật khẩu sẽ được gửi' };
      }

      // Tạo token reset password (có thời hạn 1 giờ)
      const resetToken = jwt.sign(
        { userId: user._id },
        process.env.JWT_RESET_PASSWORD_SECRET || 'reset-password-secret',
        { expiresIn: '1h' }
      );

      // Lưu token vào database (thường sẽ lưu thêm thời gian hết hạn và trạng thái)
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = Date.now() + 3600000; // 1 giờ
      await user.save();

      // Gửi email (giả lập)
      // Thông thường sẽ sử dụng dịch vụ gửi email như Nodemailer, SendGrid...
      logger.info('Gửi email đặt lại mật khẩu', { email, userId: user._id });
      
      // TODO: Integrate với email service
      // await NotificationService.sendResetPasswordEmail(user.email, resetToken);

      logger.info('Gửi yêu cầu đặt lại mật khẩu thành công', { email });
      return { success: true, message: 'Đã gửi email hướng dẫn đặt lại mật khẩu' };
    } catch (error) {
      logger.error('Lỗi khi yêu cầu đặt lại mật khẩu', { error: error.message, email });
      throw error;
    }
  }

  /**
   * Đặt lại mật khẩu
   * @param {string} token - Token reset password
   * @param {string} newPassword - Mật khẩu mới
   * @returns {Promise<Object>} - Kết quả đặt lại mật khẩu
   */
  async resetPassword(token, newPassword) {
    try {
      logger.info('Đặt lại mật khẩu với token');

      // Xác thực token
      let decodedToken;
      try {
        decodedToken = jwt.verify(
          token,
          process.env.JWT_RESET_PASSWORD_SECRET || 'reset-password-secret'
        );
      } catch (err) {
        const error = new Error('Token không hợp lệ hoặc đã hết hạn');
        error.statusCode = 400;
        error.errorCode = ERROR_CODES.BAD_REQUEST;
        throw error;
      }

      // Tìm user với token và đảm bảo token chưa hết hạn
      const user = await User.findOne({
        _id: decodedToken.userId,
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
      });

      if (!user) {
        const error = new Error('Token không hợp lệ hoặc đã hết hạn');
        error.statusCode = 400;
        error.errorCode = ERROR_CODES.BAD_REQUEST;
        throw error;
      }

      // Hash mật khẩu mới
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Cập nhật mật khẩu và xóa token reset
      user.password = hashedPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      logger.info('Đặt lại mật khẩu thành công', { userId: user._id });
      return { success: true, message: 'Đặt lại mật khẩu thành công' };
    } catch (error) {
      logger.error('Lỗi khi đặt lại mật khẩu', { error: error.message });
      throw error;
    }
  }

  /**
   * Xác thực email
   * @param {string} token - Token xác thực email
   * @returns {Promise<Object>} - Kết quả xác thực email
   */
  async verifyEmail(token) {
    try {
      logger.info('Xác thực email với token');

      // Xác thực token
      let decodedToken;
      try {
        decodedToken = jwt.verify(
          token,
          process.env.JWT_VERIFY_EMAIL_SECRET || 'verify-email-secret'
        );
      } catch (err) {
        const error = new Error('Token không hợp lệ hoặc đã hết hạn');
        error.statusCode = 400;
        error.errorCode = ERROR_CODES.BAD_REQUEST;
        throw error;
      }

      // Tìm user với token
      const user = await User.findOne({
        _id: decodedToken.userId,
        emailVerificationToken: token
      });

      if (!user) {
        const error = new Error('Token không hợp lệ hoặc đã sử dụng');
        error.statusCode = 400;
        error.errorCode = ERROR_CODES.BAD_REQUEST;
        throw error;
      }

      // Cập nhật trạng thái xác thực email
      user.isEmailVerified = true;
      user.emailVerificationToken = undefined;
      await user.save();

      logger.info('Xác thực email thành công', { userId: user._id });
      return { success: true, message: 'Email đã được xác thực thành công' };
    } catch (error) {
      logger.error('Lỗi khi xác thực email', { error: error.message });
      throw error;
    }
  }
}

module.exports = UserService;
