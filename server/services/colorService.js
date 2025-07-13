const BaseService = require('./baseService');
const Color = require('../models/ColorSchema');
const ProductVariant = require('../models/ProductVariantSchema');
const { AppError } = require('../middlewares/errorHandler');
const { MESSAGES } = require('../config/constants');
const { QueryBuilder } = require('../middlewares/queryMiddleware');

class ColorService extends BaseService {
    constructor() {
        super(Color);
    }

    // ============= BASIC CRUD OPERATIONS =============

    async getAllColors(queryOptions = {}) {
        const { page = 1, limit = 10, search, sortBy = 'name', sortOrder = 'asc' } = queryOptions;
        const skip = (page - 1) * limit;
        const filter = {};

        // Search by name
        if (search) {
            filter.name = { $regex: search, $options: 'i' };
        }

        try {
            const colors = await Color.find(filter)
                .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
                .skip(skip)
                .limit(parseInt(limit));

            const total = await Color.countDocuments(filter);

            return {
                data: colors,
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit)
            };
        } catch (error) {
            throw new AppError('Lỗi lấy danh sách màu sắc', 500);
        }
    }

    async getColorById(colorId) {
        try {
            const color = await Color.findById(colorId);
            if (!color) {
                throw new AppError('Không tìm thấy màu sắc', 404);
            }
            return color;
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError('Lỗi lấy thông tin màu sắc', 500);
        }
    }

    async createColor(colorData) {
        try {
            // Business Logic: Validate name uniqueness
            await this.validateColorNameUniqueness(colorData.name);

            const newColor = new Color(colorData);
            await newColor.save();
            return newColor;
        } catch (error) {
            if (error instanceof AppError) throw error;
            if (error.code === 11000) {
                throw new AppError('Tên màu sắc đã tồn tại', 400);
            }
            throw new AppError('Lỗi tạo màu sắc mới', 400);
        }
    }

    async updateColor(colorId, updateData) {
        try {
            // Business Logic: Validate name uniqueness if name is being updated
            if (updateData.name) {
                await this.validateColorNameUniqueness(updateData.name, colorId);
            }

            const color = await Color.findByIdAndUpdate(
                colorId, 
                updateData, 
                { new: true, runValidators: true }
            );
            
            if (!color) {
                throw new AppError('Không tìm thấy màu sắc', 404);
            }
            return color;
        } catch (error) {
            if (error instanceof AppError) throw error;
            if (error.code === 11000) {
                throw new AppError('Tên màu sắc đã tồn tại', 400);
            }
            throw new AppError('Lỗi cập nhật màu sắc', 400);
        }
    }

    async deleteColor(colorId) {
        try {
            // Business Logic: Check if color can be deleted (not used in variants)
            const canDelete = await this.canDeleteColor(colorId);
            if (!canDelete.canDelete) {
                throw new AppError(canDelete.message, 400);
            }

            const color = await Color.findByIdAndDelete(colorId);
            if (!color) {
                throw new AppError('Không tìm thấy màu sắc', 404);
            }
            
            return { message: 'Xóa màu sắc thành công' };
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError('Lỗi xóa màu sắc', 500);
        }
    }

    // ============= BUSINESS LOGIC METHODS =============

    /**
     * Business Logic: Kiểm tra tính duy nhất của tên màu (case-insensitive)
     * Đảm bảo: Tên màu phải là duy nhất
     */
    async validateColorNameUniqueness(name, excludeId = null) {
        // Validate format first
        if (!name || typeof name !== 'string') {
            throw new AppError('Tên màu sắc không hợp lệ', 400);
        }

        const trimmedName = name.trim();

        // Check length
        if (trimmedName.length < 1 || trimmedName.length > 50) {
            throw new AppError('Tên màu sắc phải từ 1-50 ký tự', 400);
        }

        // Check format - only letters, numbers, spaces, hyphens allowed
        if (!/^[a-zA-ZÀ-ỹ0-9\s\-]+$/.test(trimmedName)) {
            throw new AppError('Tên màu sắc chỉ được chứa chữ cái, số, khoảng trắng và dấu gạch ngang', 400);
        }

        // Check uniqueness
        const query = {
            name: { $regex: new RegExp(`^${trimmedName}$`, 'i') }
        };
        
        if (excludeId) {
            query._id = { $ne: excludeId };
        }
        
        const existingColor = await Color.findOne(query);
        
        if (existingColor) {
            throw new AppError(`Màu "${trimmedName}" đã tồn tại trong hệ thống`, 400);
        }
        
        return true;
    }

    /**
     * Business Logic: Kiểm tra màu có thể xóa không
     * Đảm bảo: Màu có thể được tái sử dụng cho nhiều variant, không thể xóa nếu đang được sử dụng
     */
    async canDeleteColor(colorId) {
        try {
            // Kiểm tra có variant nào đang sử dụng màu này không
            const variantCount = await ProductVariant.countDocuments({ 
                color: colorId
            });
            
            const color = await this.getColorById(colorId);
            
            return {
                canDelete: variantCount === 0,
                usageCount: variantCount,
                color: color.name,
                message: variantCount > 0 
                    ? `Không thể xóa màu "${color.name}" vì đang được sử dụng bởi ${variantCount} variant` 
                    : `Màu "${color.name}" có thể xóa an toàn`
            };
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError('Lỗi kiểm tra khả năng xóa màu: ' + error.message, 500);
        }
    }

    /**
     * Business Logic: Tìm kiếm màu theo tên (hỗ trợ tái sử dụng)
     * Đảm bảo: Mỗi màu có thể được tái sử dụng cho nhiều variant
     */
    async findByNameOrSuggest(searchName) {
        try {
            // Tìm màu theo tên (case-insensitive) để tái sử dụng
            const existingColor = await Color.findOne({
                name: { $regex: new RegExp(searchName, 'i') }
            });
            
            if (existingColor) {
                // Kiểm tra màu đang được sử dụng ở bao nhiều variant
                const usageCount = await ProductVariant.countDocuments({ 
                    color: existingColor._id 
                });
                
                return {
                    found: true,
                    color: existingColor,
                    usageCount,
                    message: `Màu "${existingColor.name}" đã tồn tại và đang được sử dụng trong ${usageCount} variant`
                };
            }
            
            // Gợi ý màu phổ biến nếu không tìm thấy
            const suggestions = this.getColorSuggestions().filter(color => 
                color.toLowerCase().includes(searchName.toLowerCase())
            );
            
            return {
                found: false,
                suggestions,
                message: suggestions.length > 0 
                    ? 'Không tìm thấy màu chính xác, đây là một số gợi ý'
                    : 'Không tìm thấy màu phù hợp'
            };
        } catch (error) {
            throw new AppError('Lỗi tìm kiếm màu: ' + error.message, 500);
        }
    }

    /**
     * Business Logic: Lấy thống kê sử dụng màu
     */
    async getColorUsageStats(colorId) {
        try {
            const color = await this.getColorById(colorId);
            const variantCount = await ProductVariant.countDocuments({ color: colorId });
            
            return {
                color,
                usageStats: {
                    variantCount,
                    canDelete: variantCount === 0,
                    message: `Màu "${color.name}" đang được sử dụng trong ${variantCount} variant`
                }
            };
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError('Lỗi lấy thống kê màu sắc', 500);
        }
    }

    /**
     * Lấy gợi ý màu phổ biến
     */
    getColorSuggestions() {
        return [
            'Đỏ', 'Xanh dương', 'Xanh lá', 'Vàng', 'Đen', 'Trắng', 
            'Xám', 'Hồng', 'Tím', 'Cam', 'Nâu', 'Xanh navy', 
            'Kem', 'Be', 'Bạc', 'Vàng gold'
        ];
    }

    /**
     * Validate màu có thể được sử dụng
     */
    async validateColorForUse(colorId) {
        try {
            const color = await this.getColorById(colorId);
            return {
                valid: true,
                color,
                message: `Màu "${color.name}" hợp lệ và có thể sử dụng`
            };
        } catch (error) {
            return {
                valid: false,
                message: 'Màu không tồn tại hoặc không hợp lệ'
            };
        }
    }

    /**
     * Get all colors using new Query Middleware
     * @param {Object} queryParams - Query parameters from request
     * @returns {Object} Query results with pagination
     */
    async getAllColorsWithQuery(queryParams) {
        try {
            // Sử dụng QueryUtils với pre-configured setup cho Color
            const result = await QueryUtils.getColors(Color, queryParams);
            
            return result;
        } catch (error) {
            throw new AppError(
                `Error fetching colors: ${error.message}`,
                'COLOR_FETCH_FAILED',
                500
            );
        }
    }
}

module.exports = ColorService;
