const BaseController = require('./baseController');
const ProductService = require('../services/productService');
const ResponseHandler = require('../services/responseHandler');
const { MESSAGES, PAGINATION } = require('../config/constants');
const { AppError } = require('../middlewares/errorHandler');

class ProductController extends BaseController {
    constructor() {
        super(new ProductService());
    }    getAllProducts = async (req, res, next) => {
        try {
            const queryOptions = {
                page: req.query.page || PAGINATION.DEFAULT_PAGE,
                limit: req.query.limit || PAGINATION.DEFAULT_LIMIT,
                name: req.query.name,
                category: req.query.category,
                minPrice: req.query.minPrice,
                maxPrice: req.query.maxPrice,
                sortBy: req.query.sortBy,
                sortOrder: req.query.sortOrder,
                includeVariants: req.query.includeVariants
            };
            const result = await this.service.getAllProducts(queryOptions);
            ResponseHandler.success(res, MESSAGES.PRODUCTS_FETCHED, result);
        } catch (error) {
            next(error);
        }
    };

    getProductById = async (req, res, next) => {
        try {
            const { id } = req.params;
            const includeVariants = req.query.includeVariants;
            const product = await this.service.getProductById(id, includeVariants);
            ResponseHandler.success(res, MESSAGES.PRODUCT_FETCHED, product);
        } catch (error) {
            next(error);
        }
    };

    createProduct = async (req, res, next) => {
        try {
            const productData = req.body;
            const newProduct = await this.service.createProduct(productData);
            ResponseHandler.created(res, MESSAGES.PRODUCT_CREATED, newProduct);
        } catch (error) {
            next(error);
        }
    };

    updateProduct = async (req, res, next) => {
        try {
            const { id } = req.params;
            const updateData = req.body;
            const updatedProduct = await this.service.updateProduct(id, updateData);
            ResponseHandler.success(res, MESSAGES.PRODUCT_UPDATED, updatedProduct);
        } catch (error) {
            next(error);
        }
    };

    deleteProduct = async (req, res, next) => {
        try {
            const { id } = req.params;
            await this.service.deleteProduct(id);
            ResponseHandler.success(res, MESSAGES.PRODUCT_DELETED, null);
        } catch (error) {
            next(error);
        }
    };

    // Handler for getting products by category
    getProductsByCategory = async (req, res, next) => {
        try {
            const { categoryId } = req.params;
            const queryOptions = {
                page: req.query.page || PAGINATION.DEFAULT_PAGE,
                limit: req.query.limit || PAGINATION.DEFAULT_LIMIT,
                includeVariants: req.query.includeVariants,
                includeOutOfStock: req.query.includeOutOfStock || false,
                sortBy: req.query.sortBy,
                sortOrder: req.query.sortOrder,
            };
            const result = await this.service.getProductsByCategory(categoryId, queryOptions);
            ResponseHandler.success(res, `Lấy sản phẩm theo danh mục ${categoryId} thành công`, result);
        } catch (error) {
            next(error);
        }
    };

    // Check product availability
    checkProductAvailability = async (req, res, next) => {
        try {
            const { id } = req.params;
            const availability = await this.service.checkProductAvailability(id);
            ResponseHandler.success(res, 'Kiểm tra tồn kho sản phẩm thành công', availability);
        } catch (error) {
            next(error);
        }
    };

    // Check variant stock
    checkVariantStock = async (req, res, next) => {
        try {
            const { variantId } = req.params;
            const { quantity = 1 } = req.query;
            const stockInfo = await this.service.checkVariantStock(variantId, parseInt(quantity));
            ResponseHandler.success(res, 'Kiểm tra tồn kho variant thành công', stockInfo);
        } catch (error) {
            next(error);
        }
    };

    // Get available products only (public endpoint)
    getAvailableProducts = async (req, res, next) => {
        try {
            const queryOptions = {
                page: req.query.page || PAGINATION.DEFAULT_PAGE,
                limit: req.query.limit || PAGINATION.DEFAULT_LIMIT,
                name: req.query.name,
                category: req.query.category,
                minPrice: req.query.minPrice,
                maxPrice: req.query.maxPrice,
                sortBy: req.query.sortBy,
                sortOrder: req.query.sortOrder,
                includeVariants: req.query.includeVariants,
                includeOutOfStock: false // Always exclude out of stock
            };
            const result = await this.service.getAllProducts(queryOptions);
            ResponseHandler.success(res, 'Lấy sản phẩm có sẵn thành công', result);
        } catch (error) {
            next(error);
        }
    };

    // Validate cart items before checkout
    validateCartItems = async (req, res, next) => {
        try {
            const { items } = req.body; // Array of {variantId, quantity}
            
            if (!items || !Array.isArray(items) || items.length === 0) {
                throw new AppError('Items không hợp lệ', 'INVALID_ITEMS', 400);
            }

            const validationResults = [];
            let allValid = true;

            for (const item of items) {
                try {
                    const stockCheck = await this.service.checkVariantStock(item.variantId, item.quantity);
                    validationResults.push({
                        variantId: item.variantId,
                        requestedQuantity: item.quantity,
                        valid: stockCheck.canOrder,
                        availableStock: stockCheck.availableStock,
                        variant: stockCheck.variant
                    });
                    
                    if (!stockCheck.canOrder) {
                        allValid = false;
                    }
                } catch (error) {
                    validationResults.push({
                        variantId: item.variantId,
                        requestedQuantity: item.quantity,
                        valid: false,
                        error: error.message
                    });
                    allValid = false;
                }
            }

            ResponseHandler.success(res, 'Kiểm tra giỏ hàng hoàn tất', {
                valid: allValid,
                items: validationResults
            });
        } catch (error) {
            next(error);
        }
    };

    // Validate product for display
    validateProductDisplay = async (req, res, next) => {
        try {
            const { id } = req.params;
            const validation = await this.service.validateProductForDisplay(id);
            ResponseHandler.success(res, 'Kiểm tra hiển thị sản phẩm thành công', validation);
        } catch (error) {
            next(error);
        }
    };

    // Get all out of stock products (Admin only)
    getOutOfStockProducts = async (req, res, next) => {
        try {
            const queryOptions = {
                page: req.query.page || PAGINATION.DEFAULT_PAGE,
                limit: req.query.limit || PAGINATION.DEFAULT_LIMIT
            };
            const result = await this.service.getOutOfStockProducts(queryOptions);
            ResponseHandler.success(res, 'Lấy danh sách sản phẩm hết hàng thành công', result);
        } catch (error) {
            next(error);
        }
    };

    // Add out of stock variant to cart (should fail)
    preventOutOfStockAddToCart = async (req, res, next) => {
        try {
            const { variantId, quantity = 1 } = req.body;
            
            if (!variantId) {
                throw new AppError('Variant ID là bắt buộc', 'VARIANT_ID_REQUIRED', 400);
            }

            const stockCheck = await this.service.checkVariantStock(variantId, quantity);
            
            if (!stockCheck.canOrder) {
                throw new AppError(
                    `Sản phẩm đã hết hàng. Còn lại: ${stockCheck.availableStock}, yêu cầu: ${quantity}`,
                    400,
                    'OUT_OF_STOCK'
                );
            }

            ResponseHandler.success(res, 'Có thể thêm vào giỏ hàng', {
                canAddToCart: true,
                availableStock: stockCheck.availableStock,
                requestedQuantity: quantity
            });
        } catch (error) {
            next(error);
        }
    };

}

module.exports = ProductController;
