const BaseController = require('./baseController');
const TagService = require('../services/tagService');
const ResponseHandler = require('../services/responseHandler');

class TagController extends BaseController {
  constructor() {
    super();
    this.tagService = new TagService();
  }

  /**
   * Lấy tất cả tag với phân trang và tìm kiếm
   */
  getAllTags = async (req, res, next) => {
    try {
      const query = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        search: req.query.search || '',
        sortBy: req.query.sortBy || 'name',
        sortOrder: req.query.sortOrder || 'asc'
      };

      const result = await this.tagService.getAllTags(query);
      ResponseHandler.success(res, result.message, {
        tags: result.tags,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Lấy tag theo ID
   */
  getTagById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await this.tagService.getTagById(id);
      
      ResponseHandler.success(res, result.message, {
        tag: result.tag
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Lấy tag theo tên
   */
  getTagByName = async (req, res, next) => {
    try {
      const { name } = req.params;
      const result = await this.tagService.getTagByName(name);
      
      ResponseHandler.success(res, result.message, {
        tag: result.tag
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Tìm kiếm tag
   */
  searchTags = async (req, res, next) => {
    try {
      const { q } = req.query;
      const options = {
        limit: parseInt(req.query.limit) || 10
      };

      const result = await this.tagService.searchTags(q, options);
      
      ResponseHandler.success(res, result.message, {
        tags: result.tags
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Lấy tag phổ biến
   */
  getPopularTags = async (req, res, next) => {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const result = await this.tagService.getPopularTags(limit);
      
      ResponseHandler.success(res, result.message, {
        tags: result.tags
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Tạo tag mới (admin only)
   */
  createTag = async (req, res, next) => {
    try {
      const tagData = req.body;
      const result = await this.tagService.createTag(tagData);
      
      ResponseHandler.created(res, result.message, {
        tag: result.tag
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Cập nhật tag (admin only)
   */
  updateTag = async (req, res, next) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const result = await this.tagService.updateTag(id, updateData);
      
      ResponseHandler.success(res, result.message, {
        tag: result.tag
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Xóa tag (admin only)
   */
  deleteTag = async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await this.tagService.deleteTag(id);
      
      ResponseHandler.success(res, result.message);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Tạo tag hàng loạt (admin only)
   */
  createBulkTags = async (req, res, next) => {
    try {
      const { tagNames } = req.body;
      const result = await this.tagService.createBulkTags(tagNames);
      
      ResponseHandler.success(res, result.message, {
        results: result.results
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Kiểm tra tag có đang được sử dụng không (admin only)
   */
  checkTagUsage = async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await this.tagService.checkTagInUse(id);
      
      ResponseHandler.success(res, 'Kiểm tra sử dụng tag thành công', {
        usage: result
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Lấy thống kê tag (admin only)
   */
  getTagStatistics = async (req, res, next) => {
    try {
      const result = await this.tagService.getTagStatistics();
      
      ResponseHandler.success(res, result.message, {
        statistics: result.statistics
      });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new TagController();