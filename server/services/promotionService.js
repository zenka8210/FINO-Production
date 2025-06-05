const Promotion = require('../models/promotionSchema');
const Product = require('../models/productSchema');
const { MESSAGES, ERROR_CODES } = require('../config/constants');
const { AppError } = require('../middlewares/errorHandler');
const LoggerService = require('./loggerService');

class PromotionService {
  constructor() {
    this.logger = LoggerService;
  }

  /**
   * Lấy tất cả chương trình khuyến mãi với phân trang
   * @param {Object} query - Query parameters
   * @returns {Promise<Object>} - Danh sách khuyến mãi
   */
  async getAllPromotions(query = {}) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        search = '',
        type,
        active,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = query;
      
      const skip = (page - 1) * limit;

      // Tạo filter
      const filter = {};
      if (search) {
        filter.name = { $regex: search, $options: 'i' };
      }
      if (type) filter.type = type;
      if (active !== undefined) filter.active = active === 'true';

      // Tạo sort object
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const promotions = await Promotion.find(filter)
        .populate('products', 'name price images')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Promotion.countDocuments(filter);

      return {
        message: MESSAGES.SUCCESS.DATA_RETRIEVED,
        promotions,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      };

    } catch (error) {
      this.logger.error('Get all promotions failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Lấy khuyến mãi theo ID
   * @param {string} promotionId - ID của khuyến mãi
   * @returns {Promise<Object>} - Thông tin khuyến mãi
   */
  async getPromotionById(promotionId) {
    try {
      const promotion = await Promotion.findById(promotionId)
        .populate('products', 'name price images category');
      
      if (!promotion) {
        throw new AppError(MESSAGES.ERROR.PROMOTION.NOT_FOUND, 404, ERROR_CODES.PROMOTION.NOT_FOUND);
      }

      return {
        message: MESSAGES.SUCCESS.DATA_RETRIEVED,
        promotion
      };

    } catch (error) {
      this.logger.error('Get promotion by ID failed', { 
        error: error.message,
        promotionId 
      });
      throw error;
    }
  }

  /**
   * Lấy khuyến mãi đang hoạt động
   * @param {Object} options - Tùy chọn lọc
   * @returns {Promise<Object>} - Danh sách khuyến mãi đang hoạt động
   */
  async getActivePromotions(options = {}) {
    try {
      const { limit = 10, type } = options;
      const now = new Date();

      const filter = {
        active: true,
        startDate: { $lte: now },
        endDate: { $gte: now }
      };

      if (type) filter.type = type;

      const promotions = await Promotion.find(filter)
        .populate('products', 'name price images')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));

      return {
        message: MESSAGES.SUCCESS.DATA_RETRIEVED,
        promotions
      };

    } catch (error) {
      this.logger.error('Get active promotions failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Tạo chương trình khuyến mãi mới
   * @param {Object} promotionData - Dữ liệu khuyến mãi
   * @returns {Promise<Object>} - Khuyến mãi được tạo
   */
  async createPromotion(promotionData) {
    try {
      // Validate dates
      const startDate = new Date(promotionData.startDate);
      const endDate = new Date(promotionData.endDate);
      
      if (startDate >= endDate) {
        throw new AppError('Ngày bắt đầu phải nhỏ hơn ngày kết thúc', 400, ERROR_CODES.PROMOTION.INVALID_DATE);
      }

      // Validate products exist
      if (promotionData.products && promotionData.products.length > 0) {
        const existingProducts = await Product.find({
          _id: { $in: promotionData.products }
        });
        
        if (existingProducts.length !== promotionData.products.length) {
          throw new AppError('Một số sản phẩm không tồn tại', 400, ERROR_CODES.PROMOTION.INVALID_PRODUCTS);
        }
      }

      // Validate value based on type
      if (promotionData.type === 'percent' && (promotionData.value < 0 || promotionData.value > 100)) {
        throw new AppError('Giá trị phần trăm phải từ 0 đến 100', 400, ERROR_CODES.PROMOTION.INVALID_VALUE);
      }

      if ((promotionData.type === 'fixed' || promotionData.type === 'bundle') && promotionData.value < 0) {
        throw new AppError('Giá trị giảm giá phải lớn hơn 0', 400, ERROR_CODES.PROMOTION.INVALID_VALUE);
      }

      const promotion = new Promotion(promotionData);
      await promotion.save();

      await promotion.populate('products', 'name price images');

      this.logger.info('Promotion created successfully', { 
        promotionId: promotion._id,
        name: promotion.name 
      });

      return {
        message: MESSAGES.SUCCESS.PROMOTION.CREATED,
        promotion
      };

    } catch (error) {
      this.logger.error('Create promotion failed', { 
        error: error.message,
        promotionData 
      });
      throw error;
    }
  }

  /**
   * Cập nhật chương trình khuyến mãi
   * @param {string} promotionId - ID của khuyến mãi
   * @param {Object} updateData - Dữ liệu cập nhật
   * @returns {Promise<Object>} - Khuyến mãi đã cập nhật
   */
  async updatePromotion(promotionId, updateData) {
    try {
      const promotion = await Promotion.findById(promotionId);
      
      if (!promotion) {
        throw new AppError(MESSAGES.ERROR.PROMOTION.NOT_FOUND, 404, ERROR_CODES.PROMOTION.NOT_FOUND);
      }

      // Validate dates if provided
      if (updateData.startDate || updateData.endDate) {
        const startDate = new Date(updateData.startDate || promotion.startDate);
        const endDate = new Date(updateData.endDate || promotion.endDate);
        
        if (startDate >= endDate) {
          throw new AppError('Ngày bắt đầu phải nhỏ hơn ngày kết thúc', 400, ERROR_CODES.PROMOTION.INVALID_DATE);
        }
      }

      // Validate products if provided
      if (updateData.products) {
        const existingProducts = await Product.find({
          _id: { $in: updateData.products }
        });
        
        if (existingProducts.length !== updateData.products.length) {
          throw new AppError('Một số sản phẩm không tồn tại', 400, ERROR_CODES.PROMOTION.INVALID_PRODUCTS);
        }
      }

      // Validate value based on type
      if (updateData.type && updateData.value !== undefined) {
        if (updateData.type === 'percent' && (updateData.value < 0 || updateData.value > 100)) {
          throw new AppError('Giá trị phần trăm phải từ 0 đến 100', 400, ERROR_CODES.PROMOTION.INVALID_VALUE);
        }

        if ((updateData.type === 'fixed' || updateData.type === 'bundle') && updateData.value < 0) {
          throw new AppError('Giá trị giảm giá phải lớn hơn 0', 400, ERROR_CODES.PROMOTION.INVALID_VALUE);
        }
      }

      Object.assign(promotion, updateData);
      await promotion.save();

      await promotion.populate('products', 'name price images');

      this.logger.info('Promotion updated successfully', { 
        promotionId,
        updateData 
      });

      return {
        message: MESSAGES.SUCCESS.PROMOTION.UPDATED,
        promotion
      };

    } catch (error) {
      this.logger.error('Update promotion failed', { 
        error: error.message,
        promotionId,
        updateData 
      });
      throw error;
    }
  }

  /**
   * Xóa chương trình khuyến mãi
   * @param {string} promotionId - ID của khuyến mãi
   * @returns {Promise<Object>} - Kết quả xóa
   */
  async deletePromotion(promotionId) {
    try {
      const promotion = await Promotion.findById(promotionId);
      
      if (!promotion) {
        throw new AppError(MESSAGES.ERROR.PROMOTION.NOT_FOUND, 404, ERROR_CODES.PROMOTION.NOT_FOUND);
      }

      await Promotion.findByIdAndDelete(promotionId);

      this.logger.info('Promotion deleted successfully', { 
        promotionId,
        promotionName: promotion.name 
      });

      return {
        message: MESSAGES.SUCCESS.PROMOTION.DELETED
      };

    } catch (error) {
      this.logger.error('Delete promotion failed', { 
        error: error.message,
        promotionId 
      });
      throw error;
    }
  }

  /**
   * Kích hoạt/tắt chương trình khuyến mãi
   * @param {string} promotionId - ID của khuyến mãi
   * @param {boolean} active - Trạng thái
   * @returns {Promise<Object>} - Khuyến mãi đã cập nhật
   */
  async togglePromotionStatus(promotionId, active) {
    try {
      const promotion = await Promotion.findById(promotionId);
      
      if (!promotion) {
        throw new AppError(MESSAGES.ERROR.PROMOTION.NOT_FOUND, 404, ERROR_CODES.PROMOTION.NOT_FOUND);
      }

      promotion.active = active;
      await promotion.save();

      this.logger.info('Promotion status updated', { 
        promotionId,
        active 
      });

      return {
        message: active ? MESSAGES.SUCCESS.PROMOTION.ACTIVATED : MESSAGES.SUCCESS.PROMOTION.DEACTIVATED,
        promotion
      };

    } catch (error) {
      this.logger.error('Toggle promotion status failed', { 
        error: error.message,
        promotionId 
      });
      throw error;
    }
  }

  /**
   * Áp dụng khuyến mãi cho sản phẩm
   * @param {string} productId - ID sản phẩm
   * @returns {Promise<Object>} - Thông tin khuyến mãi áp dụng
   */
  async getPromotionForProduct(productId) {
    try {
      const now = new Date();

      const promotion = await Promotion.findOne({
        products: productId,
        active: true,
        startDate: { $lte: now },
        endDate: { $gte: now }
      }).sort({ value: -1 }); // Lấy khuyến mãi có giá trị cao nhất

      if (!promotion) {
        return {
          message: 'Không có khuyến mãi nào áp dụng',
          promotion: null
        };
      }

      return {
        message: MESSAGES.SUCCESS.DATA_RETRIEVED,
        promotion
      };

    } catch (error) {
      this.logger.error('Get promotion for product failed', { 
        error: error.message,
        productId 
      });
      throw error;
    }
  }

  /**
   * Tính giá sau khuyến mãi
   * @param {number} originalPrice - Giá gốc
   * @param {Object} promotion - Thông tin khuyến mãi
   * @returns {number} - Giá sau khuyến mãi
   */
  calculateDiscountedPrice(originalPrice, promotion) {
    if (!promotion) return originalPrice;

    switch (promotion.type) {
      case 'percent':
        return originalPrice - (originalPrice * promotion.value / 100);
      case 'fixed':
        return Math.max(0, originalPrice - promotion.value);
      case 'bundle':
        // Bundle promotion logic would be more complex
        return originalPrice - promotion.value;
      default:
        return originalPrice;
    }
  }

  /**
   * Lấy thống kê khuyến mãi
   * @returns {Promise<Object>} - Thống kê khuyến mãi
   */
  async getPromotionStatistics() {
    try {
      const now = new Date();

      const stats = await Promotion.aggregate([
        {
          $facet: {
            total: [{ $count: "count" }],
            active: [{ $match: { active: true } }, { $count: "count" }],
            current: [
              { 
                $match: { 
                  active: true,
                  startDate: { $lte: now },
                  endDate: { $gte: now }
                } 
              }, 
              { $count: "count" }
            ],
            upcoming: [
              { 
                $match: { 
                  active: true,
                  startDate: { $gt: now }
                } 
              }, 
              { $count: "count" }
            ],
            expired: [
              { 
                $match: { 
                  endDate: { $lt: now }
                } 
              }, 
              { $count: "count" }
            ],
            byType: [
              {
                $group: {
                  _id: "$type",
                  count: { $sum: 1 },
                  totalValue: { $sum: "$value" }
                }
              }
            ]
          }
        }
      ]);

      const statistics = {
        total: stats[0].total[0]?.count || 0,
        active: stats[0].active[0]?.count || 0,
        current: stats[0].current[0]?.count || 0,
        upcoming: stats[0].upcoming[0]?.count || 0,
        expired: stats[0].expired[0]?.count || 0,
        byType: stats[0].byType || []
      };

      return {
        message: MESSAGES.SUCCESS.DATA_RETRIEVED,
        statistics
      };

    } catch (error) {
      this.logger.error('Get promotion statistics failed', { error: error.message });
      throw error;
    }
  }
}

module.exports = PromotionService;
