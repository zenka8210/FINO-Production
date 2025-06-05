const Tag = require('../models/tagSchema');
const { MESSAGES, ERROR_CODES } = require('../config/constants');
const { AppError } = require('../middlewares/errorHandler');
const LoggerService = require('./loggerService');

class TagService {
  constructor() {
    this.logger = LoggerService;
  }

  /**
   * Lấy tất cả tag với phân trang
   * @param {Object} query - Query parameters
   * @returns {Promise<Object>} - Danh sách tag
   */
  async getAllTags(query = {}) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        search = '',
        sortBy = 'name',
        sortOrder = 'asc'
      } = query;
      
      const skip = (page - 1) * limit;

      // Tạo filter
      const filter = {};
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      // Tạo sort object
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const tags = await Tag.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Tag.countDocuments(filter);

      return {
        message: MESSAGES.SUCCESS.DATA_RETRIEVED,
        tags,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      };

    } catch (error) {
      this.logger.error('Get all tags failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Lấy tag theo ID
   * @param {string} tagId - ID của tag
   * @returns {Promise<Object>} - Thông tin tag
   */
  async getTagById(tagId) {
    try {
      const tag = await Tag.findById(tagId);
      
      if (!tag) {
        throw new AppError(MESSAGES.ERROR.TAG.NOT_FOUND, 404, ERROR_CODES.TAG.NOT_FOUND);
      }

      return {
        message: MESSAGES.SUCCESS.DATA_RETRIEVED,
        tag
      };

    } catch (error) {
      this.logger.error('Get tag by ID failed', { 
        error: error.message,
        tagId 
      });
      throw error;
    }
  }

  /**
   * Lấy tag theo tên
   * @param {string} tagName - Tên tag
   * @returns {Promise<Object>} - Thông tin tag
   */
  async getTagByName(tagName) {
    try {
      const tag = await Tag.findOne({ 
        name: { $regex: new RegExp(`^${tagName}$`, 'i') } 
      });
      
      if (!tag) {
        throw new AppError(MESSAGES.ERROR.TAG.NOT_FOUND, 404, ERROR_CODES.TAG.NOT_FOUND);
      }

      return {
        message: MESSAGES.SUCCESS.DATA_RETRIEVED,
        tag
      };

    } catch (error) {
      this.logger.error('Get tag by name failed', { 
        error: error.message,
        tagName 
      });
      throw error;
    }
  }

  /**
   * Tạo tag mới
   * @param {Object} tagData - Dữ liệu tag
   * @returns {Promise<Object>} - Tag được tạo
   */
  async createTag(tagData) {
    try {
      // Kiểm tra tag đã tồn tại
      const existingTag = await Tag.findOne({ 
        name: { $regex: new RegExp(`^${tagData.name}$`, 'i') } 
      });
      
      if (existingTag) {
        throw new AppError(MESSAGES.ERROR.TAG.ALREADY_EXISTS, 400, ERROR_CODES.TAG.ALREADY_EXISTS);
      }

      // Chuẩn hóa tên tag
      tagData.name = tagData.name.toLowerCase().trim();

      const tag = new Tag(tagData);
      await tag.save();

      this.logger.info('Tag created successfully', { 
        tagId: tag._id,
        name: tag.name 
      });

      return {
        message: MESSAGES.SUCCESS.TAG.CREATED,
        tag
      };

    } catch (error) {
      this.logger.error('Create tag failed', { 
        error: error.message,
        tagData 
      });
      throw error;
    }
  }

  /**
   * Cập nhật tag
   * @param {string} tagId - ID của tag
   * @param {Object} updateData - Dữ liệu cập nhật
   * @returns {Promise<Object>} - Tag đã cập nhật
   */
  async updateTag(tagId, updateData) {
    try {
      const tag = await Tag.findById(tagId);
      
      if (!tag) {
        throw new AppError(MESSAGES.ERROR.TAG.NOT_FOUND, 404, ERROR_CODES.TAG.NOT_FOUND);
      }

      // Kiểm tra tên tag trùng lặp nếu có thay đổi
      if (updateData.name && updateData.name !== tag.name) {
        const existingTag = await Tag.findOne({ 
          name: { $regex: new RegExp(`^${updateData.name}$`, 'i') },
          _id: { $ne: tagId }
        });
        
        if (existingTag) {
          throw new AppError(MESSAGES.ERROR.TAG.ALREADY_EXISTS, 400, ERROR_CODES.TAG.ALREADY_EXISTS);
        }
        
        // Chuẩn hóa tên tag
        updateData.name = updateData.name.toLowerCase().trim();
      }

      Object.assign(tag, updateData);
      await tag.save();

      this.logger.info('Tag updated successfully', { 
        tagId,
        updateData 
      });

      return {
        message: MESSAGES.SUCCESS.TAG.UPDATED,
        tag
      };

    } catch (error) {
      this.logger.error('Update tag failed', { 
        error: error.message,
        tagId,
        updateData 
      });
      throw error;
    }
  }

  /**
   * Xóa tag
   * @param {string} tagId - ID của tag
   * @returns {Promise<Object>} - Kết quả xóa
   */
  async deleteTag(tagId) {
    try {
      const tag = await Tag.findById(tagId);
      
      if (!tag) {
        throw new AppError(MESSAGES.ERROR.TAG.NOT_FOUND, 404, ERROR_CODES.TAG.NOT_FOUND);
      }

      // Kiểm tra tag có đang được sử dụng không
      const isTagInUse = await this.checkTagInUse(tagId);
      if (isTagInUse.inUse) {
        throw new AppError(
          `Không thể xóa tag vì đang được sử dụng trong ${isTagInUse.usageCount} mục`,
          400,
          ERROR_CODES.TAG.IN_USE
        );
      }

      await Tag.findByIdAndDelete(tagId);

      this.logger.info('Tag deleted successfully', { 
        tagId,
        tagName: tag.name 
      });

      return {
        message: MESSAGES.SUCCESS.TAG.DELETED
      };

    } catch (error) {
      this.logger.error('Delete tag failed', { 
        error: error.message,
        tagId 
      });
      throw error;
    }
  }

  /**
   * Tìm kiếm tag
   * @param {string} searchTerm - Từ khóa tìm kiếm
   * @param {Object} options - Tùy chọn tìm kiếm
   * @returns {Promise<Object>} - Kết quả tìm kiếm
   */
  async searchTags(searchTerm, options = {}) {
    try {
      const { limit = 10 } = options;

      const tags = await Tag.find({
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } }
        ]
      })
      .limit(parseInt(limit))
      .sort({ name: 1 });

      return {
        message: MESSAGES.SUCCESS.DATA_RETRIEVED,
        tags
      };

    } catch (error) {
      this.logger.error('Search tags failed', { 
        error: error.message,
        searchTerm 
      });
      throw error;
    }
  }

  /**
   * Lấy tag phổ biến
   * @param {number} limit - Số lượng tag
   * @returns {Promise<Object>} - Danh sách tag phổ biến
   */
  async getPopularTags(limit = 10) {
    try {
      // Thống kê tag được sử dụng nhiều nhất
      // Ở đây ta giả lập, trong thực tế sẽ aggregate từ products và news
      const tags = await Tag.find()
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));

      return {
        message: MESSAGES.SUCCESS.DATA_RETRIEVED,
        tags
      };

    } catch (error) {
      this.logger.error('Get popular tags failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Tạo tag hàng loạt
   * @param {Array} tagNames - Danh sách tên tag
   * @returns {Promise<Object>} - Kết quả tạo tag
   */
  async createBulkTags(tagNames) {
    try {
      const results = {
        created: [],
        existed: [],
        errors: []
      };

      for (const tagName of tagNames) {
        try {
          const normalizedName = tagName.toLowerCase().trim();
          
          // Kiểm tra tag đã tồn tại
          const existingTag = await Tag.findOne({ 
            name: { $regex: new RegExp(`^${normalizedName}$`, 'i') } 
          });
          
          if (existingTag) {
            results.existed.push(existingTag);
          } else {
            const tag = new Tag({ name: normalizedName });
            await tag.save();
            results.created.push(tag);
          }
        } catch (error) {
          results.errors.push({
            tagName,
            error: error.message
          });
        }
      }

      this.logger.info('Bulk tag creation completed', { 
        created: results.created.length,
        existed: results.existed.length,
        errors: results.errors.length
      });

      return {
        message: MESSAGES.SUCCESS.TAG.BULK_CREATED,
        results
      };

    } catch (error) {
      this.logger.error('Bulk tag creation failed', { 
        error: error.message,
        tagNames 
      });
      throw error;
    }
  }

  /**
   * Kiểm tra tag có đang được sử dụng không
   * @param {string} tagId - ID của tag
   * @returns {Promise<Object>} - Kết quả kiểm tra
   */
  async checkTagInUse(tagId) {
    try {
      // Kiểm tra trong products
      const Product = require('../models/productSchema');
      const productCount = await Product.countDocuments({ tags: tagId });

      // Kiểm tra trong news
      const News = require('../models/newsSchema');
      const newsCount = await News.countDocuments({ tags: tagId });

      const totalUsage = productCount + newsCount;

      return {
        inUse: totalUsage > 0,
        usageCount: totalUsage,
        details: {
          products: productCount,
          news: newsCount
        }
      };

    } catch (error) {
      this.logger.error('Check tag usage failed', { 
        error: error.message,
        tagId 
      });
      throw error;
    }
  }

  /**
   * Lấy thống kê tag
   * @returns {Promise<Object>} - Thống kê tag
   */
  async getTagStatistics() {
    try {
      const totalTags = await Tag.countDocuments();
      
      // Thống kê tag sử dụng (giả lập)
      const stats = {
        total: totalTags,
        mostUsed: await this.getPopularTags(5),
        recentlyCreated: await Tag.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .select('name createdAt')
      };

      return {
        message: MESSAGES.SUCCESS.DATA_RETRIEVED,
        statistics: stats
      };

    } catch (error) {
      this.logger.error('Get tag statistics failed', { error: error.message });
      throw error;
    }
  }
}

module.exports = TagService;
