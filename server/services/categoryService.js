const BaseService = require('./baseService');
const Category = require('../models/CategorySchema');
const { AppError } = require('../middlewares/errorHandler');
const { MESSAGES, ERROR_CODES } = require('../config/constants');

class CategoryService extends BaseService {
    constructor() {
        super(Category);
    }
    async getAllCategories(queryOptions) {
        const { page = 1, limit = 10, name, parent, sortBy = 'name', sortOrder = 'asc' } = queryOptions;
        const skip = (page - 1) * limit;
        const filter = {};

        if (name) {
            filter.name = { $regex: name, $options: 'i' };
        }
        if (parent === 'null' || parent === null) { // Handle string 'null' for root categories
            filter.parent = null;
        } else if (parent) {
            filter.parent = parent;
        }

        try {
            const categories = await Category.find(filter)
                .populate('parent')
                .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
                .skip(skip)
                .limit(parseInt(limit));

            const totalCategories = await Category.countDocuments(filter);

            return {
                data: categories,
                total: totalCategories,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(totalCategories / limit),
            };
        } catch (error) {
            throw new AppError(MESSAGES.CATEGORY_CREATE_FAILED, ERROR_CODES.CATEGORY.FETCH_ALL_FAILED || 'CATEGORY_FETCH_ALL_FAILED', 500); // Ensure FETCH_ALL_FAILED exists or add it
        }
    }

    async getCategoryById(categoryId) {
        try {
            const category = await Category.findById(categoryId).populate('parent');
            if (!category) {
                throw new AppError(MESSAGES.CATEGORY_NOT_FOUND, ERROR_CODES.CATEGORY.NOT_FOUND, 404);
            }
            return category;
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(MESSAGES.CATEGORY_UPDATE_FAILED, ERROR_CODES.CATEGORY.FETCH_SINGLE_FAILED || 'CATEGORY_FETCH_SINGLE_FAILED', 500); // Ensure FETCH_SINGLE_FAILED exists or add it
        }
    }

    async createCategory(categoryData) {
        try {
            // Check if parent category exists if provided
            if (categoryData.parent) {
                const parentCategory = await Category.findById(categoryData.parent);
                if (!parentCategory) {
                    throw new AppError(MESSAGES.PARENT_CATEGORY_NOT_FOUND, ERROR_CODES.CATEGORY.PARENT_NOT_FOUND, 400);
                }
            }
            const newCategory = new Category(categoryData);
            await newCategory.save();
            return newCategory;
        } catch (error) {
            if (error.code === 11000) { // Duplicate key error for name
                 throw new AppError(MESSAGES.CATEGORY_EXISTS, ERROR_CODES.CATEGORY.EXISTS, 400);
            }
            if (error instanceof AppError) throw error;
            throw new AppError(MESSAGES.CATEGORY_CREATE_FAILED, ERROR_CODES.CATEGORY.CREATE_FAILED, 400, error.errors);
        }
    }

    async updateCategory(categoryId, updateData) {
        try {
            // Check if parent category exists if provided and changed
            if (updateData.parent) {
                const parentCategory = await Category.findById(updateData.parent);
                if (!parentCategory) {
                    throw new AppError(MESSAGES.PARENT_CATEGORY_NOT_FOUND, ERROR_CODES.CATEGORY.PARENT_NOT_FOUND, 400);
                }
            }
            const category = await Category.findByIdAndUpdate(categoryId, updateData, { new: true, runValidators: true });
            if (!category) {
                throw new AppError(MESSAGES.CATEGORY_NOT_FOUND, ERROR_CODES.CATEGORY.NOT_FOUND, 404);
            }
            return category;
        } catch (error) {
            if (error.code === 11000) { // Duplicate key error for name
                throw new AppError(MESSAGES.CATEGORY_EXISTS, ERROR_CODES.CATEGORY.EXISTS, 400);
           }
            if (error instanceof AppError) throw error;
            throw new AppError(MESSAGES.CATEGORY_UPDATE_FAILED, ERROR_CODES.CATEGORY.UPDATE_FAILED, 400, error.errors);
        }
    }

    async deleteCategory(categoryId) {
        try {
            // Check if category has child categories
            const childCategories = await Category.countDocuments({ parent: categoryId });
            if (childCategories > 0) {
                throw new AppError('Không thể xóa danh mục có chứa danh mục con.', 'CATEGORY_HAS_CHILDREN', 400);
            }
            // Add check for products associated with this category if necessary in the future

            const category = await Category.findByIdAndDelete(categoryId);
            if (!category) {
                throw new AppError(MESSAGES.CATEGORY_NOT_FOUND, ERROR_CODES.CATEGORY.NOT_FOUND, 404);
            }
            return { message: MESSAGES.CATEGORY_DELETED };
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(MESSAGES.CATEGORY_DELETE_FAILED, ERROR_CODES.CATEGORY.DELETE_FAILED, 500);
        }
    }

    // Specific method to get only parent categories (categories with no parent)
    async getParentCategories() {
        try {
            return await Category.find({ parent: null }).sort({ name: 1 });
        } catch (error) {
             throw new AppError('Lỗi lấy danh mục cha', 'FETCH_PARENT_CATEGORIES_FAILED', 500);
        }
    }

    // Specific method to get child categories of a given parentId
    async getChildCategories(parentId) {
        try {
            return await Category.find({ parent: parentId }).populate('parent').sort({ name: 1 });
        } catch (error) {
            throw new AppError('Lỗi lấy danh mục con', 'FETCH_CHILD_CATEGORIES_FAILED', 500);
        }
    }
}

module.exports = CategoryService;
