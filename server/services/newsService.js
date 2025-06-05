const News = require('../models/newsSchema');
const { MESSAGES, ERROR_CODES } = require('../config/constants');
const { AppError } = require('../middlewares/errorHandler');
const LoggerService = require('./loggerService');

class NewsService {
  constructor() {
    this.logger = LoggerService;
  }

  /**
   * Lấy tất cả tin tức với phân trang và tìm kiếm
   * @param {Object} query - Query parameters
   * @returns {Promise<Object>} - Danh sách tin tức
   */
  async getAllNews(query = {}) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        status, 
        category, 
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = query;
      
      const skip = (page - 1) * limit;

      // Tạo filter
      const filter = {};
      if (status) filter.status = status;
      if (category) filter.category = new RegExp(category, 'i');
      if (search) {
        filter.$or = [
          { title: new RegExp(search, 'i') },
          { content: new RegExp(search, 'i') },
          { summary: new RegExp(search, 'i') }
        ];
      }

      // Tạo sort object
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const news = await News.find(filter)
        .populate('author', 'username email')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));

      const total = await News.countDocuments(filter);

      return {
        message: MESSAGES.SUCCESS.DATA_RETRIEVED,
        news,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      this.logger.error('Lỗi khi lấy danh sách tin tức:', error);
      throw new AppError(MESSAGES.ERROR.DATA_RETRIEVE_FAILED, 500, ERROR_CODES.INTERNAL_ERROR);
    }
  }

  /**
   * Lấy tin tức công khai (cho frontend)
   * @param {Object} query - Query parameters
   * @returns {Promise<Object>} - Danh sách tin tức công khai
   */
  async getPublicNews(query = {}) {
    try {
      const { page = 1, limit = 10, category, featured } = query;
      const skip = (page - 1) * limit;

      // Filter chỉ lấy tin tức đã xuất bản
      const filter = { status: 'published' };
      if (category) filter.category = new RegExp(category, 'i');
      if (featured !== undefined) filter.isFeatured = featured === 'true';

      const news = await News.find(filter)
        .populate('author', 'username')
        .sort({ isFeatured: -1, publishedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('-content'); // Không trả về content đầy đủ trong danh sách

      const total = await News.countDocuments(filter);

      return {
        message: MESSAGES.SUCCESS.DATA_RETRIEVED,
        news,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      this.logger.error('Lỗi khi lấy tin tức công khai:', error);
      throw new AppError(MESSAGES.ERROR.DATA_RETRIEVE_FAILED, 500, ERROR_CODES.INTERNAL_ERROR);
    }
  }

  /**
   * Lấy tin tức theo ID
   * @param {string} newsId - ID tin tức
   * @param {boolean} isPublic - Có phải truy cập công khai không
   * @returns {Promise<Object>} - Thông tin tin tức
   */
  async getNewsById(newsId, isPublic = false) {
    try {
      const filter = { _id: newsId };
      if (isPublic) {
        filter.status = 'published';
      }

      const news = await News.findOne(filter)
        .populate('author', 'username email');

      if (!news) {
        throw new AppError('Không tìm thấy tin tức', 404, ERROR_CODES.NOT_FOUND);
      }

      // Tăng view count nếu là truy cập công khai
      if (isPublic) {
        news.viewCount += 1;
        await news.save();
      }

      return {
        message: MESSAGES.SUCCESS.DATA_RETRIEVED,
        news
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      this.logger.error('Lỗi khi lấy thông tin tin tức:', error);
      throw new AppError(MESSAGES.ERROR.DATA_RETRIEVE_FAILED, 500, ERROR_CODES.INTERNAL_ERROR);
    }
  }

  /**
   * Lấy tin tức theo slug
   * @param {string} slug - Slug tin tức
   * @returns {Promise<Object>} - Thông tin tin tức
   */
  async getNewsBySlug(slug) {
    try {
      const news = await News.findOne({ slug, status: 'published' })
        .populate('author', 'username email');

      if (!news) {
        throw new AppError('Không tìm thấy tin tức', 404, ERROR_CODES.NOT_FOUND);
      }

      // Tăng view count
      news.viewCount += 1;
      await news.save();

      return {
        message: MESSAGES.SUCCESS.DATA_RETRIEVED,
        news
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      this.logger.error('Lỗi khi lấy tin tức theo slug:', error);
      throw new AppError(MESSAGES.ERROR.DATA_RETRIEVE_FAILED, 500, ERROR_CODES.INTERNAL_ERROR);
    }
  }

  /**
   * Tạo tin tức mới
   * @param {Object} newsData - Dữ liệu tin tức
   * @param {string} authorId - ID tác giả
   * @returns {Promise<Object>} - Tin tức được tạo
   */
  async createNews(newsData, authorId) {
    try {
      // Tạo slug từ title nếu không có
      if (!newsData.slug) {
        newsData.slug = this.generateSlug(newsData.title);
      }

      // Kiểm tra slug đã tồn tại
      const existingNews = await News.findOne({ slug: newsData.slug });
      if (existingNews) {
        newsData.slug = `${newsData.slug}-${Date.now()}`;
      }

      const news = new News({
        ...newsData,
        author: authorId
      });

      const savedNews = await news.save();

      this.logger.info(`Tạo tin tức thành công`, { newsId: savedNews._id, authorId });

      return {
        message: 'Tạo tin tức thành công',
        news: savedNews
      };
    } catch (error) {
      this.logger.error('Lỗi khi tạo tin tức:', error);
      throw new AppError('Tạo tin tức thất bại', 500, ERROR_CODES.INTERNAL_ERROR);
    }
  }

  /**
   * Cập nhật tin tức
   * @param {string} newsId - ID tin tức
   * @param {Object} updateData - Dữ liệu cập nhật
   * @returns {Promise<Object>} - Tin tức được cập nhật
   */
  async updateNews(newsId, updateData) {
    try {
      const news = await News.findById(newsId);

      if (!news) {
        throw new AppError('Không tìm thấy tin tức', 404, ERROR_CODES.NOT_FOUND);
      }

      // Kiểm tra slug nếu được cập nhật
      if (updateData.slug && updateData.slug !== news.slug) {
        const existingNews = await News.findOne({ 
          slug: updateData.slug, 
          _id: { $ne: newsId } 
        });
        if (existingNews) {
          throw new AppError('Slug đã tồn tại', 400, ERROR_CODES.INVALID_INPUT);
        }
      }

      // Cập nhật publishedAt nếu status thay đổi thành published
      if (updateData.status === 'published' && news.status !== 'published') {
        updateData.publishedAt = new Date();
      }

      Object.assign(news, updateData);
      const savedNews = await news.save();

      this.logger.info(`Cập nhật tin tức thành công`, { newsId });

      return {
        message: 'Cập nhật tin tức thành công',
        news: savedNews
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      this.logger.error('Lỗi khi cập nhật tin tức:', error);
      throw new AppError('Cập nhật tin tức thất bại', 500, ERROR_CODES.INTERNAL_ERROR);
    }
  }

  /**
   * Xóa tin tức
   * @param {string} newsId - ID tin tức
   * @returns {Promise<Object>} - Thông báo thành công
   */
  async deleteNews(newsId) {
    try {
      const news = await News.findById(newsId);

      if (!news) {
        throw new AppError('Không tìm thấy tin tức', 404, ERROR_CODES.NOT_FOUND);
      }

      await News.findByIdAndDelete(newsId);

      this.logger.info(`Xóa tin tức thành công`, { newsId });

      return {
        message: 'Xóa tin tức thành công'
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      this.logger.error('Lỗi khi xóa tin tức:', error);
      throw new AppError('Xóa tin tức thất bại', 500, ERROR_CODES.INTERNAL_ERROR);
    }
  }

  /**
   * Lấy tin tức liên quan
   * @param {string} newsId - ID tin tức hiện tại
   * @param {string} category - Danh mục tin tức
   * @param {number} limit - Số lượng tin tức liên quan
   * @returns {Promise<Object>} - Danh sách tin tức liên quan
   */
  async getRelatedNews(newsId, category, limit = 5) {
    try {
      const relatedNews = await News.find({
        _id: { $ne: newsId },
        category: new RegExp(category, 'i'),
        status: 'published'
      })
        .populate('author', 'username')
        .sort({ publishedAt: -1 })
        .limit(limit)
        .select('title slug thumbnail summary publishedAt category viewCount');

      return {
        message: MESSAGES.SUCCESS.DATA_RETRIEVED,
        news: relatedNews
      };
    } catch (error) {
      this.logger.error('Lỗi khi lấy tin tức liên quan:', error);
      throw new AppError(MESSAGES.ERROR.DATA_RETRIEVE_FAILED, 500, ERROR_CODES.INTERNAL_ERROR);
    }
  }

  /**
   * Tạo slug từ title
   * @param {string} title - Tiêu đề tin tức
   * @returns {string} - Slug
   */
  generateSlug(title) {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Loại bỏ dấu tiếng Việt
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '') // Loại bỏ ký tự đặc biệt
      .trim()
      .replace(/\s+/g, '-') // Thay thế khoảng trắng bằng dấu gạch ngang
      .replace(/-+/g, '-'); // Loại bỏ dấu gạch ngang liên tiếp
  }
}

module.exports = NewsService;
