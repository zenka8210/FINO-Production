const BaseController = require('./baseController');
const ProductService = require('../services/productService');
const ResponseHandler = require('../services/responseHandler');
const { MESSAGES, PAGINATION } = require('../config/constants');
const { AppError } = require('../middlewares/errorHandler');

class ProductController extends BaseController {
    constructor() {
        super(new ProductService());
    }

    getAllProducts = async (req, res, next) => {
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
            ResponseHandler.success(res, MESSAGES.PRODUCT_CREATED || 'Lấy danh sách sản phẩm thành công', result);
        } catch (error) {
            next(error);
        }
    };

    getProductById = async (req, res, next) => {
        try {
            const { id } = req.params;
            const includeVariants = req.query.includeVariants;
            const product = await this.service.getProductById(id, includeVariants);
            ResponseHandler.success(res, MESSAGES.PRODUCT_UPDATED || 'Lấy chi tiết sản phẩm thành công', product);
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
                sortBy: req.query.sortBy,
                sortOrder: req.query.sortOrder,
            };
            const result = await this.service.getProductsByCategory(categoryId, queryOptions);
            ResponseHandler.success(res, `Lấy sản phẩm theo danh mục ${categoryId} thành công`, result);
        } catch (error) {
            next(error);
        }
    };
}

module.exports = ProductController;
