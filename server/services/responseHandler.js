class ResponseHandler {
  static success(res, message = 'Thành công', data = null, statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data
    });
  }

  static created(res, message = 'Tạo thành công', data = null) {
    return res.status(201).json({
      success: true,
      message,
      data
    });
  }

  static badRequest(res, message = 'Yêu cầu không hợp lệ', errors = null) {
    return res.status(400).json({
      success: false,
      message,
      errors
    });
  }

  static unauthorized(res, message = 'Không có quyền truy cập') {
    return res.status(401).json({
      success: false,
      message
    });
  }

  static forbidden(res, message = 'Truy cập bị từ chối') {
    return res.status(403).json({
      success: false,
      message
    });
  }

  static notFound(res, message = 'Không tìm thấy dữ liệu') {
    return res.status(404).json({
      success: false,
      message
    });
  }

  static conflict(res, message = 'Dữ liệu đã tồn tại') {
    return res.status(409).json({
      success: false,
      message
    });
  }

  static error(res, message = 'Lỗi server', statusCode = 500) {
    return res.status(statusCode).json({
      success: false,
      message
    });
  }

  static validationError(res, errors) {
    return res.status(422).json({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      errors
    });
  }

  static paginatedResponse(res, message, data, pagination) {
    return res.status(200).json({
      success: true,
      message,
      data,
      pagination
    });
  }
}

module.exports = ResponseHandler;
