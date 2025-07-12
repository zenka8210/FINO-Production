const BaseService = require('./baseService');
const WishList = require('../models/WishListSchema');
const { AppError } = require('../middlewares/errorHandler');

class WishListService extends BaseService {
  constructor() {
    super(WishList);
  }

  // Get user wishlist with full validation
  async getUserWishList(userId) {
    return await WishList.findOrCreateUserWishList(userId);
  }

  // Add item to wishlist with business rules
  async addToWishList(userId, productId, variantId = null) {
    // Validate item addition
    await WishList.validateItemAddition(productId, variantId);
    
    // Get or create wishlist
    const wishlist = await WishList.findOrCreateUserWishList(userId);
    
    // Check for duplicates
    const existingItem = wishlist.items.find(item => {
      const sameProduct = item.product._id.toString() === productId.toString();
      const sameVariant = (!variantId && !item.variant) || 
                         (variantId && item.variant && item.variant._id.toString() === variantId.toString());
      return sameProduct && sameVariant;
    });
    
    if (existingItem) {
      throw new AppError('Sản phẩm đã có trong wishlist', 400);
    }
    
    // Add new item
    const newItem = {
      product: productId,
      variant: variantId || null,
      addedAt: new Date()
    };
    
    wishlist.items.push(newItem);
    await wishlist.save();
    
    // Return populated wishlist
    return await WishList.findOrCreateUserWishList(userId);
  }

  // Remove item from wishlist
  async removeFromWishList(userId, productId, variantId = null) {
    const wishlist = await WishList.findOrCreateUserWishList(userId);
    
    const itemIndex = wishlist.items.findIndex(item => {
      const sameProduct = item.product._id.toString() === productId.toString();
      const sameVariant = (!variantId && !item.variant) || 
                         (variantId && item.variant && item.variant._id.toString() === variantId.toString());
      return sameProduct && sameVariant;
    });
    
    if (itemIndex === -1) {
      throw new AppError('Sản phẩm không có trong wishlist', 404);
    }
    
    wishlist.items.splice(itemIndex, 1);
    await wishlist.save();
    
    return await WishList.findOrCreateUserWishList(userId);
  }

  // Toggle item in wishlist
  async toggleWishList(userId, productId, variantId = null) {
    const wishlist = await WishList.findOrCreateUserWishList(userId);
    
    const existingItem = wishlist.items.find(item => {
      const sameProduct = item.product._id.toString() === productId.toString();
      const sameVariant = (!variantId && !item.variant) || 
                         (variantId && item.variant && item.variant._id.toString() === variantId.toString());
      return sameProduct && sameVariant;
    });
    
    if (existingItem) {
      return await this.removeFromWishList(userId, productId, variantId);
    } else {
      return await this.addToWishList(userId, productId, variantId);
    }
  }

  // Check if item is in wishlist
  async isInWishList(userId, productId, variantId = null) {
    const wishlist = await WishList.findOne({ user: userId });
    if (!wishlist) return false;
    
    return wishlist.items.some(item => {
      const sameProduct = item.product.toString() === productId.toString();
      const sameVariant = (!variantId && !item.variant) || 
                         (variantId && item.variant && item.variant.toString() === variantId.toString());
      return sameProduct && sameVariant;
    });
  }

  // Get wishlist count
  async getWishListCount(userId) {
    const wishlist = await WishList.findOne({ user: userId });
    return wishlist ? wishlist.items.length : 0;
  }

  // Clear user's entire wishlist
  async clearWishList(userId) {
    const wishlist = await WishList.findOrCreateUserWishList(userId);
    wishlist.items = [];
    await wishlist.save();
    return await WishList.findOrCreateUserWishList(userId);
  }

  // Add multiple items to wishlist
  async addMultipleToWishList(userId, items) {
    const results = [];
    const errors = [];
    
    for (const item of items) {
      try {
        const { productId, variantId } = item;
        await this.addToWishList(userId, productId, variantId);
        results.push({ productId, variantId, success: true });
      } catch (error) {
        errors.push({ productId: item.productId, variantId: item.variantId, error: error.message });
      }
    }
    
    const wishlist = await WishList.findOrCreateUserWishList(userId);
    return { wishlist, results, errors };
  }

  // Get wishlist statistics (for admin)
  async getWishListStats() {
    const stats = await WishList.aggregate([
      {
        $group: {
          _id: null,
          totalWishlists: { $sum: 1 },
          totalItems: { $sum: { $size: '$items' } },
          avgItemsPerWishlist: { $avg: { $size: '$items' } }
        }
      }
    ]);
    
    const topProducts = await WishList.aggregate([
      { $unwind: '$items' },
      { 
        $group: {
          _id: '$items.product',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          productId: '$_id',
          productName: '$product.name',
          wishlistCount: '$count'
        }
      }
    ]);
    
    return {
      overview: stats[0] || { totalWishlists: 0, totalItems: 0, avgItemsPerWishlist: 0 },
      topProducts
    };
  }

  // Admin: Get all wishlists with pagination
  async getAllWishLists(options = {}) {
    const { page = 1, limit = 20, userId } = options;
    const skip = (page - 1) * limit;
    
    const filter = {};
    if (userId) filter.user = userId;
    
    const wishlists = await WishList.find(filter)
      .populate([
        {
          path: 'user',
          select: 'name email'
        },
        {
          path: 'items.product',
          select: 'name price images'
        },
        {
          path: 'items.variant',
          select: 'price stock color size'
        }
      ])
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await WishList.countDocuments(filter);
    
    return {
      wishlists,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }
}

module.exports = WishListService;
