class ResponseHandler {
  static success(res, data, message = 'Thao tác thành công', status = 200) {
    return res.status(status).json({
      success: true,
      message,
      data
    });
  }

  static created(res, message = 'Tạo mới thành công', data = null) {
    return res.status(201).json({
      success: true,
      message,
      data
    });
  }

  static error(res, message = 'Đã xảy ra lỗi', status = 500, error = null) {
    return res.status(status).json({
      success: false,
      message,
      error: error?.message || error
    });
  }

  static badRequest(res, validationErrors = null, message = 'Dữ liệu không hợp lệ') {
    return res.status(400).json({
      success: false,
      message,
      validationErrors
    });
  }

  static unauthorized(res, message = 'Không có quyền truy cập') {
    return res.status(401).json({
      success: false,
      message
    });
  }

  static forbidden(res, message = 'Truy cập bị cấm') {
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

  static conflict(res, message = 'Xung đột dữ liệu') {
    return res.status(409).json({
      success: false,
      message
    });
  }

  static serverError(res, message = 'Lỗi máy chủ', error = null) {
    return res.status(500).json({
      success: false,
      message,
      error: process.env.NODE_ENV === 'production' ? null : error
    });
  }
}

module.exports = ResponseHandler;
