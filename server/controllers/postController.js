const BaseController = require('./baseController');
const PostService = require('../services/postService');
const ResponseHandler = require('../services/responseHandler');
const { MESSAGES, ERROR_CODES } = require('../config/constants');

class PostController extends BaseController {
  constructor() {
    super(new PostService()); // Sử dụng instance của PostService
  }

  // Lấy tất cả bài viết (có phân trang và tìm kiếm)
  getAllPosts = async (req, res, next) => {
    try {
      const { page, limit, sort, title, author } = req.query;
      const options = {
        page: parseInt(page) || undefined,
        limit: parseInt(limit) || undefined,
        sort: sort ? JSON.parse(sort) : undefined,
        filter: { title, author },
      };
      const result = await this.service.getAllPosts(options);
      
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
      const post = await this.service.createPost(req.user._id, req.body);
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
}

module.exports = PostController;
