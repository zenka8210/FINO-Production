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
            // Validation: Link is required
            if (!bannerData.link || !bannerData.link.trim()) {
                throw new Error('Link là bắt buộc');
            }
            
            const newBanner = new Banner(bannerData);
            await newBanner.save();
            return newBanner;
        } catch (error) {
            if (error.message === 'Link là bắt buộc') {
                throw error;
            }
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
            return await Banner.getActiveBanners();
        } catch (error) {
            throw new AppError(MESSAGES.BANNER_FETCH_ACTIVE_FAILED, ERROR_CODES.INTERNAL_SERVER_ERROR);
        }
    }

    // Get banners with detailed status information
    async getBannersWithStatus(queryOptions = {}) {
        try {
            const { page = 1, limit = 10, includeExpired = false } = queryOptions;
            const skip = (page - 1) * limit;
            
            let filter = {};
            if (!includeExpired) {
                const now = new Date();
                // Only get banners created within last 30 days
                filter.createdAt = { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
            }

            const banners = await Banner.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit));

            // Add status information to each banner
            const bannersWithStatus = banners.map(banner => ({
                ...banner.toObject(),
                startDate: banner.startDate,
                endDate: banner.endDate,
                isExpired: banner.isExpired(),
                isCurrentlyActive: banner.isCurrentlyActive(),
                daysRemaining: Math.ceil((banner.endDate - new Date()) / (1000 * 60 * 60 * 24))
            }));

            const total = await Banner.countDocuments(filter);

            return {
                data: bannersWithStatus,
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit)
            };
        } catch (error) {
            throw new AppError('Lỗi khi lấy banner với trạng thái', ERROR_CODES.INTERNAL_SERVER_ERROR);
        }
    }

    // Validate banner link
    async validateBannerLink(link) {
        if (!link || !link.trim()) {
            throw new AppError('Link banner là bắt buộc', ERROR_CODES.BAD_REQUEST);
        }

        // Check if link is valid format (product, category, or external URL)
        const linkPatterns = [
            /^\/products\/[a-fA-F0-9]{24}$/, // Product link
            /^\/categories\/[a-fA-F0-9]{24}$/, // Category link
            /^https?:\/\/.+/, // External URL
            /^\/[a-zA-Z0-9\-\/]+$/ // Internal path
        ];

        const isValidLink = linkPatterns.some(pattern => pattern.test(link));
        if (!isValidLink) {
            throw new AppError('Format link không hợp lệ. Link phải là đường dẫn đến sản phẩm, danh mục hoặc URL hợp lệ', ERROR_CODES.BAD_REQUEST);
        }

        return true;
    }

    // Override createBanner to include validation
    async createBanner(bannerData) {
        try {
            const newBanner = new Banner(bannerData);
            await newBanner.save();
            
            // Return with status information
            const result = newBanner.toObject({ virtuals: true });
            result.isCurrentlyActive = newBanner.isCurrentlyActive();
            result.isExpired = newBanner.isExpired();
            
            return result;
        } catch (error) {
            if (error.name === 'ValidationError') {
                const messages = Object.values(error.errors).map(err => err.message);
                throw new AppError(messages.join(', '), ERROR_CODES.BAD_REQUEST);
            }
            if (error instanceof AppError) throw error;
            throw new AppError(MESSAGES.BANNER_CREATE_FAILED, ERROR_CODES.BAD_REQUEST);
        }
    }

    // Override updateBanner to include validation
    async updateBanner(bannerId, updateData) {
        try {
            const banner = await Banner.findByIdAndUpdate(bannerId, updateData, { 
                new: true, 
                runValidators: true 
            });
            
            if (!banner) {
                throw new AppError(MESSAGES.BANNER_NOT_FOUND, ERROR_CODES.NOT_FOUND);
            }
            
            // Return with status information
            const result = banner.toObject({ virtuals: true });
            result.isCurrentlyActive = banner.isCurrentlyActive();
            result.isExpired = banner.isExpired();
            
            return result;
        } catch (error) {
            if (error.name === 'ValidationError') {
                const messages = Object.values(error.errors).map(err => err.message);
                throw new AppError(messages.join(', '), ERROR_CODES.BAD_REQUEST);
            }
            if (error instanceof AppError) throw error;
            throw new AppError(MESSAGES.BANNER_UPDATE_FAILED, ERROR_CODES.BAD_REQUEST);
        }
    }
}

module.exports = BannerService;
