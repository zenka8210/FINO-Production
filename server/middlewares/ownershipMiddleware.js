const mongoose = require('mongoose');
const ResponseHandler = require('../services/responseHandler');
const { MESSAGES, ROLES } = require('../config/constants');

/**
 * Middleware kiểm tra quyền sở hữu
 * @param {Object} options - Các tùy chọn
 * @param {string} options.model - Tên model (ví dụ: 'User', 'Order')
 * @param {string} options.idField - Tên trường trong request params chứa ID của resource (mặc định: 'id')
 * @param {string} options.ownerField - Tên trường trong model xác định người sở hữu (mặc định: 'user')
 * @returns {Function} Middleware function
 */
const ownershipMiddleware = (options = {}) => async (req, res, next) => {
  try {
    // Người dùng admin luôn có quyền truy cập
    if (req.user.role === ROLES.ADMIN) {
      return next();
    }

    // Lấy các tham số từ options
    const { 
      model,
      idField = 'id', 
      ownerField = 'user' 
    } = options;
    
    // Lấy ID resource từ request params
    const resourceId = req.params[idField];
    if (!resourceId || !mongoose.Types.ObjectId.isValid(resourceId)) {
      return ResponseHandler.badRequest(res, null, 'ID không hợp lệ');
    }

    // Nếu không có model cụ thể, chỉ kiểm tra nếu resourceId là ID của user
    if (!model) {
      if (req.user._id.toString() === resourceId) {
        return next();
      }
      return ResponseHandler.forbidden(res);
    }

    // Lấy model từ mongoose
    const Model = mongoose.model(model);
    if (!Model) {
      return ResponseHandler.error(res, `Model ${model} không tồn tại`, 500);
    }

    // Tìm resource và kiểm tra quyền sở hữu
    const resource = await Model.findById(resourceId);
    if (!resource) {
      return ResponseHandler.notFound(res);
    }

    // Kiểm tra quyền sở hữu
    const ownerId = resource[ownerField]?.toString?.() || resource[ownerField];
    const userId = req.user._id.toString();
    
    if (ownerId === userId) {
      return next();
    }

    // Không có quyền truy cập
    return ResponseHandler.forbidden(res);
  } catch (error) {
    return ResponseHandler.error(res, 'Lỗi khi kiểm tra quyền truy cập', 500, error);
  }
};

module.exports = ownershipMiddleware;
