const BaseController = require('./baseController');
const NewsService = require('../services/newsService');
const ResponseHandler = require('../services/responseHandler');

/**
 * News Controller - Quản lý tin tức
 * Extends BaseController để sử dụng các phương thức chung
 */
class NewsController extends BaseController {
  constructor() {
    super();
    this.newsService = new NewsService();
  }

  /**
   * Lấy tin tức công khai (Frontend)
   * GET /api/news/public
   */  getPublicNews = async (req, res, next) => {
    try {
      const result = await this.newsService.getPublicNews(req.query);
      
      return ResponseHandler.success(res, { news: result.news, pagination: result.pagination }, result.message);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Lấy tin tức theo slug (Frontend)
   * GET /api/news/public/:slug
   */  getNewsBySlug = async (req, res, next) => {
    try {
      const { slug } = req.params;
      const result = await this.newsService.getNewsBySlug(slug);
      
      return ResponseHandler.success(res, result.news, result.message);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Lấy tin tức liên quan (Frontend)
   * GET /api/news/public/:id/related
   */  getRelatedNews = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { category, limit } = req.query;
      const result = await this.newsService.getRelatedNews(id, category, limit);
      
      return ResponseHandler.success(res, result.news, result.message);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Lấy tất cả tin tức (Admin)
   * GET /api/news
   */  getAllNews = async (req, res, next) => {
    try {
      const result = await this.newsService.getAllNews(req.query);
      
      return ResponseHandler.success(res, { news: result.news, pagination: result.pagination }, result.message);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Lấy tin tức theo ID (Admin)
   * GET /api/news/:id
   */  getNewsById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await this.newsService.getNewsById(id, false);
      
      return ResponseHandler.success(res, result.news, result.message);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Tạo tin tức mới (Admin)
   * POST /api/news
   */  createNews = async (req, res, next) => {
    try {
      const authorId = req.user.id;
      const result = await this.newsService.createNews(req.body, authorId);
      
      return ResponseHandler.created(res, result.message, result.news);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Cập nhật tin tức (Admin)
   * PUT /api/news/:id
   */  updateNews = async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await this.newsService.updateNews(id, req.body);
      
      return ResponseHandler.success(res, result.news, result.message);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Xóa tin tức (Admin)
   * DELETE /api/news/:id
   */  deleteNews = async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await this.newsService.deleteNews(id);
      
      return ResponseHandler.success(res, null, result.message);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new NewsController();