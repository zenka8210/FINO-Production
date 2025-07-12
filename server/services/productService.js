const BaseService = require('./baseService');
const Product = require('../models/ProductSchema');
const ProductVariant = require('../models/ProductVariantSchema');
const Category = require('../models/CategorySchema');
const { AppError } = require('../middlewares/errorHandler');
const { MESSAGES, ERROR_CODES, PAGINATION } = require('../config/constants');

class ProductService extends BaseService {
    constructor() {
        super(Product);
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
            includeOutOfStock = false // New option to include out of stock products
        } = queryOptions;

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

        try {
            let query = Product.find(filter)
                .populate('category')
                .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
                .skip(skip)
                .limit(parseInt(limit));

            if (includeVariants === 'true' || includeVariants === true) {
                query = query.populate({
                    path: 'variants',
                    populate: [
                        { path: 'color', select: 'name hexCode' },
                        { path: 'size', select: 'name' }
                    ]
                });
            }

            let products = await query;
            
            // Filter out products with no stock if includeOutOfStock is false
            if (includeOutOfStock === 'false' || includeOutOfStock === false) {
                const productsWithStock = [];
                
                for (const product of products) {
                    // Check if product can be displayed (has variants, is active, has stock)
                    const displayValidation = await this.validateProductForDisplay(product._id);
                    
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
            } else {
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

            return {
                data: products,
                total: totalProducts,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(totalProducts / parseInt(limit)),
            };
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(MESSAGES.PRODUCT_CREATE_FAILED || "Lấy danh sách sản phẩm thất bại", ERROR_CODES.PRODUCT.FETCH_ALL_FAILED || 'PRODUCT_FETCH_ALL_FAILED', 500);
        }
    }

    async getProductById(productId, includeVariants = false) {
        try {
            let query = Product.findById(productId).populate('category');
            if (includeVariants === 'true' || includeVariants === true) {
                query = query.populate('variants');
            }
            const product = await query;

            if (!product) {
                throw new AppError(MESSAGES.PRODUCT_NOT_FOUND, ERROR_CODES.PRODUCT.NOT_FOUND, 404);
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
     * Validate that product has at least one variant before allowing it to be visible
     */
    async validateProductForDisplay(productId) {
        try {
            const product = await Product.findById(productId);
            if (!product) {
                throw new AppError(MESSAGES.PRODUCT_NOT_FOUND, ERROR_CODES.PRODUCT.NOT_FOUND, 404);
            }

            // Check if product is active
            if (!product.isActive) {
                return { canDisplay: false, reason: 'Sản phẩm đã bị ẩn' };
            }

            // Check if product has at least one variant
            const variantsCount = await ProductVariant.countDocuments({ product: productId, isActive: true });
            if (variantsCount === 0) {
                return { canDisplay: false, reason: 'Sản phẩm phải có ít nhất 1 variant' };
            }

            // Check if all variants are out of stock
            const inStockVariants = await ProductVariant.countDocuments({ 
                product: productId, 
                isActive: true, 
                stock: { $gt: 0 } 
            });
            
            if (inStockVariants === 0) {
                return { canDisplay: false, reason: 'Tất cả variants đã hết hàng' };
            }

            return { canDisplay: true, reason: null };
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError('Lỗi kiểm tra hiển thị sản phẩm', 'PRODUCT_DISPLAY_VALIDATION_FAILED', 500);
        }
    }

    /**
     * Get all products that have all variants out of stock
     */
    async getOutOfStockProducts(queryOptions = {}) {
        try {
            const {
                page = PAGINATION.DEFAULT_PAGE,
                limit = PAGINATION.DEFAULT_LIMIT
            } = queryOptions;

            const skip = (parseInt(page) - 1) * parseInt(limit);

            // Aggregate to find products where all variants are out of stock
            const outOfStockProducts = await Product.aggregate([
                {
                    $lookup: {
                        from: 'productvariants',
                        localField: '_id',
                        foreignField: 'product',
                        as: 'variants'
                    }
                },
                {
                    $match: {
                        $and: [
                            { 'variants.0': { $exists: true } }, // Has at least one variant
                            {
                                $expr: {
                                    $eq: [
                                        { $size: { $filter: { input: '$variants', cond: { $gt: ['$$this.stock', 0] } } } },
                                        0
                                    ]
                                }
                            }
                        ]
                    }
                },
                {
                    $lookup: {
                        from: 'categories',
                        localField: 'category',
                        foreignField: '_id',
                        as: 'category'
                    }
                },
                {
                    $unwind: '$category'
                },
                { $skip: skip },
                { $limit: parseInt(limit) }
            ]);

            const total = await Product.aggregate([
                {
                    $lookup: {
                        from: 'productvariants',
                        localField: '_id',
                        foreignField: 'product',
                        as: 'variants'
                    }
                },
                {
                    $match: {
                        $and: [
                            { 'variants.0': { $exists: true } },
                            {
                                $expr: {
                                    $eq: [
                                        { $size: { $filter: { input: '$variants', cond: { $gt: ['$$this.stock', 0] } } } },
                                        0
                                    ]
                                }
                            }
                        ]
                    }
                },
                { $count: 'total' }
            ]);

            const totalCount = total.length > 0 ? total[0].total : 0;

            return {
                data: outOfStockProducts,
                total: totalCount,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(totalCount / parseInt(limit))
            };
        } catch (error) {
            throw new AppError('Lỗi lấy danh sách sản phẩm hết hàng', 'OUT_OF_STOCK_PRODUCTS_FAILED', 500);
        }
    }

    // Keep specific methods if they offer distinct logic or are widely used
    // For example, getting products by category with variants is a common use case
    async getProductsByCategory(categoryId, queryOptions) {
        const {
            page = PAGINATION.DEFAULT_PAGE,
            limit = PAGINATION.DEFAULT_LIMIT,
            // other specific filters for this function if needed
        } = queryOptions;

        const categoryExists = await Category.findById(categoryId);
        if (!categoryExists) {
            throw new AppError(MESSAGES.CATEGORY_NOT_FOUND, ERROR_CODES.CATEGORY.NOT_FOUND, 404);
        }

        return this.getAllProducts({
            ...queryOptions,
            category: categoryId,
            includeVariants: queryOptions.includeVariants === undefined ? true : queryOptions.includeVariants // Default to true if not specified
        });
    }

    /**
     * Check if a product has available stock
     * @param {string} productId - Product ID
     * @returns {Promise<object>} Availability information
     */
    async checkProductAvailability(productId) {
        try {
            const variants = await ProductVariant.find({ product: productId })
                .populate('color', 'name hexCode')
                .populate('size', 'name');

            if (!variants || variants.length === 0) {
                return {
                    available: false,
                    totalStock: 0,
                    availableVariants: 0,
                    outOfStockVariants: 0,
                    variants: []
                };
            }

            let totalStock = 0;
            let availableVariants = 0;
            let outOfStockVariants = 0;
            
            const variantDetails = variants.map(variant => {
                const stock = variant.stock || 0;
                totalStock += stock;
                
                if (stock > 0) {
                    availableVariants++;
                } else {
                    outOfStockVariants++;
                }
                
                return {
                    _id: variant._id,
                    color: variant.color,
                    size: variant.size,
                    price: variant.price,
                    stock: stock,
                    available: stock > 0
                };
            });

            return {
                available: totalStock > 0,
                totalStock,
                availableVariants,
                outOfStockVariants,
                variants: variantDetails
            };
        } catch (error) {
            throw new AppError("Lỗi kiểm tra tồn kho sản phẩm", 'STOCK_CHECK_FAILED', 500);
        }
    }

    /**
     * Check if a specific variant has enough stock for order
     * @param {string} variantId - Product Variant ID
     * @param {number} quantity - Requested quantity
     * @returns {Promise<object>} Stock availability
     */
    async checkVariantStock(variantId, quantity = 1) {
        try {
            const variant = await ProductVariant.findById(variantId)
                .populate('product', 'name')
                .populate('color', 'name')
                .populate('size', 'name');

            if (!variant) {
                throw new AppError("Variant không tồn tại", 'VARIANT_NOT_FOUND', 404);
            }

            const availableStock = variant.stock || 0;
            const canOrder = availableStock >= quantity;

            return {
                canOrder,
                availableStock,
                requestedQuantity: quantity,
                variant: {
                    _id: variant._id,
                    product: variant.product,
                    color: variant.color,
                    size: variant.size,
                    price: variant.price
                }
            };
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError("Lỗi kiểm tra tồn kho variant", 'VARIANT_STOCK_CHECK_FAILED', 500);
        }
    }

    /**
     * Reserve stock for order (decrease stock)
     * @param {Array} orderItems - Array of {variantId, quantity}
     * @returns {Promise<Array>} Updated variants
     */
    async reserveStock(orderItems) {
        const session = await ProductVariant.startSession();
        session.startTransaction();

        try {
            const updatedVariants = [];

            for (const item of orderItems) {
                const { variantId, quantity } = item;

                // Check stock availability
                const stockCheck = await this.checkVariantStock(variantId, quantity);
                
                if (!stockCheck.canOrder) {
                    throw new AppError(
                        `Không đủ hàng cho ${stockCheck.variant.product.name} - ${stockCheck.variant.color.name} - ${stockCheck.variant.size.name}. Còn lại: ${stockCheck.availableStock}, yêu cầu: ${quantity}`,
                        'INSUFFICIENT_STOCK',
                        400
                    );
                }

                // Update stock
                const updatedVariant = await ProductVariant.findByIdAndUpdate(
                    variantId,
                    { $inc: { stock: -quantity } },
                    { new: true, session }
                );

                updatedVariants.push(updatedVariant);
            }

            await session.commitTransaction();
            return updatedVariants;

        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * Restore stock when order is cancelled
     * @param {Array} orderItems - Array of {variantId, quantity}
     * @returns {Promise<Array>} Updated variants
     */
    async restoreStock(orderItems) {
        try {
            const updatedVariants = [];

            for (const item of orderItems) {
                const { variantId, quantity } = item;

                const updatedVariant = await ProductVariant.findByIdAndUpdate(
                    variantId,
                    { $inc: { stock: quantity } },
                    { new: true }
                );

                updatedVariants.push(updatedVariant);
            }

            return updatedVariants;
        } catch (error) {
            throw new AppError("Lỗi khôi phục tồn kho", 'STOCK_RESTORE_FAILED', 500);
        }
    }
}

module.exports = ProductService;
