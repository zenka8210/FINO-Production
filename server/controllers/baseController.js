const ResponseHandler = require('../services/responseHandler');

class BaseController {
  constructor(model) {
    this.model = model;
  }

  // Lấy tất cả bản ghi
  async getAll(req, res) {
    try {
      const items = await this.model.find();
      return ResponseHandler.success(res, items, 'Lấy dữ liệu thành công');
    } catch (error) {
      return ResponseHandler.error(res, 'Lỗi khi lấy dữ liệu', 500, error);
    }
  }

  // Lấy bản ghi theo ID
  async getById(req, res) {
    try {
      const item = await this.model.findById(req.params.id);
      if (!item) {
        return ResponseHandler.error(res, 'Không tìm thấy dữ liệu', 404);
      }
      return ResponseHandler.success(res, item, 'Lấy dữ liệu thành công');
    } catch (error) {
      return ResponseHandler.error(res, 'Lỗi khi truy vấn dữ liệu', 500, error);
    }
  }

  // Tạo bản ghi mới
  async create(req, res) {
    try {
      const item = await this.model.create(req.body);
      return ResponseHandler.success(res, item, 'Tạo mới thành công', 201);
    } catch (error) {
      return ResponseHandler.error(res, 'Lỗi khi tạo dữ liệu mới', 500, error);
    }
  }

  // Cập nhật bản ghi
  async update(req, res) {
    try {
      const item = await this.model.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );
      if (!item) {
        return ResponseHandler.error(res, 'Không tìm thấy dữ liệu để cập nhật', 404);
      }
      return ResponseHandler.success(res, item, 'Cập nhật thành công');
    } catch (error) {
      return ResponseHandler.error(res, 'Lỗi khi cập nhật dữ liệu', 500, error);
    }
  }

  // Xóa bản ghi
  async delete(req, res) {
    try {
      const item = await this.model.findByIdAndDelete(req.params.id);
      if (!item) {
        return ResponseHandler.error(res, 'Không tìm thấy dữ liệu để xóa', 404);
      }
      return ResponseHandler.success(res, null, 'Xóa thành công');
    } catch (error) {
      return ResponseHandler.error(res, 'Lỗi khi xóa dữ liệu', 500, error);
    }
  }
}

module.exports = BaseController;
