const BaseController = require('./baseController');
const ReviewService = require('../services/reviewService');
const Review = require('../models/ReviewSchema');
const ResponseHandler = require('../services/responseHandler');
const { QueryUtils } = require('../utils/queryUtils');
const { PAGINATION } = require('../config/constants');
const AdminSortUtils = require('../utils/adminSortUtils');

class ReviewController extends BaseController {
  constructor() {
    super(new ReviewService());
  }

  // Lấy reviews theo sản phẩm
  getProductReviews = async (req, res, next) => {
    try {
      const { productId } = req.params;
      
      // Thêm productId vào query params để filter
      const queryParams = { ...req.query, product: productId };
      
      // Sử dụng Query Middleware mới
      const result = await this.service.getProductReviewsWithQuery(queryParams);
      ResponseHandler.success(res, 'Lấy đánh giá sản phẩm thành công', result);
    } catch (error) {
      next(error);
    }
  };

  // Giữ lại method cũ để backward compatibility
  getProductReviewsLegacy = async (req, res, next) => {
    try {
      const { productId } = req.params;
      const { page, limit, rating, sort } = req.query;

      const options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        rating: rating ? parseInt(rating) : undefined,
        sort: sort ? JSON.parse(sort) : { createdAt: -1 }
      };

      const result = await this.service.getProductReviews(productId, options);
      ResponseHandler.success(res, 'Lấy đánh giá sản phẩm thành công', result);
    } catch (error) {
      next(error);
    }
  };

  // Lấy thống kê rating sản phẩm
  getProductReviewStats = async (req, res, next) => {
    try {
      const { productId } = req.params;
      const stats = await this.service.getProductRatingStats(productId);
      ResponseHandler.success(res, 'Lấy thống kê đánh giá thành công', stats);
    } catch (error) {
      next(error);
    }
  };

  // Lấy reviews của user hiện tại
  getUserReviews = async (req, res, next) => {
    try {
      // Use new QueryBuilder if available
      if (req.createQueryBuilder) {
        const queryBuilder = req.createQueryBuilder(Review);
        
        // Add user filter to only get current user's reviews
        const userFilter = { user: req.user._id };
        
        const result = await queryBuilder
          .setBaseFilter(userFilter)
          .search(['comment'])
          .applyFilters({
            productId: { type: 'objectId', field: 'product' },
            orderId: { type: 'objectId', field: 'order' },
            rating: { type: 'exact' },
            minRating: { type: 'range', field: 'rating', operator: 'gte' },
            maxRating: { type: 'range', field: 'rating', operator: 'lte' }
          })
          .populateFields()
          .execute();
        
        ResponseHandler.success(res, 'Lấy đánh giá của bạn thành công', result);
      } else {
        // Fallback to legacy method
        const { page, limit } = req.query;
        const options = {
          page: parseInt(page) || 1,
          limit: parseInt(limit) || 10
        };

        const result = await this.service.getUserReviews(req.user._id, options);
        ResponseHandler.success(res, 'Lấy đánh giá của bạn thành công', result);
      }
    } catch (error) {
      next(error);
    }
  };

  // Tạo review mới
  createReview = async (req, res, next) => {
    try {
      const review = await this.service.createReview(req.user._id, req.body);
      ResponseHandler.created(res, 'Tạo đánh giá thành công', review);
    } catch (error) {
      next(error);
    }
  };

  // Cập nhật review
  updateReview = async (req, res, next) => {
    try {
      const review = await this.service.updateUserReview(req.params.id, req.user._id, req.body);
      ResponseHandler.success(res, 'Cập nhật đánh giá thành công', review);
    } catch (error) {
      next(error);
    }
  };

  // Xóa review
  deleteReview = async (req, res, next) => {
    try {
      await this.service.deleteUserReview(req.params.id, req.user._id);
      ResponseHandler.success(res, 'Xóa đánh giá thành công');
    } catch (error) {
      next(error);
    }
  };

  // Kiểm tra có thể review không
  canReviewProduct = async (req, res, next) => {
    try {
      const { productId } = req.params;
      const { orderId } = req.query; // Optional order ID
      const result = await this.service.canUserReview(req.user._id, productId, orderId);
      ResponseHandler.success(res, 'Kiểm tra quyền đánh giá thành công', result);
    } catch (error) {
      next(error);
    }
  };

  // Admin: Lấy tất cả reviews
  getAllReviews = async (req, res, next) => {
    try {
      // Force use service method for better search functionality
      const queryOptions = {
        page: parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE,
        limit: parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT,
        productId: req.query.productId,
        userId: req.query.userId,
        rating: req.query.rating ? parseInt(req.query.rating) : undefined,
        sortBy: req.query.sortBy || 'createdAt',
        sortOrder: req.query.sortOrder || 'desc',
        search: req.query.search // Add search support
      };
      
      console.log('🔍 ReviewController.getAllReviews queryOptions:', queryOptions);
      
      const result = await this.service.getAllReviews(queryOptions);
      ResponseHandler.success(res, 'Lấy danh sách đánh giá thành công', result);
    } catch (error) {
      console.error('❌ ReviewController.getAllReviews error:', error.message);
      next(error);
    }
  };

  // Admin: Lấy tất cả reviews - Legacy version (preserved for backward compatibility)
  getAllReviewsLegacy = async (req, res, next) => {
    try {
      const { page, limit, rating, isVerified, product, user } = req.query;
      
      const filter = {};
      if (rating) filter.rating = parseInt(rating);
      if (isVerified !== undefined) filter.isVerified = isVerified === 'true';
      if (product) filter.product = product;
      if (user) filter.user = user;

      const options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        filter,
        populate: 'user product', // Removed productVariant as it's not in Review schema
        sort: AdminSortUtils.ensureAdminSort(req, 'Review')
      };

      const result = await this.service.getAll(options);
      ResponseHandler.success(res, 'Lấy danh sách đánh giá thành công', result);
    } catch (error) {
      next(error);
    }
  };

  // Admin: Lấy reviews chờ duyệt
  getPendingReviews = async (req, res, next) => {
    try {
      const { page, limit } = req.query;
      const options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20
      };

      const result = await this.service.getPendingReviews(options);
      ResponseHandler.success(res, 'Lấy đánh giá chờ duyệt thành công', result);
    } catch (error) {
      next(error);
    }
  };

  // Admin: Duyệt review
  approveReview = async (req, res, next) => {
    try {
      const review = await this.service.approveReview(req.params.id);
      ResponseHandler.success(res, 'Duyệt đánh giá thành công', review);
    } catch (error) {
      next(error);
    }
  };

  // Admin: Xóa review
  adminDeleteReview = async (req, res, next) => {
    try {
      await this.service.adminDeleteReview(req.params.id);
      ResponseHandler.success(res, 'Xóa đánh giá thành công');
    } catch (error) {
      next(error);
    }
  };

  // Admin: Lấy thống kê reviews
  getReviewStats = async (req, res, next) => {
    try {
      const stats = await this.service.getReviewStats();
      ResponseHandler.success(res, 'Lấy thống kê đánh giá thành công', stats);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = ReviewController;
