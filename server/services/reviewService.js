const BaseService = require('./baseService');
const Review = require('../models/ReviewSchema');
const Order = require('../models/OrderSchema');
const mongoose = require('mongoose');
const { AppError } = require('../middlewares/errorHandler');
const { MESSAGES, ERROR_CODES } = require('../config/constants');
const { QueryUtils } = require('../utils/queryUtils');

class ReviewService extends BaseService {
  constructor() {
    super(Review);
  }

  /**
   * Get product reviews using new Query Middleware
   * @param {Object} queryParams - Query parameters from request
   * @returns {Object} Query results with pagination
   */
  async getProductReviewsWithQuery(queryParams) {
    try {
      // Use the correct getAll method instead of non-existent QueryUtils.getReviews
      const options = {
        page: parseInt(queryParams.page) || 1,
        limit: parseInt(queryParams.limit) || 10,
        filter: { product: queryParams.product },
        populate: 'user order product',
        sort: { createdAt: -1 }
      };

      // Add rating filter if specified
      if (queryParams.rating) {
        options.filter.rating = parseInt(queryParams.rating);
      }

      const result = await this.getAll(options);
      
      // Debug: Log the dates of reviews being returned
      if (result.documents && result.documents.length > 0) {
        console.log('🔍 Review dates debug:');
        result.documents.forEach((review, index) => {
          console.log(`Review ${index + 1}: createdAt = ${review.createdAt}, updatedAt = ${review.updatedAt}`);
        });
      }
      
      // Transform response to expected format for frontend
      return {
        data: result.documents, // rename documents to data
        pagination: result.pagination
      };
    } catch (error) {
      throw new AppError(
        `Error fetching reviews: ${error.message}`,
        ERROR_CODES.REVIEW?.FETCH_FAILED || 'REVIEW_FETCH_FAILED',
        500
      );
    }
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
    console.log('🔍 canUserReview called:', { userId, productId, orderId });
    let canReviewReasons = [];

    // If orderId is provided, check that specific order
    if (orderId) {
      const order = await Order.findOne({
        _id: orderId,
        user: userId,
        status: 'delivered'
      }).populate({
        path: 'items.productVariant',
        populate: { path: 'product', select: 'name _id' }
      });

      console.log('📦 Order found:', !!order);
      if (order) {
        console.log('📋 Order items count:', order.items.length);
        console.log('📋 Order items:', order.items.map(item => ({
          variantId: item.productVariant?._id,
          productId: item.productVariant?.product?._id || item.productVariant?.product,
          productName: item.productVariant?.product?.name
        })));
      }

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
      
      console.log('🎯 Target productId:', productId);
      console.log('🔍 Found variants for product:', variantIds);
      
      const hasProduct = order.items.some(item => {
        const itemVariantId = item.productVariant?._id?.toString();
        const found = variantIds.includes(itemVariantId);
        console.log('🔍 Checking item variant:', itemVariantId, 'found:', found);
        return found;
      });

      console.log('✅ Product found in order?', hasProduct);

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
    console.log('🔍 No orderId provided, finding eligible orders...');
    const ProductVariant = require('../models/ProductVariantSchema');
    const variants = await ProductVariant.find({ product: productId }).select('_id');
    const variantIds = variants.map(v => v._id);
    
    console.log('🎯 Target productId:', productId);
    console.log('🔍 Found variants for product:', variantIds.map(v => v.toString()));

    const eligibleOrders = await Order.find({
      user: userId,
      status: 'delivered',
      'items.productVariant': { $in: variantIds }
    });
    
    console.log('📦 Found eligible orders:', eligibleOrders.length);
    eligibleOrders.forEach((order, index) => {
      console.log(`Order ${index + 1}: ${order.orderCode} - Items: ${order.items.length}`);
    });

    if (eligibleOrders.length === 0) {
      console.log('❌ No eligible orders found');
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
    console.log('🔧 createReview called with:', { userId, reviewData });
    
    const { product: productId, order: orderId, rating, comment } = reviewData;
    
    console.log('🔧 Extracted data:', { productId, orderId, rating, comment });
    
    if (!orderId) {
      console.log('❌ No orderId provided');
      throw new AppError('ID đơn hàng là bắt buộc', ERROR_CODES.BAD_REQUEST);
    }

    // Validate that user can review this product for this order
    console.log('🔧 Calling canUserReview with:', { userId, productId, orderId });
    const canReview = await this.canUserReview(userId, productId, orderId);
    console.log('🔧 canUserReview result:', canReview);
    
    if (!canReview.canReview) {
      console.log('❌ Cannot review:', canReview.reason);
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

  // Admin: Approve review
  async approveReview(reviewId) {
    const review = await this.getById(reviewId);
    if (!review) {
      throw new AppError('Đánh giá không tồn tại', ERROR_CODES.NOT_FOUND);
    }
    
    return await this.updateById(reviewId, { isApproved: true });
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

  // Get review statistics - Enhanced version with more comprehensive data
  async getReviewStats() {
    try {
      // Get overall statistics
      const [overallStats] = await this.Model.aggregate([
        {
          $group: {
            _id: null,
            totalReviews: { $sum: 1 },
            averageRating: { $avg: '$rating' },
            ratingCounts: { $push: '$rating' }
          }
        }
      ]);

      // Get top rated products
      const topRatedProducts = await this.Model.aggregate([
        {
          $group: {
            _id: '$product',
            averageRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'productInfo'
          }
        },
        {
          $unwind: '$productInfo'
        },
        {
          $match: {
            totalReviews: { $gte: 2 } // Ít nhất 2 review để có ý nghĩa
          }
        },
        {
          $sort: { averageRating: -1, totalReviews: -1 }
        },
        {
          $limit: 10
        },
        {
          $project: {
            productId: '$_id',
            productName: '$productInfo.name',
            averageRating: { $round: ['$averageRating', 2] },
            totalReviews: 1
          }
        }
      ]);

      // Get lowest rated products (products with many low ratings)
      const lowestRatedProducts = await this.Model.aggregate([
        {
          $group: {
            _id: '$product',
            averageRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 },
            lowRatingCount: {
              $sum: {
                $cond: [{ $lte: ['$rating', 2] }, 1, 0]
              }
            }
          }
        },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'productInfo'
          }
        },
        {
          $unwind: '$productInfo'
        },
        {
          $match: {
            totalReviews: { $gte: 3 }, // Ít nhất 3 review
            lowRatingCount: { $gte: 2 } // Ít nhất 2 review thấp
          }
        },
        {
          $sort: { averageRating: 1, lowRatingCount: -1 }
        },
        {
          $limit: 10
        },
        {
          $project: {
            productId: '$_id',
            productName: '$productInfo.name',
            averageRating: { $round: ['$averageRating', 2] },
            totalReviews: 1,
            lowRatingCount: 1,
            lowRatingPercentage: {
              $round: [
                { $multiply: [{ $divide: ['$lowRatingCount', '$totalReviews'] }, 100] },
                1
              ]
            }
          }
        }
      ]);

      if (!overallStats) {
        return {
          totalReviews: 0,
          averageRating: 0,
          ratingDistribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
          topRatedProducts: [],
          lowestRatedProducts: []
        };
      }

      // Count rating distribution
      const distribution = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
      overallStats.ratingCounts.forEach(rating => {
        distribution[rating.toString()]++;
      });

      return {
        totalReviews: overallStats.totalReviews,
        averageRating: Math.round(overallStats.averageRating * 100) / 100,
        ratingDistribution: distribution,
        topRatedProducts,
        lowestRatedProducts
      };
    } catch (error) {
      throw new AppError(`Failed to get review statistics: ${error.message}`, ERROR_CODES.INTERNAL_ERROR);
    }
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

  /**
   * Get all reviews using new Query Middleware (Admin)
   * @param {Object} queryBuilder - QueryBuilder instance
   * @returns {Object} Query results with pagination
   */
  async getAllReviewsWithQuery(queryParams) {
    try {
      // Sử dụng QueryUtils với pre-configured setup cho Review
      const result = await QueryUtils.getReviews(Review, queryParams);
      
      return result;
    } catch (error) {
      throw new AppError(`Failed to get all reviews: ${error.message}`, ERROR_CODES.INTERNAL_ERROR);
    }
  }

  /**
   * Get all reviews (Admin) - Legacy method with search support
   * @param {Object} queryOptions - Query options
   * @returns {Object} Query results with pagination
   */
  async getAllReviews(queryOptions) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        rating,
        productId,
        userId,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = queryOptions;

      // Build query
      let query = {};
      
      // Add rating filter
      if (rating) {
        query.rating = parseInt(rating);
      }
      
      // Add product filter
      if (productId) {
        query.product = productId;
      }
      
      // Add user filter
      if (userId) {
        query.user = userId;
      }

      // Build sort object
      const sort = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      // Calculate skip
      const skip = (page - 1) * limit;

      // Base aggregate pipeline
      let pipeline = [];

      // Start with initial match if there are filters
      if (Object.keys(query).length > 0) {
        pipeline.push({ $match: query });
      }

      // Add search functionality for comment, user name, and user email
      if (search) {
        console.log('🔍 Search term:', search);
        
        // Add lookup for users first
        pipeline.push({
          $lookup: {
            from: 'users',
            localField: 'user',
            foreignField: '_id',
            as: 'userInfo'
          }
        });
        
        // Then add search match
        pipeline.push({
          $match: {
            $or: [
              { comment: { $regex: search, $options: 'i' } },
              { 'userInfo.name': { $regex: search, $options: 'i' } },
              { 'userInfo.email': { $regex: search, $options: 'i' } }
            ]
          }
        });
        
        console.log('🔍 Search pipeline:', JSON.stringify(pipeline, null, 2));
      }

      // Add sorting
      pipeline.push({ $sort: sort });

      // Count total documents
      const countPipeline = [...pipeline, { $count: 'total' }];
      const countResult = await Review.aggregate(countPipeline);
      const total = countResult.length > 0 ? countResult[0].total : 0;

      // Add pagination
      pipeline.push({ $skip: skip }, { $limit: limit });

      // Add populate stages
      pipeline.push(
        {
          $lookup: {
            from: 'users',
            localField: 'user',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $lookup: {
            from: 'products',
            localField: 'product',
            foreignField: '_id',
            as: 'product'
          }
        },
        {
          $lookup: {
            from: 'orders',
            localField: 'order',
            foreignField: '_id',
            as: 'order'
          }
        },
        {
          $unwind: { path: '$user', preserveNullAndEmptyArrays: true }
        },
        {
          $unwind: { path: '$product', preserveNullAndEmptyArrays: true }
        },
        {
          $unwind: { path: '$order', preserveNullAndEmptyArrays: true }
        }
      );

      // Execute query
      const documents = await Review.aggregate(pipeline);

      // Calculate pagination
      const totalPages = Math.ceil(total / limit);

      return {
        data: documents,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages
        }
      };
    } catch (error) {
      throw new AppError(`Failed to get all reviews: ${error.message}`, ERROR_CODES.INTERNAL_ERROR);
    }
  }
}

module.exports = ReviewService;
