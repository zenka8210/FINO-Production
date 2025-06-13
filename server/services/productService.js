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
            includeVariants = false // New option to include variants or not
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
        }        try {
            let query = Product.find(filter)
                .populate('category')
                .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
                .skip(skip)
                .limit(parseInt(limit));

            if (includeVariants === 'true' || includeVariants === true) {
                query = query.populate('variants');
            }

            const products = await query;
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
            if (productData.category) {
                const categoryExists = await Category.findById(productData.category);
                if (!categoryExists) {
                    throw new AppError(MESSAGES.CATEGORY_NOT_FOUND, ERROR_CODES.CATEGORY.NOT_FOUND, 400);
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
                throw new AppError(MESSAGES.PRODUCT_HAS_VARIANTS || "Sản phẩm có biến thể, không thể xóa. Xóa các biến thể trước.", ERROR_CODES.PRODUCT.HAS_VARIANTS || 'PRODUCT_HAS_VARIANTS', 400);
            }

            const product = await Product.findByIdAndDelete(productId);
            if (!product) {
                throw new AppError(MESSAGES.PRODUCT_NOT_FOUND, ERROR_CODES.PRODUCT.NOT_FOUND, 404);
            }
            return { message: MESSAGES.PRODUCT_DELETED };
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(MESSAGES.PRODUCT_DELETE_FAILED, ERROR_CODES.PRODUCT.DELETE_FAILED, 500);
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
}

module.exports = ProductService;
