const Banner = require('../models/bannerSchema');
const { MESSAGES, ERROR_CODES } = require('../config/constants');
const { AppError } = require('../middlewares/errorHandler');
const LoggerService = require('./loggerService');

class BannerService {
  constructor() {
    this.logger = LoggerService;
  }

  /**
   * Lấy tất cả banner với phân trang
   * @param {Object} query - Query parameters
   * @returns {Promise<Object>} - Danh sách banner
   */
  async getAllBanners(query = {}) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        status, 
        position,
        sortBy = 'order',
        sortOrder = 'asc'
      } = query;
      
      const skip = (page - 1) * limit;

      // Tạo filter
      const filter = {};
      if (status) filter.status = status;
      if (position) filter.position = position;

      // Tạo sort object
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const banners = await Banner.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Banner.countDocuments(filter);

      return {
        message: MESSAGES.SUCCESS.DATA_RETRIEVED,
        banners,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      this.logger.error('Lỗi khi lấy danh sách banner:', error);
      throw new AppError(MESSAGES.ERROR.DATA_RETRIEVE_FAILED, 500, ERROR_CODES.INTERNAL_ERROR);
    }
  }

  /**
   * Lấy banner công khai theo vị trí
   * @param {string} position - Vị trí banner
   * @returns {Promise<Object>} - Danh sách banner công khai
   */
  async getPublicBanners(position = null) {
    try {
      const filter = { 
        status: 'active',
        startDate: { $lte: new Date() },
        $or: [
          { endDate: { $gte: new Date() } },
          { endDate: null }
        ]
      };
      
      if (position) {
        filter.position = position;
      }

      const banners = await Banner.find(filter)
        .sort({ order: 1, createdAt: -1 })
        .select('title image link position alt order type');

      return {
        message: MESSAGES.SUCCESS.DATA_RETRIEVED,
        banners
      };
    } catch (error) {
      this.logger.error('Lỗi khi lấy banner công khai:', error);
      throw new AppError(MESSAGES.ERROR.DATA_RETRIEVE_FAILED, 500, ERROR_CODES.INTERNAL_ERROR);
    }
  }

  /**
   * Lấy banner theo ID
   * @param {string} bannerId - ID banner
   * @returns {Promise<Object>} - Thông tin banner
   */
  async getBannerById(bannerId) {
    try {
      const banner = await Banner.findById(bannerId);

      if (!banner) {
        throw new AppError('Không tìm thấy banner', 404, ERROR_CODES.NOT_FOUND);
      }

      return {
        message: MESSAGES.SUCCESS.DATA_RETRIEVED,
        banner
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      this.logger.error('Lỗi khi lấy thông tin banner:', error);
      throw new AppError(MESSAGES.ERROR.DATA_RETRIEVE_FAILED, 500, ERROR_CODES.INTERNAL_ERROR);
    }
  }

  /**
   * Tạo banner mới
   * @param {Object} bannerData - Dữ liệu banner
   * @returns {Promise<Object>} - Banner được tạo
   */
  async createBanner(bannerData) {
    try {
      // Nếu không có order, đặt order cao nhất + 1
      if (!bannerData.order) {
        const lastBanner = await Banner.findOne({ position: bannerData.position })
          .sort({ order: -1 });
        bannerData.order = lastBanner ? lastBanner.order + 1 : 1;
      }

      const banner = new Banner(bannerData);
      const savedBanner = await banner.save();

      this.logger.info(`Tạo banner thành công`, { bannerId: savedBanner._id });

      return {
        message: 'Tạo banner thành công',
        banner: savedBanner
      };
    } catch (error) {
      this.logger.error('Lỗi khi tạo banner:', error);
      throw new AppError('Tạo banner thất bại', 500, ERROR_CODES.INTERNAL_ERROR);
    }
  }

  /**
   * Cập nhật banner
   * @param {string} bannerId - ID banner
   * @param {Object} updateData - Dữ liệu cập nhật
   * @returns {Promise<Object>} - Banner được cập nhật
   */
  async updateBanner(bannerId, updateData) {
    try {
      const banner = await Banner.findById(bannerId);

      if (!banner) {
        throw new AppError('Không tìm thấy banner', 404, ERROR_CODES.NOT_FOUND);
      }

      Object.assign(banner, updateData);
      const savedBanner = await banner.save();

      this.logger.info(`Cập nhật banner thành công`, { bannerId });

      return {
        message: 'Cập nhật banner thành công',
        banner: savedBanner
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      this.logger.error('Lỗi khi cập nhật banner:', error);
      throw new AppError('Cập nhật banner thất bại', 500, ERROR_CODES.INTERNAL_ERROR);
    }
  }

  /**
   * Xóa banner
   * @param {string} bannerId - ID banner
   * @returns {Promise<Object>} - Thông báo thành công
   */
  async deleteBanner(bannerId) {
    try {
      const banner = await Banner.findById(bannerId);

      if (!banner) {
        throw new AppError('Không tìm thấy banner', 404, ERROR_CODES.NOT_FOUND);
      }

      await Banner.findByIdAndDelete(bannerId);

      this.logger.info(`Xóa banner thành công`, { bannerId });

      return {
        message: 'Xóa banner thành công'
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      this.logger.error('Lỗi khi xóa banner:', error);
      throw new AppError('Xóa banner thất bại', 500, ERROR_CODES.INTERNAL_ERROR);
    }
  }

  /**
   * Cập nhật thứ tự banner
   * @param {string} bannerId - ID banner
   * @param {number} newOrder - Thứ tự mới
   * @returns {Promise<Object>} - Banner được cập nhật
   */
  async updateBannerOrder(bannerId, newOrder) {
    try {
      const banner = await Banner.findById(bannerId);

      if (!banner) {
        throw new AppError('Không tìm thấy banner', 404, ERROR_CODES.NOT_FOUND);
      }

      const oldOrder = banner.order;

      // Cập nhật thứ tự các banner khác trong cùng position
      if (newOrder > oldOrder) {
        // Di chuyển xuống dưới
        await Banner.updateMany(
          { 
            position: banner.position, 
            order: { $gt: oldOrder, $lte: newOrder },
            _id: { $ne: bannerId }
          },
          { $inc: { order: -1 } }
        );
      } else if (newOrder < oldOrder) {
        // Di chuyển lên trên
        await Banner.updateMany(
          { 
            position: banner.position, 
            order: { $gte: newOrder, $lt: oldOrder },
            _id: { $ne: bannerId }
          },
          { $inc: { order: 1 } }
        );
      }

      banner.order = newOrder;
      const savedBanner = await banner.save();

      this.logger.info(`Cập nhật thứ tự banner thành công`, { bannerId, newOrder });

      return {
        message: 'Cập nhật thứ tự banner thành công',
        banner: savedBanner
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      this.logger.error('Lỗi khi cập nhật thứ tự banner:', error);
      throw new AppError('Cập nhật thứ tự banner thất bại', 500, ERROR_CODES.INTERNAL_ERROR);
    }
  }

  /**
   * Cập nhật trạng thái banner
   * @param {string} bannerId - ID banner
   * @param {string} status - Trạng thái mới
   * @returns {Promise<Object>} - Banner được cập nhật
   */
  async updateBannerStatus(bannerId, status) {
    try {
      const banner = await Banner.findById(bannerId);

      if (!banner) {
        throw new AppError('Không tìm thấy banner', 404, ERROR_CODES.NOT_FOUND);
      }

      banner.status = status;
      const savedBanner = await banner.save();

      this.logger.info(`Cập nhật trạng thái banner thành công`, { bannerId, status });

      return {
        message: 'Cập nhật trạng thái banner thành công',
        banner: savedBanner
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      this.logger.error('Lỗi khi cập nhật trạng thái banner:', error);
      throw new AppError('Cập nhật trạng thái banner thất bại', 500, ERROR_CODES.INTERNAL_ERROR);
    }
  }

  /**
   * Lấy banner theo vị trí cụ thể
   * @param {string} position - Vị trí banner
   * @param {number} limit - Số lượng banner tối đa
   * @returns {Promise<Object>} - Danh sách banner
   */
  async getBannersByPosition(position, limit = null) {
    try {
      const filter = { 
        position, 
        status: 'active',
        startDate: { $lte: new Date() },
        $or: [
          { endDate: { $gte: new Date() } },
          { endDate: null }
        ]
      };

      let query = Banner.find(filter)
        .sort({ order: 1, createdAt: -1 })
        .select('title image link alt order type');

      if (limit) {
        query = query.limit(limit);
      }

      const banners = await query;

      return {
        message: MESSAGES.SUCCESS.DATA_RETRIEVED,
        banners
      };
    } catch (error) {
      this.logger.error('Lỗi khi lấy banner theo vị trí:', error);
      throw new AppError(MESSAGES.ERROR.DATA_RETRIEVE_FAILED, 500, ERROR_CODES.INTERNAL_ERROR);
    }
  }
}

module.exports = BannerService;
