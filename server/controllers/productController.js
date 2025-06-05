const Product = require('../models/productSchema');
const BaseController = require('./baseController');
const productService = require('../services/productService');
const ResponseHandler = require('../services/responseHandler');
const logger = require('../services/loggerService').getLogger('ProductController');
const { PAGINATION, MESSAGES } = require('../config/constants');

/**
 * Controller xử lý các request liên quan đến sản phẩm
 * Kế thừa từ BaseController
 */
class ProductController extends BaseController {
  constructor() {
    super(Product);
  }

  /**
   * [Admin] Tạo sản phẩm mới
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async createProduct(req, res, next) {
    try {
      const productData = req.body;
      const savedProduct = await productService.createProduct(productData, req.user);
      return ResponseHandler.created(res, MESSAGES.PRODUCT_CREATED, savedProduct);
    } catch (error) {
      logger.error('Lỗi khi tạo sản phẩm', { error: error.message });
      next(error);
    }
  }

  /**
   * Lấy danh sách tất cả sản phẩm (có phân trang và lọc)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getProducts(req, res, next) {
    try {
      // Xử lý các tham số query
      const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
      const limit = parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT;
      const category = req.query.category;
      const status = req.query.status;
      const isFeatured = req.query.isFeatured;
      const search = req.query.search;
      const sortBy = req.query.sortBy || 'createdAt';
      const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
      
      // Xây dựng filter
      const filter = {};
      if (category) filter.category = category;
      if (status) filter.status = status;
      if (isFeatured !== undefined) filter.isFeatured = isFeatured === 'true';
      if (search) filter.search = search;
      
      // Xây dựng options
      const options = {
        page,
        limit,
        sort: { [sortBy]: sortOrder }
      };
      
      // Lấy danh sách sản phẩm từ service
      const result = await productService.getProducts(filter, options);
      
      return ResponseHandler.success(res, result, 'Lấy danh sách sản phẩm thành công');
    } catch (error) {
      logger.error('Lỗi khi lấy danh sách sản phẩm', { error: error.message });
      next(error);
    }
  }

  /**
   * Lấy sản phẩm theo ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getProductById(req, res, next) {
    try {
      const productId = req.params.id;
      const product = await productService.getProductById(productId);
      
      return ResponseHandler.success(res, product, 'Lấy sản phẩm thành công');
    } catch (error) {
      logger.error('Lỗi khi lấy sản phẩm', { productId: req.params.id, error: error.message });
      next(error);
    }
  }

  /**
   * [Admin] Cập nhật sản phẩm
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateProduct(req, res, next) {
    try {
      const productId = req.params.id;
      const updateData = req.body;
      
      const updatedProduct = await productService.updateProduct(productId, updateData, req.user);
      
      return ResponseHandler.success(res, updatedProduct, MESSAGES.PRODUCT_UPDATED);
    } catch (error) {
      logger.error('Lỗi khi cập nhật sản phẩm', { productId: req.params.id, error: error.message });
      next(error);
    }
  }

  /**
   * [Admin] Xóa sản phẩm
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async deleteProduct(req, res, next) {
    try {
      const productId = req.params.id;
      await productService.deleteProduct(productId, req.user);
      
      return ResponseHandler.success(res, null, MESSAGES.PRODUCT_DELETED);
    } catch (error) {
      logger.error('Lỗi khi xóa sản phẩm', { productId: req.params.id, error: error.message });
      next(error);
    }
  }

  /**
   * Tìm kiếm sản phẩm
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async searchProducts(req, res, next) {
    try {
      const searchTerm = req.query.q || req.query.search;
      
      if (!searchTerm) {
        return ResponseHandler.badRequest(res, 'Vui lòng nhập từ khóa tìm kiếm');
      }

      const options = {
        page: parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE,
        limit: parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT,
        category: req.query.category,
        minPrice: req.query.minPrice ? parseFloat(req.query.minPrice) : undefined,
        maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice) : undefined,
        sortBy: req.query.sortBy || 'createdAt',
        sortOrder: req.query.sortOrder || 'desc'
      };
      
      const result = await productService.searchProducts(searchTerm, options);
      
      return ResponseHandler.success(res, result, 'Tìm kiếm sản phẩm thành công');
    } catch (error) {
      logger.error('Lỗi khi tìm kiếm sản phẩm', { error: error.message });
      next(error);
    }
  }

  /**
   * Lấy sản phẩm nổi bật
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getFeaturedProducts(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 8;
      const products = await productService.getFeaturedProducts(limit);
      
      return ResponseHandler.success(res, products, 'Lấy sản phẩm nổi bật thành công');
    } catch (error) {
      logger.error('Lỗi khi lấy sản phẩm nổi bật', { error: error.message });
      next(error);
    }
  }

  /**
   * Lấy sản phẩm theo category
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getProductsByCategory(req, res, next) {
    try {
      const categoryId = req.params.categoryId;
      const options = {
        page: parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE,
        limit: parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT,
        sort: { 
          [req.query.sortBy || 'createdAt']: req.query.sortOrder === 'asc' ? 1 : -1 
        }
      };
      
      const result = await productService.getProductsByCategory(categoryId, options);
      
      return ResponseHandler.success(res, result, 'Lấy sản phẩm theo danh mục thành công');
    } catch (error) {
      logger.error('Lỗi khi lấy sản phẩm theo category', { 
        categoryId: req.params.categoryId, 
        error: error.message 
      });
      next(error);
    }
  }

  /**
   * [Admin] Cập nhật trạng thái sản phẩm
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateProductStatus(req, res, next) {
    try {
      const productId = req.params.id;
      const { status } = req.body;
      
      const updatedProduct = await productService.updateProductStatus(productId, status, req.user);
      
      return ResponseHandler.success(res, updatedProduct, MESSAGES.PRODUCT_STATUS_UPDATED);
    } catch (error) {
      logger.error('Lỗi khi cập nhật trạng thái sản phẩm', { 
        productId: req.params.id, 
        error: error.message 
      });
      next(error);
    }
  }
}

// Tạo instance của ProductController
const productController = new ProductController();

// Export các methods với cú pháp tương thích
module.exports = {
  createProduct: productController.createProduct.bind(productController),
  getProducts: productController.getProducts.bind(productController),
  getProductById: productController.getProductById.bind(productController),
  updateProduct: productController.updateProduct.bind(productController),
  deleteProduct: productController.deleteProduct.bind(productController),
  searchProducts: productController.searchProducts.bind(productController),
  getFeaturedProducts: productController.getFeaturedProducts.bind(productController),
  getProductsByCategory: productController.getProductsByCategory.bind(productController),
  updateProductStatus: productController.updateProductStatus.bind(productController),
  
  // Các methods từ BaseController
  getAll: productController.getAll.bind(productController),
  getById: productController.getById.bind(productController),
  create: productController.create.bind(productController),
  update: productController.update.bind(productController),
  delete: productController.delete.bind(productController)
};