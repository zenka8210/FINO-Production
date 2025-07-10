const BaseService = require('./baseService');
const Review = require('../models/ReviewSchema');
const Order = require('../models/OrderSchema');
const { AppError } = require('../middlewares/errorHandler');
const { MESSAGES, ERROR_CODES } = require('../config/constants');

class ReviewService extends BaseService {
  constructor() {
    super(Review);
  }

  // Get reviews for a product
  async getProductReviews(productId, options = {}) {
    const { page = 1, limit = 10 } = options;
    
    return await this.getAll({
      page,
      limit,
      filter: { product: productId },
      populate: 'user',
      sort: { createdAt: -1 }
    });
  }

  // Check if user can review a product (must have delivered order containing the product)
  async canUserReview(userId, productId) {
    // Check if user has delivered order with this product
    const ProductVariant = require('../models/ProductVariantSchema');
    const variants = await ProductVariant.find({ product: productId }).select('_id');
    const variantIds = variants.map(v => v._id);

    const order = await Order.findOne({
      user: userId,
      status: 'delivered',
      'items.productVariant': { $in: variantIds }
    });

    if (!order) {
      return { canReview: false, reason: 'Bạn cần mua và nhận sản phẩm mới có thể đánh giá' };
    }

    // Check if user has already reviewed this product
    const existingReview = await this.Model.findOne({
      user: userId,
      product: productId
    });

    if (existingReview) {
      return { canReview: false, reason: 'Bạn đã đánh giá sản phẩm này rồi' };
    }

    return { canReview: true };
  }

  // Create review with purchase validation
  async createReview(userId, reviewData) {
    const { product: productId } = reviewData;
    
    // Validate that user can review this product
    const canReview = await this.canUserReview(userId, productId);
    if (!canReview.canReview) {
      throw new AppError(canReview.reason, ERROR_CODES.FORBIDDEN);
    }

    return await this.create({
      user: userId,
      ...reviewData
    });
  }

  // Update user's own review
  async updateUserReview(reviewId, userId, updateData) {
    const review = await this.Model.findOne({ _id: reviewId, user: userId });
    if (!review) {
      throw new AppError('Đánh giá không tồn tại', 404);
    }
    
    return await this.updateById(reviewId, updateData);
  }

  // Delete user's own review
  async deleteUserReview(reviewId, userId) {
    const review = await this.Model.findOne({ _id: reviewId, user: userId });
    if (!review) {
      throw new AppError('Đánh giá không tồn tại', 404);
    }
    
    return await this.deleteById(reviewId);
  }
}

module.exports = ReviewService;
