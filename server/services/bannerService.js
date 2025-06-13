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
            throw new AppError(MESSAGES.BANNER.ERROR.FETCH_ALL, ERROR_CODES.BANNER.FETCH_ALL_FAILED, 500);
        }
    }

    async getBannerById(bannerId) {
        try {
            const banner = await Banner.findById(bannerId);
            if (!banner) {
                throw new AppError(MESSAGES.BANNER.ERROR.NOT_FOUND, ERROR_CODES.BANNER.NOT_FOUND, 404);
            }
            return banner;
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(MESSAGES.BANNER.ERROR.FETCH_SINGLE, ERROR_CODES.BANNER.FETCH_SINGLE_FAILED, 500);
        }
    }

    async createBanner(bannerData) {
        try {
            const newBanner = new Banner(bannerData);
            await newBanner.save();
            return newBanner;
        } catch (error) {
            throw new AppError(MESSAGES.BANNER.ERROR.CREATE, ERROR_CODES.BANNER.CREATE_FAILED, 400, error.errors);
        }
    }

    async updateBanner(bannerId, updateData) {
        try {
            const banner = await Banner.findByIdAndUpdate(bannerId, updateData, { new: true, runValidators: true });
            if (!banner) {
                throw new AppError(MESSAGES.BANNER.ERROR.NOT_FOUND, ERROR_CODES.BANNER.NOT_FOUND, 404);
            }
            return banner;
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(MESSAGES.BANNER.ERROR.UPDATE, ERROR_CODES.BANNER.UPDATE_FAILED, 400, error.errors);
        }
    }

    async deleteBanner(bannerId) {
        try {
            const banner = await Banner.findByIdAndDelete(bannerId);
            if (!banner) {
                throw new AppError(MESSAGES.BANNER.ERROR.NOT_FOUND, ERROR_CODES.BANNER.NOT_FOUND, 404);
            }
            return { message: MESSAGES.BANNER.SUCCESS.DELETE };
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(MESSAGES.BANNER.ERROR.DELETE, ERROR_CODES.BANNER.DELETE_FAILED, 500);
        }
    }

    // Method to get only active banners for client-side display
    async getActiveClientBanners() {
        try {
            return await Banner.find({ isActive: true }).sort({ createdAt: -1 }); // Example sort, adjust if needed
        } catch (error) {
            throw new AppError(MESSAGES.BANNER.ERROR.FETCH_ACTIVE, ERROR_CODES.BANNER.FETCH_ACTIVE_FAILED, 500);
        }
    }
}

module.exports = BannerService;
