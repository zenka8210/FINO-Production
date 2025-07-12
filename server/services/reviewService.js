const BaseService = require('./baseService');
const Review = require('../models/ReviewSchema');
const Order = require('../models/OrderSchema');
const mongoose = require('mongoose');
const { AppError } = require('../middlewares/errorHandler');
const { MESSAGES, ERROR_CODES } = require('../config/constants');

class ReviewService extends BaseService {
  constructor() {
    super(Review);
  }

  // Get reviews for a product
  async getProductReviews(productId, options = {}) {
    const { page = 1, limit = 10, rating, sort = { createdAt: -1 } } = options;
    
    const filter = { product: productId };
    if (rating) filter.rating = rating;
    
    return await this.getAll({
      page,
      limit,
      filter,
      populate: 'user order',
      sort
    });
  }

  // Get product rating statistics
  async getProductRatingStats(productId) {
    const stats = await this.Model.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(productId) } },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          ratingDistribution: {
            $push: {
              $switch: {
                branches: [
                  { case: { $eq: ['$rating', 1] }, then: '1' },
                  { case: { $eq: ['$rating', 2] }, then: '2' },
                  { case: { $eq: ['$rating', 3] }, then: '3' },
                  { case: { $eq: ['$rating', 4] }, then: '4' },
                  { case: { $eq: ['$rating', 5] }, then: '5' }
                ]
              }
            }
          }
        }
      }
    ]);

    if (stats.length === 0) {
      return {
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }
      };
    }

    // Count rating distribution
    const distribution = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
    stats[0].ratingDistribution.forEach(rating => {
      if (rating) distribution[rating]++;
    });

    return {
      totalReviews: stats[0].totalReviews,
      averageRating: Math.round(stats[0].averageRating * 10) / 10,
      ratingDistribution: distribution
    };
  }

  // Get user's reviews
  async getUserReviews(userId, options = {}) {
    const { page = 1, limit = 10 } = options;
    
    return await this.getAll({
      page,
      limit,
      filter: { user: userId },
      populate: 'product order',
      sort: { createdAt: -1 }
    });
  }

  // Check if user can review a product in a specific order
  async canUserReview(userId, productId, orderId = null) {
    let canReviewReasons = [];

    // If orderId is provided, check that specific order
    if (orderId) {
      const order = await Order.findOne({
        _id: orderId,
        user: userId,
        status: 'delivered'
      }).populate('items.productVariant');

      if (!order) {
        return { 
          canReview: false, 
          reason: 'Đơn hàng không tồn tại hoặc chưa được giao' 
        };
      }

      // Check if product is in this order
      const ProductVariant = require('../models/ProductVariantSchema');
      const variants = await ProductVariant.find({ product: productId }).select('_id');
      const variantIds = variants.map(v => v._id.toString());
      
      const hasProduct = order.items.some(item => 
        variantIds.includes(item.productVariant.toString())
      );

      if (!hasProduct) {
        return { 
          canReview: false, 
          reason: 'Sản phẩm này không có trong đơn hàng' 
        };
      }

      // Check if already reviewed for this order
      const existingReview = await this.Model.findOne({
        user: userId,
        product: productId,
        order: orderId
      });

      if (existingReview) {
        return { 
          canReview: false, 
          reason: 'Bạn đã đánh giá sản phẩm này cho đơn hàng này rồi',
          existingReview
        };
      }

      return { canReview: true, order };
    }

    // If no orderId provided, find all eligible orders
    const ProductVariant = require('../models/ProductVariantSchema');
    const variants = await ProductVariant.find({ product: productId }).select('_id');
    const variantIds = variants.map(v => v._id);

    const eligibleOrders = await Order.find({
      user: userId,
      status: 'delivered',
      'items.productVariant': { $in: variantIds }
    });

    if (eligibleOrders.length === 0) {
      return { 
        canReview: false, 
        reason: 'Bạn cần mua và nhận sản phẩm mới có thể đánh giá' 
      };
    }

    // Check which orders haven't been reviewed yet
    const reviewedOrders = await this.Model.find({
      user: userId,
      product: productId
    }).select('order');

    const reviewedOrderIds = reviewedOrders.map(r => r.order.toString());
    const availableOrders = eligibleOrders.filter(order => 
      !reviewedOrderIds.includes(order._id.toString())
    );

    if (availableOrders.length === 0) {
      return { 
        canReview: false, 
        reason: 'Bạn đã đánh giá sản phẩm này cho tất cả đơn hàng của mình' 
      };
    }

    return { 
      canReview: true, 
      availableOrders,
      message: `Bạn có thể đánh giá sản phẩm này cho ${availableOrders.length} đơn hàng`
    };
  }

  // Create review with strict validation
  async createReview(userId, reviewData) {
    const { product: productId, order: orderId, rating, comment } = reviewData;
    
    if (!orderId) {
      throw new AppError('ID đơn hàng là bắt buộc', ERROR_CODES.BAD_REQUEST);
    }

    // Validate that user can review this product for this order
    const canReview = await this.canUserReview(userId, productId, orderId);
    if (!canReview.canReview) {
      throw new AppError(canReview.reason, ERROR_CODES.FORBIDDEN);
    }

    return await this.create({
      user: userId,
      product: productId,
      order: orderId,
      rating,
      comment
    });
  }

  // Update user's own review (with 48h limit)
  async updateUserReview(reviewId, userId, updateData) {
    const review = await this.Model.findOne({ _id: reviewId, user: userId });
    if (!review) {
      throw new AppError('Đánh giá không tồn tại hoặc bạn không có quyền chỉnh sửa', ERROR_CODES.NOT_FOUND);
    }
    
    if (!review.canEdit()) {
      throw new AppError('Không thể chỉnh sửa đánh giá sau 48 giờ', ERROR_CODES.FORBIDDEN);
    }
    
    // Only allow updating rating and comment
    const allowedFields = ['rating', 'comment'];
    const filteredData = {};
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredData[key] = updateData[key];
      }
    });
    
    return await this.updateById(reviewId, filteredData);
  }

  // Delete user's own review (with 48h limit)
  async deleteUserReview(reviewId, userId) {
    const review = await this.Model.findOne({ _id: reviewId, user: userId });
    if (!review) {
      throw new AppError('Đánh giá không tồn tại hoặc bạn không có quyền xóa', ERROR_CODES.NOT_FOUND);
    }
    
    if (!review.canEdit()) {
      throw new AppError('Không thể xóa đánh giá sau 48 giờ', ERROR_CODES.FORBIDDEN);
    }
    
    return await this.deleteById(reviewId);
  }

  // Admin: Delete any review
  async adminDeleteReview(reviewId) {
    const review = await this.getById(reviewId);
    if (!review) {
      throw new AppError('Đánh giá không tồn tại', ERROR_CODES.NOT_FOUND);
    }
    
    return await this.deleteById(reviewId);
  }

  // Get pending reviews (if approval system is needed)
  async getPendingReviews(options = {}) {
    const { page = 1, limit = 20 } = options;
    
    return await this.getAll({
      page,
      limit,
      filter: { isApproved: false },
      populate: 'user product order',
      sort: { createdAt: -1 }
    });
  }

  // Get review statistics
  async getReviewStats() {
    const stats = await this.Model.aggregate([
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          ratingCounts: {
            $push: '$rating'
          }
        }
      }
    ]);

    if (stats.length === 0) {
      return {
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }
      };
    }

    // Count rating distribution
    const distribution = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
    stats[0].ratingCounts.forEach(rating => {
      distribution[rating.toString()]++;
    });

    return {
      totalReviews: stats[0].totalReviews,
      averageRating: Math.round(stats[0].averageRating * 10) / 10,
      ratingDistribution: distribution
    };
  }

  // Get reviews by user for admin
  async getReviewsByUser(userId, options = {}) {
    const { page = 1, limit = 20 } = options;
    
    return await this.getAll({
      page,
      limit,
      filter: { user: userId },
      populate: 'product order',
      sort: { createdAt: -1 }
    });
  }
}

module.exports = ReviewService;
