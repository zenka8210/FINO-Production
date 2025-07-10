const BaseService = require('./baseService');
const Banner = require('../models/BannerSchema');
const { AppError } = require('../middlewares/errorHandler');
const { MESSAGES, ERROR_CODES } = require('../config/constants');

class BannerService extends BaseService {
    constructor() {
        super(Banner);
    }
    async getAllBanners(queryOptions) {
        const { page = 1, limit = 10, title, isActive, sortBy = 'createdAt', sortOrder = 'desc' } = queryOptions;
        const skip = (page - 1) * limit;
        const filter = {};

        if (title) {
            filter.title = { $regex: title, $options: 'i' };
        }
        if (isActive !== undefined) {
            filter.isActive = isActive === 'true' || isActive === true;
        }

        try {
            const banners = await Banner.find(filter)
                .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
                .skip(skip)
                .limit(parseInt(limit));

            const totalBanners = await Banner.countDocuments(filter);

            return {
                data: banners,
                total: totalBanners,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(totalBanners / limit),
            };
        } catch (error) {
            throw new AppError(MESSAGES.BANNER_FETCH_ALL_FAILED, ERROR_CODES.INTERNAL_SERVER_ERROR);
        }
    }

    async getBannerById(bannerId) {
        try {
            const banner = await Banner.findById(bannerId);
            if (!banner) {
                throw new AppError(MESSAGES.BANNER_NOT_FOUND, ERROR_CODES.NOT_FOUND);
            }
            return banner;
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(MESSAGES.BANNER_FETCH_SINGLE_FAILED, ERROR_CODES.INTERNAL_SERVER_ERROR);
        }
    }

    async createBanner(bannerData) {
        try {
            const newBanner = new Banner(bannerData);
            await newBanner.save();
            return newBanner;
        } catch (error) {
            throw new AppError(MESSAGES.BANNER_CREATE_FAILED, ERROR_CODES.BAD_REQUEST);
        }
    }

    async updateBanner(bannerId, updateData) {
        try {
            const banner = await Banner.findByIdAndUpdate(bannerId, updateData, { new: true, runValidators: true });
            if (!banner) {
                throw new AppError(MESSAGES.BANNER_NOT_FOUND, ERROR_CODES.NOT_FOUND);
            }
            return banner;
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(MESSAGES.BANNER_UPDATE_FAILED, ERROR_CODES.BAD_REQUEST);
        }
    }

    async deleteBanner(bannerId) {
        try {
            const banner = await Banner.findByIdAndDelete(bannerId);
            if (!banner) {
                throw new AppError(MESSAGES.BANNER_NOT_FOUND, ERROR_CODES.NOT_FOUND);
            }
            return { message: MESSAGES.BANNER_DELETED };
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(MESSAGES.BANNER_DELETE_FAILED, ERROR_CODES.INTERNAL_SERVER_ERROR);
        }
    }

    // Method to get only active banners for client-side display
    async getActiveClientBanners() {
        try {
            return await Banner.find({ isActive: true }).sort({ createdAt: -1 }); // Example sort, adjust if needed
        } catch (error) {
            throw new AppError(MESSAGES.BANNER_FETCH_ACTIVE_FAILED, ERROR_CODES.INTERNAL_SERVER_ERROR);
        }
    }
}

module.exports = BannerService;
