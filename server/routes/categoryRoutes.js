const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const validateRequest = require('../middlewares/validateRequest');
const { categorySchemas } = require('../middlewares/validationSchemas');
const authenticateToken = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

// Public routes - Các route công khai

// GET /api/categories - Lấy tất cả danh mục (có phân trang)
router.get('/', categoryController.getAllCategories);

// GET /api/categories/tree - Lấy cây danh mục
router.get('/tree', categoryController.getCategoryTree);

// GET /api/categories/parents - Lấy danh mục cha
router.get('/parents', categoryController.getParentCategories);

// GET /api/categories/search - Tìm kiếm danh mục
router.get('/search', categoryController.searchCategories);

// GET /api/categories/:id - Lấy danh mục theo ID
router.get('/:id', categoryController.getCategoryById);

// Admin routes - Các route yêu cầu quyền admin

// POST /api/categories - Tạo danh mục mới
router.post('/', 
  authenticateToken, 
  adminMiddleware, 
  validateRequest(categorySchemas.create), 
  categoryController.createCategory
);

// PUT /api/categories/:id - Cập nhật danh mục
router.put('/:id', 
  authenticateToken, 
  adminMiddleware, 
  validateRequest(categorySchemas.create), 
  categoryController.updateCategory
);

// DELETE /api/categories/:id - Xóa danh mục
router.delete('/:id', 
  authenticateToken, 
  adminMiddleware, 
  categoryController.deleteCategory
);

module.exports = router;