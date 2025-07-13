const BaseService = require('./baseService');
const Size = require('../models/SizeSchema');
const ProductVariant = require('../models/ProductVariantSchema');
const { AppError } = require('../middlewares/errorHandler');
const { MESSAGES } = require('../config/constants');
const { QueryUtils } = require('../utils/queryUtils');

class SizeService extends BaseService {
    constructor() {
        super(Size);
    }

    // ============= BASIC CRUD OPERATIONS =============

    async getAllSizes(queryOptions = {}) {
        const { page = 1, limit = 10, search, sortBy = 'name', sortOrder = 'asc' } = queryOptions;
        const skip = (page - 1) * limit;
        const filter = {};

        // Search by name
        if (search) {
            filter.name = { $regex: search, $options: 'i' };
        }

        try {
            const sizes = await Size.find(filter)
                .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
                .skip(skip)
                .limit(parseInt(limit));

            const total = await Size.countDocuments(filter);

            return {
                data: sizes,
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit)
            };
        } catch (error) {
            throw new AppError('Lỗi lấy danh sách kích thước', 500);
        }
    }

    async getSizeById(sizeId) {
        try {
            const size = await Size.findById(sizeId);
            if (!size) {
                throw new AppError('Không tìm thấy kích thước', 404);
            }
            return size;
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError('Lỗi lấy thông tin kích thước', 500);
        }
    }

    async createSize(sizeData) {
        try {
            // Business Logic: Validate name uniqueness
            await this.validateSizeNameUniqueness(sizeData.name);

            const newSize = new Size(sizeData);
            await newSize.save();
            return newSize;
        } catch (error) {
            if (error instanceof AppError) throw error;
            if (error.code === 11000) {
                throw new AppError('Tên kích thước đã tồn tại', 400);
            }
            throw new AppError('Lỗi tạo kích thước mới', 400);
        }
    }

    async updateSize(sizeId, updateData) {
        try {
            // Business Logic: Validate name uniqueness if name is being updated
            if (updateData.name) {
                await this.validateSizeNameUniqueness(updateData.name, sizeId);
            }

            const size = await Size.findByIdAndUpdate(
                sizeId, 
                updateData, 
                { new: true, runValidators: true }
            );
            
            if (!size) {
                throw new AppError('Không tìm thấy kích thước', 404);
            }
            return size;
        } catch (error) {
            if (error instanceof AppError) throw error;
            if (error.code === 11000) {
                throw new AppError('Tên kích thước đã tồn tại', 400);
            }
            throw new AppError('Lỗi cập nhật kích thước', 400);
        }
    }

    async deleteSize(sizeId) {
        try {
            // Business Logic: Check if size can be deleted (not used in variants)
            const canDelete = await this.canDeleteSize(sizeId);
            if (!canDelete.canDelete) {
                throw new AppError(canDelete.message, 400);
            }

            const size = await Size.findByIdAndDelete(sizeId);
            if (!size) {
                throw new AppError('Không tìm thấy kích thước', 404);
            }
            
            return { message: 'Xóa kích thước thành công' };
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError('Lỗi xóa kích thước', 500);
        }
    }

    // ============= BUSINESS LOGIC METHODS =============

    /**
     * Business Logic: Kiểm tra tính duy nhất của tên size (case-insensitive)
     * Đảm bảo: Tên size phải là duy nhất
     */
    async validateSizeNameUniqueness(name, excludeId = null) {
        // Validate format first
        if (!name || typeof name !== 'string') {
            throw new AppError('Tên kích thước không hợp lệ', 400);
        }

        const trimmedName = name.trim().toUpperCase(); // Normalize to uppercase

        // Check length
        if (trimmedName.length < 1 || trimmedName.length > 20) {
            throw new AppError('Tên kích thước phải từ 1-20 ký tự', 400);
        }

        // Check format - only letters, numbers, spaces, hyphens allowed
        if (!/^[a-zA-ZÀ-ỹ0-9\s\-]+$/.test(trimmedName)) {
            throw new AppError('Tên kích thước chỉ được chứa chữ cái, số, khoảng trắng và dấu gạch ngang', 400);
        }

        // Check uniqueness (case-insensitive since we normalize to uppercase)
        const query = {
            name: { $regex: new RegExp(`^${trimmedName}$`, 'i') }
        };
        
        if (excludeId) {
            query._id = { $ne: excludeId };
        }
        
        const existingSize = await Size.findOne(query);
        
        if (existingSize) {
            throw new AppError(`Kích thước "${trimmedName}" đã tồn tại trong hệ thống`, 400);
        }
        
        return true;
    }

    /**
     * Business Logic: Kiểm tra size có thể xóa không
     * Đảm bảo: Size có thể được tái sử dụng cho nhiều variant, không thể xóa nếu đang được sử dụng
     */
    async canDeleteSize(sizeId) {
        try {
            // Kiểm tra có variant nào đang sử dụng size này không
            const variantCount = await ProductVariant.countDocuments({ 
                size: sizeId
            });
            
            const size = await this.getSizeById(sizeId);
            
            return {
                canDelete: variantCount === 0,
                usageCount: variantCount,
                size: size.name,
                message: variantCount > 0 
                    ? `Không thể xóa kích thước "${size.name}" vì đang được sử dụng bởi ${variantCount} variant` 
                    : `Kích thước "${size.name}" có thể xóa an toàn`
            };
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError('Lỗi kiểm tra khả năng xóa kích thước: ' + error.message, 500);
        }
    }

    /**
     * Business Logic: Tìm kiếm size theo tên (hỗ trợ tái sử dụng)
     * Đảm bảo: Mỗi size có thể được tái sử dụng cho nhiều variant
     */
    async findByNameOrSuggest(searchName) {
        try {
            // Tìm size theo tên (case-insensitive) để tái sử dụng
            const existingSize = await Size.findOne({
                name: { $regex: new RegExp(searchName, 'i') }
            });
            
            if (existingSize) {
                // Kiểm tra size đang được sử dụng ở bao nhiều variant
                const usageCount = await ProductVariant.countDocuments({ 
                    size: existingSize._id 
                });
                
                return {
                    found: true,
                    size: existingSize,
                    usageCount,
                    message: `Kích thước "${existingSize.name}" đã tồn tại và đang được sử dụng trong ${usageCount} variant`
                };
            }
            
            // Gợi ý size enum nếu không tìm thấy
            const suggestions = this.getSizeEnums().filter(size => 
                size.toLowerCase().includes(searchName.toLowerCase())
            );
            
            return {
                found: false,
                suggestions,
                message: suggestions.length > 0 
                    ? 'Không tìm thấy kích thước chính xác, đây là một số gợi ý'
                    : 'Không tìm thấy kích thước phù hợp'
            };
        } catch (error) {
            throw new AppError('Lỗi tìm kiếm kích thước: ' + error.message, 500);
        }
    }

    /**
     * Business Logic: Lấy thống kê sử dụng size
     */
    async getSizeUsageStats(sizeId) {
        try {
            const size = await this.getSizeById(sizeId);
            const variantCount = await ProductVariant.countDocuments({ size: sizeId });
            
            return {
                size,
                usageStats: {
                    variantCount,
                    canDelete: variantCount === 0,
                    message: `Kích thước "${size.name}" đang được sử dụng trong ${variantCount} variant`
                }
            };
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError('Lỗi lấy thống kê kích thước', 500);
        }
    }

    /**
     * Business Logic: Lấy enum sizes (S, M, L, XL, Free Size...)
     */
    getSizeEnums() {
        return [
            'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL',
            'FREE SIZE', 'ONE SIZE',
            '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45',
            'SMALL', 'MEDIUM', 'LARGE'
        ];
    }

    /**
     * Lấy gợi ý size theo loại
     */
    getSizeEnumsByCategory(category = 'all') {
        const sizeCategories = {
            clothing: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'FREE SIZE'],
            shoes: ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45'],
            accessories: ['FREE SIZE', 'ONE SIZE', 'SMALL', 'MEDIUM', 'LARGE'],
            all: this.getSizeEnums()
        };
        
        return sizeCategories[category] || sizeCategories.all;
    }

    /**
     * Validate size có thể được sử dụng
     */
    async validateSizeForUse(sizeId) {
        try {
            const size = await this.getSizeById(sizeId);
            return {
                valid: true,
                size,
                message: `Kích thước "${size.name}" hợp lệ và có thể sử dụng`
            };
        } catch (error) {
            return {
                valid: false,
                message: 'Kích thước không tồn tại hoặc không hợp lệ'
            };
        }
    }

    /**
     * Get all sizes using new Query Middleware
     * @param {Object} queryParams - Query parameters from request
     * @returns {Object} Query results with pagination
     */
    async getAllSizesWithQuery(queryBuilder) {
        try {
            // Size search fields
            const searchFields = ['name'];
            
            const result = await queryBuilder
                .paginate()
                .sortBy()
                .search(searchFields)
                .execute();
            
            return result;
        } catch (error) {
            throw new AppError(
                `Error fetching sizes: ${error.message}`,
                'SIZE_FETCH_FAILED',
                500
            );
        }
    }
}

module.exports = SizeService;
