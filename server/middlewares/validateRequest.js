const Joi = require('joi');
const ResponseHandler = require('../services/responseHandler');

/**
 * Middleware kiểm tra tính hợp lệ của request
 * @param {Object} schema - Joi schema để validate
 * @param {String} property - Thuộc tính của request để validate ('body', 'query', 'params')
 * @returns {Function} Middleware function
 */
const validateRequest = (schema, property = 'body') => {
  return (req, res, next) => {
    // Lấy dữ liệu từ request dựa trên property
    const data = req[property];
    
    // Validate với schema
    const { error, value } = schema.validate(data, {
      abortEarly: false, // Hiển thị tất cả lỗi, không dừng lại ở lỗi đầu tiên
      allowUnknown: true, // Cho phép các trường không định nghĩa trong schema
      stripUnknown: true, // Loại bỏ các trường không định nghĩa trong schema
    });

    // Nếu có lỗi validation
    if (error) {
      // Tạo object chứa các lỗi validation
      const errors = error.details.reduce((acc, curr) => {
        const path = curr.path.join('.');
        acc[path] = curr.message.replace(/["']/g, '');
        return acc;
      }, {});

      return ResponseHandler.badRequest(res, errors);
    }

    // Gán lại giá trị đã validate vào request
    req[property] = value;
    return next();
  };
};

module.exports = validateRequest;
