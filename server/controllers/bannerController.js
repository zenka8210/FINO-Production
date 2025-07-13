const BaseController = require('./baseController');
const BannerService = require('../services/bannerService');
const Banner = require('../models/BannerSchema');
const ResponseHandler = require('../services/responseHandler');
const { MESSAGES, PAGINATION } = require('../config/constants');
const { QueryBuilder } = require('../middlewares/queryMiddleware');

class BannerController extends BaseController {
    constructor() {
        super(new BannerService());
    }

    getAllBanners = async (req, res, next) => {
        try {
            const result = await req.createQueryBuilder(Banner)
                .search(['title', 'description'])
                .applyFilters()
                .execute();

            ResponseHandler.success(res, 'Lấy danh sách banner thành công', result);
        } catch (error) {
            next(error);
        }
    };

    // Giữ lại method cũ để backward compatibility
    getAllBannersLegacy = async (req, res, next) => {
        try {
            const queryOptions = req.query;
            const result = await this.service.getAllBanners(queryOptions);
            ResponseHandler.success(res, 'Lấy danh sách banner thành công', result);
        } catch (error) {
            next(error);
        }
    };

    getBannerById = async (req, res, next) => {
        try {
            const { id } = req.params;
            const banner = await this.service.getBannerById(id);
            ResponseHandler.success(res, 'Lấy chi tiết banner thành công', banner);
        } catch (error) {
            next(error);
        }
    };

    createBanner = async (req, res, next) => {
        try {
            const bannerData = req.body;
            const newBanner = await this.service.createBanner(bannerData);
            ResponseHandler.created(res, MESSAGES.BANNER_CREATED, newBanner);
        } catch (error) {
            next(error);
        }
    };

    updateBanner = async (req, res, next) => {
        try {
            const { id } = req.params;
            const updateData = req.body;
            const updatedBanner = await this.service.updateBanner(id, updateData);
            ResponseHandler.success(res, MESSAGES.BANNER_UPDATED, updatedBanner);
        } catch (error) {
            next(error);
        }
    };

    deleteBanner = async (req, res, next) => {
        try {
            const { id } = req.params;
            await this.service.deleteBanner(id);
            ResponseHandler.success(res, MESSAGES.BANNER_DELETED, null);
        } catch (error) {
            next(error);
        }
    };

    // Get active banners for client-side (e.g., homepage display)
    getActiveClientBanners = async (req, res, next) => {
        try {
            const banners = await this.service.getActiveClientBanners();
            ResponseHandler.success(res, 'Lấy danh sách banner hoạt động thành công', banners);
        } catch (error) {
            next(error);
        }
    };

    // Get banners with detailed status information (Admin)
    getBannersWithStatus = async (req, res, next) => {
        try {
            const queryOptions = req.query;
            const result = await this.service.getBannersWithStatus(queryOptions);
            ResponseHandler.success(res, 'Lấy danh sách banner với trạng thái thành công', result);
        } catch (error) {
            next(error);
        }
    };

    // Validate banner link
    validateBannerLink = async (req, res, next) => {
        try {
            const { link } = req.body;
            await this.service.validateBannerLink(link);
            ResponseHandler.success(res, 'Link banner hợp lệ', { valid: true });
        } catch (error) {
            next(error);
        }
    };

    // Get banners by status
    getBannersByStatus = async (req, res, next) => {
        try {
            const { status } = req.params;
            const banners = await this.service.getBannersByStatus(status);
            ResponseHandler.success(res, `Lấy danh sách banner ${status} thành công`, banners);
        } catch (error) {
            next(error);
        }
    };

    // Check if banner is active
    checkBannerStatus = async (req, res, next) => {
        try {
            const { id } = req.params;
            const isActive = await this.service.isBannerActive(id);
            ResponseHandler.success(res, 'Kiểm tra trạng thái banner thành công', { isActive });
        } catch (error) {
            next(error);
        }
    };

    // Get banner statistics
    getBannerStatistics = async (req, res, next) => {
        try {
            const statistics = await this.service.getBannerStatistics();
            ResponseHandler.success(res, 'Lấy thống kê banner thành công', statistics);
        } catch (error) {
            next(error);
        }
    };
}

module.exports = BannerController;
