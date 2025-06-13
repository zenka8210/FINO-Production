const ResponseHandler = require('../services/responseHandler');

class BaseController {
  constructor(service) {
    this.service = service;
  }

  // Tạo mới
  create = async (req, res, next) => {
    try {
      const document = await this.service.create(req.body);
      ResponseHandler.created(res, 'Tạo thành công', document);
    } catch (error) {
      next(error);
    }
  };

  // Lấy tất cả
  getAll = async (req, res, next) => {
    try {
      const { page, limit, sort, ...filter } = req.query;
      const options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        sort: sort ? JSON.parse(sort) : { createdAt: -1 },
        filter,
        populate: req.query.populate || '',
        select: req.query.select || ''
      };

      const result = await this.service.getAll(options);
      ResponseHandler.success(res, 'Lấy danh sách thành công', result);
    } catch (error) {
      next(error);
    }
  };

  // Lấy theo ID
  getById = async (req, res, next) => {
    try {
      const document = await this.service.getById(req.params.id, req.query.populate || '');
      ResponseHandler.success(res, 'Lấy thông tin thành công', document);
    } catch (error) {
      next(error);
    }
  };

  // Cập nhật theo ID
  updateById = async (req, res, next) => {
    try {
      const document = await this.service.updateById(req.params.id, req.body);
      ResponseHandler.success(res, 'Cập nhật thành công', document);
    } catch (error) {
      next(error);
    }
  };

  // Xóa theo ID
  deleteById = async (req, res, next) => {
    try {
      await this.service.deleteById(req.params.id);
      ResponseHandler.success(res, 'Xóa thành công');
    } catch (error) {
      next(error);
    }
  };

  // Tìm kiếm
  search = async (req, res, next) => {
    try {
      const { q, fields, page, limit } = req.query;
      if (!q) {
        return ResponseHandler.badRequest(res, 'Thiếu từ khóa tìm kiếm');
      }

      const searchFields = fields ? fields.split(',') : ['name'];
      const options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10
      };

      const result = await this.service.search(q, searchFields, options);
      ResponseHandler.success(res, 'Tìm kiếm thành công', result);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = BaseController;
