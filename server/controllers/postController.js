const BaseController = require('./baseController');
const PostService = require('../services/postService');
const Post = require('../models/PostSchema');
const ResponseHandler = require('../services/responseHandler');
const { MESSAGES, ERROR_CODES } = require('../config/constants');
const { QueryUtils } = require('../utils/queryUtils');

class PostController extends BaseController {
  constructor() {
    super(new PostService()); // Sử dụng instance của PostService
  }

  // Lấy tất cả bài viết (có phân trang và tìm kiếm)
  getAllPosts = async (req, res, next) => {
    try {
      // Use new QueryBuilder with improved safety
      if (req.createQueryBuilder) {
        const queryBuilder = req.createQueryBuilder(Post);
        
        // Configure search and filters for posts
        const result = await queryBuilder
          .search(['title', 'content', 'excerpt'])
          .applyFilters({
            isPublished: { type: 'boolean' },
            category: { type: 'exact' },
            author: { type: 'objectId' },
            featured: { type: 'boolean' }
          })
          .execute();
        
        if (result.pagination) {
          ResponseHandler.paginatedResponse(res, MESSAGES.POST_RETRIEVED || 'Lấy danh sách bài viết thành công', result.data, result.pagination);
        } else {
          ResponseHandler.success(res, MESSAGES.POST_RETRIEVED || 'Lấy danh sách bài viết thành công', result.data);
        }
      } else {
        // Fallback to legacy method if middleware not available
        const result = await this.service.getAllPostsWithQuery(req.query, req.user?.role);
        
        if (result.pagination) {
          ResponseHandler.paginatedResponse(res, MESSAGES.POST_RETRIEVED || 'Lấy danh sách bài viết thành công', result.data, result.pagination);
        } else {
          ResponseHandler.success(res, MESSAGES.POST_RETRIEVED || 'Lấy danh sách bài viết thành công', result.data);
        }
      }
    } catch (error) {
      console.error('❌ PostController.getAllPosts error:', error.message);
      next(error);
    }
  };

  // Giữ lại method cũ để backward compatibility
  getAllPostsLegacy = async (req, res, next) => {
    try {
      const { page, limit, sort, title, author, isPublished } = req.query;
      const options = {
        page: parseInt(page) || undefined,
        limit: parseInt(limit) || undefined,
        sort: sort ? JSON.parse(sort) : undefined,
        filter: { title, author, isPublished },
      };
      
      // Pass user role để service biết có filter published hay không
      const result = await this.service.getAllPosts(options, req.user?.role);
      
      if (result.pagination) {
        ResponseHandler.paginatedResponse(res, MESSAGES.POST_RETRIEVED || 'Lấy danh sách bài viết thành công', result.data, result.pagination);
      } else {
        ResponseHandler.success(res, MESSAGES.POST_RETRIEVED || 'Lấy danh sách bài viết thành công', result.data);
      }
    } catch (error) {
      next(error);
    }
  };
  // Tạo bài viết mới
  createPost = async (req, res, next) => {
    try {
      const post = await this.service.createPost(req.user._id, req.body, req.user.role);
      ResponseHandler.created(res, MESSAGES.POST_CREATED, post);
    } catch (error) {
      next(error);
    }
  };

  // Lấy chi tiết bài viết
  getPostById = async (req, res, next) => {
    try {
      const post = await this.service.getPostById(req.params.id);
      ResponseHandler.success(res, MESSAGES.POST_RETRIEVED || 'Lấy chi tiết bài viết thành công', post);
    } catch (error) {
      next(error);
    }
  };

  // Cập nhật bài viết
  updatePost = async (req, res, next) => {
    try {
      const post = await this.service.updatePost(req.params.id, req.user._id, req.user.role, req.body);
      ResponseHandler.success(res, MESSAGES.POST_UPDATED, post);
    } catch (error) {
      next(error);
    }
  };

  // Xóa bài viết
  deletePost = async (req, res, next) => {
    try {
      await this.service.deletePost(req.params.id, req.user._id, req.user.role);
      ResponseHandler.success(res, MESSAGES.POST_DELETED);
    } catch (error) {
      next(error);
    }
  };

  // Lấy bài viết đã xuất bản (public endpoint)
  getPublishedPosts = async (req, res, next) => {
    try {
      const { page, limit, author } = req.query;
      const options = { page: parseInt(page), limit: parseInt(limit), author };
      const result = await this.service.getPublishedPosts(options);
      
      ResponseHandler.paginatedResponse(res, 'Lấy danh sách bài viết đã xuất bản thành công', result.data, result.pagination);
    } catch (error) {
      next(error);
    }
  };

  // Admin ẩn/hiện bài viết
  togglePostVisibility = async (req, res, next) => {
    try {
      const result = await this.service.togglePostVisibility(req.params.id, req.user.role);
      ResponseHandler.success(res, result.message, result);
    } catch (error) {
      next(error);
    }
  };

  // Admin cập nhật trạng thái xuất bản
  updatePublishStatus = async (req, res, next) => {
    try {
      const { isPublished } = req.body;
      const post = await this.service.updatePublishStatus(req.params.id, isPublished, req.user.role);
      const message = isPublished ? 'Bài viết đã được xuất bản' : 'Bài viết đã được ẩn';
      ResponseHandler.success(res, message, post);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = PostController;
