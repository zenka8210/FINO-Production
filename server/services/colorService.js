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
            throw new AppError(MESSAGES.COLOR_UPDATE_FAILED, ERROR_CODES.COLOR.FETCH_ALL_FAILED || 'COLOR_FETCH_ALL_FAILED', 500);
        }
    }

    async getColorById(colorId) {
        try {
            const color = await Color.findById(colorId);
            if (!color) {
                throw new AppError(MESSAGES.COLOR_NOT_FOUND, ERROR_CODES.COLOR.NOT_FOUND, 404);
            }
            return color;
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(MESSAGES.COLOR_CREATE_FAILED, ERROR_CODES.COLOR.FETCH_SINGLE_FAILED || 'COLOR_FETCH_SINGLE_FAILED', 500);
        }
    }

    async createColor(colorData) {
        try {
            const newColor = new Color(colorData);
            await newColor.save();
            return newColor;
        } catch (error) {
            if (error.code === 11000) { // Duplicate key error for name
                throw new AppError(MESSAGES.COLOR_EXISTS, ERROR_CODES.COLOR.EXISTS, 400);
            }
            throw new AppError(MESSAGES.COLOR_CREATE_FAILED, ERROR_CODES.COLOR.CREATE_FAILED, 400, error.errors);
        }
    }

    async updateColor(colorId, updateData) {
        try {
            const color = await Color.findByIdAndUpdate(colorId, updateData, { new: true, runValidators: true });
            if (!color) {
                throw new AppError(MESSAGES.COLOR_NOT_FOUND, ERROR_CODES.COLOR.NOT_FOUND, 404);
            }
            return color;
        } catch (error) {
            if (error.code === 11000) { // Duplicate key error for name
                throw new AppError(MESSAGES.COLOR_EXISTS, ERROR_CODES.COLOR.EXISTS, 400);
            }
            if (error instanceof AppError) throw error;
            throw new AppError(MESSAGES.COLOR_UPDATE_FAILED, ERROR_CODES.COLOR.UPDATE_FAILED, 400, error.errors);
        }
    }

    async deleteColor(colorId) {
        try {
            // Check if the color is used in any ProductVariant
            const existingVariant = await ProductVariant.findOne({ color: colorId });
            if (existingVariant) {
                throw new AppError(MESSAGES.COLOR_IN_USE || 'Màu đang được sử dụng, không thể xóa.', ERROR_CODES.COLOR.IN_USE || 'COLOR_IN_USE', 400);
            }

            const color = await Color.findByIdAndDelete(colorId);
            if (!color) {
                throw new AppError(MESSAGES.COLOR_NOT_FOUND, ERROR_CODES.COLOR.NOT_FOUND, 404);
            }
            return { message: MESSAGES.COLOR_DELETED };
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(MESSAGES.COLOR_DELETE_FAILED, ERROR_CODES.COLOR.DELETE_FAILED, 500);
        }
    }
}

module.exports = ColorService;
