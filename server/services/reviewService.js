const BaseService = require('./baseService');
const Review = require('../models/ReviewSchema');
const { AppError } = require('../middlewares/errorHandler');

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

  // Create review with user check
  async createReview(userId, reviewData) {
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
