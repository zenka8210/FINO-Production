const BaseController = require('./baseController');
const ProductService = require('../services/productService');
const Product = require('../models/ProductSchema');
const ResponseHandler = require('../services/responseHandler');
const { MESSAGES, PAGINATION } = require('../config/constants');
const { AppError } = require('../middlewares/errorHandler');
const { QueryUtils } = require('../utils/queryUtils');
const { queryParserMiddleware } = require('../middlewares/queryMiddleware');

class ProductController extends BaseController {
    constructor() {
        super(new ProductService());
    }    getAllProducts = async (req, res, next) => {
        try {
            // Use new QueryBuilder with improved safety
            if (req.createQueryBuilder) {
                const Product = require('../models/ProductSchema');
                const queryBuilder = req.createQueryBuilder(Product);
                
                // Configure search and filters for products
                const result = await queryBuilder
                    .search(['name', 'description'])
                    .applyFilters({
                        category: { type: 'objectId' },
                        minPrice: { type: 'range', field: 'price' },
                        maxPrice: { type: 'range', field: 'price' },
                        brand: { type: 'regex' },
                        status: { type: 'exact' }
                    })
                    .execute();
                
                ResponseHandler.success(res, MESSAGES.PRODUCTS_FETCHED, result);
            } else {
                // Fallback to legacy method if middleware not available
                const queryOptions = {
                    page: req.query.page || PAGINATION.DEFAULT_PAGE,
                    limit: req.query.limit || PAGINATION.DEFAULT_LIMIT,
                    name: req.query.name,
                    category: req.query.category,
                    minPrice: req.query.minPrice,
                    maxPrice: req.query.maxPrice,
                    sortBy: req.query.sortBy || 'createdAt',
                    sortOrder: req.query.sortOrder || 'desc'
                };
                const result = await this.service.getAllProducts(queryOptions);
                ResponseHandler.success(res, MESSAGES.PRODUCTS_FETCHED, result);
            }
        } catch (error) {
            console.error('❌ ProductController.getAllProducts error:', error.message);
            next(error);
        }
    };

    // Giữ lại method cũ để backward compatibility
    getAllProductsLegacy = async (req, res, next) => {
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
            
            // Validate product data before creation
            const validation = await this.service.validateProductData(productData);
            if (!validation.isValid) {
                throw new AppError(validation.errors.join('; '), 400);
            }
            
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
            
            // Validate product data before update
            const validation = await this.service.validateProductData(updateData);
            if (!validation.isValid) {
                throw new AppError(validation.errors.join('; '), 400);
            }
            
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

    // Get products for public display (homepage, product listing)
    getPublicProducts = async (req, res, next) => {
        try {
            const queryOptions = {
                page: req.query.page || PAGINATION.DEFAULT_PAGE,
                limit: req.query.limit || PAGINATION.DEFAULT_LIMIT,
                name: req.query.name,
                category: req.query.category,
                minPrice: req.query.minPrice,
                maxPrice: req.query.maxPrice,
                sortBy: req.query.sortBy,
                sortOrder: req.query.sortOrder
            };
            
            const result = await this.service.getPublicProducts(queryOptions);
            ResponseHandler.success(res, 'Public products fetched successfully', result);
        } catch (error) {
            next(error);
        }
    };

    // Validate product for display (admin use)
    validateProductForDisplay = async (req, res, next) => {
        try {
            const { id } = req.params;
            const validation = await this.service.validateProductForDisplay(id);
            ResponseHandler.success(res, 'Product validation completed', validation);
        } catch (error) {
            next(error);
        }
    };

    // Check product availability
    checkProductAvailability = async (req, res, next) => {
        try {
            const { id } = req.params;
            const availability = await this.service.checkProductAvailability(id);
            ResponseHandler.success(res, 'Product availability checked', availability);
        } catch (error) {
            next(error);
        }
    };

    // Get admin notification about out of stock products
    getOutOfStockNotification = async (req, res, next) => {
        try {
            const notification = await this.service.getOutOfStockNotification();
            ResponseHandler.success(res, 'Out of stock notification retrieved', notification);
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
            // Use QueryBuilder if available, otherwise fallback to legacy
            if (req.createQueryBuilder) {
                const result = await req.createQueryBuilder(Product)
                    .setBaseFilter({ isActive: true })
                    .search(['name', 'description'])
                    .applyFilters({
                        'category': 'category',
                        'price': 'price'
                    })
                    .execute();

                ResponseHandler.success(res, 'Lấy sản phẩm có sẵn thành công', result);
            } else {
                // Fallback to legacy method
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
            }
        } catch (error) {
            next(error);
        }
    };

    // Validate cart items before checkout
    validateCartItems = async (req, res, next) => {
        try {
            const { items } = req.body; // Array of {variantId, quantity}
            
            if (!items || !Array.isArray(items)) {
                throw new AppError('Items phải là một mảng', 400, 'INVALID_ITEMS');
            }

            if (items.length === 0) {
                return ResponseHandler.success(res, 'Giỏ hàng trống', {
                    valid: true,
                    items: []
                });
            }

            const validationResults = [];
            let allValid = true;

            for (const item of items) {
                try {
                    const stockCheck = await this.service.checkVariantStock(item.variantId, item.quantity);
                    validationResults.push({
                        variantId: item.variantId,
                        requestedQuantity: item.quantity,
                        valid: stockCheck.available,
                        availableStock: stockCheck.currentStock,
                        variant: stockCheck.variantInfo
                    });
                    
                    if (!stockCheck.available) {
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
            
            if (!stockCheck.available) {
                throw new AppError(
                    `Sản phẩm đã hết hàng. Còn lại: ${stockCheck.currentStock}, yêu cầu: ${quantity}`,
                    400,
                    'OUT_OF_STOCK'
                );
            }

            ResponseHandler.success(res, 'Có thể thêm vào giỏ hàng', {
                canAddToCart: true,
                availableStock: stockCheck.currentStock,
                requestedQuantity: quantity
            });
        } catch (error) {
            next(error);
        }
    };

    // Get comprehensive product statistics for admin dashboard
    getProductStatistics = async (req, res, next) => {
        try {
            const statistics = await this.service.getProductStatistics();
            ResponseHandler.success(res, 'Lấy thống kê sản phẩm thành công', statistics);
        } catch (error) {
            next(error);
        }
    };
}

module.exports = ProductController;
