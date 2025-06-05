const BaseController = require('./baseController');
const CategoryService = require('../services/categoryService');
const ResponseHandler = require('../services/responseHandler');

class CategoryController extends BaseController {
  constructor() {
    super();
    this.categoryService = new CategoryService();
  }

  /**
   * Lấy tất cả danh mục với phân trang và tìm kiếm
   */
  getAllCategories = async (req, res, next) => {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        search: req.query.search || '',
        parentOnly: req.query.parentOnly === 'true',
        includeChildren: req.query.includeChildren !== 'false'
      };

      const result = await this.categoryService.getAllCategories(options);
      ResponseHandler.success(res, result.message, {
        categories: result.categories,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Lấy danh mục theo ID
   */
  getCategoryById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await this.categoryService.getCategoryById(id);
      
      ResponseHandler.success(res, result.message, {
        category: result.category
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Tạo danh mục mới
   */
  createCategory = async (req, res, next) => {
    try {
      const categoryData = {
        ...req.body,
        createdBy: req.user?.id
      };

      const result = await this.categoryService.createCategory(categoryData);
      ResponseHandler.created(res, result.message, {
        category: result.category
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Cập nhật danh mục
   */
  updateCategory = async (req, res, next) => {
    try {
      const { id } = req.params;
      const updateData = {
        ...req.body,
        updatedBy: req.user?.id
      };

      const result = await this.categoryService.updateCategory(id, updateData);
      ResponseHandler.success(res, result.message, {
        category: result.category
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Xóa danh mục
   */
  deleteCategory = async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await this.categoryService.deleteCategory(id);
      
      ResponseHandler.success(res, result.message, {
        deletedCategory: result.deletedCategory
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Lấy cây danh mục (danh mục cha và con)
   */
  getCategoryTree = async (req, res, next) => {
    try {
      const result = await this.categoryService.getCategoryTree();
      ResponseHandler.success(res, result.message, {
        categories: result.categories
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Tìm kiếm danh mục
   */
  searchCategories = async (req, res, next) => {
    try {
      const { q } = req.query;
      const options = {
        limit: parseInt(req.query.limit) || 10
      };

      const result = await this.categoryService.searchCategories(q, options);
      ResponseHandler.success(res, result.message, {
        categories: result.categories,
        searchTerm: result.searchTerm
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Lấy danh mục cha (root categories)
   */
  getParentCategories = async (req, res, next) => {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 50,
        parentOnly: true,
        includeChildren: req.query.includeChildren === 'true'
      };

      const result = await this.categoryService.getAllCategories(options);
      ResponseHandler.success(res, result.message, {
        categories: result.categories,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new CategoryController();