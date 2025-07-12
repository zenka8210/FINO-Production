const BaseService = require('./baseService');
const Size = require('../models/SizeSchema');
const ProductVariant = require('../models/ProductVariantSchema'); // To check usage
const { AppError } = require('../middlewares/errorHandler');
const { MESSAGES, ERROR_CODES } = require('../config/constants');

class SizeService extends BaseService {
    constructor() {
        super(Size);
    }

    async getAllSizes(queryOptions) {
        const { page = 1, limit = 10, name, sortBy = 'name', sortOrder = 'asc' } = queryOptions;
        const skip = (page - 1) * limit;
        const filter = {};

        if (name) {
            filter.name = { $regex: name, $options: 'i' };
        }

        try {
            const sizes = await Size.find(filter)
                .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
                .skip(skip)
                .limit(parseInt(limit));

            const totalSizes = await Size.countDocuments(filter);

            return {
                data: sizes,
                total: totalSizes,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(totalSizes / limit),
            };
        } catch (error) {
            throw new AppError(MESSAGES.SIZE_UPDATE_FAILED, 500);
        }
    }

    async getSizeById(sizeId) {
        try {
            const size = await Size.findById(sizeId);
            if (!size) {
                throw new AppError(MESSAGES.SIZE_NOT_FOUND, 404);
            }
            return size;
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(MESSAGES.SIZE_CREATE_FAILED, 500);
        }
    }

    // Business rule validation methods

    /**
     * Validate size name format (linh hoạt hơn)
     */
    validateSizeName(name) {
        if (!name || typeof name !== 'string') {
            throw new AppError('Tên kích thước không hợp lệ', 400);
        }

        name = name.trim();
        
        // Check length
        if (name.length < 1 || name.length > 20) {
            throw new AppError('Tên kích thước phải từ 1-20 ký tự', 400);
        }

        // Flexible validation: letters, numbers, spaces, hyphens
        if (!/^[a-zA-ZÀ-ỹ0-9\s\-]+$/.test(name)) {
            throw new AppError('Tên kích thước chỉ được chứa chữ cái, số, khoảng trắng và dấu gạch ngang', 400);
        }
        
        return true;
    }

    /**
     * Check if size name is unique (case-insensitive)
     */
    async validateSizeUniqueness(name, excludeId = null) {
        const filter = { name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } };
        if (excludeId) {
            filter._id = { $ne: excludeId };
        }
        
        const existingSize = await Size.findOne(filter);
        if (existingSize) {
            throw new AppError('Tên kích thước đã tồn tại', 400);
        }
        
        return true;
    }

    /**
     * Check if size can be safely deleted (not used in any variants)
     */
    async canDeleteSize(sizeId) {
        const usageCount = await ProductVariant.countDocuments({ size: sizeId });
        if (usageCount > 0) {
            throw new AppError(`Kích thước đang được sử dụng trong ${usageCount} variant, không thể xóa`, 400);
        }
        return true;
    }

    /**
     * Get size usage statistics
     */
    async getSizeUsageStats(sizeId) {
        const variantCount = await ProductVariant.countDocuments({ size: sizeId });
        const size = await this.getSizeById(sizeId);
        
        return {
            size,
            usageStats: {
                variantCount,
                canDelete: variantCount === 0
            }
        };
    }

    /**
     * Get suggested sizes by category (for admin UI)
     */
    async getSuggestedSizesByCategory(category) {
        return await Size.getSuggestedSizes(category);
    }
    
    /**
     * Get all suggested sizes
     */
    async getAllSuggestedSizes() {
        return await Size.getSuggestedSizes();
    }

    /**
     * Get valid sizes by category (for validation)
     */
    getValidSizesByCategory(category) {
        const validSizes = {
            clothing: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', 'Free Size'],
            shoes: ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47'],
            accessories: ['Free Size', 'One Size', 'Nhỏ', 'Vừa', 'Lớn', 'Mini', 'Standard']
        };
        
        return validSizes[category] || [];
    }

    /**
     * Get all valid sizes (all categories)
     */
    getAllValidSizes() {
        return {
            clothing: this.getValidSizesByCategory('clothing'),
            shoes: this.getValidSizesByCategory('shoes'),
            accessories: this.getValidSizesByCategory('accessories')
        };
    }

    // Enhanced CRUD methods with business rules
    
    async createSize(sizeData) {
        try {
            // Validate size name against enum
            this.validateSizeName(sizeData.name);
            
            // Check uniqueness
            await this.validateSizeUniqueness(sizeData.name);

            const newSize = new Size(sizeData);
            await newSize.save();
            return newSize;
        } catch (error) {
            if (error instanceof AppError) throw error;
            if (error.code === 11000) { // Duplicate key error for name
                throw new AppError(MESSAGES.SIZE_EXISTS, 400);
            }
            throw new AppError(MESSAGES.SIZE_CREATE_FAILED, 400, error.errors);
        }
    }

    async updateSize(sizeId, updateData) {
        try {
            // Validate size name if being updated
            if (updateData.name) {
                this.validateSizeName(updateData.name);
                await this.validateSizeUniqueness(updateData.name, sizeId);
            }

            const size = await Size.findByIdAndUpdate(sizeId, updateData, { new: true, runValidators: true });
            if (!size) {
                throw new AppError(MESSAGES.SIZE_NOT_FOUND, 404);
            }
            return size;
        } catch (error) {
            if (error instanceof AppError) throw error;
            if (error.code === 11000) { // Duplicate key error for name
                throw new AppError(MESSAGES.SIZE_EXISTS, 400);
            }
            throw new AppError(MESSAGES.SIZE_UPDATE_FAILED, 400, error.errors);
        }
    }

    async deleteSize(sizeId) {
        try {
            // Check if size can be deleted
            await this.canDeleteSize(sizeId);

            const size = await Size.findByIdAndDelete(sizeId);
            if (!size) {
                throw new AppError(MESSAGES.SIZE_NOT_FOUND, 404);
            }
            return { message: MESSAGES.SIZE_DELETED };
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(MESSAGES.SIZE_DELETE_FAILED, 500);
        }
    }
}

module.exports = SizeService;
