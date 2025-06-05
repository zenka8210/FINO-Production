const express = require('express');
const router = express.Router();

const productController = require('../controllers/productController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const validateRequest = require('../middlewares/validateRequest');
const { 
  productCreateSchema, 
  productUpdateSchema, 
  productStatusUpdateSchema,
  productSearchSchema 
} = require('../middlewares/validationSchemas');

// ===== PUBLIC ROUTES =====

// Tìm kiếm sản phẩm (public) - phải đặt trước :id route
// GET http://localhost:5000/api/products/search?q=keyword
router.get('/search', 
  validateRequest(productSearchSchema, 'query'), 
  productController.searchProducts
);

// Lấy sản phẩm nổi bật (public) - phải đặt trước :id route
// GET http://localhost:5000/api/products/featured
router.get('/featured', 
  productController.getFeaturedProducts
);

// Lấy sản phẩm theo category (public) - phải đặt trước :id route
// GET http://localhost:5000/api/products/category/:categoryId
router.get('/category/:categoryId', 
  productController.getProductsByCategory
);

// Lấy danh sách sản phẩm (public)
// GET http://localhost:5000/api/products/
router.get('/', 
  productController.getProducts
);

// Lấy sản phẩm theo ID (public)
// GET http://localhost:5000/api/products/:id
router.get('/:id', 
  productController.getProductById
);

// ===== ADMIN ROUTES =====

// Tạo sản phẩm mới (chỉ admin)
// POST http://localhost:5000/api/products/
router.post('/', 
  authMiddleware, 
  adminMiddleware, 
  validateRequest(productCreateSchema), 
  productController.createProduct
);

// Cập nhật sản phẩm (chỉ admin)
// PUT http://localhost:5000/api/products/:id
router.put('/:id', 
  authMiddleware, 
  adminMiddleware, 
  validateRequest(productUpdateSchema), 
  productController.updateProduct
);

// Cập nhật trạng thái sản phẩm (chỉ admin)
// PATCH http://localhost:5000/api/products/:id/status
router.patch('/:id/status', 
  authMiddleware, 
  adminMiddleware, 
  validateRequest(productStatusUpdateSchema), 
  productController.updateProductStatus
);

// Xóa sản phẩm (chỉ admin)
// DELETE http://localhost:5000/api/products/:id
router.delete('/:id', 
  authMiddleware, 
  adminMiddleware, 
  productController.deleteProduct
);

module.exports = router;
