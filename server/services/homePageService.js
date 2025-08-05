const Product = require('../models/ProductSchema');
const Category = require('../models/CategorySchema');
const Banner = require('../models/BannerSchema');
const Post = require('../models/PostSchema');

class HomePageService {
  /**
   * Get complete home page data without Redis caching
   */
  async getHomePageData() {
    try {
      console.log('🔄 HomePageService: Fetching optimized home data...');

      // Fetch data with simple queries - no complex aggregations
      const [categories, banners, products, posts] = await Promise.all([
        Category.find({ isActive: true }).limit(10).lean(),
        Banner.find({ isActive: true }).limit(5).lean(),
        Product.find({ isActive: true }).limit(30).lean(),
        Post.find({ isActive: true }).limit(6).lean()
      ]);

      const homeData = {
        categories: categories || [],
        banners: banners || [],
        featuredProducts: products.slice(0, 8) || [],
        newProducts: products.slice(8, 16) || [],
        saleProducts: products.slice(16, 24) || [],
        posts: posts || [],
        lastUpdated: new Date().toISOString()
      };

      console.log('✅ HomePageService: Successfully fetched home data');
      console.log('📊 Data counts:', {
        categories: homeData.categories.length,
        banners: homeData.banners.length,
        featuredProducts: homeData.featuredProducts.length,
        newProducts: homeData.newProducts.length,
        saleProducts: homeData.saleProducts.length,
        posts: homeData.posts.length
      });

      return homeData;
    } catch (error) {
      console.error('❌ HomePageService: Error fetching home data:', error);
      // Return empty data instead of throwing error
      return {
        categories: [],
        banners: [],
        featuredProducts: [],
        newProducts: [],
        saleProducts: [],
        posts: [],
        lastUpdated: new Date().toISOString(),
        error: error.message
      };
    }
  }

  /**
   * Get categories
   */
  async getCategories() {
    try {
      const categories = await Category.find({ isActive: true }).limit(20).lean();
      return categories || [];
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
      const banners = await Banner.find({ isActive: true }).lean();
      return banners || [];
    } catch (error) {
      console.error('❌ HomePageService: Error fetching banners:', error);
      return [];
    }
  }

  /**
   * Get featured products based on business metrics
   * Priority logic:
   * 1. Top 6 products with highest average rating (from reviews)
   * 2. Top 6 products added to wishlist most frequently 
   * 3. Top 6 products sold most successfully (from completed orders)
   */
  async getFeaturedProducts(limit = 6, filterType = 'combined') {
    try {
      console.log(`🌟 Calculating featured products with filter: ${filterType}...`);
      
      const Review = require('../models/ReviewSchema');
      const WishList = require('../models/WishListSchema'); 
      const Order = require('../models/OrderSchema');
      
      // Handle specific filter types
      if (filterType === 'topRated') {
        return this.getTopRatedProducts(limit);
      } else if (filterType === 'mostWishlisted') {
        return this.getMostWishlistedProducts(limit);
      } else if (filterType === 'bestSelling') {
        return this.getBestSellingProducts(limit);
      }
      
      // Default: Combined logic (existing implementation)
      // 1. Get products with highest average rating
      const topRatedProducts = await Review.aggregate([
        {
          $group: {
            _id: '$product',
            avgRating: { $avg: '$rating' },
            reviewCount: { $sum: 1 }
          }
        },
        { $match: { reviewCount: { $gte: 1 } } }, // At least 1 review
        { $sort: { avgRating: -1, reviewCount: -1 } },
        { $limit: limit }
      ]);
      
      // 2. Get products added to wishlist most frequently
      const mostWishlistedProducts = await WishList.aggregate([
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.product',
            wishlistCount: { $sum: 1 }
          }
        },
        { $sort: { wishlistCount: -1 } },
        { $limit: limit }
      ]);
      
      // 3. Get products sold most successfully (completed orders only)
      const bestSellingProducts = await Order.aggregate([
        { $match: { status: { $in: ['delivered'] } } }, // Only successful orders
        { $unwind: '$items' },
        {
          $lookup: {
            from: 'productvariants',
            localField: 'items.productVariant',
            foreignField: '_id',
            as: 'variant'
          }
        },
        { $unwind: '$variant' },
        {
          $group: {
            _id: '$variant.product',
            totalSold: { $sum: '$items.quantity' },
            orderCount: { $sum: 1 }
          }
        },
        { $sort: { totalSold: -1, orderCount: -1 } },
        { $limit: limit }
      ]);
      
      console.log('📊 Featured products metrics:', {
        topRatedCount: topRatedProducts.length,
        wishlistedCount: mostWishlistedProducts.length,
        bestSellingCount: bestSellingProducts.length
      });
      
      // Combine and prioritize product IDs
      const featuredProductIds = [];
      const addedProducts = new Set();
      
      // Priority 1: Top rated products
      for (const item of topRatedProducts) {
        if (featuredProductIds.length < limit && !addedProducts.has(item._id.toString())) {
          featuredProductIds.push(item._id);
          addedProducts.add(item._id.toString());
        }
      }
      
      // Priority 2: Most wishlisted products
      for (const item of mostWishlistedProducts) {
        if (featuredProductIds.length < limit && !addedProducts.has(item._id.toString())) {
          featuredProductIds.push(item._id);
          addedProducts.add(item._id.toString());
        }
      }
      
      // Priority 3: Best selling products
      for (const item of bestSellingProducts) {
        if (featuredProductIds.length < limit && !addedProducts.has(item._id.toString())) {
          featuredProductIds.push(item._id);
          addedProducts.add(item._id.toString());
        }
      }
      
      // If still need more products, fill with newest active products
      if (featuredProductIds.length < limit) {
        const additionalProducts = await Product.find({ 
          isActive: true,
          _id: { $nin: featuredProductIds }
        })
        .sort({ createdAt: -1 })
        .limit(limit - featuredProductIds.length)
        .lean();
        
        featuredProductIds.push(...additionalProducts.map(p => p._id));
      }
      
      // Fetch final products with populated data
      const featuredProducts = await Product.find({
        _id: { $in: featuredProductIds },
        isActive: true
      })
      .populate('category', 'name isActive')
      .lean();
      
      // Maintain the priority order
      const orderedProducts = featuredProductIds
        .map(id => featuredProducts.find(p => p._id.toString() === id.toString()))
        .filter(Boolean)
        .slice(0, limit);
      
      console.log('✅ Featured products selected:', {
        filterType,
        totalProducts: orderedProducts.length,
        productIds: orderedProducts.map(p => p._id)
      });
      
      return orderedProducts;
    } catch (error) {
      console.error('❌ HomePageService: Error calculating featured products:', error);
      // Fallback to simple featured products
      const fallbackProducts = await Product.find({ isActive: true })
        .populate('category', 'name isActive')
        .limit(limit)
        .lean();
      return fallbackProducts || [];
    }
  }

  /**
   * Get top rated products only
   */
  async getTopRatedProducts(limit = 6) {
    try {
      const Review = require('../models/ReviewSchema');
      
      const topRatedProducts = await Review.aggregate([
        {
          $group: {
            _id: '$product',
            avgRating: { $avg: '$rating' },
            reviewCount: { $sum: 1 }
          }
        },
        { $match: { reviewCount: { $gte: 1 } } },
        { $sort: { avgRating: -1, reviewCount: -1 } },
        { $limit: limit * 2 } // Get more to ensure we have enough active products
      ]);
      
      const productIds = topRatedProducts.map(item => item._id);
      
      const products = await Product.find({
        _id: { $in: productIds },
        isActive: true
      })
      .populate('category', 'name isActive')
      .limit(limit)
      .lean();
      
      // Maintain rating order
      const orderedProducts = productIds
        .map(id => products.find(p => p._id.toString() === id.toString()))
        .filter(Boolean)
        .slice(0, limit);
      
      console.log(`✅ Top rated products: ${orderedProducts.length} found`);
      return orderedProducts;
    } catch (error) {
      console.error('❌ Error getting top rated products:', error);
      return [];
    }
  }

  /**
   * Get most wishlisted products only
   */
  async getMostWishlistedProducts(limit = 6) {
    try {
      const WishList = require('../models/WishListSchema');
      
      const mostWishlisted = await WishList.aggregate([
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.product',
            wishlistCount: { $sum: 1 }
          }
        },
        { $sort: { wishlistCount: -1 } },
        { $limit: limit * 2 }
      ]);
      
      const productIds = mostWishlisted.map(item => item._id);
      
      const products = await Product.find({
        _id: { $in: productIds },
        isActive: true
      })
      .populate('category', 'name isActive')
      .limit(limit)
      .lean();
      
      // Maintain wishlist order
      const orderedProducts = productIds
        .map(id => products.find(p => p._id.toString() === id.toString()))
        .filter(Boolean)
        .slice(0, limit);
      
      console.log(`✅ Most wishlisted products: ${orderedProducts.length} found`);
      return orderedProducts;
    } catch (error) {
      console.error('❌ Error getting most wishlisted products:', error);
      return [];
    }
  }

  /**
   * Get best selling products only
   */
  async getBestSellingProducts(limit = 6) {
    try {
      const Order = require('../models/OrderSchema');
      
      const bestSelling = await Order.aggregate([
        { $match: { status: { $in: ['delivered'] } } },
        { $unwind: '$items' },
        {
          $lookup: {
            from: 'productvariants',
            localField: 'items.productVariant',
            foreignField: '_id',
            as: 'variant'
          }
        },
        { $unwind: '$variant' },
        {
          $group: {
            _id: '$variant.product',
            totalSold: { $sum: '$items.quantity' },
            orderCount: { $sum: 1 }
          }
        },
        { $sort: { totalSold: -1, orderCount: -1 } },
        { $limit: limit * 2 }
      ]);
      
      const productIds = bestSelling.map(item => item._id);
      
      const products = await Product.find({
        _id: { $in: productIds },
        isActive: true
      })
      .populate('category', 'name isActive')
      .limit(limit)
      .lean();
      
      // Maintain sales order
      const orderedProducts = productIds
        .map(id => products.find(p => p._id.toString() === id.toString()))
        .filter(Boolean)
        .slice(0, limit);
      
      console.log(`✅ Best selling products: ${orderedProducts.length} found`);
      return orderedProducts;
    } catch (error) {
      console.error('❌ Error getting best selling products:', error);
      return [];
    }
  }

  /**
   * Get new products
   */
  async getNewProducts(limit = 8) {
    try {
      console.log(`🆕 HomePageService: Fetching ${limit} newest products...`);
      const products = await Product.find({ isActive: true })
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .lean();
      
      console.log(`✅ HomePageService: Found ${products.length} new products`);
      return products || [];
    } catch (error) {
      console.error('❌ HomePageService: Error fetching new products:', error);
      return [];
    }
  }

  /**
   * Get sale products
   */
  async getSaleProducts() {
    try {
      const products = await Product.find({ 
        isActive: true,
        salePrice: { $exists: true, $gt: 0 }
      }).limit(8).lean();
      return products || [];
    } catch (error) {
      console.error('❌ HomePageService: Error fetching sale products:', error);
      return [];
    }
  }

  /**
   * Get recent posts
   */
  async getRecentPosts() {
    try {
      const posts = await Post.find({ isActive: true })
        .sort({ createdAt: -1 })
        .limit(6)
        .lean();
      return posts || [];
    } catch (error) {
      console.error('❌ HomePageService: Error fetching posts:', error);
      return [];
    }
  }
}

module.exports = new HomePageService();
