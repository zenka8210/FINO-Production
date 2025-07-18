const ResponseHandler = require('../services/responseHandler');
const { queryParserMiddleware } = require('../middlewares/queryMiddleware');
const AdminSortUtils = require('../utils/adminSortUtils');

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

  // Lấy tất cả với query middleware support
  getAll = async (req, res, next) => {
    try {
      // Use the enhanced getPaginated method if available
      let result;
      if (this.service.getPaginated) {
        result = await this.service.getPaginated(req.query);
      } else {
        // Fallback to legacy method
        const { page, limit, sort, ...filter } = req.query;
        
        // Apply admin sort if this is an admin request
        let sortConfig = sort ? JSON.parse(sort) : { createdAt: -1 };
        if (req.path.includes('/admin/') || req.user?.role === 'admin') {
          const modelName = this.service.Model?.modelName;
          sortConfig = AdminSortUtils.ensureAdminSort(req, modelName);
        }
        
        const options = {
          page: parseInt(page) || 1,
          limit: parseInt(limit) || 10,
          sort: sortConfig,
          filter,
          populate: req.query.populate || '',
          select: req.query.select || ''
        };
        result = await this.service.getAll(options);
      }

      // Handle different response formats
      if (result.data) {
        ResponseHandler.success(res, 'Lấy danh sách thành công', result.data, result.pagination);
      } else {
        ResponseHandler.success(res, 'Lấy danh sách thành công', result);
      }
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
