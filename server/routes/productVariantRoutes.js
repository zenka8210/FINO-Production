const express = require('express');
const ProductVariantController = require('../controllers/productVariantController');
const protect = require('../middlewares/authMiddleware'); // Corrected: authMiddleware is the protect middleware
const restrictToAdmin = require('../middlewares/adminMiddleware'); 
const validateObjectId = require('../middlewares/validateObjectId');

const router = express.Router();
const productVariantController = new ProductVariantController();

// --- Admin Routes ---

/**
 * @route POST /api/v1/product-variants
 * @description Tạo một biến thể sản phẩm mới (yêu cầu quyền admin).
 * @access Private (Admin)
 * @body {String} product - ID của sản phẩm.
 * @body {String} color - ID của màu sắc.
 * @body {String} size - ID của kích thước.
 * @body {Number} price - Giá của biến thể.
 * @body {Number} stock - Số lượng tồn kho.
 * @body {Array<String>} [images] - Danh sách URL hình ảnh.
 */
router.post(
  '/',
  protect,
  restrictToAdmin,
  productVariantController.createProductVariant
);

/**
 * @route GET /api/v1/product-variants/admin
 * @description Lấy tất cả biến thể sản phẩm với tùy chọn lọc và phân trang (yêu cầu quyền admin).
 * @access Private (Admin)
 * @query {Number} [page] - Trang hiện tại.
 * @query {Number} [limit] - Số lượng kết quả mỗi trang.
 * @query {String} [sortBy] - Trường để sắp xếp (ví dụ: createdAt, price, stock).
 * @query {String} [sortOrder] - Thứ tự sắp xếp ('asc' hoặc 'desc').
 * @query {String} [product] - Lọc theo ID sản phẩm.
 * @query {String} [color] - Lọc theo ID màu sắc.
 * @query {String} [size] - Lọc theo ID kích thước.
 * @query {Number} [minPrice] - Lọc theo giá tối thiểu.
 * @query {Number} [maxPrice] - Lọc theo giá tối đa.
 * @query {Number} [minStock] - Lọc theo số lượng tồn kho tối thiểu.
 * @query {Number} [maxStock] - Lọc theo số lượng tồn kho tối đa.
 */
router.get(
  '/admin',
  protect,
  restrictToAdmin,
  productVariantController.getAllProductVariants
);

/**
 * @route GET /api/v1/product-variants/admin/:id
 * @description Lấy chi tiết một biến thể sản phẩm bằng ID (yêu cầu quyền admin).
 * @access Private (Admin)
 * @param {String} id - ID của biến thể sản phẩm.
 */
router.get(
  '/admin/:id',
  protect,
  restrictToAdmin,
  validateObjectId('id'),
  productVariantController.getProductVariantById
);

/**
 * @route PUT /api/v1/product-variants/:id
 * @description Cập nhật một biến thể sản phẩm bằng ID (yêu cầu quyền admin).
 * @access Private (Admin)
 * @param {String} id - ID của biến thể sản phẩm.
 * @body {String} [product] - ID của sản phẩm.
 * @body {String} [color] - ID của màu sắc.
 * @body {String} [size] - ID của kích thước.
 * @body {Number} [price] - Giá của biến thể.
 * @body {Number} [stock] - Số lượng tồn kho.
 * @body {Array<String>} [images] - Danh sách URL hình ảnh.
 */
router.put(
  '/:id',
  protect,
  restrictToAdmin,
  validateObjectId('id'),
  productVariantController.updateProductVariantById
);

/**
 * @route DELETE /api/v1/product-variants/:id
 * @description Xóa một biến thể sản phẩm bằng ID (yêu cầu quyền admin).
 * @access Private (Admin)
 * @param {String} id - ID của biến thể sản phẩm.
 */
router.delete(
  '/:id',
  protect,
  restrictToAdmin,
  validateObjectId('id'),
  productVariantController.deleteProductVariantById
);

/**
 * @route PATCH /api/v1/product-variants/:id/stock
 * @description Cập nhật số lượng tồn kho cho một biến thể sản phẩm (yêu cầu quyền admin).
 * @access Private (Admin)
 * @param {String} id - ID của biến thể sản phẩm.
 * @body {Number} quantityChange - Số lượng thay đổi (có thể âm để giảm).
 * @body {String} [operation='decrease'] - Thao tác ('increase' hoặc 'decrease').
 */
router.patch(
  '/:id/stock',
  protect,
  restrictToAdmin,
  validateObjectId('id'),
  productVariantController.updateStock
);

// --- Public Routes ---

/**
 * @route GET /api/v1/product-variants
 * @description Lấy tất cả biến thể sản phẩm với tùy chọn lọc và phân trang (công khai).
 * @access Public
 * @query {Number} [page] - Trang hiện tại.
 * @query {Number} [limit] - Số lượng kết quả mỗi trang.
 * @query {String} [sortBy] - Trường để sắp xếp (ví dụ: createdAt, price).
 * @query {String} [sortOrder] - Thứ tự sắp xếp ('asc' hoặc 'desc').
 * @query {String} [product] - Lọc theo ID sản phẩm.
 * @query {String} [color] - Lọc theo ID màu sắc.
 * @query {String} [size] - Lọc theo ID kích thước.
 * @query {Number} [minPrice] - Lọc theo giá tối thiểu.
 * @query {Number} [maxPrice] - Lọc theo giá tối đa.
 */
router.get(
  '/',
  productVariantController.getAllProductVariants
);

/**
 * @route GET /api/v1/product-variants/product/:productId
 * @description Lấy tất cả các biến thể cho một sản phẩm cụ thể (công khai).
 * @access Public
 * @param {String} productId - ID của sản phẩm.
 * @query {Number} [page] - Trang hiện tại.
 * @query {Number} [limit] - Số lượng kết quả mỗi trang.
 * @query {String} [sortBy] - Trường để sắp xếp.
 * @query {String} [sortOrder] - Thứ tự sắp xếp.
 * @query {String} [color] - Lọc theo ID màu sắc.
 * @query {String} [size] - Lọc theo ID kích thước.
 * @query {Number} [minPrice] - Lọc theo giá tối thiểu.
 * @query {Number} [maxPrice] - Lọc theo giá tối đa.
 */
router.get(
  '/product/:productId',
  validateObjectId('productId'),
  productVariantController.getVariantsByProductId
);

/**
 * @route GET /api/v1/product-variants/:id
 * @description Lấy chi tiết một biến thể sản phẩm bằng ID (công khai).
 * @access Public
 * @param {String} id - ID của biến thể sản phẩm.
 */
router.get(
  '/:id',
  validateObjectId('id'),
  productVariantController.getProductVariantById
);

module.exports = router;
