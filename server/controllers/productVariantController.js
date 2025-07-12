const BaseController = require('./baseController');
const ProductVariantService = require('../services/productVariantService');
const ResponseHandler = require('../services/responseHandler');
const { productVariantMessages, generalMessages, PAGINATION } = require('../config/constants');

class ProductVariantController extends BaseController {
  constructor() {
    super(new ProductVariantService());
  }

  createProductVariant = async (req, res, next) => {
    try {
      const newVariant = await this.service.createProductVariant(req.body);
      ResponseHandler.success(res, productVariantMessages.CREATE_SUCCESS, newVariant, 201);
    } catch (error) {
      next(error);
    }
  };

  getAllProductVariants = async (req, res, next) => {
    try {
      const queryOptions = {
        page: req.query.page || PAGINATION.DEFAULT_PAGE,
        limit: req.query.limit || PAGINATION.DEFAULT_LIMIT,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder,
        product: req.query.product,
        color: req.query.color,
        size: req.query.size,
        minPrice: req.query.minPrice,
        maxPrice: req.query.maxPrice,
        minStock: req.query.minStock,
        maxStock: req.query.maxStock
      };
      const { data, pagination } = await this.service.getAllProductVariants(queryOptions);
      ResponseHandler.success(res, productVariantMessages.FETCH_ALL_SUCCESS, data, pagination);
    } catch (error) {
      next(error);
    }
  };
  getProductVariantById = async (req, res, next) => {
    try {
      const variant = await this.service.getProductVariantById(req.params.id);
      ResponseHandler.success(res, productVariantMessages.FETCH_ONE_SUCCESS, variant);
    } catch (error) {
      next(error);
    }
  };

  updateProductVariantById = async (req, res, next) => {
    try {
      const updatedVariant = await this.service.updateProductVariantById(req.params.id, req.body);
      ResponseHandler.success(res, productVariantMessages.UPDATE_SUCCESS, updatedVariant);
    } catch (error) {
      next(error);
    }
  };

  deleteProductVariantById = async (req, res, next) => {
    try {
      await this.service.deleteProductVariantById(req.params.id);
      ResponseHandler.success(res, productVariantMessages.VARIANT_DELETED_SUCCESSFULLY);
    } catch (error) {
      next(error);
    }
  };

  getVariantsByProductId = async (req, res, next) => {
    try {
      const { productId } = req.params;
      const queryOptions = {
        page: req.query.page || PAGINATION.DEFAULT_PAGE,
        limit: req.query.limit || PAGINATION.DEFAULT_LIMIT,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder,
        color: req.query.color,
        size: req.query.size,
        minPrice: req.query.minPrice,
        maxPrice: req.query.maxPrice,
        minStock: req.query.minStock,
        maxStock: req.query.maxStock
      };      const { data, pagination } = await this.service.getVariantsByProductId(productId, queryOptions);
      ResponseHandler.success(res, productVariantMessages.FETCH_BY_PRODUCT_SUCCESS, data, pagination);
    } catch (error) {
      next(error);
    }
  };

  updateStock = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { quantityChange, operation } = req.body; // operation can be 'increase' or 'decrease'
      const updatedVariant = await this.service.updateStockWithValidation(id, quantityChange, operation);
      ResponseHandler.success(res, productVariantMessages.UPDATE_SUCCESS, updatedVariant);
    } catch (error) {
      next(error);
    }
  };

  // New API endpoints for variant business rules
  validateCartAddition = async (req, res, next) => {
    try {
      const { variantId, quantity } = req.body;
      const result = await this.service.validateCartAddition(variantId, quantity);
      ResponseHandler.success(res, 'Variant có thể thêm vào giỏ hàng', result);
    } catch (error) {
      next(error);
    }
  };

  checkProductOutOfStock = async (req, res, next) => {
    try {
      const { productId } = req.params;
      const result = await this.service.checkProductOutOfStock(productId);
      ResponseHandler.success(res, 'Kiểm tra tồn kho sản phẩm', result);
    } catch (error) {
      next(error);
    }
  };

  getOutOfStockVariants = async (req, res, next) => {
    try {
      const queryOptions = {
        page: req.query.page || PAGINATION.DEFAULT_PAGE,
        limit: req.query.limit || PAGINATION.DEFAULT_LIMIT,
        product: req.query.product
      };
      const result = await this.service.getOutOfStockVariants(queryOptions);
      ResponseHandler.success(res, 'Danh sách variant hết hàng', result);
    } catch (error) {
      next(error);
    }
  };

  validateVariantRequirements = async (req, res, next) => {
    try {
      const { product, color, size } = req.body;
      // This will validate if the variant requirements are met
      await this.service._validateReferences(product, color, size);
      ResponseHandler.success(res, 'Variant requirements hợp lệ', { 
        valid: true, 
        message: 'Color và Size hợp lệ và đang hoạt động' 
      });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = ProductVariantController;
