const express = require('express');
const ProductVariantController = require('../controllers/productVariantController');
const protect = require('../middlewares/authMiddleware'); // Corrected: authMiddleware is the protect middleware
const restrictToAdmin = require('../middlewares/adminMiddleware'); 
const validateObjectId = require('../middlewares/validateObjectId');
const { queryParserMiddleware } = require('../middlewares/queryMiddleware');

const router = express.Router();
const productVariantController = new ProductVariantController();

// --- Business Rules Endpoints (must come before generic routes) ---

/**
 * @route POST /api/v1/product-variants/validate-cart-addition
 * @description Kiểm tra xem variant có thể thêm vào giỏ hàng không
 * @access Public
 * @body {String} variantId - ID của variant
 * @body {Number} quantity - Số lượng muốn thêm
 */
router.post(
  '/validate-cart-addition',
  productVariantController.validateCartAddition
);

/**
 * @route POST /api/v1/product-variants/validate-requirements
 * @description Kiểm tra color và size có hợp lệ không
 * @access Public
 * @body {String} product - ID của sản phẩm
 * @body {String} color - ID của màu sắc
 * @body {String} size - ID của kích thước
 */
router.post(
  '/validate-requirements',
  productVariantController.validateVariantRequirements
);

/**
 * @route GET /api/v1/product-variants/:id/check-deletion
 * @description Kiểm tra xem variant có thể xóa an toàn không
 * @access Private (Admin)
 * @param {String} id - ID của variant
 */
router.get(
  '/:id/check-deletion',
  protect,
  restrictToAdmin,
  validateObjectId('id'),
  productVariantController.checkVariantDeletion
);

/**
 * @route GET /api/v1/product-variants/admin/out-of-stock
 * @description Lấy danh sách tất cả variant hết hàng (Admin)
 * @access Private (Admin)
 * @query {Number} [page] - Trang hiện tại
 * @query {Number} [limit] - Số lượng kết quả mỗi trang
 * @query {String} [product] - Lọc theo ID sản phẩm
 */
router.get(
  '/admin/out-of-stock',
  protect,
  restrictToAdmin,
  productVariantController.getOutOfStockVariants
);

/**
 * @route GET /api/v1/product-variants/product/:productId/stock-status
 * @description Kiểm tra tình trạng tồn kho của tất cả variant của một sản phẩm
 * @access Public
 * @param {String} productId - ID của sản phẩm
 */
router.get(
  '/product/:productId/stock-status',
  validateObjectId('productId'),
  productVariantController.checkProductOutOfStock
);

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
 * @route PUT /api/v1/product-variants/:id/stock
 * @description Cập nhật tồn kho cho biến thể sản phẩm (yêu cầu quyền admin).
 * @access Private (Admin)
 * @param {String} id - ID của biến thể sản phẩm.
 * @body {Number} quantityChange - Số lượng thay đổi.
 * @body {String} operation - Loại thao tác ('increase' hoặc 'decrease').
 */
router.put(
  '/:id/stock',
  protect,
  restrictToAdmin,
  validateObjectId('id'),
  productVariantController.updateStock
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
