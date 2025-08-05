const BaseController = require('./baseController');
const homePageService = require('../services/homePageService');

class HomePageController extends BaseController {
  constructor() {
    super('HomePage');
  }

  /**
   * Get complete home page data
   * @route GET /api/home
   */
  async getHomeData(req, res) {
    try {
      console.log('📱 HomePageController: Fetching home page data...');
      
      const homeData = await homePageService.getHomePageData();
      
      console.log('✅ HomePageController: Successfully fetched home data');
      console.log('📊 Data summary:', {
        categories: homeData.categories?.length || 0,
        banners: homeData.banners?.length || 0,
        featuredProducts: homeData.featuredProducts?.length || 0,
        newProducts: homeData.newProducts?.length || 0,
        saleProducts: homeData.saleProducts?.length || 0,
        posts: homeData.posts?.length || 0
      });

      return res.status(200).json({
        success: true,
        message: 'Home page data fetched successfully',
        data: homeData
      });
    } catch (error) {
      console.error('❌ HomePageController: Error fetching home data:', error);
      return this.handleError(res, error, 'Failed to fetch home page data');
    }
  }

  /**
   * Get categories only
   * @route GET /api/home/categories
   */
  async getCategories(req, res) {
    try {
      const categories = await homePageService.getCategories();
      
      return res.status(200).json({
        success: true,
        message: 'Categories fetched successfully',
        data: categories
      });
    } catch (error) {
      console.error('❌ HomePageController: Error fetching categories:', error);
      return this.handleError(res, error, 'Failed to fetch categories');
    }
  }

  /**
   * Get banners only
   * @route GET /api/home/banners
   */
  async getBanners(req, res) {
    try {
      const banners = await homePageService.getBanners();
      
      return res.status(200).json({
        success: true,
        message: 'Banners fetched successfully',
        data: banners
      });
    } catch (error) {
      console.error('❌ HomePageController: Error fetching banners:', error);
      return this.handleError(res, error, 'Failed to fetch banners');
    }
  }

  /**
   * Get featured products only
   * @route GET /api/home/featured?limit=6&filter=combined|topRated|mostWishlisted|bestSelling
   */
  async getFeaturedProducts(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 6;
      const filterType = req.query.filter || 'combined';
      
      console.log(`🌟 HomePageController: Fetching featured products with filter: ${filterType}, limit: ${limit}`);
      
      const products = await homePageService.getFeaturedProducts(limit, filterType);
      
      return res.status(200).json({
        success: true,
        message: `Featured products (${filterType}) fetched successfully`,
        data: products,
        meta: {
          filter: filterType,
          count: products.length,
          limit
        }
      });
    } catch (error) {
      console.error('❌ HomePageController: Error fetching featured products:', error);
      return this.handleError(res, error, 'Failed to fetch featured products');
    }
  }

  /**
   * Get new products only
   * @route GET /api/home/new
   */
  async getNewProducts(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 8;
      console.log(`🆕 HomePageController: Fetching new products with limit ${limit}`);
      const products = await homePageService.getNewProducts(limit);
      
      return res.status(200).json({
        success: true,
        message: 'New products fetched successfully',
        data: products
      });
    } catch (error) {
      console.error('❌ HomePageController: Error fetching new products:', error);
      return this.handleError(res, error, 'Failed to fetch new products');
    }
  }

  /**
   * Get sale products only
   * @route GET /api/home/sale
   */
  async getSaleProducts(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 20;
      const products = await homePageService.getSaleProducts(limit);
      
      return res.status(200).json({
        success: true,
        message: 'Sale products fetched successfully',
        data: products
      });
    } catch (error) {
      console.error('❌ HomePageController: Error fetching sale products:', error);
      return this.handleError(res, error, 'Failed to fetch sale products');
    }
  }

  /**
   * Get recent posts only
   * @route GET /api/home/posts
   */
  async getPosts(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 6;
      const posts = await homePageService.getRecentPosts(limit);
      
      return res.status(200).json({
        success: true,
        message: 'Posts fetched successfully',
        data: posts
      });
    } catch (error) {
      console.error('❌ HomePageController: Error fetching posts:', error);
      return this.handleError(res, error, 'Failed to fetch posts');
    }
  }

  /**
   * Clear cache
   * @route DELETE /api/home/cache
   */
  async clearCache(req, res) {
    try {
      const { cacheKey } = req.query;
      await homePageService.clearCache(cacheKey);
      
      return res.status(200).json({
        success: true,
        message: cacheKey ? `Cache cleared for ${cacheKey}` : 'All home page cache cleared'
      });
    } catch (error) {
      console.error('❌ HomePageController: Error clearing cache:', error);
      return this.handleError(res, error, 'Failed to clear cache');
    }
  }

  /**
   * Preload cache
   * @route POST /api/home/cache/preload
   */
  async preloadCache(req, res) {
    try {
      await homePageService.preloadCache();
      
      return res.status(200).json({
        success: true,
        message: 'Cache preloaded successfully'
      });
    } catch (error) {
      console.error('❌ HomePageController: Error preloading cache:', error);
      return this.handleError(res, error, 'Failed to preload cache');
    }
  }
}

module.exports = new HomePageController();
