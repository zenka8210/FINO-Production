const BaseController = require('./baseController');
const ProductService = require('../services/productService');
const Product = require('../models/ProductSchema');
const ResponseHandler = require('../services/responseHandler');
const { MESSAGES, PAGINATION } = require('../config/constants');
const { AppError } = require('../middlewares/errorHandler');
const { QueryUtils } = require('../utils/queryUtils');
const { queryParserMiddleware } = require('../middlewares/queryMiddleware');
const AdminSortUtils = require('../utils/adminSortUtils');

class ProductController extends BaseController {
    constructor() {
        super(new ProductService());
    }    getAllProducts = async (req, res, next) => {
        try {
            console.log('🎯 ProductController.getAllProducts called');
            console.log('📊 Query params:', req.query);
            console.log('🔧 Has createQueryBuilder:', !!req.createQueryBuilder);
            console.log('💰 Has isOnSale filter:', req.query.isOnSale);
            
            // Use new QueryBuilder with improved safety, but fallback for specific params
            if (req.createQueryBuilder && !req.query.isOnSale && !req.query.includeVariants) {
                console.log('🔥 Using QueryBuilder middleware for products');
                const Product = require('../models/ProductSchema');
                const queryBuilder = req.createQueryBuilder(Product);
                
                console.log('🔧 About to execute QueryBuilder...');
                
                try {
                    // Handle hierarchical category filtering BEFORE QueryBuilder execution
                    if (req.query.category) {
                        console.log('🌳 Handling hierarchical category filtering for:', req.query.category);
                        const categoryIds = await this.getHierarchicalCategoryIds(req.query.category);
                        console.log('📊 Found category IDs (parent + children):', categoryIds);
                        
                        // Override the category filter to use $in with all related category IDs
                        queryBuilder.filter.category = { $in: categoryIds };
                        
                        // Remove category from query to prevent QueryBuilder from overriding
                        delete req.query.category;
                    }
                    
                    // Configure search and filters for products
                    const result = await queryBuilder
                        .search(['name', 'description'])
                        .applyFilters({
                            // Skip category here since we handled it above
                            minPrice: { type: 'range', field: 'price' },
                            maxPrice: { type: 'range', field: 'price' },
                            brand: { type: 'regex' },
                            status: { type: 'exact' }
                        })
                        .execute();
                    
                    console.log('✅ QueryBuilder executed successfully, found', result.data ? result.data.length : 0, 'products');
                    
                    // IMPORTANT: Populate categories after QueryBuilder execution
                    if (result.data && Array.isArray(result.data)) {
                        console.log('🔧 Populating categories...');
                        result.data = await Product.populate(result.data, { path: 'category' });
                        console.log('✅ Categories populated');
                    }
                    
                    // Add review stats if requested
                    if (req.query.includeReviewStats === 'true') {
                        console.log('📊 Adding review statistics to QueryBuilder results...');
                        result.data = await this.service.addReviewStatsToProducts(result.data);
                        console.log('✅ Review stats added to', result.data.length, 'products');
                    }
                    
                    console.log('📤 Sending QueryBuilder response...');
                    ResponseHandler.success(res, MESSAGES.PRODUCTS_FETCHED, result);
                    return;
                } catch (queryError) {
                    console.error('❌ QueryBuilder error:', queryError);
                    console.log('🔄 Falling back to legacy service...');
                    // Fall through to legacy method
                }
            } else {
                console.log('🔥 Using legacy service for products (special parameters detected)');
            }
            
            // Fallback to legacy method for special parameters like isOnSale, includeVariants
            let categoryIds = null;
            if (req.query.category) {
                categoryIds = await this.getHierarchicalCategoryIds(req.query.category);
                console.log('🌳 Legacy method: Using hierarchical category IDs:', categoryIds);
            }
            
            const queryOptions = {
                page: req.query.page || PAGINATION.DEFAULT_PAGE,
                limit: req.query.limit || PAGINATION.DEFAULT_LIMIT,
                search: req.query.search,
                category: req.query.category,
                categoryIds: categoryIds, // Pass hierarchical IDs to service
                minPrice: req.query.minPrice,
                maxPrice: req.query.maxPrice,
                sortBy: req.query.sortBy || 'createdAt',
                sortOrder: req.query.sortOrder || 'desc',
                isOnSale: req.query.isOnSale,
                includeVariants: req.query.includeVariants, // Support for variant population
                includeReviewStats: req.query.includeReviewStats, // Support for review statistics
                includeOutOfStock: req.query.includeOutOfStock === 'true' // Parse boolean properly
            };
            
            // Apply admin sort
            const sortConfig = AdminSortUtils.ensureAdminSort(req, 'Product');
            queryOptions.sort = sortConfig;
            
            const result = await this.service.getAllProducts(queryOptions);
            ResponseHandler.success(res, MESSAGES.PRODUCTS_FETCHED, result);
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
            
            console.log('🆕 ProductController.createProduct called');
            console.log('📝 Product data keys:', Object.keys(productData));
            console.log('🎨 Variants data:', productData.variants ? `${productData.variants.length} variants` : 'No variants');
            
            // Validate product data before creation
            const validation = await this.service.validateProductData(productData);
            if (!validation.isValid) {
                throw new AppError(validation.errors.join('; '), 400);
            }
            
            const newProduct = await this.service.createProduct(productData);
            console.log('✅ Product created successfully');
            ResponseHandler.created(res, MESSAGES.PRODUCT_CREATED, newProduct);
        } catch (error) {
            console.error('❌ Error creating product:', error.message);
            next(error);
        }
    };

    updateProduct = async (req, res, next) => {
        try {
            const { id } = req.params;
            const updateData = req.body;
            
            console.log('🔄 ProductController.updateProduct called');
            console.log('📦 Product ID:', id);
            console.log('📝 Update data keys:', Object.keys(updateData));
            console.log('🎨 Variants data:', updateData.variants ? `${updateData.variants.length} variants` : 'No variants');
            
            // Validate product data before update
            const validation = await this.service.validateProductData(updateData);
            if (!validation.isValid) {
                throw new AppError(validation.errors.join('; '), 400);
            }
            
            const updatedProduct = await this.service.updateProduct(id, updateData);
            console.log('✅ Product updated successfully');
            ResponseHandler.success(res, MESSAGES.PRODUCT_UPDATED, updatedProduct);
        } catch (error) {
            console.error('❌ Error updating product:', error.message);
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
                sortOrder: req.query.sortOrder,
                includeReviewStats: req.query.includeReviewStats || 'true' // Default to true for public display
            };
            
            const result = await this.service.getPublicProducts(queryOptions);
            ResponseHandler.success(res, 'Public products fetched successfully', result);
        } catch (error) {
            next(error);
        }
    };

    // Get single product for public display (product details page)
    getPublicProductById = async (req, res, next) => {
        try {
            const { id } = req.params;
            const includeVariants = req.query.includeVariants;
            const includeReviewStats = req.query.includeReviewStats || 'true'; // Default to true for public display
            
            // Use the same service method but ensure only public/active products
            const product = await this.service.getProductById(id, includeVariants, includeReviewStats);
            
            // Ensure product is active and available for public display
            if (!product.isActive || product.isDeleted) {
                throw new AppError('Sản phẩm không khả dụng', 404);
            }
            
            ResponseHandler.success(res, MESSAGES.PRODUCT_FETCHED, product);
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

    // Get featured products based on real sales, reviews, and wishlist data
    getFeaturedProducts = async (req, res, next) => {
        try {
            const limit = parseInt(req.query.limit) || 9; // Updated default to 9 for frontend sections
            
            console.log('🎯 ProductController.getFeaturedProducts called with limit:', limit);
            
            const featuredProducts = await this.service.getFeaturedProducts(limit);
            
            ResponseHandler.success(res, 'Lấy sản phẩm nổi bật thành công', featuredProducts);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Get all category IDs including parent and its children
     * For hierarchical category filtering
     */
    async getHierarchicalCategoryIds(categoryId) {
        try {
            const Category = require('../models/CategorySchema');
            const mongoose = require('mongoose');
            
            if (!mongoose.Types.ObjectId.isValid(categoryId)) {
                return [categoryId];
            }
            
            // Get the selected category
            const selectedCategory = await Category.findById(categoryId);
            if (!selectedCategory) {
                return [];
            }
            
            const categoryIds = [categoryId];
            
            // If it's a parent category, get all its children
            if (!selectedCategory.parent) {
                const childCategories = await Category.find({ parent: categoryId });
                const childIds = childCategories.map(child => child._id.toString());
                categoryIds.push(...childIds);
                console.log(`🌳 Parent category ${selectedCategory.name} has ${childIds.length} children`);
            }
            
            return categoryIds;
        } catch (error) {
            console.error('❌ Error in getHierarchicalCategoryIds:', error);
            return [categoryId]; // Fallback to original category
        }
    }
}

module.exports = ProductController;
