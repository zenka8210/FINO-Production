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
        Product.find({ isActive: true })
          .populate('category', 'name isActive') // ADD: Populate category for consistency
          .limit(30)
          .lean(),
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
        { $sort: { avgRating: -1, reviewCount: -1, _id: 1 } }, // ADD: _id for deterministic sorting
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
        { $sort: { wishlistCount: -1, _id: 1 } }, // ADD: _id for deterministic sorting
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
        { $sort: { totalSold: -1, orderCount: -1, _id: 1 } }, // ADD: _id for deterministic sorting
        { $limit: limit }
      ]);
      
      console.log('📊 Featured products metrics:', {
        topRatedCount: topRatedProducts.length,
        wishlistedCount: mostWishlistedProducts.length,
        bestSellingCount: bestSellingProducts.length
      });
      
      // IMPROVED: Score-based combination for more distinct differences
      const productScores = new Map();
      
      // Add scores from top rated (weight: 40%)
      topRatedProducts.forEach((item, index) => {
        const score = (topRatedProducts.length - index) * 0.4;
        productScores.set(item._id.toString(), (productScores.get(item._id.toString()) || 0) + score);
      });
      
      // Add scores from wishlisted (weight: 30%)
      mostWishlistedProducts.forEach((item, index) => {
        const score = (mostWishlistedProducts.length - index) * 0.3;
        productScores.set(item._id.toString(), (productScores.get(item._id.toString()) || 0) + score);
      });
      
      // Add scores from best selling (weight: 30%)
      bestSellingProducts.forEach((item, index) => {
        const score = (bestSellingProducts.length - index) * 0.3;
        productScores.set(item._id.toString(), (productScores.get(item._id.toString()) || 0) + score);
      });
      
      // Sort by combined score, then by _id for deterministic order
      const sortedByScore = Array.from(productScores.entries())
        .sort((a, b) => {
          if (b[1] !== a[1]) return b[1] - a[1]; // Sort by score desc
          return a[0].localeCompare(b[0]); // Then by _id for deterministic order
        })
        .slice(0, limit)
        .map(entry => entry[0]);
      
      // Convert back to ObjectIds
      const featuredProductIds = sortedByScore.map(id => {
        const mongoose = require('mongoose');
        return new mongoose.Types.ObjectId(id);
      });
      
      // If still need more products, fill with newest active products
      if (featuredProductIds.length < limit) {
        const additionalProducts = await Product.find({ 
          isActive: true,
          _id: { $nin: featuredProductIds }
        })
        .sort({ createdAt: -1, _id: 1 }) // ADD: _id for deterministic sorting
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
        { $sort: { avgRating: -1, reviewCount: -1, _id: 1 } }, // ADD: _id for deterministic sorting
        { $limit: limit * 2 } // Get more to ensure we have enough active products
      ]);
      
      const productIds = topRatedProducts.map(item => item._id);
      
      const products = await Product.find({
        _id: { $in: productIds },
        isActive: true
      })
      .populate('category', 'name isActive')
      .lean();
      
      // FIXED: Maintain rating order deterministically
      const orderedProducts = [];
      for (const id of productIds) {
        const product = products.find(p => p._id.toString() === id.toString());
        if (product && orderedProducts.length < limit) {
          orderedProducts.push(product);
        }
      }
      
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
        { $sort: { wishlistCount: -1, _id: 1 } }, // ADD: _id for deterministic sorting
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
      
      // FIXED: Maintain wishlist order deterministically
      const orderedProducts = [];
      for (const id of productIds) {
        const product = products.find(p => p._id.toString() === id.toString());
        if (product && orderedProducts.length < limit) {
          orderedProducts.push(product);
        }
      }
      
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
        { $sort: { totalSold: -1, orderCount: -1, _id: 1 } }, // ADD: _id for deterministic sorting
        { $limit: limit * 2 }
      ]);
      
      const productIds = bestSelling.map(item => item._id);
      
      const products = await Product.find({
        _id: { $in: productIds },
        isActive: true
      })
      .populate('category', 'name isActive')
      .lean();
      
      // FIXED: Maintain sales order deterministically
      const orderedProducts = [];
      for (const id of productIds) {
        const product = products.find(p => p._id.toString() === id.toString());
        if (product && orderedProducts.length < limit) {
          orderedProducts.push(product);
        }
      }
      
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
        .populate('category', 'name isActive') // ADD: Populate category like featured products
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .lean();
      
      console.log(`✅ HomePageService: Found ${products.length} new products`);
      console.log('📋 Sample new product categories:', products.slice(0, 2).map(p => ({
        productName: p.name,
        categoryId: p.category?._id,
        categoryName: p.category?.name || 'No category'
      })));
      
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
      })
      .populate('category', 'name isActive') // ADD: Populate category like featured products
      .limit(8)
      .lean();
      
      console.log(`✅ HomePageService: Found ${products.length} sale products with populated categories`);
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
