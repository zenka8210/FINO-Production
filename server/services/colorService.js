const BaseService = require('./baseService');
const Color = require('../models/ColorSchema');
const ProductVariant = require('../models/ProductVariantSchema'); // To check usage
const { AppError } = require('../middlewares/errorHandler');
const { MESSAGES, ERROR_CODES } = require('../config/constants');

class ColorService extends BaseService {
    constructor() {
        super(Color);
    }

    async getAllColors(queryOptions) {
        const { page = 1, limit = 10, name, sortBy = 'name', sortOrder = 'asc' } = queryOptions;
        const skip = (page - 1) * limit;
        const filter = {};

        if (name) {
            filter.name = { $regex: name, $options: 'i' };
        }

        try {
            const colors = await Color.find(filter)
                .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
                .skip(skip)
                .limit(parseInt(limit));

            const totalColors = await Color.countDocuments(filter);

            return {
                data: colors,
                total: totalColors,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(totalColors / limit),
            };
        } catch (error) {
            throw new AppError(MESSAGES.COLOR_UPDATE_FAILED, 500);
        }
    }

    async getColorById(colorId) {
        try {
            const color = await Color.findById(colorId);
            if (!color) {
                throw new AppError(MESSAGES.COLOR_NOT_FOUND, 404);
            }
            return color;
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(MESSAGES.COLOR_CREATE_FAILED, 500);
        }
    }

    // Business rule validation methods
    
    /**
     * Validate color name format and uniqueness (linh hoạt hơn)
     */
    async validateColorName(name, excludeId = null) {
        if (!name || typeof name !== 'string') {
            throw new AppError('Tên màu sắc không hợp lệ', 400);
        }

        name = name.trim();

        // Check length
        if (name.length < 1 || name.length > 50) {
            throw new AppError('Tên màu sắc phải từ 1-50 ký tự', 400);
        }

        // Flexible validation: letters, numbers, spaces, hyphens
        if (!/^[a-zA-ZÀ-ỹ0-9\s\-]+$/.test(name)) {
            throw new AppError('Tên màu sắc chỉ được chứa chữ cái, số, khoảng trắng và dấu gạch ngang', 400);
        }

        // Check uniqueness
        const filter = { name: { $regex: new RegExp(`^${name}$`, 'i') } };
        if (excludeId) {
            filter._id = { $ne: excludeId };
        }
        
        const existingColor = await Color.findOne(filter);
        if (existingColor) {
            throw new AppError('Tên màu sắc đã tồn tại', 400);
        }
        
        return true;
    }

    /**
     * Check if color can be safely deleted (not used in any variants)
     */
    async canDeleteColor(colorId) {
        const usageCount = await ProductVariant.countDocuments({ color: colorId });
        if (usageCount > 0) {
            throw new AppError(`Màu sắc đang được sử dụng trong ${usageCount} variant, không thể xóa`, 'COLOR_IN_USE', 400);
        }
        return true;
    }

    /**
     * Get color usage statistics
     */
    async getColorUsageStats(colorId) {
        const variantCount = await ProductVariant.countDocuments({ color: colorId });
        const color = await this.getColorById(colorId);
        
        return {
            color,
            usageStats: {
                variantCount,
                canDelete: variantCount === 0
            }
        };
    }

    /**
     * Get suggested colors for admin UI
     */
    async getSuggestedColors() {
        return await Color.getSuggestedColors();
    }

    /**
     * Check if color can be deleted (business rule)
     */
    async canDeleteColor(colorId) {
        try {
            const variantCount = await ProductVariant.countDocuments({ color: colorId });
            
            if (variantCount > 0) {
                return { 
                    canDelete: false, 
                    message: `Không thể xóa màu vì còn ${variantCount} biến thể sản phẩm đang sử dụng` 
                };
            }
            
            return { canDelete: true, message: 'Màu có thể xóa' };
        } catch (error) {
            throw new AppError('Lỗi kiểm tra xóa màu', 'CHECK_DELETE_COLOR_FAILED', 500);
        }
    }

    // Enhanced CRUD methods with business rules
    
    async createColor(colorData) {
        try {
            // Validate color name
            await this.validateColorName(colorData.name);

            const newColor = new Color(colorData);
            await newColor.save();
            return newColor;
        } catch (error) {
            if (error instanceof AppError) throw error;
            if (error.code === 11000) { // Duplicate key error for name
                throw new AppError(MESSAGES.COLOR_EXISTS, 400);
            }
            throw new AppError(MESSAGES.COLOR_CREATE_FAILED, 400, error.errors);
        }
    }

    async updateColor(colorId, updateData) {
        try {
            // Validate color name if being updated
            if (updateData.name) {
                await this.validateColorName(updateData.name, colorId);
            }

            const color = await Color.findByIdAndUpdate(colorId, updateData, { new: true, runValidators: true });
            if (!color) {
                throw new AppError(MESSAGES.COLOR_NOT_FOUND, 404);
            }
            return color;
        } catch (error) {
            if (error instanceof AppError) throw error;
            if (error.code === 11000) { // Duplicate key error for name
                throw new AppError(MESSAGES.COLOR_EXISTS, 400);
            }
            throw new AppError(MESSAGES.COLOR_UPDATE_FAILED, 400, error.errors);
        }
    }

    async deleteColor(colorId) {
        try {
            // Check if color can be deleted
            await this.canDeleteColor(colorId);

            const color = await Color.findByIdAndDelete(colorId);
            if (!color) {
                throw new AppError(MESSAGES.COLOR_NOT_FOUND, 404);
            }
            return { message: MESSAGES.COLOR_DELETED };
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(MESSAGES.COLOR_DELETE_FAILED, 500);
        }
    }
}

module.exports = ColorService;
