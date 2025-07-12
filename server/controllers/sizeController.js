const BaseController = require('./baseController');
const SizeService = require('../services/sizeService');
const ResponseHandler = require('../services/responseHandler');
const { MESSAGES } = require('../config/constants');

class SizeController extends BaseController {
  constructor() {
    super(new SizeService());
  }

  getAllSizes = async (req, res, next) => {
    try {
      const queryOptions = req.query;
      const result = await this.service.getAllSizes(queryOptions);
      ResponseHandler.success(res, 'Lấy danh sách kích thước thành công', result);
    } catch (error) {
      next(error);
    }
  };

  getSizeById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const size = await this.service.getSizeById(id);
      ResponseHandler.success(res, 'Lấy chi tiết kích thước thành công', size);
    } catch (error) {
      next(error);
    }
  };
  createSize = async (req, res, next) => {
    try {
      const sizeData = req.body;
      const newSize = await this.service.createSize(sizeData);
      ResponseHandler.success(res, 'Tạo kích thước thành công', newSize, 201);
    } catch (error) {
      next(error);
    }
  };

  updateSize = async (req, res, next) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const updatedSize = await this.service.updateSize(id, updateData);
      ResponseHandler.success(res, 'Cập nhật kích thước thành công', updatedSize);
    } catch (error) {
      next(error);
    }
  };

  deleteSize = async (req, res, next) => {
    try {
      const { id } = req.params;
      await this.service.deleteSize(id);
      ResponseHandler.success(res, 'Xóa kích thước thành công');
    } catch (error) {
      next(error);
    }
  };

  // Business Rules Endpoints
  validateSizeName = async (req, res, next) => {
    try {
      const { name, excludeId } = req.body;
      this.service.validateSizeName(name);
      await this.service.validateSizeUniqueness(name, excludeId);
      ResponseHandler.success(res, 'Tên kích thước hợp lệ', { valid: true });
    } catch (error) {
      next(error);
    }
  };

  getSizeUsageStats = async (req, res, next) => {
    try {
      const { id } = req.params;
      const stats = await this.service.getSizeUsageStats(id);
      ResponseHandler.success(res, 'Thống kê sử dụng kích thước', stats);
    } catch (error) {
      next(error);
    }
  };

  getValidSizesByCategory = async (req, res, next) => {
    try {
      const { category } = req.params;
      const validSizes = this.service.getValidSizesByCategory(category);
      ResponseHandler.success(res, 'Danh sách kích thước hợp lệ theo danh mục', { category, validSizes });
    } catch (error) {
      next(error);
    }
  };

  checkSizeDeletion = async (req, res, next) => {
    try {
      const { id } = req.params;
      await this.service.canDeleteSize(id);
      ResponseHandler.success(res, 'Kích thước có thể xóa', { canDelete: true });
    } catch (error) {
      next(error);
    }
  };

  getAllValidSizes = async (req, res, next) => {
    try {
      const validSizes = this.service.constructor.VALID_SIZES;
      ResponseHandler.success(res, 'Danh sách tất cả kích thước hợp lệ', { validSizes });
    } catch (error) {
      next(error);
    }
  };

  getSuggestedSizes = async (req, res, next) => {
    try {
      const { category } = req.params;
      const suggestedSizes = category 
        ? await this.service.getSuggestedSizesByCategory(category)
        : await this.service.getAllSuggestedSizes();
      
      ResponseHandler.success(res, 'Danh sách size đề xuất', { 
        category: category || 'all',
        suggestedSizes 
      });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = SizeController;
