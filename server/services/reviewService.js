const Review = require('../models/reviewSchema');
const Product = require('../models/productSchema');
const User = require('../models/userSchema');
const { MESSAGES, ERROR_CODES } = require('../config/constants');
const { AppError } = require('../middlewares/errorHandler');
const LoggerService = require('./loggerService');

class ReviewService {
  constructor() {
    this.logger = LoggerService;
  }

  /**
   * Tạo đánh giá mới
   * @param {Object} reviewData - Dữ liệu đánh giá
   * @param {string} userId - ID người dùng
   * @returns {Promise<Object>} - Đánh giá được tạo
   */
  async createReview(reviewData, userId) {
    try {
      const { product, rating, comment, images } = reviewData;

      // Kiểm tra sản phẩm tồn tại
      const productExists = await Product.findById(product);
      if (!productExists) {
        throw new AppError(MESSAGES.ERROR.PRODUCT_NOT_FOUND, 404, ERROR_CODES.NOT_FOUND);
      }

      // Kiểm tra người dùng đã đánh giá sản phẩm này chưa
      const existingReview = await Review.findOne({ product, user: userId });
      if (existingReview) {
        throw new AppError(
          'Bạn đã đánh giá sản phẩm này rồi', 
          409, 
          ERROR_CODES.DUPLICATE_ENTRY
        );
      }

      // TODO: Kiểm tra người dùng đã mua sản phẩm này chưa
      // const Order = require('../models/orderSchema');
      // const hasPurchased = await Order.findOne({
      //   user: userId,
      //   'items.product': product,
      //   status: 'delivered'
      // });
      // if (!hasPurchased) {
      //   throw new AppError(
      //     'Bạn chỉ có thể đánh giá sản phẩm đã mua', 
      //     400, 
      //     ERROR_CODES.PERMISSION_DENIED
      //   );
      // }

      const review = new Review({
        product,
        user: userId,
        rating,
        comment: comment?.trim(),
        images: images || [],
        approved: false // Đánh giá cần được duyệt
      });

      const savedReview = await review.save();
      
      // Populate thông tin user và product
      await savedReview.populate([
        { path: 'user', select: 'username full_name avatar' },
        { path: 'product', select: 'name images' }
      ]);

      // Cập nhật rating trung bình của sản phẩm
      await this.updateProductRating(product);

      this.logger.info(`Đánh giá mới được tạo cho sản phẩm ${product}`, {
        reviewId: savedReview._id,
        userId,
        rating
      });

      return {
        message: MESSAGES.SUCCESS.REVIEW_CREATED,
        review: savedReview
      };
    } catch (error) {
      this.logger.error('Lỗi khi tạo đánh giá:', error);
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError(MESSAGES.ERROR.REVIEW_CREATE_FAILED, 500, ERROR_CODES.INTERNAL_ERROR);
    }
  }

  /**
   * Lấy đánh giá của sản phẩm
   * @param {string} productId - ID sản phẩm
   * @param {Object} options - Tùy chọn phân trang và lọc
   * @returns {Promise<Object>} - Danh sách đánh giá
   */
  async getProductReviews(productId, options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        rating = null,
        approved = true
      } = options;

      const skip = (page - 1) * limit;
      let query = { product: productId };

      // Lọc theo rating
      if (rating) {
        query.rating = rating;
      }

      // Lọc theo trạng thái duyệt
      if (approved !== null) {
        query.approved = approved;
      }

      const [reviews, total, stats] = await Promise.all([
        Review.find(query)
          .populate('user', 'username full_name avatar')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Review.countDocuments(query),
        this.getReviewStats(productId)
      ]);

      return {
        message: MESSAGES.SUCCESS.DATA_RETRIEVED,
        reviews,
        stats,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          limit
        }
      };
    } catch (error) {
      this.logger.error(`Lỗi khi lấy đánh giá sản phẩm ${productId}:`, error);
      throw new AppError(MESSAGES.ERROR.DATA_RETRIEVE_FAILED, 500, ERROR_CODES.INTERNAL_ERROR);
    }
  }

  /**
   * Lấy thống kê đánh giá của sản phẩm
   * @param {string} productId - ID sản phẩm
   * @returns {Promise<Object>} - Thống kê đánh giá
   */
  async getReviewStats(productId) {
    try {
      const stats = await Review.aggregate([
        { $match: { product: productId, approved: true } },
        {
          $group: {
            _id: null,
            totalReviews: { $sum: 1 },
            averageRating: { $avg: '$rating' },
            ratingDistribution: {
              $push: '$rating'
            }
          }
        }
      ]);

      if (stats.length === 0) {
        return {
          totalReviews: 0,
          averageRating: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        };
      }

      // Tính phân bố rating
      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      stats[0].ratingDistribution.forEach(rating => {
        distribution[rating]++;
      });

      return {
        totalReviews: stats[0].totalReviews,
        averageRating: Math.round(stats[0].averageRating * 10) / 10,
        ratingDistribution: distribution
      };
    } catch (error) {
      this.logger.error(`Lỗi khi lấy thống kê đánh giá ${productId}:`, error);
      throw new AppError(MESSAGES.ERROR.DATA_RETRIEVE_FAILED, 500, ERROR_CODES.INTERNAL_ERROR);
    }
  }

  /**
   * Lấy đánh giá của người dùng
   * @param {string} userId - ID người dùng
   * @param {Object} options - Tùy chọn phân trang
   * @returns {Promise<Object>} - Danh sách đánh giá của người dùng
   */
  async getUserReviews(userId, options = {}) {
    try {
      const { page = 1, limit = 10 } = options;
      const skip = (page - 1) * limit;

      const [reviews, total] = await Promise.all([
        Review.find({ user: userId })
          .populate('product', 'name images variants')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Review.countDocuments({ user: userId })
      ]);

      return {
        message: MESSAGES.SUCCESS.DATA_RETRIEVED,
        reviews,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          limit
        }
      };
    } catch (error) {
      this.logger.error(`Lỗi khi lấy đánh giá của người dùng ${userId}:`, error);
      throw new AppError(MESSAGES.ERROR.DATA_RETRIEVE_FAILED, 500, ERROR_CODES.INTERNAL_ERROR);
    }
  }

  /**
   * Cập nhật đánh giá
   * @param {string} reviewId - ID đánh giá
   * @param {Object} updateData - Dữ liệu cập nhật
   * @param {string} userId - ID người dùng
   * @returns {Promise<Object>} - Đánh giá được cập nhật
   */
  async updateReview(reviewId, updateData, userId) {
    try {
      const review = await Review.findById(reviewId);
      
      if (!review) {
        throw new AppError(MESSAGES.ERROR.REVIEW_NOT_FOUND, 404, ERROR_CODES.NOT_FOUND);
      }

      // Kiểm tra quyền sở hữu
      if (review.user.toString() !== userId) {
        throw new AppError(MESSAGES.ERROR.ACCESS_DENIED, 403, ERROR_CODES.FORBIDDEN);
      }

      // Cập nhật các trường được phép
      if (updateData.rating !== undefined) {
        review.rating = updateData.rating;
      }
      if (updateData.comment !== undefined) {
        review.comment = updateData.comment?.trim();
      }
      if (updateData.images !== undefined) {
        review.images = updateData.images;
      }

      // Đặt lại trạng thái duyệt nếu có thay đổi nội dung
      review.approved = false;

      const updatedReview = await review.save();
      await updatedReview.populate([
        { path: 'user', select: 'username full_name avatar' },
        { path: 'product', select: 'name images' }
      ]);

      // Cập nhật rating trung bình của sản phẩm
      await this.updateProductRating(review.product);

      this.logger.info(`Đánh giá được cập nhật: ${reviewId}`, {
        userId,
        changes: updateData
      });

      return {
        message: MESSAGES.SUCCESS.REVIEW_UPDATED,
        review: updatedReview
      };
    } catch (error) {
      this.logger.error(`Lỗi khi cập nhật đánh giá ${reviewId}:`, error);
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError(MESSAGES.ERROR.REVIEW_UPDATE_FAILED, 500, ERROR_CODES.INTERNAL_ERROR);
    }
  }

  /**
   * Xóa đánh giá
   * @param {string} reviewId - ID đánh giá
   * @param {string} userId - ID người dùng
   * @returns {Promise<Object>} - Kết quả xóa
   */
  async deleteReview(reviewId, userId) {
    try {
      const review = await Review.findById(reviewId);
      
      if (!review) {
        throw new AppError(MESSAGES.ERROR.REVIEW_NOT_FOUND, 404, ERROR_CODES.NOT_FOUND);
      }

      // Kiểm tra quyền sở hữu
      if (review.user.toString() !== userId) {
        throw new AppError(MESSAGES.ERROR.ACCESS_DENIED, 403, ERROR_CODES.FORBIDDEN);
      }

      const productId = review.product;
      await Review.findByIdAndDelete(reviewId);

      // Cập nhật rating trung bình của sản phẩm
      await this.updateProductRating(productId);

      this.logger.info(`Đánh giá được xóa: ${reviewId}`, { userId });

      return {
        message: MESSAGES.SUCCESS.REVIEW_DELETED,
        deletedReview: {
          id: reviewId,
          productId
        }
      };
    } catch (error) {
      this.logger.error(`Lỗi khi xóa đánh giá ${reviewId}:`, error);
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError(MESSAGES.ERROR.REVIEW_DELETE_FAILED, 500, ERROR_CODES.INTERNAL_ERROR);
    }
  }

  /**
   * Duyệt đánh giá (Admin)
   * @param {string} reviewId - ID đánh giá
   * @param {boolean} approved - Trạng thái duyệt
   * @returns {Promise<Object>} - Đánh giá được duyệt
   */
  async approveReview(reviewId, approved) {
    try {
      const review = await Review.findById(reviewId);
      
      if (!review) {
        throw new AppError(MESSAGES.ERROR.REVIEW_NOT_FOUND, 404, ERROR_CODES.NOT_FOUND);
      }

      review.approved = approved;
      const updatedReview = await review.save();
      
      await updatedReview.populate([
        { path: 'user', select: 'username full_name avatar' },
        { path: 'product', select: 'name images' }
      ]);

      // Cập nhật rating trung bình của sản phẩm
      await this.updateProductRating(review.product);

      this.logger.info(`Đánh giá ${approved ? 'được duyệt' : 'bị từ chối'}: ${reviewId}`);

      return {
        message: approved ? MESSAGES.SUCCESS.REVIEW_APPROVED : MESSAGES.SUCCESS.REVIEW_REJECTED,
        review: updatedReview
      };
    } catch (error) {
      this.logger.error(`Lỗi khi duyệt đánh giá ${reviewId}:`, error);
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError(MESSAGES.ERROR.REVIEW_APPROVE_FAILED, 500, ERROR_CODES.INTERNAL_ERROR);
    }
  }

  /**
   * Lấy đánh giá chờ duyệt (Admin)
   * @param {Object} options - Tùy chọn phân trang
   * @returns {Promise<Object>} - Danh sách đánh giá chờ duyệt
   */
  async getPendingReviews(options = {}) {
    try {
      const { page = 1, limit = 10 } = options;
      const skip = (page - 1) * limit;

      const [reviews, total] = await Promise.all([
        Review.find({ approved: false })
          .populate('user', 'username full_name avatar')
          .populate('product', 'name images')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Review.countDocuments({ approved: false })
      ]);

      return {
        message: MESSAGES.SUCCESS.DATA_RETRIEVED,
        reviews,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          limit
        }
      };
    } catch (error) {
      this.logger.error('Lỗi khi lấy đánh giá chờ duyệt:', error);
      throw new AppError(MESSAGES.ERROR.DATA_RETRIEVE_FAILED, 500, ERROR_CODES.INTERNAL_ERROR);
    }
  }

  /**
   * Cập nhật rating trung bình của sản phẩm
   * @param {string} productId - ID sản phẩm
   */
  async updateProductRating(productId) {
    try {
      const stats = await this.getReviewStats(productId);
      
      await Product.findByIdAndUpdate(productId, {
        'rating.average': stats.averageRating,
        'rating.count': stats.totalReviews
      });
      
      this.logger.debug(`Cập nhật rating sản phẩm ${productId}:`, {
        average: stats.averageRating,
        count: stats.totalReviews
      });
    } catch (error) {
      this.logger.error(`Lỗi khi cập nhật rating sản phẩm ${productId}:`, error);
      // Không throw error để không ảnh hưởng đến luồng chính
    }
  }
}

module.exports = ReviewService;