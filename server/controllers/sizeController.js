const BaseController = require('./baseController');
const SizeService = require('../services/sizeService');
const ResponseHandler = require('../services/responseHandler');
const { MESSAGES, PAGINATION } = require('../config/constants');
const { QueryBuilder } = require('../middlewares/queryMiddleware');

class SizeController extends BaseController {
    constructor() {
        super(new SizeService());
    }

    // ============= BASIC CRUD OPERATIONS =============

    getAllSizes = async (req, res, next) => {
        try {
            // Sử dụng method cũ stable
            const queryOptions = {
                page: req.query.page || PAGINATION.DEFAULT_PAGE,
                limit: req.query.limit || PAGINATION.DEFAULT_LIMIT,
                name: req.query.name,
                sortBy: req.query.sortBy || 'createdAt',
                sortOrder: req.query.sortOrder || 'desc'
            };
            const result = await this.service.getAllSizes(queryOptions);
            ResponseHandler.success(res, 'Lấy danh sách kích thước thành công', result);
        } catch (error) {
            next(error);
        }
    };

    // Giữ lại method cũ để backward compatibility
    getAllSizesLegacy = async (req, res, next) => {
        try {
            const queryOptions = req.query;
            const result = await this.service.getAllSizes(queryOptions);
            ResponseHandler.success(res, 'Lấy danh sách kích thước thành công', result);
        } catch (error) {
            next(error);
        }
    };

    getSizeById = async (req, res, next) => {
        try {
            const { id } = req.params;
            const size = await this.service.getSizeById(id);
            ResponseHandler.success(res, 'Lấy chi tiết kích thước thành công', size);
        } catch (error) {
            next(error);
        }
    };

    createSize = async (req, res, next) => {
        try {
            const sizeData = req.body;
            const newSize = await this.service.createSize(sizeData);
            ResponseHandler.success(res, 'Tạo kích thước thành công', newSize, 201);
        } catch (error) {
            next(error);
        }
    };

    updateSize = async (req, res, next) => {
        try {
            const { id } = req.params;
            const updateData = req.body;
            const updatedSize = await this.service.updateSize(id, updateData);
            ResponseHandler.success(res, 'Cập nhật kích thước thành công', updatedSize);
        } catch (error) {
            next(error);
        }
    };

    deleteSize = async (req, res, next) => {
        try {
            const { id } = req.params;
            await this.service.deleteSize(id);
            ResponseHandler.success(res, 'Xóa kích thước thành công');
        } catch (error) {
            next(error);
        }
    };

    // ============= BUSINESS LOGIC ENDPOINTS =============

    /**
     * Validate size name (uniqueness and format)
     */
    validateSizeName = async (req, res, next) => {
        try {
            const { name, excludeId } = req.body;
            await this.service.validateSizeNameUniqueness(name, excludeId);
            ResponseHandler.success(res, 'Tên kích thước hợp lệ', { valid: true });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Get size usage statistics
     */
    getSizeUsageStats = async (req, res, next) => {
        try {
            const { id } = req.params;
            const stats = await this.service.getSizeUsageStats(id);
            ResponseHandler.success(res, 'Thống kê sử dụng kích thước', stats);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Check if size can be deleted
     */
    canDeleteSize = async (req, res, next) => {
        try {
            const { id } = req.params;
            const result = await this.service.canDeleteSize(id);
            ResponseHandler.success(res, 'Kiểm tra khả năng xóa size', result);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Find size by name or get suggestions
     */
    findByNameOrSuggest = async (req, res, next) => {
        try {
            const { name } = req.query;
            if (!name) {
                return ResponseHandler.badRequest(res, 'Tên size là bắt buộc');
            }
            
            const result = await this.service.findByNameOrSuggest(name);
            ResponseHandler.success(res, 'Kết quả tìm kiếm size', result);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Get size enums (S, M, L, XL, Free Size...)
     */
    getSizeEnums = async (req, res, next) => {
        try {
            const { category = 'all' } = req.query;
            const enums = this.service.getSizeEnumsByCategory(category);
            ResponseHandler.success(res, 'Danh sách size enum', { 
                category, 
                enums 
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Get all available size enums
     */
    getAllSizeEnums = async (req, res, next) => {
        try {
            const enums = this.service.getSizeEnums();
            ResponseHandler.success(res, 'Tất cả size enum có sẵn', { enums });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Validate size for use (check if exists and valid)
     */
    validateSizeForUse = async (req, res, next) => {
        try {
            const { id } = req.params;
            const result = await this.service.validateSizeForUse(id);
            ResponseHandler.success(res, 'Kiểm tra size để sử dụng', result);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Get size suggestions by category
     */
    getSizeSuggestions = async (req, res, next) => {
        try {
            const { category = 'clothing' } = req.query;
            const suggestions = this.service.getSizeEnumsByCategory(category);
            ResponseHandler.success(res, 'Gợi ý size theo danh mục', { 
                category, 
                suggestions 
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Bulk create sizes from enum list
     */
    bulkCreateSizesFromEnum = async (req, res, next) => {
        try {
            const { category = 'clothing' } = req.body;
            const sizeEnums = this.service.getSizeEnumsByCategory(category);
            const results = [];
            
            for (const sizeName of sizeEnums) {
                try {
                    const existingSize = await this.service.findByNameOrSuggest(sizeName);
                    if (!existingSize.found) {
                        const newSize = await this.service.createSize({ name: sizeName });
                        results.push({ success: true, size: newSize });
                    } else {
                        results.push({ 
                            success: false, 
                            name: sizeName, 
                            message: 'Size đã tồn tại' 
                        });
                    }
                } catch (error) {
                    results.push({ 
                        success: false, 
                        name: sizeName, 
                        message: error.message 
                    });
                }
            }
            
            ResponseHandler.success(res, 'Tạo hàng loạt size từ enum', { 
                category, 
                results 
            });
        } catch (error) {
            next(error);
        }
    };
}

module.exports = SizeController;
