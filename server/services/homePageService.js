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
   * Get featured products (simple)
   */
  async getFeaturedProducts() {
    try {
      const products = await Product.find({ isActive: true }).limit(8).lean();
      return products || [];
    } catch (error) {
      console.error('❌ HomePageService: Error fetching featured products:', error);
      return [];
    }
  }

  /**
   * Get new products
   */
  async getNewProducts() {
    try {
      const products = await Product.find({ isActive: true })
        .sort({ createdAt: -1 })
        .limit(8)
        .lean();
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
