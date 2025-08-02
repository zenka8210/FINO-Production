const redisConfig = require('../config/redis');
const Product = require('../models/ProductSchema');
const Category = require('../models/CategorySchema');
const Banner = require('../models/BannerSchema');
const Post = require('../models/PostSchema');
const Review = require('../models/ReviewSchema');
const WishList = require('../models/WishListSchema');
const Order = require('../models/OrderSchema');

class HomePageService {
  constructor() {
    this.redis = redisConfig.getClient();
    this.CACHE_KEYS = {
      HOME_DATA: 'home:data:v1'
    };
    this.CACHE_TTL = {
      HOME_DATA: 15 * 60 // 15 minutes
    };
  }

  /**
   * Get complete home page data (cached)
   */
  async getHomePageData() {
    try {
      // Try to get cached data first
      if (this.redis && redisConfig.isRedisConnected()) {
        const cachedData = await this.redis.get(this.CACHE_KEYS.HOME_DATA);
        if (cachedData) {
          console.log('✅ HomePageService: Returning cached home data');
          return JSON.parse(cachedData);
        }
      }

      console.log('🔄 HomePageService: Fetching fresh home data...');

      // Fetch all data in parallel for better performance
      const [
        categories,
        banners,
        featuredProducts,
        newProducts,
        saleProducts,
        posts
      ] = await Promise.all([
        this.getCategories(),
        this.getBanners(),
        this.getFeaturedProducts(),
        this.getNewProducts(),
        this.getSaleProducts(),
        this.getRecentPosts()
      ]);

      const homeData = {
        categories,
        banners,
        featuredProducts,
        newProducts,
        saleProducts,
        posts,
        lastUpdated: new Date().toISOString()
      };

      // Cache the complete data
      if (this.redis && redisConfig.isRedisConnected()) {
        await this.redis.setex(
          this.CACHE_KEYS.HOME_DATA,
          this.CACHE_TTL.HOME_DATA,
          JSON.stringify(homeData)
        );
        console.log('💾 HomePageService: Cached home data for', this.CACHE_TTL.HOME_DATA, 'seconds');
      }

      return homeData;
    } catch (error) {
      console.error('❌ HomePageService: Error fetching home data:', error);
      throw error;
    }
  }

  /**
   * Get categories
   */
  async getCategories() {
    try {
      const categories = await Category.find({ isActive: true }).limit(20);
      return categories;
    } catch (error) {
      console.error('❌ HomePageService: Error fetching categories:', error);
      return [];
    }
  }

  /**
   * Get active banners
   */
  async getBanners() {
    try {
      const banners = await Banner.find({ isActive: true });
      return banners;
    } catch (error) {
      console.error('❌ HomePageService: Error fetching banners:', error);
      return [];
    }
  }

  /**
   * Get featured products based on real metrics:
   * - Top rated products (average rating)
   * - Most wishlisted products 
   * - Best selling products (order count)
   */
  async getFeaturedProducts(limit = 6) {
    try {
      console.log('🎯 Getting featured products with real metrics...');
      
      // Get products with aggregated metrics
      const productsWithMetrics = await Product.aggregate([
        { $match: { isActive: true } },
        
        // Lookup reviews for average rating
        {
          $lookup: {
            from: 'reviews',
            localField: '_id',
            foreignField: 'product',
            as: 'reviews'
          }
        },
        
        // Lookup wishlist counts
        {
          $lookup: {
            from: 'wishlists',
            localField: '_id',
            foreignField: 'items.product',
            as: 'wishlists'
          }
        },
        
        // Lookup order items for sales count
        {
          $lookup: {
            from: 'orders',
            let: { productId: '$_id' },
            pipeline: [
              { $match: { status: 'delivered' } }, // Only delivered orders
              { $unwind: '$items' },
              { $match: { $expr: { $eq: ['$items.product', '$$productId'] } } },
              { $group: { _id: null, totalSold: { $sum: '$items.quantity' } } }
            ],
            as: 'sales'
          }
        },
        
        // Calculate metrics
        {
          $addFields: {
            averageRating: {
              $cond: {
                if: { $gt: [{ $size: '$reviews' }, 0] },
                then: { $avg: '$reviews.rating' },
                else: 0
              }
            },
            reviewCount: { $size: '$reviews' },
            wishlistCount: { $size: '$wishlists' },
            salesCount: {
              $cond: {
                if: { $gt: [{ $size: '$sales' }, 0] },
                then: { $arrayElemAt: ['$sales.totalSold', 0] },
                else: 0
              }
            }
          }
        },
        
        // Calculate composite featured score
        // Rating (0-5) * 20 + Wishlist count * 2 + Sales count * 1
        {
          $addFields: {
            featuredScore: {
              $add: [
                { $multiply: ['$averageRating', 20] }, // Rating weight: 20
                { $multiply: ['$wishlistCount', 2] },   // Wishlist weight: 2
                { $multiply: ['$salesCount', 1] }       // Sales weight: 1
              ]
            }
          }
        },
        
        // Sort by featured score and creation date
        { $sort: { featuredScore: -1, createdAt: -1 } },
        { $limit: limit },
        
        // Populate category
        {
          $lookup: {
            from: 'categories',
            localField: 'category',
            foreignField: '_id',
            as: 'category'
          }
        },
        { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
        
        // Clean up fields
        {
          $project: {
            reviews: 0,
            wishlists: 0,
            sales: 0
          }
        }
      ]);
      
      console.log(`✅ Found ${productsWithMetrics.length} featured products with metrics`);
      return productsWithMetrics;
      
    } catch (error) {
      console.error('❌ HomePageService: Error fetching featured products:', error);
      
      // Fallback to simple query if aggregation fails
      const fallbackProducts = await Product.find({ isActive: true })
        .populate('category')
        .sort({ createdAt: -1 })
        .limit(limit);
      
      return fallbackProducts;
    }
  }

  /**
   * Get new products
   */
  async getNewProducts(limit = 6) {
    try {
      const products = await Product.find({ isActive: true })
        .populate('category')
        .sort({ createdAt: -1 })
        .limit(limit);
      return products;
    } catch (error) {
      console.error('❌ HomePageService: Error fetching new products:', error);
      return [];
    }
  }

  /**
   * Get sale products with real discount calculation
   */
  async getSaleProducts(limit = 20) {
    try {
      console.log('💰 Getting sale products with discount calculation...');
      
      const saleProducts = await Product.aggregate([
        {
          $match: {
            isActive: true,
            salePrice: { $exists: true, $ne: null },
            $expr: { $lt: ['$salePrice', '$price'] } // salePrice < price
          }
        },
        
        // Calculate discount percentage
        {
          $addFields: {
            discountPercent: {
              $multiply: [
                {
                  $divide: [
                    { $subtract: ['$price', '$salePrice'] },
                    '$price'
                  ]
                },
                100
              ]
            }
          }
        },
        
        // Sort by discount percentage (highest first)
        { $sort: { discountPercent: -1, createdAt: -1 } },
        { $limit: limit },
        
        // Populate category
        {
          $lookup: {
            from: 'categories',
            localField: 'category',
            foreignField: '_id',
            as: 'category'
          }
        },
        { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } }
      ]);
      
      console.log(`✅ Found ${saleProducts.length} sale products with discounts`);
      return saleProducts;
      
    } catch (error) {
      console.error('❌ HomePageService: Error fetching sale products:', error);
      
      // Fallback to simple query
      const fallbackProducts = await Product.find({ 
        isActive: true,
        salePrice: { $exists: true, $ne: null }
      })
      .populate('category')
      .sort({ createdAt: -1 })
      .limit(limit);
      
      return fallbackProducts;
    }
  }

  /**
   * Get recent posts
   */
  async getRecentPosts(limit = 6) {
    try {
      const posts = await Post.find({ status: 'published' })
        .sort({ createdAt: -1 })
        .limit(limit);
      return posts;
    } catch (error) {
      console.error('❌ HomePageService: Error fetching posts:', error);
      return [];
    }
  }

  /**
   * Clear cache
   */
  async clearCache() {
    try {
      if (this.redis && redisConfig.isRedisConnected()) {
        await this.redis.del(this.CACHE_KEYS.HOME_DATA);
        console.log('🗑️  HomePageService: Cache cleared');
      }
    } catch (error) {
      console.error('❌ HomePageService: Error clearing cache:', error);
    }
  }
}

module.exports = HomePageService;
