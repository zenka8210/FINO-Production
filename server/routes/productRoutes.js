const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/productController');
const productController = new ProductController();
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const validateObjectId = require('../middlewares/validateObjectId');

// --- Tuyến đường công khai ---

// @route GET /api/products/public
// @desc Lấy tất cả sản phẩm (công khai, có phân trang, tìm kiếm, lọc, sắp xếp)
// @query includeVariants=true/false - để bao gồm/loại trừ các biến thể sản phẩm
// @access Public
router.get('/public', productController.getAllProducts);

// @route GET /api/products/public/:id
// @desc Lấy chi tiết một sản phẩm bằng ID (công khai)
// @query includeVariants=true/false - để bao gồm/loại trừ các biến thể sản phẩm
// @access Public
router.get('/public/:id', validateObjectId('id'), productController.getProductById);

// @route GET /api/products/category/:categoryId/public
// @desc Lấy sản phẩm theo danh mục (công khai)
// @query includeVariants=true/false - để bao gồm/loại trừ các biến thể sản phẩm
// @access Public
router.get('/category/:categoryId/public', validateObjectId('categoryId'), productController.getProductsByCategory);


// --- Tuyến đường cho quản trị viên (Yêu cầu xác thực và quyền admin) ---

// @route GET /api/products
// @desc Lấy tất cả sản phẩm (cho admin, có phân trang, tìm kiếm, lọc, sắp xếp)
// @query includeVariants=true/false - để bao gồm/loại trừ các biến thể sản phẩm
// @access Private (Admin)
router.get('/', authMiddleware, adminMiddleware, productController.getAllProducts);

// @route GET /api/products/:id
// @desc Lấy chi tiết sản phẩm bằng ID (cho admin)
// @query includeVariants=true/false - để bao gồm/loại trừ các biến thể sản phẩm
// @access Private (Admin)
router.get('/:id', authMiddleware, adminMiddleware, validateObjectId('id'), productController.getProductById);

// @route POST /api/products
// @desc Tạo sản phẩm mới (cho admin)
// @access Private (Admin)
router.post('/', authMiddleware, adminMiddleware, productController.createProduct);

// @route PUT /api/products/:id
// @desc Cập nhật sản phẩm bằng ID (cho admin)
// @access Private (Admin)
router.put('/:id', authMiddleware, adminMiddleware, validateObjectId('id'), productController.updateProduct);

// @route DELETE /api/products/:id
// @desc Xóa sản phẩm bằng ID (cho admin)
// @note Service sẽ kiểm tra xem sản phẩm có biến thể không trước khi xóa
// @access Private (Admin)
router.delete('/:id', authMiddleware, adminMiddleware, validateObjectId('id'), productController.deleteProduct);

module.exports = router;
