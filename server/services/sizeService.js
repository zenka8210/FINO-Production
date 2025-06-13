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
            throw new AppError(MESSAGES.SIZE_UPDATE_FAILED, ERROR_CODES.SIZE.FETCH_ALL_FAILED || 'SIZE_FETCH_ALL_FAILED', 500);
        }
    }

    async getSizeById(sizeId) {
        try {
            const size = await Size.findById(sizeId);
            if (!size) {
                throw new AppError(MESSAGES.SIZE_NOT_FOUND, ERROR_CODES.SIZE.NOT_FOUND, 404);
            }
            return size;
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(MESSAGES.SIZE_CREATE_FAILED, ERROR_CODES.SIZE.FETCH_SINGLE_FAILED || 'SIZE_FETCH_SINGLE_FAILED', 500);
        }
    }

    async createSize(sizeData) {
        try {
            const newSize = new Size(sizeData);
            await newSize.save();
            return newSize;
        } catch (error) {
            if (error.code === 11000) { // Duplicate key error for name
                throw new AppError(MESSAGES.SIZE_EXISTS, ERROR_CODES.SIZE.EXISTS, 400);
            }
            throw new AppError(MESSAGES.SIZE_CREATE_FAILED, ERROR_CODES.SIZE.CREATE_FAILED, 400, error.errors);
        }
    }

    async updateSize(sizeId, updateData) {
        try {
            const size = await Size.findByIdAndUpdate(sizeId, updateData, { new: true, runValidators: true });
            if (!size) {
                throw new AppError(MESSAGES.SIZE_NOT_FOUND, ERROR_CODES.SIZE.NOT_FOUND, 404);
            }
            return size;
        } catch (error) {
            if (error.code === 11000) { // Duplicate key error for name
                throw new AppError(MESSAGES.SIZE_EXISTS, ERROR_CODES.SIZE.EXISTS, 400);
            }
            if (error instanceof AppError) throw error;
            throw new AppError(MESSAGES.SIZE_UPDATE_FAILED, ERROR_CODES.SIZE.UPDATE_FAILED, 400, error.errors);
        }
    }

    async deleteSize(sizeId) {
        try {
            // Check if the size is used in any ProductVariant
            const existingVariant = await ProductVariant.findOne({ size: sizeId });
            if (existingVariant) {
                throw new AppError(MESSAGES.SIZE_IN_USE || 'Kích thước đang được sử dụng, không thể xóa.', ERROR_CODES.SIZE.IN_USE || 'SIZE_IN_USE', 400);
            }

            const size = await Size.findByIdAndDelete(sizeId);
            if (!size) {
                throw new AppError(MESSAGES.SIZE_NOT_FOUND, ERROR_CODES.SIZE.NOT_FOUND, 404);
            }
            return { message: MESSAGES.SIZE_DELETED };
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(MESSAGES.SIZE_DELETE_FAILED, ERROR_CODES.SIZE.DELETE_FAILED, 500);
        }
    }
}

module.exports = SizeService;
