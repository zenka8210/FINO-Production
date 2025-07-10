const mongoose = require('mongoose');
const ResponseHandler = require('../services/responseHandler');

// Simple console logger fallback if winston is not available
const logger = {
  error: (message, meta) => {
    console.error(`[ERROR] ${message}`, meta ? JSON.stringify(meta, null, 2) : '');
  },
  warn: (message, meta) => {
    console.warn(`[WARN] ${message}`, meta ? JSON.stringify(meta, null, 2) : '');
  },
  info: (message, meta) => {
    console.log(`[INFO] ${message}`, meta ? JSON.stringify(meta, null, 2) : '');
  }
};

/**
 * Custom Error class để tạo lỗi có thể điều khiển được
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Wrapper function để bắt lỗi async cho các route handlers
 * Tự động chuyển lỗi tới error handler middleware
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Middleware xử lý lỗi tập trung
 * Xử lý tất cả các lỗi được chuyển tới thông qua next(error)
 */
const errorHandler = (err, req, res, next) => {
  // Lấy thông tin request để log
  const requestInfo = {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id || 'anonymous'
  };
  
  // Log lỗi với thông tin chi tiết
  logger.error(`Error in ${req.method} ${req.originalUrl}`, { 
    error: err.message, 
    stack: err.stack,
    ...requestInfo 
  });

  // Xử lý các loại lỗi khác nhau
  
  // Lỗi validation của Mongoose
  if (err instanceof mongoose.Error.ValidationError) {
    const validationErrors = {};
    
    // Xử lý từng lỗi validation
    Object.keys(err.errors).forEach(key => {
      validationErrors[key] = err.errors[key].message;
    });
    
    return ResponseHandler.badRequest(res, validationErrors);
  }
  
  // Lỗi CastError của Mongoose (ví dụ: ID không đúng định dạng)
  if (err instanceof mongoose.Error.CastError) {
    return ResponseHandler.badRequest(res, { 
      [err.path]: `Giá trị không hợp lệ cho trường ${err.path}` 
    });
  }

  // Lỗi trùng key (ví dụ: đã tồn tại email)
  if (err.name === 'MongoError' && err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return ResponseHandler.badRequest(res, { 
      [field]: `${field} đã tồn tại.` 
    });
  }
    // Lỗi không tìm thấy (NotFoundError)
  if (err.name === 'NotFoundError') {
    return ResponseHandler.notFound(res, err.message || 'Not found');
  }

  // Lỗi xác thực (AuthenticationError)
  if (err.name === 'AuthenticationError') {
    return ResponseHandler.unauthorized(res, err.message || 'Authentication failed');
  }

  // Lỗi quyền truy cập (AccessDeniedError)
  if (err.name === 'AccessDeniedError') {
    return ResponseHandler.forbidden(res, err.message || 'Access denied');
  }
  
  // Lỗi validation (ValidationError) - từ Joi hoặc tự định nghĩa
  if (err.name === 'ValidationError') {
    return ResponseHandler.badRequest(res, err.details || err.message);
  }
  
  // Lỗi xử lý yêu cầu không hợp lệ
  if (err.name === 'BadRequestError') {
    return ResponseHandler.badRequest(res, null, err.message);
  }
  
  // Lỗi server mặc định nếu không phải các loại trên
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  return ResponseHandler.error(res, message, statusCode);
};

module.exports = {
  errorHandler,
  catchAsync,
  AppError
};
