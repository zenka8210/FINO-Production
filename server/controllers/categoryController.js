const BaseController = require('./baseController');
const CategoryService = require('../services/categoryService');
const Category = require('../models/CategorySchema');
const ResponseHandler = require('../services/responseHandler');
const { QueryUtils } = require('../utils/queryUtils');
const AdminSortUtils = require('../utils/adminSortUtils');

class CategoryController extends BaseController {
    constructor() {
        super(new CategoryService());
    }

    // ============= BASIC CRUD OPERATIONS =============

    getAllCategories = async (req, res, next) => {
        try {
            // Use QueryBuilder if available, otherwise fallback to legacy
            if (req.createQueryBuilder) {
                const result = await req.createQueryBuilder(Category)
                    .search(['name', 'description'])
                    .applyFilters({
                        isActive: { type: 'boolean' },
                        parent: { type: 'objectId' },
                        level: { type: 'number' }
                    })
                    .execute();
                
                ResponseHandler.success(res, 'Lấy danh sách danh mục thành công', result);
            } else {
                // Fallback to legacy method
                const queryOptions = req.query;
                
                // Apply admin sort
                const sortConfig = AdminSortUtils.ensureAdminSort(req, 'Category');
                queryOptions.sort = sortConfig;
                
                const result = await this.service.getAllCategories(queryOptions);
                ResponseHandler.success(res, 'Lấy danh sách danh mục thành công', result);
            }
        } catch (error) {
            console.error('❌ CategoryController.getAllCategories error:', error.message);
            next(error);
        }
    };

    // Giữ lại method cũ để backward compatibility
    getAllCategoriesLegacy = async (req, res, next) => {
        try {
            const queryOptions = req.query;
            const result = await this.service.getAllCategories(queryOptions);
            ResponseHandler.success(res, 'Lấy danh sách danh mục thành công', result);
        } catch (error) {
            next(error);
        }
    };

    getCategoryById = async (req, res, next) => {
        try {
            const { id } = req.params;
            const category = await this.service.getCategoryById(id);
            ResponseHandler.success(res, 'Lấy chi tiết danh mục thành công', category);
        } catch (error) {
            next(error);
        }
    };

    createCategory = async (req, res, next) => {
        try {
            const categoryData = req.body;
            const newCategory = await this.service.createCategory(categoryData);
            ResponseHandler.success(res, 'Tạo danh mục thành công', newCategory, 201);
        } catch (error) {
            next(error);
        }
    };

    updateCategory = async (req, res, next) => {
        try {
            const { id } = req.params;
            const updateData = req.body;
            const updatedCategory = await this.service.updateCategory(id, updateData);
            ResponseHandler.success(res, 'Cập nhật danh mục thành công', updatedCategory);
        } catch (error) {
            next(error);
        }
    };

    deleteCategory = async (req, res, next) => {
        try {
            const { id } = req.params;
            const result = await this.service.deleteCategory(id);
            ResponseHandler.success(res, 'Vô hiệu hóa danh mục thành công. Danh mục đã bị ẩn khỏi hệ thống.', result);
        } catch (error) {
            next(error);
        }
    };

    permanentDeleteCategory = async (req, res, next) => {
        try {
            const { id } = req.params;
            const result = await this.service.permanentDeleteCategory(id);
            ResponseHandler.success(res, 'Xóa vĩnh viễn danh mục thành công. Danh mục đã bị xóa khỏi database.', result);
        } catch (error) {
            next(error);
        }
    };

    // ============= BUSINESS LOGIC ENDPOINTS =============

    /**
     * Get category tree with hierarchical structure
     */
    getCategoryTree = async (req, res, next) => {
        try {
            const tree = await this.service.getCategoryTree();
            ResponseHandler.success(res, 'Lấy cây danh mục thành công', tree);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Get root categories (categories without parent)
     */
    getRootCategories = async (req, res, next) => {
        try {
            const rootCategories = await this.service.getRootCategories();
            ResponseHandler.success(res, 'Lấy danh mục gốc thành công', rootCategories);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Get child categories of a specific category
     */
    getChildCategories = async (req, res, next) => {
        try {
            const { id } = req.params;
            const childCategories = await this.service.getChildCategories(id);
            ResponseHandler.success(res, 'Lấy danh mục con thành công', childCategories);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Get category path (breadcrumb)
     */
    getCategoryPath = async (req, res, next) => {
        try {
            const { id } = req.params;
            const path = await this.service.getCategoryPath(id);
            ResponseHandler.success(res, 'Lấy đường dẫn danh mục thành công', path);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Get category statistics (children count, products count, etc.)
     */
    getCategoryStats = async (req, res, next) => {
        try {
            const { id } = req.params;
            const stats = await this.service.getCategoryStats(id);
            ResponseHandler.success(res, 'Lấy thống kê danh mục thành công', stats);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Get admin statistics for all categories
     */
    getAdminStatistics = async (req, res, next) => {
        try {
            const stats = await this.service.getAdminStatistics();
            ResponseHandler.success(res, 'Lấy thống kê admin thành công', stats);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Check if category can be deleted
     */
    canDeleteCategory = async (req, res, next) => {
        try {
            const { id } = req.params;
            const result = await this.service.canDeleteCategory(id);
            ResponseHandler.success(res, 'Kiểm tra khả năng xóa danh mục', result);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Validate parent category
     */
    validateParentCategory = async (req, res, next) => {
        try {
            const { parentId, categoryId } = req.body;
            await this.service.validateParentCategory(parentId, categoryId);
            ResponseHandler.success(res, 'Danh mục cha hợp lệ', { valid: true });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Get category ancestors (parent hierarchy)
     */
    getCategoryAncestors = async (req, res, next) => {
        try {
            const { id } = req.params;
            const ancestors = await this.service.getCategoryAncestors(id);
            ResponseHandler.success(res, 'Lấy danh sách danh mục cha thành công', ancestors);
        } catch (error) {
            next(error);
        }
    };
}

module.exports = CategoryController;
