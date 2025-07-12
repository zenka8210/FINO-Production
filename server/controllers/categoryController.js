const BaseController = require('./baseController');
const CategoryService = require('../services/categoryService');
const ResponseHandler = require('../services/responseHandler');
const { MESSAGES } = require('../config/constants');

class CategoryController extends BaseController {
  constructor() {
    super(new CategoryService());
  }

  getAllCategories = async (req, res, next) => {
    try {
      const queryOptions = req.query;
      const result = await this.service.getAllCategories(queryOptions);
      ResponseHandler.success(res, MESSAGES.CATEGORY_CREATED || 'Categories retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  };

  getCategoryById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const category = await this.service.getCategoryById(id);
      ResponseHandler.success(res, MESSAGES.CATEGORY_UPDATED || 'Category retrieved successfully', category);
    } catch (error) {
      next(error);
    }
  };

  createCategory = async (req, res, next) => {
    try {
      const categoryData = req.body;
      const newCategory = await this.service.createCategory(categoryData);
      ResponseHandler.created(res, MESSAGES.CATEGORY_CREATED, newCategory);
    } catch (error) {
      next(error);
    }
  };

  updateCategory = async (req, res, next) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const updatedCategory = await this.service.updateCategory(id, updateData);
      ResponseHandler.success(res, MESSAGES.CATEGORY_UPDATED, updatedCategory);
    } catch (error) {
      next(error);
    }
  };

  deleteCategory = async (req, res, next) => {
    try {
      const { id } = req.params;
      await this.service.deleteCategory(id);
      ResponseHandler.success(res, MESSAGES.CATEGORY_DELETED, null);
    } catch (error) {
      next(error);
    }
  };

  // Get parent categories
  getParentCategories = async (req, res, next) => {
    try {
      const categories = await this.service.getParentCategories();
      ResponseHandler.success(res, 'Parent categories retrieved successfully', categories);
    } catch (error) {
      next(error);
    }
  };

  // Get child categories of a specific parent
  getChildCategories = async (req, res, next) => {
    try {
      const { parentId } = req.params;
      const categories = await this.service.getChildCategories(parentId);
      ResponseHandler.success(res, 'Child categories retrieved successfully', categories);
    } catch (error) {
      next(error);
    }
  };

  // Validate category name
  validateCategoryName = async (req, res, next) => {
    try {
      const { name, excludeId } = req.body;
      const result = await this.service.validateCategoryName(name, excludeId);
      ResponseHandler.success(res, 'Tên danh mục hợp lệ', result);
    } catch (error) {
      next(error);
    }
  };

  // Check if category can be deleted
  checkCategoryDeletion = async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await this.service.canDeleteCategory(id);
      ResponseHandler.success(res, 'Kiểm tra xóa danh mục', result);
    } catch (error) {
      next(error);
    }
  };

  // Get category tree
  getCategoryTree = async (req, res, next) => {
    try {
      const tree = await this.service.getCategoryTree();
      ResponseHandler.success(res, 'Cây danh mục', { tree });
    } catch (error) {
      next(error);
    }
  };

  // Get category usage statistics
  getCategoryUsageStats = async (req, res, next) => {
    try {
      const { id } = req.params;
      const stats = await this.service.getCategoryUsageStats(id);
      ResponseHandler.success(res, 'Thống kê sử dụng danh mục', stats);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = CategoryController;
