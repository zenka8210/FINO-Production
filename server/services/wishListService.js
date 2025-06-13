const BaseService = require('./baseService');
const WishList = require('../models/WishListSchema');
const { AppError } = require('../middlewares/errorHandler');

class WishListService extends BaseService {
  constructor() {
    super(WishList);
  }

  // Get user wishlist
  async getUserWishList(userId) {
    return await this.Model.find({ user: userId })
      .populate('product')
      .sort({ createdAt: -1 });
  }

  // Add to wishlist
  async addToWishList(userId, productId) {
    // Check if already exists
    const existing = await this.Model.findOne({ user: userId, product: productId });
    if (existing) {
      throw new AppError('Sản phẩm đã có trong wishlist', 400);
    }

    return await this.create({
      user: userId,
      product: productId
    });
  }
  // Remove from wishlist
  async removeFromWishList(userId, productId) {
    const item = await this.Model.findOne({ user: userId, product: productId });
    if (!item) {
      throw new AppError('Sản phẩm không có trong wishlist', 404);
    }

    return await this.deleteById(item._id);
  }

  // Clear user's entire wishlist
  async clearWishList(userId) {
    return await this.Model.deleteMany({ user: userId });
  }

  // Check if product is in wishlist
  async isInWishList(userId, productId) {
    const item = await this.Model.findOne({ user: userId, product: productId });
    return !!item;
  }

  // Add multiple products to wishlist
  async addMultipleToWishList(userId, productIds) {
    const results = [];
    for (const productId of productIds) {
      try {
        const existing = await this.Model.findOne({ user: userId, product: productId });
        if (!existing) {
          const item = await this.create({ user: userId, product: productId });
          results.push(item);
        }
      } catch (error) {
        // Continue with other products if one fails
        continue;
      }
    }
    return results;
  }

  // Get wishlist count for user
  async getWishListCount(userId) {
    return await this.Model.countDocuments({ user: userId });
  }

  // Get wishlist statistics (admin)
  async getWishListStats() {
    const [totalItems, totalUsers, topProducts] = await Promise.all([
      this.Model.countDocuments(),
      this.Model.distinct('user').then(users => users.length),
      this.Model.aggregate([
        { $group: { _id: '$product', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } }
      ])
    ]);

    return {
      totalItems,
      totalUsers,
      topProducts
    };
  }

  // Get all wishlists (admin)
  async getAllWishLists(options = {}) {
    return await this.getAll({
      ...options,
      populate: 'user product'
    });
  }
}

module.exports = WishListService;
