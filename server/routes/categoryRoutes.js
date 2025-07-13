const express = require('express');
const router = express.Router();
const CategoryController = require('../controllers/categoryController');
const categoryController = new CategoryController();
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const validateObjectId = require('../middlewares/validateObjectId');
const { queryParserMiddleware } = require('../middlewares/queryMiddleware');

// ============= PUBLIC ROUTES =============

/**
 * @route   GET /api/categories/tree
 * @desc    Lấy cây danh mục phân cấp
 * @access  Public
 */
router.get('/tree', categoryController.getCategoryTree);

/**
 * @route   GET /api/categories/roots
 * @desc    Lấy tất cả danh mục gốc (không có parent)
 * @access  Public
 */
router.get('/roots', categoryController.getRootCategories);

/**
 * @route   GET /api/categories/:id/children
 * @desc    Lấy tất cả danh mục con của một danh mục cha cụ thể
 * @access  Public
 */
router.get('/:id/children', validateObjectId('id'), categoryController.getChildCategories);

/**
 * @route   GET /api/categories/:id/path
 * @desc    Lấy đường dẫn breadcrumb của danh mục
 * @access  Public
 */
router.get('/:id/path', validateObjectId('id'), categoryController.getCategoryPath);

/**
 * @route   GET /api/categories/:id/ancestors
 * @desc    Lấy danh sách danh mục cha (hierarchy)
 * @access  Public
 */
router.get('/:id/ancestors', validateObjectId('id'), categoryController.getCategoryAncestors);

/**
 * @route   GET /api/categories/public
 * @desc    Lấy tất cả danh mục công khai
 * @access  Public
 */
router.get('/public', queryParserMiddleware(), categoryController.getAllCategories);

/**
 * @route   GET /api/categories/:id/public
 * @desc    Lấy chi tiết danh mục công khai
 * @access  Public
 */
router.get('/:id/public', validateObjectId('id'), categoryController.getCategoryById);

// ============= ADMIN ROUTES (Require Auth and Admin Role) =============

/**
 * @route   GET /api/categories
 * @desc    Lấy tất cả danh mục (admin - có phân trang, tìm kiếm, filter)
 * @access  Private (Admin)
 */
router.get('/', authMiddleware, adminMiddleware, queryParserMiddleware(), categoryController.getAllCategories);

/**
 * @route   GET /api/categories/:id
 * @desc    Lấy chi tiết danh mục bằng ID (admin)
 * @access  Private (Admin)
 */
router.get('/:id', authMiddleware, adminMiddleware, validateObjectId('id'), categoryController.getCategoryById);

/**
 * @route   POST /api/categories
 * @desc    Tạo danh mục mới
 * @access  Private (Admin)
 */
router.post('/', authMiddleware, adminMiddleware, categoryController.createCategory);

/**
 * @route   PUT /api/categories/:id
 * @desc    Cập nhật danh mục bằng ID
 * @access  Private (Admin)
 */
router.put('/:id', authMiddleware, adminMiddleware, validateObjectId('id'), categoryController.updateCategory);

/**
 * @route   DELETE /api/categories/:id
 * @desc    Xóa danh mục bằng ID
 * @access  Private (Admin)
 */
router.delete('/:id', authMiddleware, adminMiddleware, validateObjectId('id'), categoryController.deleteCategory);

// ============= BUSINESS LOGIC ROUTES (Admin) =============

/**
 * @route   GET /api/categories/:id/stats
 * @desc    Lấy thống kê danh mục (số con, số sản phẩm, etc.)
 * @access  Private (Admin)
 */
router.get('/:id/stats', authMiddleware, adminMiddleware, validateObjectId('id'), categoryController.getCategoryStats);

/**
 * @route   GET /api/categories/:id/can-delete
 * @desc    Kiểm tra xem danh mục có thể xóa không
 * @access  Private (Admin)
 */
router.get('/:id/can-delete', authMiddleware, adminMiddleware, validateObjectId('id'), categoryController.canDeleteCategory);

/**
 * @route   POST /api/categories/validate-parent
 * @desc    Kiểm tra tính hợp lệ của danh mục cha
 * @access  Private (Admin)
 */
router.post('/validate-parent', authMiddleware, adminMiddleware, categoryController.validateParentCategory);

module.exports = router;
