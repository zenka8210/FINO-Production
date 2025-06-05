const BaseController = require('./baseController');
const BannerService = require('../services/bannerService');
const ResponseHandler = require('../services/responseHandler');

class BannerController extends BaseController {
  constructor() {
    super();
    this.bannerService = new BannerService();
  }

  /**
   * Lấy tất cả banner với phân trang và lọc
   */
  getAllBanners = async (req, res, next) => {
    try {
      const query = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        status: req.query.status,
        position: req.query.position,
        sortBy: req.query.sortBy || 'order',
        sortOrder: req.query.sortOrder || 'asc'
      };

      const result = await this.bannerService.getAllBanners(query);
      ResponseHandler.success(res, result.message, {
        banners: result.banners,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Lấy banner theo ID
   */
  getBannerById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await this.bannerService.getBannerById(id);
      
      ResponseHandler.success(res, result.message, {
        banner: result.banner
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Lấy banner theo vị trí (public endpoint)
   */
  getBannersByPosition = async (req, res, next) => {
    try {
      const { position } = req.params;
      const limit = parseInt(req.query.limit) || 10;
      
      const result = await this.bannerService.getBannersByPosition(position, limit);
      
      ResponseHandler.success(res, result.message, {
        banners: result.banners
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Tạo banner mới (admin only)
   */
  createBanner = async (req, res, next) => {
    try {
      const bannerData = req.body;
      const result = await this.bannerService.createBanner(bannerData);
      
      ResponseHandler.created(res, result.message, {
        banner: result.banner
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Cập nhật banner (admin only)
   */
  updateBanner = async (req, res, next) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const result = await this.bannerService.updateBanner(id, updateData);
      
      ResponseHandler.success(res, result.message, {
        banner: result.banner
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Xóa banner (admin only)
   */
  deleteBanner = async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await this.bannerService.deleteBanner(id);
      
      ResponseHandler.success(res, result.message);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Cập nhật thứ tự banner (admin only)
   */
  updateBannerOrder = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { order } = req.body;
      
      const result = await this.bannerService.updateBannerOrder(id, order);
      
      ResponseHandler.success(res, result.message, {
        banner: result.banner
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Cập nhật trạng thái banner (admin only)
   */
  updateBannerStatus = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const result = await this.bannerService.updateBannerStatus(id, status);
      
      ResponseHandler.success(res, result.message, {
        banner: result.banner
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Sắp xếp lại thứ tự banner (admin only)
   */
  reorderBanners = async (req, res, next) => {
    try {
      const { bannerOrders } = req.body; // Array of {id, order}
      
      const result = await this.bannerService.reorderBanners(bannerOrders);
      
      ResponseHandler.success(res, result.message, {
        banners: result.banners
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Lấy banner đang hoạt động theo vị trí (public)
   */
  getActiveBannersByPosition = async (req, res, next) => {
    try {
      const { position } = req.params;
      const limit = parseInt(req.query.limit) || 10;
      
      const result = await this.bannerService.getActiveBannersByPosition(position, limit);
      
      ResponseHandler.success(res, result.message, {
        banners: result.banners
      });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new BannerController();