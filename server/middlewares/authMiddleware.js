const jwt = require('jsonwebtoken');
const User = require('../models/UserSchema');
const { AppError } = require('./errorHandler'); // Import AppError
const { MESSAGES, ERROR_CODES } = require('../config/constants'); // Import constants

const authMiddleware = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError(MESSAGES.AUTH_FAILED || 'Không có token, truy cập bị từ chối', ERROR_CODES.UNAUTHORIZED));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Đảm bảo rằng decoded.userId tồn tại, nếu JWT của bạn lưu id user dưới tên khác (ví dụ: id), hãy thay đổi cho phù hợp
    const user = await User.findById(decoded.id || decoded.userId).select('-password'); 

    if (!user) {
      return next(new AppError(MESSAGES.USER.NOT_FOUND || 'Token không hợp lệ, người dùng không tồn tại', ERROR_CODES.UNAUTHORIZED));
    }

    // Check if user account is active
    if (!user.isActive) {
      return next(new AppError('Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.', ERROR_CODES.FORBIDDEN));
    }

    req.user = user; // Gắn thông tin user vào request
    next();
  } catch (err) {
    // console.error('JWT error:', err); // Có thể giữ lại để debug nếu cần
    if (err.name === 'JsonWebTokenError') {
        return next(new AppError(MESSAGES.AUTH_FAILED || 'Token không hợp lệ', ERROR_CODES.UNAUTHORIZED));
    }
    if (err.name === 'TokenExpiredError') {
        return next(new AppError(MESSAGES.AUTH_FAILED || 'Token đã hết hạn', ERROR_CODES.UNAUTHORIZED));
    }
    // Lỗi chung khác
    return next(new AppError(MESSAGES.AUTH_FAILED || 'Xác thực thất bại', ERROR_CODES.UNAUTHORIZED));
  }
};

module.exports = authMiddleware;
