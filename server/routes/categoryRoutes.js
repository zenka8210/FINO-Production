const express = require('express');
const router = express.Router();
const CategoryController = require('../controllers/categoryController');
const categoryController = new CategoryController();
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const validateObjectId = require('../middlewares/validateObjectId');

// --- Public Routes ---

/**
 * @route   GET /api/categories/parents
 * @desc    Lấy tất cả danh mục cha (không có parent)
 * @access  Public
 */
router.get('/parents', categoryController.getParentCategories);

/**
 * @route   GET /api/categories/:parentId/children
 * @desc    Lấy tất cả danh mục con của một danh mục cha cụ thể
 * @access  Public
 */
router.get('/:parentId/children', validateObjectId('parentId'), categoryController.getChildCategories);

/**
 * @route   GET /api/categories/public
 * @desc    Lấy tất cả danh mục (có thể dùng cho client, có thể có filter đơn giản nếu cần, ví dụ: chỉ lấy name, _id)
 * @access  Public
 */
router.get('/public', categoryController.getAllCategories); // Sử dụng lại getAllCategories, client có thể query parent=null

/**
 * @route   GET /api/categories/:id/public
 * @desc    Lấy chi tiết một danh mục (public)
 * @access  Public
 */
router.get('/:id/public', validateObjectId('id'), categoryController.getCategoryById);


// --- Admin Routes (Require Auth and Admin Role) ---

/**
 * @route   GET /api/categories
 * @desc    Lấy tất cả danh mục (cho admin, có phân trang, tìm kiếm, filter theo parent)
 * @access  Private (Admin)
 */
router.get('/', authMiddleware, adminMiddleware, categoryController.getAllCategories);

/**
 * @route   GET /api/categories/:id
 * @desc    Lấy chi tiết danh mục bằng ID (cho admin)
 * @access  Private (Admin)
 */
router.get('/:id', authMiddleware, adminMiddleware, validateObjectId('id'), categoryController.getCategoryById);

/**
 * @route   POST /api/categories
 * @desc    Tạo danh mục mới (cho admin)
 * @access  Private (Admin)
 */
router.post('/', authMiddleware, adminMiddleware, categoryController.createCategory);

/**
 * @route   PUT /api/categories/:id
 * @desc    Cập nhật danh mục bằng ID (cho admin)
 * @access  Private (Admin)
 */
router.put('/:id', authMiddleware, adminMiddleware, validateObjectId('id'), categoryController.updateCategory);

/**
 * @route   DELETE /api/categories/:id
 * @desc    Xóa danh mục bằng ID (cho admin)
 * @access  Private (Admin)
 */
router.delete('/:id', authMiddleware, adminMiddleware, validateObjectId('id'), categoryController.deleteCategory);

module.exports = router;
