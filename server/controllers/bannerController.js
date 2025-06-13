const BaseController = require('./baseController');
const BannerService = require('../services/bannerService');
const ResponseHandler = require('../services/responseHandler');
const { MESSAGES } = require('../config/constants');

class BannerController extends BaseController {
    constructor() {
        super(new BannerService());
    }

    getAllBanners = async (req, res, next) => {
        try {
            const queryOptions = req.query;
            const result = await this.service.getAllBanners(queryOptions);
            ResponseHandler.success(res, MESSAGES.BANNER.SUCCESS.FETCH_ALL || 'Banners retrieved successfully', result);
        } catch (error) {
            next(error);
        }
    };

    getBannerById = async (req, res, next) => {
        try {
            const { id } = req.params;
            const banner = await this.service.getBannerById(id);
            ResponseHandler.success(res, MESSAGES.BANNER.SUCCESS.FETCH_SINGLE || 'Banner retrieved successfully', banner);
        } catch (error) {
            next(error);
        }
    };

    createBanner = async (req, res, next) => {
        try {
            const bannerData = req.body;
            const newBanner = await this.service.createBanner(bannerData);
            ResponseHandler.created(res, MESSAGES.BANNER.SUCCESS.CREATE || 'Banner created successfully', newBanner);
        } catch (error) {
            next(error);
        }
    };

    updateBanner = async (req, res, next) => {
        try {
            const { id } = req.params;
            const updateData = req.body;
            const updatedBanner = await this.service.updateBanner(id, updateData);
            ResponseHandler.success(res, MESSAGES.BANNER.SUCCESS.UPDATE || 'Banner updated successfully', updatedBanner);
        } catch (error) {
            next(error);
        }
    };    deleteBanner = async (req, res, next) => {
        try {
            const { id } = req.params;
            await this.service.deleteBanner(id);
            ResponseHandler.success(res, MESSAGES.BANNER.SUCCESS.DELETE || 'Banner deleted successfully', null);
        } catch (error) {
            next(error);
        }
    };

    // Get active banners for client-side (e.g., homepage display)
    getActiveClientBanners = async (req, res, next) => {
        try {
            const banners = await this.service.getActiveClientBanners();
            ResponseHandler.success(res, MESSAGES.BANNER.SUCCESS.FETCH_ACTIVE || 'Active banners retrieved successfully', banners);
        } catch (error) {
            next(error);
        }
    };
}

module.exports = BannerController;
