const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/productController');
const productController = new ProductController();
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const validateObjectId = require('../middlewares/validateObjectId');
const { queryParserMiddleware } = require('../middlewares/queryMiddleware');

// --- Tuyến đường công khai ---

// @route GET /api/products/available
// @desc Lấy sản phẩm có sẵn (chỉ sản phẩm còn hàng)
// @query includeVariants=true/false - để bao gồm/loại trừ các biến thể sản phẩm
// @access Public
router.get('/available', queryParserMiddleware(), productController.getAvailableProducts);

// @route GET /api/products/check-availability/:id
// @desc Kiểm tra tồn kho sản phẩm
// @access Public
router.get('/check-availability/:id', validateObjectId('id'), productController.checkProductAvailability);

// @route GET /api/products/check-variant-stock/:variantId
// @desc Kiểm tra tồn kho variant cụ thể
// @query quantity - số lượng muốn kiểm tra
// @access Public
router.get('/check-variant-stock/:variantId', validateObjectId('variantId'), productController.checkVariantStock);

// @route POST /api/products/validate-cart
// @desc Kiểm tra giỏ hàng trước khi checkout
// @body items - Array of {variantId, quantity}
// @access Public
router.post('/validate-cart', productController.validateCartItems);

// @route GET /api/products/:id/validate-display
// @desc Kiểm tra sản phẩm có thể hiển thị hay không
// @access Public
router.get('/:id/validate-display', validateObjectId('id'), productController.validateProductForDisplay);

// @route POST /api/products/check-add-to-cart
// @desc Kiểm tra có thể thêm vào giỏ hàng hay không
// @body variantId, quantity
// @access Public
router.post('/check-add-to-cart', productController.preventOutOfStockAddToCart);

// @route GET /api/products/public
// @desc Lấy tất cả sản phẩm (công khai, có phân trang, tìm kiếm, lọc, sắp xếp)
// @query includeVariants=true/false - để bao gồm/loại trừ các biến thể sản phẩm
// @access Public
router.get('/public', queryParserMiddleware(), productController.getAllProducts);

// @route GET /api/products/public-display
// @desc Lấy sản phẩm cho hiển thị công khai (homepage, product listing) - chỉ sản phẩm active và có stock
// @access Public
router.get('/public-display', productController.getPublicProducts);

// @route GET /api/products/public/:id
// @desc Lấy chi tiết sản phẩm công khai bằng ID (cho product details page)
// @query includeVariants=true/false - để bao gồm/loại trừ các biến thể sản phẩm
// @access Public
router.get('/public/:id', validateObjectId('id'), productController.getPublicProductById);

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
router.get('/', authMiddleware, adminMiddleware, queryParserMiddleware(), productController.getAllProducts);

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

// @route GET /api/products/admin/out-of-stock
// @desc Lấy tất cả sản phẩm hết hàng (Admin only)
// @access Private (Admin)
router.get('/admin/out-of-stock', authMiddleware, adminMiddleware, productController.getOutOfStockProducts);

// @route GET /api/products/admin/out-of-stock-notification
// @desc Lấy thông báo về sản phẩm hết hàng cho admin
// @access Admin
router.get('/admin/out-of-stock-notification', authMiddleware, adminMiddleware, productController.getOutOfStockNotification);

// @route GET /api/products/admin/statistics
// @desc Lấy thống kê tổng quan về sản phẩm cho admin dashboard
// @access Admin
router.get('/admin/statistics', authMiddleware, adminMiddleware, productController.getProductStatistics);

// @route GET /api/products/:id/validate-display-admin
// @desc Kiểm tra validation sản phẩm cho admin (có thể hiển thị hay không)
// @access Admin
router.get('/:id/validate-display-admin', authMiddleware, adminMiddleware, validateObjectId('id'), productController.validateProductForDisplay);

module.exports = router;
