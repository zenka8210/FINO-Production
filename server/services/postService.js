const BaseService = require('./baseService');
const Post = require('../models/PostSchema');
const { MESSAGES, ERROR_CODES, ROLES } = require('../config/constants');
const { AppError } = require('../middlewares/errorHandler'); // Thay đổi đường dẫn import AppError
const { QueryUtils } = require('../utils/queryUtils');

class PostService extends BaseService {
  constructor() {
    super(Post);
  }

  async getAllPosts(options = {}) {
    const { page = 1, limit = 10, sort = { createdAt: -1 }, filter = {} } = options;

    const query = {};

    if (filter.title) {
      query.title = { $regex: filter.title, $options: 'i' }; // Tìm kiếm không phân biệt hoa thường
    }
    if (filter.author) {
      query.author = filter.author;
    }

    try {
      const posts = await Post.find(query)
        .populate('author', 'name email') // Lấy thông tin tên và email của tác giả
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(parseInt(limit)); // Đảm bảo limit là số

      const totalPosts = await Post.countDocuments(query);
      const totalPages = Math.ceil(totalPosts / parseInt(limit)); // Đảm bảo limit là số

      return {
        data: posts,
        pagination: {
          currentPage: parseInt(page), // Đảm bảo page là số
          totalPages,
          totalItems: totalPosts,
          itemsPerPage: parseInt(limit),
        },
      };
    } catch (error) {
      // Sử dụng AppError đã import
      throw new AppError(MESSAGES.POST_RETRIEVAL_FAILED || 'Lấy danh sách bài viết thất bại', ERROR_CODES.INTERNAL_ERROR);
    }
  }

  async createPost(authorId, postData, userRole) {
    try {
      // Chỉ admin mới có quyền tạo bài viết
      if (userRole !== ROLES.ADMIN) {
        throw new AppError('Chỉ admin mới có quyền tạo bài viết', ERROR_CODES.FORBIDDEN);
      }

      const newPost = new Post({
        ...postData,
        author: authorId,
      });
      await newPost.save();
      return newPost.populate('author', 'name email');
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (error.name === 'ValidationError') {
        // Lấy chi tiết lỗi validation
        const errors = Object.values(error.errors).map(err => ({ field: err.path, message: err.message }));
        throw new AppError(MESSAGES.VALIDATION_ERROR, ERROR_CODES.VALIDATION_ERROR, errors);
      }
      throw new AppError(MESSAGES.POST_CREATE_FAILED || 'Tạo bài viết thất bại', ERROR_CODES.POST.CREATE_FAILED);
    }
  }

  async getPostById(postId) {
    try {
      const post = await Post.findById(postId).populate('author', 'name email');
      if (!post) {
        throw new AppError(MESSAGES.POST_NOT_FOUND, ERROR_CODES.POST.NOT_FOUND);
      }
      return post;
    } catch (error) {
      if (error instanceof AppError) throw error;
      // Thêm kiểm tra cho CastError nếu ID không hợp lệ
      if (error.name === 'CastError') {
        throw new AppError(`ID bài viết không hợp lệ: ${postId}`, ERROR_CODES.BAD_REQUEST);
      }
      throw new AppError(MESSAGES.POST_RETRIEVAL_FAILED || 'Lấy bài viết thất bại', ERROR_CODES.INTERNAL_ERROR);
    }
  }

  async updatePost(postId, userId, userRole, updateData) { // Thêm userRole để kiểm tra admin
    try {
      const post = await Post.findById(postId);
      if (!post) {
        throw new AppError(MESSAGES.POST_NOT_FOUND, ERROR_CODES.POST.NOT_FOUND);
      }

      // Chỉ tác giả hoặc admin mới có quyền sửa bài viết
      if (post.author.toString() !== userId.toString() && userRole !== ROLES.ADMIN) {
        throw new AppError(MESSAGES.ACCESS_DENIED, ERROR_CODES.FORBIDDEN);
      }

      Object.assign(post, updateData);
      await post.save();
      return post.populate('author', 'name email');
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => ({ field: err.path, message: err.message }));
        throw new AppError(MESSAGES.VALIDATION_ERROR, ERROR_CODES.VALIDATION_ERROR, errors);
      }
      if (error.name === 'CastError') {
        throw new AppError(`ID bài viết không hợp lệ: ${postId}`, ERROR_CODES.BAD_REQUEST);
      }
      throw new AppError(MESSAGES.POST_UPDATE_FAILED || 'Cập nhật bài viết thất bại', ERROR_CODES.POST.UPDATE_FAILED);
    }
  }

  async deletePost(postId, userId, userRole) { // Thêm userRole để kiểm tra admin
    try {
      const post = await Post.findById(postId);
      if (!post) {
        throw new AppError(MESSAGES.POST_NOT_FOUND, ERROR_CODES.POST.NOT_FOUND);
      }

      // Chỉ tác giả hoặc admin mới có quyền xóa bài viết
      if (post.author.toString() !== userId.toString() && userRole !== ROLES.ADMIN) {
        throw new AppError(MESSAGES.ACCESS_DENIED, ERROR_CODES.FORBIDDEN);
      }

      await Post.findByIdAndDelete(postId);
      // Không cần trả về message ở đây, controller sẽ xử lý response
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (error.name === 'CastError') {
        throw new AppError(`ID bài viết không hợp lệ: ${postId}`, ERROR_CODES.BAD_REQUEST);
      }
      throw new AppError(MESSAGES.POST_DELETE_FAILED || 'Xóa bài viết thất bại', ERROR_CODES.POST.DELETE_FAILED);
    }
  }

  // Lấy bài viết đã được xuất bản (dành cho public)
  async getPublishedPosts(options = {}) {
    try {
      const { page = 1, limit = 10, author } = options;
      const posts = await Post.getPublishedPosts({ page, limit, author });
      const totalPosts = await Post.countDocuments({ isPublished: true, ...(author && { author }) });
      const totalPages = Math.ceil(totalPosts / parseInt(limit));

      return {
        data: posts,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: totalPosts,
          itemsPerPage: parseInt(limit),
        },
      };
    } catch (error) {
      throw new AppError(MESSAGES.POST_RETRIEVAL_FAILED || 'Lấy danh sách bài viết thất bại', ERROR_CODES.INTERNAL_ERROR);
    }
  }

  // Admin ẩn/hiện bài viết
  async togglePostVisibility(postId, userRole) {
    try {
      // Chỉ admin mới có quyền ẩn/hiện bài viết
      if (userRole !== ROLES.ADMIN) {
        throw new AppError(MESSAGES.ACCESS_DENIED, ERROR_CODES.FORBIDDEN);
      }

      const post = await Post.findById(postId);
      if (!post) {
        throw new AppError(MESSAGES.POST_NOT_FOUND, ERROR_CODES.POST.NOT_FOUND);
      }

      post.isPublished = !post.isPublished;
      await post.save();
      
      const populatedPost = await post.populate('author', 'name email');
      
      return {
        ...populatedPost.toObject(),
        message: post.isPublished ? 'Bài viết đã được hiển thị' : 'Bài viết đã được ẩn'
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (error.name === 'CastError') {
        throw new AppError(`ID bài viết không hợp lệ: ${postId}`, ERROR_CODES.BAD_REQUEST);
      }
      throw new AppError(MESSAGES.POST_UPDATE_FAILED || 'Cập nhật trạng thái bài viết thất bại', ERROR_CODES.POST.UPDATE_FAILED);
    }
  }

  // Admin cập nhật trạng thái xuất bản
  async updatePublishStatus(postId, isPublished, userRole) {
    try {
      // Chỉ admin mới có quyền thay đổi trạng thái xuất bản
      if (userRole !== ROLES.ADMIN) {
        throw new AppError(MESSAGES.ACCESS_DENIED, ERROR_CODES.FORBIDDEN);
      }

      const post = await Post.findById(postId);
      if (!post) {
        throw new AppError(MESSAGES.POST_NOT_FOUND, ERROR_CODES.POST.NOT_FOUND);
      }

      post.isPublished = isPublished;
      await post.save();
      
      return post.populate('author', 'name email');
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (error.name === 'CastError') {
        throw new AppError(`ID bài viết không hợp lệ: ${postId}`, ERROR_CODES.BAD_REQUEST);
      }
      throw new AppError(MESSAGES.POST_UPDATE_FAILED || 'Cập nhật trạng thái xuất bản thất bại', ERROR_CODES.POST.UPDATE_FAILED);
    }
  }

  // Override getAllPosts để admin có thể xem tất cả, user chỉ xem published
  async getAllPosts(options = {}, userRole = null) {
    const { page = 1, limit = 10, sort = { createdAt: -1 }, filter = {} } = options;

    const query = {};

    // Nếu không phải admin, chỉ lấy bài viết đã được xuất bản
    if (userRole !== ROLES.ADMIN) {
      query.isPublished = true;
    }

    if (filter.title) {
      query.title = { $regex: filter.title, $options: 'i' };
    }
    if (filter.author) {
      query.author = filter.author;
    }
    if (filter.isPublished !== undefined && userRole === ROLES.ADMIN) {
      query.isPublished = filter.isPublished;
    }

    try {
      const posts = await Post.find(query)
        .populate('author', 'name email')
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

      const totalPosts = await Post.countDocuments(query);
      const totalPages = Math.ceil(totalPosts / parseInt(limit));

      return {
        data: posts,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: totalPosts,
          itemsPerPage: parseInt(limit),
        },
      };
    } catch (error) {
      throw new AppError(MESSAGES.POST_RETRIEVAL_FAILED || 'Lấy danh sách bài viết thất bại', ERROR_CODES.INTERNAL_ERROR);
    }
  }

  /**
   * Get all posts using new Query Middleware
   * @param {Object} queryParams - Query parameters from request
   * @param {String} userRole - User role to determine access level
   * @returns {Object} Query results with pagination
   */
  async getAllPostsWithQuery(queryParams, userRole) {
    try {
      // Nếu không phải admin, chỉ show published posts
      if (userRole !== ROLES.ADMIN) {
        queryParams.isPublished = 'true';
      }

      // Sử dụng QueryUtils với pre-configured setup cho Post
      const result = await QueryUtils.getPosts(Post, queryParams);
      
      return result;
    } catch (error) {
      throw new AppError(
        `Error fetching posts: ${error.message}`,
        ERROR_CODES.POST?.FETCH_FAILED || 'POST_FETCH_FAILED',
        500
      );
    }
  }
}

module.exports = PostService;
