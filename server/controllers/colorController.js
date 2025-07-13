const BaseController = require('./baseController');
const ColorService = require('../services/colorService');
const Color = require('../models/ColorSchema');
const ResponseHandler = require('../services/responseHandler');
const { MESSAGES, PAGINATION } = require('../config/constants');
const { QueryBuilder } = require('../middlewares/queryMiddleware');

class ColorController extends BaseController {
  constructor() {
    super(new ColorService());
  }

  // ============= BASIC CRUD OPERATIONS =============

  getAllColors = async (req, res, next) => {
    try {
      const result = await req.createQueryBuilder(Color)
        .search(['name', 'hexCode'])
        .applyFilters()
        .execute();

      return ResponseHandler.success(res, 'Lấy danh sách màu sắc thành công', result);
    } catch (error) {
      next(error);
    }
  };

  // Giữ lại method cũ để backward compatibility
  getAllColorsLegacy = async (req, res, next) => {
    try {
      const queryOptions = req.query;
      const result = await this.service.getAllColors(queryOptions);
      ResponseHandler.success(res, 'Lấy danh sách màu sắc thành công', result);
    } catch (error) {
      next(error);
    }
  };

  getColorById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const color = await this.service.getColorById(id);
      ResponseHandler.success(res, 'Lấy thông tin màu sắc thành công', color);
    } catch (error) {
      next(error);
    }
  };

  createColor = async (req, res, next) => {
    try {
      const colorData = req.body;
      const newColor = await this.service.createColor(colorData);
      ResponseHandler.success(res, 'Tạo màu sắc thành công', newColor, 201);
    } catch (error) {
      next(error);
    }
  };

  updateColor = async (req, res, next) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const updatedColor = await this.service.updateColor(id, updateData);
      ResponseHandler.success(res, 'Cập nhật màu sắc thành công', updatedColor);
    } catch (error) {
      next(error);
    }
  };

  deleteColor = async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await this.service.deleteColor(id);
      ResponseHandler.success(res, result.message);
    } catch (error) {
      next(error);
    }
  };

  // ============= BUSINESS LOGIC ENDPOINTS =============

  /**
   * Kiểm tra màu có thể xóa không (Business Logic)
   * Đảm bảo: Màu có thể được tái sử dụng, không xóa nếu đang được sử dụng
   */
  canDeleteColor = async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await this.service.canDeleteColor(id);
      ResponseHandler.success(res, 'Kiểm tra khả năng xóa màu sắc', result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Tìm kiếm màu theo tên hoặc gợi ý (Business Logic)
   * Đảm bảo: Hỗ trợ tái sử dụng màu có sẵn
   */
  findByNameOrSuggest = async (req, res, next) => {
    try {
      const { name } = req.query;
      if (!name) {
        return ResponseHandler.badRequest(res, 'Tên màu sắc là bắt buộc');
      }
      
      const result = await this.service.findByNameOrSuggest(name);
      ResponseHandler.success(res, 'Kết quả tìm kiếm màu sắc', result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Lấy thống kê sử dụng màu (Business Logic)
   */
  getColorUsageStats = async (req, res, next) => {
    try {
      const { id } = req.params;
      const stats = await this.service.getColorUsageStats(id);
      ResponseHandler.success(res, 'Thống kê sử dụng màu sắc', stats);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Validate màu có thể sử dụng không
   */
  validateColorForUse = async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await this.service.validateColorForUse(id);
      ResponseHandler.success(res, 'Kiểm tra tính hợp lệ của màu sắc', result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Lấy gợi ý màu phổ biến
   */
  getSuggestedColors = async (req, res, next) => {
    try {
      const suggestions = this.service.getColorSuggestions();
      ResponseHandler.success(res, 'Danh sách màu gợi ý', { suggestions });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Validate tên màu (Business Logic)
   * Đảm bảo: Tên màu phải duy nhất và hợp lệ
   */
  validateColorName = async (req, res, next) => {
    try {
      const { name, excludeId } = req.body;
      
      // Check if name is provided
      if (!name) {
        return ResponseHandler.badRequest(res, 'Tên màu sắc là bắt buộc');
      }
      
      await this.service.validateColorNameUniqueness(name, excludeId);
      ResponseHandler.success(res, 'Tên màu sắc hợp lệ', { valid: true });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = ColorController;
