const BaseService = require('./baseService');
const Product = require('../models/ProductSchema');
const ProductVariant = require('../models/ProductVariantSchema');
const Category = require('../models/CategorySchema');
const { AppError } = require('../middlewares/errorHandler');
const { MESSAGES, ERROR_CODES, PAGINATION } = require('../config/constants');
const { QueryUtils } = require('../utils/queryUtils');
const ReviewService = require('./reviewService');

class ProductService extends BaseService {
    constructor() {
        super(Product);
    }

    /**
     * Add review statistics to products
     * @param {Array} products - Array of product objects
     * @returns {Array} Products with review stats added
     */
    async addReviewStatsToProducts(products) {
        if (!products || products.length === 0) return products;

        try {
            const reviewService = new ReviewService();
            
            console.log(`📊 Adding review stats to ${products.length} products...`);
            
            // Get stats for all products in parallel for better performance
            const productsWithStats = await Promise.all(products.map(async (product) => {
                try {
                    const productId = product._id || product.id;
                    console.log(`🔍 Getting review stats for product ${productId}...`);
                    
                    const reviewStats = await reviewService.getProductRatingStats(productId);
                    
                    // Convert to plain object if it's a Mongoose document
                    const productObj = product.toObject ? product.toObject() : { ...product };
                    
                    // Add review stats
                    productObj.averageRating = reviewStats.averageRating || 0;
                    productObj.reviewCount = reviewStats.totalReviews || 0;
                    productObj.ratingDistribution = reviewStats.ratingDistribution || { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
                    
                    console.log(`✅ Product ${productId}: ${productObj.reviewCount} reviews, avg ${productObj.averageRating}`);
                    
                    return productObj;
                } catch (error) {
                    console.warn(`❌ Failed to get review stats for product ${product._id}:`, error.message);
                    // Return product without stats if review fetching fails
                    const productObj = product.toObject ? product.toObject() : { ...product };
                    productObj.averageRating = 0;
                    productObj.reviewCount = 0;
                    productObj.ratingDistribution = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
                    return productObj;
                }
            }));

            return productsWithStats;
        } catch (error) {
            console.error('❌ Error in addReviewStatsToProducts:', error);
            // Return products without stats if there's an error
            return products.map(product => {
                const productObj = product.toObject ? product.toObject() : { ...product };
                productObj.averageRating = 0;
                productObj.reviewCount = 0;
                productObj.ratingDistribution = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
                return productObj;
            });
        }
    }

    /**
     * Get all products using new Query Middleware
     * @param {Object} queryParams - Query parameters from request
     * @returns {Object} Query results with pagination
     */
    async getAllProductsWithQuery(queryParams) {
        try {
            // Sử dụng QueryUtils với pre-configured setup cho Product
            const result = await QueryUtils.getProducts(Product, queryParams);
            
            // TODO: Thêm logic kiểm tra stock sau nếu cần
            // if (queryParams.includeOutOfStock === 'false') {
            //     const productsWithStock = [];
            //     for (const product of result.data) {
            //         const hasStock = await this.checkProductAvailability(product._id);
            //         if (hasStock.available) {
            //             productsWithStock.push(product);
            //         }
            //     }
            //     result.data = productsWithStock;
            //     result.pagination.total = productsWithStock.length;
            //     result.pagination.totalPages = Math.ceil(productsWithStock.length / result.pagination.limit);
            // }

            return result;
        } catch (error) {
            throw new AppError(
                `Error fetching products: ${error.message}`,
                ERROR_CODES.PRODUCT.FETCH_FAILED,
                500
            );
        }
    }

    async getAllProducts(queryOptions) {
        const {
            page = PAGINATION.DEFAULT_PAGE,
            limit = PAGINATION.DEFAULT_LIMIT,
            name,
            category, // category ID
            minPrice,
            maxPrice,
            sortBy = 'createdAt', // Default sort field
            sortOrder = 'desc', // Default sort order
            includeVariants = false, // New option to include variants or not
            includeOutOfStock = false, // New option to include out of stock products
            includeReviewStats = false, // New option to include review statistics
            isOnSale // New filter for sale products
        } = queryOptions;

        // Smart default: If including variants for frontend, usually want to show all products
        const shouldIncludeOutOfStock = includeOutOfStock || 
            (includeVariants === 'true' || includeVariants === true);

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const filter = {};

        if (name) {
            filter.name = { $regex: name, $options: 'i' };
        }
        if (category) {
            // Validate if category exists
            const categoryExists = await Category.findById(category);
            if (!categoryExists) {
                throw new AppError(MESSAGES.CATEGORY_NOT_FOUND, ERROR_CODES.CATEGORY.NOT_FOUND, 400);
            }
            filter.category = category;
        }
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) {
                filter.price.$gte = parseFloat(minPrice);
            }
            if (maxPrice) {
                filter.price.$lte = parseFloat(maxPrice);
            }
        }

        // PERFORMANCE OPTIMIZATION: When filtering for sale products, add filter to database query
        // and reduce limit to exactly what we need
        let adjustedLimit = limit;
        if (isOnSale === 'true' || isOnSale === true) {
            console.log('🔥 PERFORMANCE: Optimized salePrice filter + reduced limit');
            filter.salePrice = { 
                $exists: true, 
                $ne: null, 
                $gt: 0 
            };
            // Also ensure salePrice < price for valid discount
            filter.$expr = { $lt: ['$salePrice', '$price'] };
            
            // PERFORMANCE: Reduce limit for sale products to exactly what FlashSale needs
            if (parseInt(limit) > 30) {
                adjustedLimit = Math.min(30, parseInt(limit)); // FlashSale only needs 20-30 max
                console.log('⚡ PERFORMANCE: Reduced limit to', adjustedLimit, 'for sale products');
            }
        }

        try {
            console.log('🔍 ProductService.getAllProducts called with options:', queryOptions);
            
            // Add debug to check what collection and fields we're querying
            console.log('📋 Product model collection name:', Product.collection.name);
            console.log('📋 Sample database query to verify fields...');
            
            let query = Product.find(filter)
                .populate('category', 'name') // PERFORMANCE: Only load category name
                .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
                .skip(skip)
                .limit(parseInt(adjustedLimit));

            if (includeVariants === 'true' || includeVariants === true) {
                console.log('📦 Including variants in query');
                query = query.populate({
                    path: 'variants',
                    populate: [
                        { path: 'color', select: 'name hexCode' },
                        { path: 'size', select: 'name' }
                    ]
                });
            }

            let products = await query;
            console.log(`📊 Found ${products.length} products after initial query`);
            
            // DEBUG: Log first product to see all fields
            if (products.length > 0) {
                const firstProduct = products[0];
                console.log('🔍 DEBUG - First product fields:');
                console.log('  name:', firstProduct.name);
                console.log('  price:', firstProduct.price);
                console.log('  salePrice field exists:', 'salePrice' in firstProduct._doc);
                console.log('  salePrice value:', firstProduct.salePrice);
                console.log('  Raw _doc salePrice:', firstProduct._doc.salePrice);
                console.log('  isOnSale virtual:', firstProduct.isOnSale);
                console.log('  All _doc fields:', Object.keys(firstProduct._doc));
            }
            
            // Filter for sale products if requested - MODERN BUSINESS LOGIC
            if (isOnSale === 'true' || isOnSale === true) {
                console.log('🔥 Filtering for sale products, total products before filter:', products.length);
                console.log('🔍 DEBUG - Checking first product salePrice in detail...');
                if (products.length > 0) {
                    const firstProduct = products[0];
                    console.log('  Product name:', firstProduct.name);
                    console.log('  salePrice property:', firstProduct.salePrice);
                    console.log('  Raw _doc salePrice:', firstProduct._doc ? firstProduct._doc.salePrice : 'no _doc');
                    console.log('  toObject salePrice:', firstProduct.toObject().salePrice);
                }
                const now = new Date();
                
                // Modern e-commerce sale logic - much more flexible
                products = products.filter(product => {
                    console.log('🔍 Checking product:', product.name, 'price:', product.price, 'salePrice:', product.salePrice);
                    
                    // Check if product has explicit salePrice in database
                    const hasSalePrice = product.salePrice && 
                                       product.salePrice > 0 && 
                                       product.salePrice < product.price;
                    
                    if (hasSalePrice) {
                        // If has date range, check it; otherwise assume active
                        if (product.saleStartDate && product.saleEndDate) {
                            const isDateValid = now >= new Date(product.saleStartDate) && now <= new Date(product.saleEndDate);
                            if (isDateValid) {
                                console.log('✅ Active sale product (with dates):', product.name, `${product.price}đ → ${product.salePrice}đ`);
                                return true;
                            } else {
                                console.log('⏰ Sale product but date range invalid:', product.name);
                                return false;
                            }
                        } else {
                            // No date restriction = always on sale
                            console.log('✅ Permanent sale product:', product.name, `${product.price}đ → ${product.salePrice}đ`);
                            return true;
                        }
                    }
                    
                    console.log('❌ Not eligible for sale:', product.name, 'Reason: No valid salePrice in database');
                    return false;
                });
                
                console.log('🔥 Sale products after modern filter:', products.length);
            }
            
            // PERFORMANCE CRITICAL: Skip expensive stock filtering for sale products (FlashSale use case)
            console.log(`🔍 shouldIncludeOutOfStock: ${shouldIncludeOutOfStock}, isOnSale: ${isOnSale}`);
            
            if (isOnSale === 'true' || isOnSale === true) {
                console.log('⚡ FLASH SALE MODE: Skipping all stock validation for maximum performance');
                // For flash sale products, skip expensive validation entirely
                const flashSaleProducts = products.map(product => ({
                    ...product.toObject(),
                    stockInfo: { 
                        totalStock: 999, 
                        available: true, 
                        variants: [] 
                    },
                    displayInfo: { 
                        canDisplay: true, 
                        reasons: ['Flash sale product'] 
                    }
                }));
                
                products = flashSaleProducts;
                console.log(`⚡ Flash sale products ready: ${products.length}`);
            } else if (shouldIncludeOutOfStock === false) {
                console.log('🚫 Filtering out products with no stock...');
                const productsWithStock = [];
                
                for (const product of products) {
                    // Check if product can be displayed (has variants, is active, has stock)
                    const displayValidation = await this.validateProductForDisplay(product._id);
                    console.log(`📋 Product ${product.name}: canDisplay=${displayValidation.canDisplay}, reasons=${displayValidation.reasons}`);
                    
                    if (displayValidation.canDisplay) {
                        const hasStock = await this.checkProductAvailability(product._id);
                        if (hasStock.available) {
                            productsWithStock.push({
                                ...product.toObject(),
                                stockInfo: hasStock
                            });
                        }
                    }
                }
                
                products = productsWithStock;
                console.log(`📊 Final products after stock filtering: ${products.length}`);
            } else {
                console.log('✅ Including all products (includeOutOfStock=true or includeVariants=true)');
                // Include stock info for all products
                const productsWithStockInfo = [];
                
                for (const product of products) {
                    const stockInfo = await this.checkProductAvailability(product._id);
                    const displayValidation = await this.validateProductForDisplay(product._id);
                    
                    productsWithStockInfo.push({
                        ...product.toObject(),
                        stockInfo,
                        displayInfo: displayValidation
                    });
                }
                
                products = productsWithStockInfo;
            }

            const totalProducts = await Product.countDocuments(filter);

            // Add review statistics if requested
            if (includeReviewStats === 'true' || includeReviewStats === true) {
                console.log('📊 Including review statistics for products...');
                products = await this.addReviewStatsToProducts(products);
            }

            return {
                data: products,
                total: totalProducts,
                page: parseInt(page),
                limit: parseInt(adjustedLimit),
                totalPages: Math.ceil(totalProducts / parseInt(adjustedLimit)),
            };
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(MESSAGES.PRODUCT_CREATE_FAILED || "Lấy danh sách sản phẩm thất bại", ERROR_CODES.PRODUCT.FETCH_ALL_FAILED || 'PRODUCT_FETCH_ALL_FAILED', 500);
        }
    }

    async getProductById(productId, includeVariants = false, includeReviewStats = false) {
        try {
            let query = Product.findById(productId).populate('category');
            if (includeVariants === 'true' || includeVariants === true) {
                // Populate variants with color and size information
                query = query.populate({
                    path: 'variants',
                    populate: [
                        { path: 'color', select: 'name hexCode' },
                        { path: 'size', select: 'name code' }
                    ]
                });
            }
            const product = await query;

            if (!product) {
                throw new AppError(MESSAGES.PRODUCT_NOT_FOUND, ERROR_CODES.PRODUCT.NOT_FOUND, 404);
            }

            // Add review statistics if requested
            if (includeReviewStats === 'true' || includeReviewStats === true) {
                const reviewService = new ReviewService();
                try {
                    const reviewStats = await reviewService.getProductRatingStats(productId);
                    
                    // Add stats to the product object
                    const productObj = product.toObject();
                    productObj.averageRating = reviewStats.averageRating || 0;
                    productObj.reviewCount = reviewStats.totalReviews || 0;
                    productObj.ratingDistribution = reviewStats.ratingDistribution || { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
                    
                    return productObj;
                } catch (reviewError) {
                    console.warn(`Failed to get review stats for product ${productId}:`, reviewError.message);
                    // Return product without stats if review fetching fails
                    const productObj = product.toObject();
                    productObj.averageRating = 0;
                    productObj.reviewCount = 0;
                    productObj.ratingDistribution = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
                    return productObj;
                }
            }

            return product;
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(MESSAGES.PRODUCT_UPDATE_FAILED || "Lấy chi tiết sản phẩm thất bại", ERROR_CODES.PRODUCT.FETCH_SINGLE_FAILED || 'PRODUCT_FETCH_SINGLE_FAILED', 500);
        }
    }

    async createProduct(productData) {
        try {
            // Validate required category
            if (!productData.category) {
                throw new AppError('Sản phẩm phải thuộc ít nhất 1 danh mục', 400, ERROR_CODES.PRODUCT.CATEGORY_REQUIRED);
            }
            
            const categoryExists = await Category.findById(productData.category);
            if (!categoryExists) {
                throw new AppError(MESSAGES.CATEGORY_NOT_FOUND, ERROR_CODES.CATEGORY.NOT_FOUND, 400);
            }

            // Validate sale price if provided
            if (productData.salePrice !== undefined && productData.salePrice !== null) {
                if (productData.salePrice >= productData.price) {
                    throw new AppError('Giá khuyến mãi phải nhỏ hơn giá gốc', 400, ERROR_CODES.PRODUCT.INVALID_SALE_PRICE);
                }
                
                if (productData.saleStartDate && productData.saleEndDate) {
                    const startDate = new Date(productData.saleStartDate);
                    const endDate = new Date(productData.saleEndDate);
                    
                    if (startDate >= endDate) {
                        throw new AppError('Ngày bắt đầu khuyến mãi phải nhỏ hơn ngày kết thúc', 400, ERROR_CODES.PRODUCT.INVALID_SALE_PERIOD);
                    }
                }
            }

            const newProduct = new Product(productData);
            await newProduct.save();
            return newProduct;
        } catch (error) {
            if (error instanceof AppError) throw error;
            // Handle potential validation errors from Mongoose
            throw new AppError(MESSAGES.PRODUCT_CREATE_FAILED, ERROR_CODES.PRODUCT.CREATE_FAILED, 400, error.errors || error.message);
        }
    }

    async updateProduct(productId, updateData) {
        try {
            if (updateData.category) {
                const categoryExists = await Category.findById(updateData.category);
                if (!categoryExists) {
                    throw new AppError(MESSAGES.CATEGORY_NOT_FOUND, ERROR_CODES.CATEGORY.NOT_FOUND, 400);
                }
            }

            // Validate sale price if provided
            if (updateData.salePrice !== undefined && updateData.salePrice !== null) {
                const currentProduct = await Product.findById(productId);
                const basePrice = updateData.price || currentProduct.price;
                
                if (updateData.salePrice >= basePrice) {
                    throw new AppError('Giá khuyến mãi phải nhỏ hơn giá gốc', 400, ERROR_CODES.PRODUCT.INVALID_SALE_PRICE);
                }
            }

            // Validate sale period if start/end dates are provided
            if (updateData.saleStartDate || updateData.saleEndDate) {
                const currentProduct = await Product.findById(productId);
                const startDate = new Date(updateData.saleStartDate || currentProduct.saleStartDate);
                const endDate = new Date(updateData.saleEndDate || currentProduct.saleEndDate);
                
                if (startDate >= endDate) {
                    throw new AppError('Ngày bắt đầu khuyến mãi phải nhỏ hơn ngày kết thúc', 400, ERROR_CODES.PRODUCT.INVALID_SALE_PERIOD);
                }
            }

            const product = await Product.findByIdAndUpdate(productId, updateData, { new: true, runValidators: true }).populate('category');
            if (!product) {
                throw new AppError(MESSAGES.PRODUCT_NOT_FOUND, ERROR_CODES.PRODUCT.NOT_FOUND, 404);
            }
            return product;
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(MESSAGES.PRODUCT_UPDATE_FAILED, ERROR_CODES.PRODUCT.UPDATE_FAILED, 400, error.errors || error.message);
        }
    }

    async deleteProduct(productId) {
        try {
            // Check if product has any variants
            const variantsCount = await ProductVariant.countDocuments({ product: productId });
            if (variantsCount > 0) {
                throw new AppError(MESSAGES.PRODUCT_HAS_VARIANTS || "Sản phẩm có biến thể, không thể xóa. Xóa các biến thể trước.", 400, ERROR_CODES.PRODUCT.HAS_VARIANTS);
            }

            const product = await Product.findByIdAndDelete(productId);
            if (!product) {
                throw new AppError(MESSAGES.PRODUCT_NOT_FOUND, 404, ERROR_CODES.PRODUCT.NOT_FOUND);
            }
            return { message: MESSAGES.PRODUCT_DELETED };
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(MESSAGES.PRODUCT_DELETE_FAILED, 500, ERROR_CODES.PRODUCT.DELETE_FAILED);
        }
    }

    /**
     * Validate if product meets business requirements for display
     * @param {string} productId - Product ID
     * @returns {Object} Validation result with canDisplay boolean and reasons
     */
    async validateProductForDisplay(productId) {
        const product = await Product.findById(productId).populate('category');
        
        if (!product) {
            return { canDisplay: false, reasons: ['Product not found'] };
        }
        
        const reasons = [];
        
        // Check if product is active
        if (!product.isActive) {
            reasons.push('Product is inactive');
        }
        
        // Check if product belongs to at least 1 category
        if (!product.category) {
            reasons.push('Product must belong to at least 1 category');
        }
        
        // Check if product has at least 1 variant
        const variants = await ProductVariant.find({ product: productId });
        if (variants.length === 0) {
            reasons.push('Product must have at least 1 variant');
        }
        
        // Check if all variants are out of stock
        const inStockVariants = variants.filter(variant => variant.stock > 0);
        if (variants.length > 0 && inStockVariants.length === 0) {
            reasons.push('All variants are out of stock');
        }
        
        return {
            canDisplay: reasons.length === 0,
            reasons: reasons,
            totalVariants: variants.length,
            inStockVariants: inStockVariants.length,
            outOfStockVariants: variants.length - inStockVariants.length
        };
    }
    
    /**
     * Check product availability for purchase
     * @param {string} productId - Product ID 
     * @returns {Object} Availability info
     */
    async checkProductAvailability(productId) {
        const variants = await ProductVariant.find({ product: productId })
            .populate([
                { path: 'color', select: 'name hexCode' },
                { path: 'size', select: 'name' }
            ]);
        
        const totalStock = variants.reduce((sum, variant) => sum + variant.stock, 0);
        const availableVariants = variants.filter(variant => variant.stock > 0);
        
        return {
            available: totalStock > 0,
            totalStock: totalStock,
            totalVariants: variants.length,
            availableVariants: availableVariants.length,
            outOfStockVariants: variants.length - availableVariants.length,
            variants: variants.map(variant => ({
                _id: variant._id,
                color: variant.color,
                size: variant.size,
                stock: variant.stock,
                isInStock: variant.stock > 0,
                price: variant.price
            }))
        };
    }
    
    /**
     * Get products for public display (homepage, product listing)
     * Filters out hidden products and products with no stock
     * @param {Object} queryOptions - Query parameters
     * @returns {Object} Products with pagination
     */
    async getPublicProducts(queryOptions) {
        const {
            page = PAGINATION.DEFAULT_PAGE,
            limit = PAGINATION.DEFAULT_LIMIT,
            name,
            category,
            minPrice,
            maxPrice,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            includeReviewStats = false
        } = queryOptions;
        
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const filter = { isActive: true }; // Only active products
        
        if (name) {
            filter.name = { $regex: name, $options: 'i' };
        }
        if (category) {
            filter.category = category;
        }
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = parseFloat(minPrice);
            if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
        }
        
        // Get all products that match basic criteria
        const allProducts = await Product.find(filter)
            .populate('category')
            .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 });
        
        // Filter products that can be displayed
        let displayableProducts = [];
        
        for (const product of allProducts) {
            const validation = await this.validateProductForDisplay(product._id);
            if (validation.canDisplay) {
                const stockInfo = await this.checkProductAvailability(product._id);
                displayableProducts.push({
                    ...product.toObject(),
                    stockInfo: stockInfo
                });
            }
        }
        
        // Add review statistics if requested
        if (includeReviewStats === 'true' || includeReviewStats === true) {
            console.log('📊 Including review statistics for public products...');
            displayableProducts = await this.addReviewStatsToProducts(displayableProducts);
        }
        
        // Apply pagination to filtered results
        const total = displayableProducts.length;
        const paginatedProducts = displayableProducts.slice(skip, skip + parseInt(limit));
        
        return {
            products: paginatedProducts,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalItems: total,
                itemsPerPage: parseInt(limit),
                hasNextPage: skip + parseInt(limit) < total,
                hasPrevPage: parseInt(page) > 1
            }
        };
    }
    
    /**
     * Get admin notification about out of stock products
     * @returns {Object} Notification data
     */
    async getOutOfStockNotification() {
        const products = await Product.find({ isActive: true }).populate('category');
        const outOfStockProducts = [];
        
        for (const product of products) {
            const stockInfo = await this.checkProductAvailability(product._id);
            if (!stockInfo.available && stockInfo.totalVariants > 0) {
                outOfStockProducts.push({
                    _id: product._id,
                    name: product.name,
                    category: product.category.name,
                    totalVariants: stockInfo.totalVariants,
                    outOfStockVariants: stockInfo.outOfStockVariants
                });
            }
        }
        
        return {
            hasOutOfStockProducts: outOfStockProducts.length > 0,
            outOfStockCount: outOfStockProducts.length,
            products: outOfStockProducts,
            message: outOfStockProducts.length > 0 
                ? `Có ${outOfStockProducts.length} sản phẩm đã hết hàng hoàn toàn`
                : 'Tất cả sản phẩm đều còn hàng'
        };
    }
    
    /**
     * Get out of stock products for admin
     * @param {Object} queryOptions - Query parameters
     * @returns {Object} Out of stock products with pagination
     */
    async getOutOfStockProducts(queryOptions) {
        const {
            page = PAGINATION.DEFAULT_PAGE,
            limit = PAGINATION.DEFAULT_LIMIT,
            name,
            category,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = queryOptions;
        
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const filter = { isActive: true };
        
        if (name) {
            filter.name = { $regex: name, $options: 'i' };
        }
        if (category) {
            filter.category = category;
        }
        
        const allProducts = await Product.find(filter)
            .populate('category')
            .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 });
        
        // Filter only out of stock products
        const outOfStockProducts = [];
        
        for (const product of allProducts) {
            const stockInfo = await this.checkProductAvailability(product._id);
            if (!stockInfo.available && stockInfo.totalVariants > 0) {
                outOfStockProducts.push({
                    ...product.toObject(),
                    stockInfo: stockInfo
                });
            }
        }
        
        // Apply pagination
        const total = outOfStockProducts.length;
        const paginatedProducts = outOfStockProducts.slice(skip, skip + parseInt(limit));
        
        return {
            products: paginatedProducts,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalItems: total,
                itemsPerPage: parseInt(limit),
                hasNextPage: skip + parseInt(limit) < total,
                hasPrevPage: parseInt(page) > 1
            }
        };
    }

    /**
     * Validate product data before create/update
     * @param {Object} productData - Product data to validate
     * @returns {Object} Validation result
     */
    async validateProductData(productData) {
        const errors = [];
        
        // Check category exists
        if (productData.category) {
            const categoryExists = await Category.findById(productData.category);
            if (!categoryExists) {
                errors.push('Category does not exist');
            }
        } else {
            errors.push('Product must belong to at least 1 category');
        }
        
        // Validate sale price and dates
        if (productData.salePrice !== undefined) {
            if (productData.salePrice >= productData.price) {
                errors.push('Sale price must be less than original price');
            }
            
            if (productData.saleStartDate && productData.saleEndDate) {
                const startDate = new Date(productData.saleStartDate);
                const endDate = new Date(productData.saleEndDate);
                const now = new Date();
                
                if (startDate >= endDate) {
                    errors.push('Sale start date must be before end date');
                }
                
                if (endDate <= now) {
                    errors.push('Sale end date must be in the future');
                }
            } else if (productData.salePrice) {
                errors.push('Sale start and end dates are required when setting sale price');
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Check variant stock availability
     */
    async checkVariantStock(variantId, quantity = 1) {
        try {
            const variant = await ProductVariant.findById(variantId)
                .populate('product', 'name isActive')
                .populate('color', 'name')
                .populate('size', 'name');
            
            if (!variant) {
                throw new AppError('Product variant not found', ERROR_CODES.NOT_FOUND);
            }
            
            if (!variant.product.isActive) {
                return {
                    available: false,
                    reason: 'Product is not active',
                    currentStock: variant.stock
                };
            }
            
            const available = variant.stock >= quantity;
            
            return {
                available,
                reason: available ? 'In stock' : 'Insufficient stock',
                currentStock: variant.stock,
                requestedQuantity: quantity,
                variantInfo: {
                    id: variant._id,
                    product: variant.product.name,
                    color: variant.color.name,
                    size: variant.size.name,
                    price: variant.price
                }
            };
        } catch (error) {
            throw error;
        }
    }
    
    /**
     * Get products by category
     */
    async getProductsByCategory(categoryId, queryOptions = {}) {
        try {
            // Validate category exists
            const category = await Category.findById(categoryId);
            if (!category) {
                throw new AppError('Category not found', ERROR_CODES.NOT_FOUND);
            }
            
            // Use existing getAllProducts method with category filter
            const options = {
                ...queryOptions,
                category: categoryId
            };
            
            return await this.getAllProducts(options);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get comprehensive product statistics for admin dashboard
     * @returns {Object} Statistical data for admin
     */
    async getProductStatistics() {
        try {
            // 1. Tổng số sản phẩm
            const totalProducts = await Product.countDocuments({});
            
            // 2. Tổng số variant từ ProductVariant model
            const totalVariants = await ProductVariant.countDocuments({});
            
            // 3. Top sản phẩm bán chạy nhất dựa trên Order
            // (Cần import Order model để tính toán)
            const Order = require('../models/OrderSchema');
            const topSellingProducts = await Order.aggregate([
                { $unwind: '$items' },
                {
                    $lookup: {
                        from: 'productvariants',
                        localField: 'items.productVariant',
                        foreignField: '_id',
                        as: 'variantInfo'
                    }
                },
                { $unwind: '$variantInfo' },
                {
                    $lookup: {
                        from: 'products',
                        localField: 'variantInfo.product',
                        foreignField: '_id',
                        as: 'productInfo'
                    }
                },
                { $unwind: '$productInfo' },
                {
                    $group: {
                        _id: '$variantInfo.product',
                        name: { $first: '$productInfo.name' },
                        totalSold: { $sum: '$items.quantity' },
                        totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
                        orderCount: { $sum: 1 }
                    }
                },
                { $sort: { totalSold: -1 } },
                { $limit: 10 }
            ]);

            // 4. Tồn kho của từng product (tính tổng stock từ các variant)
            const productStockSummary = await ProductVariant.aggregate([
                {
                    $group: {
                        _id: '$product',
                        totalStock: { $sum: '$stock' },
                        variantCount: { $sum: 1 },
                        inStockVariants: {
                            $sum: { $cond: [{ $gt: ['$stock', 0] }, 1, 0] }
                        },
                        outOfStockVariants: {
                            $sum: { $cond: [{ $eq: ['$stock', 0] }, 1, 0] }
                        },
                        lowestStock: { $min: '$stock' },
                        highestStock: { $max: '$stock' }
                    }
                },
                {
                    $lookup: {
                        from: 'products',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                { $unwind: '$product' },
                {
                    $project: {
                        _id: 1,
                        name: '$product.name',
                        category: '$product.category',
                        isActive: '$product.isActive',
                        totalStock: 1,
                        variantCount: 1,
                        inStockVariants: 1,
                        outOfStockVariants: 1,
                        lowestStock: 1,
                        highestStock: 1,
                        stockStatus: {
                            $cond: {
                                if: { $eq: ['$totalStock', 0] },
                                then: 'out_of_stock',
                                else: {
                                    $cond: {
                                        if: { $lt: ['$totalStock', 10] },
                                        then: 'low_stock',
                                        else: 'in_stock'
                                    }
                                }
                            }
                        }
                    }
                },
                { $sort: { totalStock: 1 } }
            ]);

            // 5. Danh sách sản phẩm có tồn kho thấp (dưới 10 sản phẩm)
            const lowStockProducts = productStockSummary.filter(p => p.totalStock > 0 && p.totalStock < 10);

            // 6. Số lượng sản phẩm theo category
            const productsByCategory = await Product.aggregate([
                {
                    $lookup: {
                        from: 'categories',
                        localField: 'category',
                        foreignField: '_id',
                        as: 'categoryInfo'
                    }
                },
                { $unwind: '$categoryInfo' },
                {
                    $group: {
                        _id: '$category',
                        categoryName: { $first: '$categoryInfo.name' },
                        productCount: { $sum: 1 },
                        activeProducts: {
                            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
                        },
                        inactiveProducts: {
                            $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] }
                        }
                    }
                },
                { $sort: { productCount: -1 } }
            ]);

            // 7. Tính toán thống kê tổng quan
            const activeProducts = await Product.countDocuments({ isActive: true });
            const inactiveProducts = await Product.countDocuments({ isActive: false });
            
            const outOfStockProductsCount = productStockSummary.filter(p => p.totalStock === 0).length;
            const lowStockProductsCount = lowStockProducts.length;
            const inStockProductsCount = productStockSummary.filter(p => p.totalStock > 0).length;

            // 8. Tính tổng giá trị tồn kho
            const totalInventoryValue = await ProductVariant.aggregate([
                {
                    $group: {
                        _id: null,
                        totalValue: { $sum: { $multiply: ['$stock', '$price'] } }
                    }
                }
            ]);

            return {
                overview: {
                    totalProducts,
                    totalVariants,
                    activeProducts,
                    inactiveProducts,
                    totalInventoryValue: totalInventoryValue[0]?.totalValue || 0
                },
                stockSummary: {
                    inStockProducts: inStockProductsCount,
                    outOfStockProducts: outOfStockProductsCount,
                    lowStockProducts: lowStockProductsCount,
                    lowStockThreshold: 10
                },
                topSellingProducts: topSellingProducts.map(product => ({
                    _id: product._id,
                    name: product.name,
                    totalSold: product.totalSold,
                    totalRevenue: product.totalRevenue,
                    orderCount: product.orderCount
                })),
                productStockDetails: productStockSummary,
                lowStockProducts: lowStockProducts.map(product => ({
                    _id: product._id,
                    name: product.name,
                    totalStock: product.totalStock,
                    variantCount: product.variantCount,
                    stockStatus: product.stockStatus
                })),
                productsByCategory: productsByCategory.map(cat => ({
                    _id: cat._id,
                    categoryName: cat.categoryName,
                    productCount: cat.productCount,
                    activeProducts: cat.activeProducts,
                    inactiveProducts: cat.inactiveProducts
                })),
                generatedAt: new Date(),
                summary: {
                    message: `Hệ thống có ${totalProducts} sản phẩm với ${totalVariants} biến thể. ${outOfStockProductsCount} sản phẩm hết hàng, ${lowStockProductsCount} sản phẩm sắp hết hàng.`,
                    recommendations: [
                        ...(lowStockProductsCount > 0 ? [`Cần nhập thêm hàng cho ${lowStockProductsCount} sản phẩm sắp hết hàng`] : []),
                        ...(outOfStockProductsCount > 0 ? [`Có ${outOfStockProductsCount} sản phẩm đã hết hàng cần được bổ sung`] : []),
                        ...(inactiveProducts > 0 ? [`Xem xét kích hoạt lại ${inactiveProducts} sản phẩm đang ẩn`] : [])
                    ]
                }
            };
        } catch (error) {
            throw new AppError(`Lỗi khi tạo thống kê sản phẩm: ${error.message}`, 500, 'STATISTICS_GENERATION_FAILED');
        }
    }

    /**
     * Get featured products based on real business metrics
     * Calculates popularity score from orders, reviews, and wishlist data
     * @param {number} limit - Number of products to return
     * @returns {Array} Featured products with popularity scores
     */
    async getFeaturedProducts(limit = 9) { // Updated default to 9 for frontend sections
        try {
            console.log('🎯 ProductService.getFeaturedProducts called with limit:', limit);
            
            // Step 1: First, let's just get all products to debug
            const allProducts = await Product.find({ isDeleted: { $ne: true } }).limit(10);
            console.log(`📋 Found ${allProducts.length} total products in DB`);
            allProducts.forEach(p => console.log(`  - ${p._id}: ${p.name} (status: ${p.status || 'undefined'})`));
            
            // Simplified featured products query for testing  
            const featuredProducts = await Product.aggregate([
                {
                    // Stage 1: Match products that should be displayed
                    $match: {
                        isDeleted: { $ne: true }
                    }
                },
                {
                    // Stage 2: Add simple popularity score (just use price as base)
                    $addFields: {
                        popularityScore: { $ifNull: ['$price', 100000] } // Use price as simple score
                    }
                },
                {
                    // Stage 3: Sort by popularity score (highest first)
                    $sort: { popularityScore: -1 }
                },
                {
                    // Stage 4: Limit results
                    $limit: limit
                },
                {
                    // Stage 5: Lookup category information 
                    $lookup: {
                        from: 'categories',
                        localField: 'category',
                        foreignField: '_id',
                        as: 'category'
                    }
                },
                {
                    // Stage 6: Unwind category array to object
                    $unwind: {
                        path: '$category',
                        preserveNullAndEmptyArrays: true // Keep products without category
                    }
                },
                {
                    // Stage 7: Project with category information
                    $project: {
                        _id: 1,
                        name: 1,
                        description: 1,
                        price: 1,
                        salePrice: 1,
                        images: 1,
                        status: 1,
                        category: {
                            _id: '$category._id',
                            name: '$category.name'
                        },
                        popularityScore: 1
                    }
                }
            ]);

            console.log(`✅ Found ${featuredProducts.length} featured products (simplified pipeline)`);
            if (featuredProducts.length > 0) {
                console.log('📊 First featured product category check:', {
                    name: featuredProducts[0].name,
                    hasCategory: !!featuredProducts[0].category,
                    categoryData: featuredProducts[0].category,
                    allFields: Object.keys(featuredProducts[0])
                });
            }

            return featuredProducts;
        } catch (error) {
            console.error('❌ Error in getFeaturedProducts:', error);
            throw new AppError(`Lỗi khi lấy sản phẩm nổi bật: ${error.message}`, 500, 'FEATURED_PRODUCTS_FAILED');
        }
    }
}

module.exports = ProductService;
