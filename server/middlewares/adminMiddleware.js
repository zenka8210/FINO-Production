const { AppError } = require('./errorHandler');
const { MESSAGES, ERROR_CODES, ROLES } = require('../config/constants');

const adminMiddleware = (req, res, next) => {
  // Đảm bảo authMiddleware đã chạy trước và gắn req.user
  if (req.user && req.user.role === ROLES.ADMIN) {
    return next();
  }
  // Sử dụng AppError để errorHandler xử lý
  return next(new AppError(MESSAGES.ACCESS_DENIED || 'Yêu cầu quyền Admin', ERROR_CODES.FORBIDDEN));
};

module.exports = adminMiddleware;
