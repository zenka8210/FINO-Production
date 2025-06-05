const BaseController = require('./baseController');
const ReviewService = require('../services/reviewService');
const ResponseHandler = require('../services/responseHandler');

class ReviewController extends BaseController {
  constructor() {
    super();
    this.reviewService = new ReviewService();
  }

  /**
   * Tạo đánh giá mới
   */
  createReview = async (req, res, next) => {
    try {
      const userId = req.user.id;
      const reviewData = req.body;

      const result = await this.reviewService.createReview(reviewData, userId);
      ResponseHandler.created(res, result.message, {
        review: result.review
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Lấy đánh giá của sản phẩm
   */
  getProductReviews = async (req, res, next) => {
    try {
      const { productId } = req.params;
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        rating: req.query.rating ? parseInt(req.query.rating) : null,
        approved: req.query.approved !== 'false'
      };

      const result = await this.reviewService.getProductReviews(productId, options);
      ResponseHandler.success(res, result.message, {
        reviews: result.reviews,
        stats: result.stats,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Lấy thống kê đánh giá của sản phẩm
   */
  getProductReviewStats = async (req, res, next) => {
    try {
      const { productId } = req.params;
      const stats = await this.reviewService.getReviewStats(productId);
      
      ResponseHandler.success(res, 'Lấy thống kê đánh giá thành công', { stats });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Lấy đánh giá của người dùng
   */
  getUserReviews = async (req, res, next) => {
    try {
      const userId = req.user.id;
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10
      };

      const result = await this.reviewService.getUserReviews(userId, options);
      ResponseHandler.success(res, result.message, {
        reviews: result.reviews,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Lấy đánh giá theo ID
   */
  getReviewById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const review = await Review.findById(id)
        .populate('user', 'username full_name avatar')
        .populate('product', 'name images');

      if (!review) {
        return ResponseHandler.notFound(res, 'Không tìm thấy đánh giá');
      }

      ResponseHandler.success(res, 'Lấy đánh giá thành công', { review });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Cập nhật đánh giá
   */
  updateReview = async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const updateData = req.body;

      const result = await this.reviewService.updateReview(id, updateData, userId);
      ResponseHandler.success(res, result.message, {
        review: result.review
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Xóa đánh giá
   */
  deleteReview = async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await this.reviewService.deleteReview(id, userId);
      ResponseHandler.success(res, result.message, {
        deletedReview: result.deletedReview
      });
    } catch (error) {
      next(error);
    }
  };

  // Admin methods

  /**
   * Lấy đánh giá chờ duyệt (Admin)
   */
  getPendingReviews = async (req, res, next) => {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10
      };

      const result = await this.reviewService.getPendingReviews(options);
      ResponseHandler.success(res, result.message, {
        reviews: result.reviews,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Duyệt đánh giá (Admin)
   */
  approveReview = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { approved } = req.body;

      const result = await this.reviewService.approveReview(id, approved);
      ResponseHandler.success(res, result.message, {
        review: result.review
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Lấy tất cả đánh giá (Admin)
   */
  getAllReviews = async (req, res, next) => {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        approved: req.query.approved ? req.query.approved === 'true' : null
      };

      // Admin có thể xem tất cả đánh giá
      const Review = require('../models/reviewSchema');
      const skip = (options.page - 1) * options.limit;
      let query = {};

      if (options.approved !== null) {
        query.approved = options.approved;
      }

      const [reviews, total] = await Promise.all([
        Review.find(query)
          .populate('user', 'username full_name avatar')
          .populate('product', 'name images')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(options.limit),
        Review.countDocuments(query)
      ]);

      ResponseHandler.success(res, 'Lấy danh sách đánh giá thành công', {
        reviews,
        pagination: {
          currentPage: options.page,
          totalPages: Math.ceil(total / options.limit),
          totalItems: total,
          limit: options.limit
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Xóa đánh giá (Admin)
   */
  adminDeleteReview = async (req, res, next) => {
    try {
      const { id } = req.params;
      const Review = require('../models/reviewSchema');
      
      const review = await Review.findById(id);
      if (!review) {
        return ResponseHandler.notFound(res, 'Không tìm thấy đánh giá');
      }

      const productId = review.product;
      await Review.findByIdAndDelete(id);

      // Cập nhật rating của sản phẩm
      await this.reviewService.updateProductRating(productId);

      ResponseHandler.success(res, 'Xóa đánh giá thành công', {
        deletedReview: { id, productId }
      });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new ReviewController();