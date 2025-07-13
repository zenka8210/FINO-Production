const BaseService = require('./baseService');
const Banner = require('../models/BannerSchema');
const { AppError } = require('../middlewares/errorHandler');
const { MESSAGES, ERROR_CODES } = require('../config/constants');
const { QueryUtils } = require('../utils/queryUtils');

class BannerService extends BaseService {
    constructor() {
        super(Banner);
    }

    /**
     * Get all banners using new Query Middleware
     * @param {Object} queryParams - Query parameters from request
     * @returns {Object} Query results with pagination
     */
    async getAllBannersWithQuery(queryParams) {
        try {
            // Sử dụng QueryUtils với pre-configured setup cho Banner
            const result = await QueryUtils.getBanners(Banner, queryParams);
            
            return result;
        } catch (error) {
            throw new AppError(
                `Error fetching banners: ${error.message}`,
                ERROR_CODES.BANNER?.FETCH_FAILED || 'BANNER_FETCH_FAILED',
                500
            );
        }
    }

    async getAllBanners(queryOptions) {
        const { page = 1, limit = 10, title, status, sortBy = 'createdAt', sortOrder = 'desc' } = queryOptions;
        const skip = (page - 1) * limit;
        const filter = {};
        const now = new Date();

        if (title) {
            filter.title = { $regex: title, $options: 'i' };
        }
        
        // Filter by status: active, expired, upcoming
        if (status) {
            switch (status) {
                case 'active':
                    filter.startDate = { $lte: now };
                    filter.endDate = { $gt: now };
                    break;
                case 'expired':
                    filter.endDate = { $lte: now };
                    break;
                case 'upcoming':
                    filter.startDate = { $gt: now };
                    break;
            }
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
            
            // Validation: Dates are required and valid
            if (!bannerData.startDate) {
                throw new Error('Ngày bắt đầu là bắt buộc');
            }
            
            if (!bannerData.endDate) {
                throw new Error('Ngày kết thúc là bắt buộc');
            }
            
            if (new Date(bannerData.endDate) <= new Date(bannerData.startDate)) {
                throw new Error('Ngày kết thúc phải sau ngày bắt đầu');
            }
            
            const newBanner = new Banner(bannerData);
            await newBanner.save();
            return newBanner;
        } catch (error) {
            if (error.message.includes('Link là bắt buộc') || 
                error.message.includes('Ngày') || 
                error.name === 'ValidationError') {
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
            const now = new Date();
            const activeBanners = await Banner.find({
                startDate: { $lte: now },
                endDate: { $gt: now }
            }).sort({ createdAt: -1 });
            
            return activeBanners;
        } catch (error) {
            throw new AppError(MESSAGES.BANNER_FETCH_ACTIVE_FAILED, ERROR_CODES.INTERNAL_SERVER_ERROR);
        }
    }

    // Get banners with detailed status information
    async getBannersWithStatus(queryOptions = {}) {
        try {
            const { page = 1, limit = 10, includeExpired = false } = queryOptions;
            const skip = (page - 1) * limit;
            const now = new Date();
            
            let filter = {};
            if (!includeExpired) {
                filter.endDate = { $gt: now };
            }

            const banners = await Banner.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit));

            // Add status information to each banner
            const bannersWithStatus = banners.map(banner => {
                const isActive = now >= banner.startDate && now < banner.endDate;
                const isExpired = now >= banner.endDate;
                const isUpcoming = now < banner.startDate;
                const daysRemaining = isExpired ? 0 : Math.ceil((banner.endDate - now) / (1000 * 60 * 60 * 24));
                
                return {
                    ...banner.toObject(),
                    status: isActive ? 'active' : (isExpired ? 'expired' : 'upcoming'),
                    isActive,
                    isExpired,
                    isUpcoming,
                    daysRemaining
                };
            });

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
            
            return newBanner;
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
            // Validate dates if being updated
            if (updateData.startDate && updateData.endDate) {
                if (new Date(updateData.endDate) <= new Date(updateData.startDate)) {
                    throw new AppError('Ngày kết thúc phải sau ngày bắt đầu', ERROR_CODES.BAD_REQUEST);
                }
            }
            
            const banner = await Banner.findByIdAndUpdate(bannerId, updateData, { 
                new: true, 
                runValidators: true 
            });
            
            if (!banner) {
                throw new AppError(MESSAGES.BANNER_NOT_FOUND, ERROR_CODES.NOT_FOUND);
            }
            
            return banner;
        } catch (error) {
            if (error.name === 'ValidationError') {
                const messages = Object.values(error.errors).map(err => err.message);
                throw new AppError(messages.join(', '), ERROR_CODES.BAD_REQUEST);
            }
            if (error instanceof AppError) throw error;
            throw new AppError(MESSAGES.BANNER_UPDATE_FAILED, ERROR_CODES.BAD_REQUEST);
        }
    }

    // Get banners by status
    async getBannersByStatus(status) {
        try {
            const now = new Date();
            let filter = {};
            
            switch (status) {
                case 'active':
                    filter = {
                        startDate: { $lte: now },
                        endDate: { $gt: now }
                    };
                    break;
                case 'expired':
                    filter = {
                        endDate: { $lte: now }
                    };
                    break;
                case 'upcoming':
                    filter = {
                        startDate: { $gt: now }
                    };
                    break;
                default:
                    throw new AppError('Trạng thái không hợp lệ', ERROR_CODES.BAD_REQUEST);
            }
            
            return await Banner.find(filter).sort({ createdAt: -1 });
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError('Lỗi khi lấy banner theo trạng thái', ERROR_CODES.INTERNAL_SERVER_ERROR);
        }
    }

    // Check if banner is currently active
    async isBannerActive(bannerId) {
        try {
            const banner = await Banner.findById(bannerId);
            if (!banner) {
                throw new AppError(MESSAGES.BANNER_NOT_FOUND, ERROR_CODES.NOT_FOUND);
            }
            
            const now = new Date();
            return now >= banner.startDate && now < banner.endDate;
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError('Lỗi khi kiểm tra trạng thái banner', ERROR_CODES.INTERNAL_SERVER_ERROR);
        }
    }

    // Get banner statistics
    async getBannerStatistics() {
        try {
            const now = new Date();
            const total = await Banner.countDocuments();
            const active = await Banner.countDocuments({
                startDate: { $lte: now },
                endDate: { $gt: now }
            });
            const expired = await Banner.countDocuments({
                endDate: { $lte: now }
            });
            const upcoming = await Banner.countDocuments({
                startDate: { $gt: now }
            });
            
            return {
                total,
                active,
                expired,
                upcoming
            };
        } catch (error) {
            throw new AppError('Lỗi khi lấy thống kê banner', ERROR_CODES.INTERNAL_SERVER_ERROR);
        }
    }
}

module.exports = BannerService;
