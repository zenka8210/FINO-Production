const BaseController = require('./baseController');
const PersonalizationService = require('../services/personalizationServiceSimple'); // Use simple version
const ResponseHandler = require('../services/responseHandler');

/**
 * Controller xử lý các request liên quan đến personalization
 */
class PersonalizationController extends BaseController {
  constructor() {
    const personalizationService = new PersonalizationService();
    super(personalizationService);
  }

  /**
   * GET /api/personalization/categories
   * Lấy danh mục được cá nhân hóa cho user
   */
  getPersonalizedCategories = async (req, res, next) => {
    try {
      const userId = req.user?._id || null; // Support cả guest user
      const { limit = 10, includeSubcategories = true } = req.query;
      
      console.log('🎯 PersonalizationController: Getting personalized categories for user:', userId);
      
      const options = {
        limit: parseInt(limit),
        includeSubcategories: includeSubcategories === 'true'
      };

      const result = await this.service.getPersonalizedCategories(userId, options);
      
      console.log('✅ PersonalizationController: Personalized categories generated:', {
        categoriesCount: result.categories.length,
        personalizationLevel: result.userBehaviorSummary.personalizationLevel,
        autoExpandCount: result.categories.filter(cat => cat.personalization?.shouldAutoExpand).length
      });

      ResponseHandler.success(res, 'Lấy danh mục cá nhân hóa thành công', result);
    } catch (error) {
      console.error('❌ PersonalizationController Error:', error);
      next(error);
    }
  };

  /**
   * GET /api/personalization/user-behavior
   * Lấy thông tin phân tích hành vi user (dành cho debugging hoặc admin)
   */
  getUserBehaviorAnalysis = async (req, res, next) => {
    try {
      const userId = req.user?._id;
      
      if (!userId) {
        return ResponseHandler.badRequest(res, 'Yêu cầu đăng nhập để xem phân tích hành vi');
      }

      const behaviorData = await this.service.analyzeUserBehavior(userId);
      
      ResponseHandler.success(res, 'Phân tích hành vi user thành công', {
        userId,
        analysis: {
          recentOrdersCount: behaviorData.recentOrders.length,
          totalOrderValue: behaviorData.totalOrderValue,
          wishlistItemsCount: behaviorData.wishlistItemsCount,
          cartItemsCount: behaviorData.cartItemsCount,
          personalizationLevel: this.service.calculatePersonalizationLevel(behaviorData)
        },
        rawData: {
          recentOrders: behaviorData.recentOrders.map(order => ({
            _id: order._id,
            orderCode: order.orderCode,
            finalTotal: order.finalTotal,
            itemsCount: order.items?.length || 0,
            createdAt: order.createdAt
          })),
          wishlistCategories: this.extractCategoriesFromWishlist(behaviorData.currentWishlist),
          cartCategories: this.extractCategoriesFromCart(behaviorData.currentCart)
        }
      });
    } catch (error) {
      console.error('❌ getUserBehaviorAnalysis Error:', error);
      next(error);
    }
  };

  /**
   * Utility: Extract categories from wishlist
   */
  extractCategoriesFromWishlist(wishlist) {
    if (!wishlist?.items) return [];
    
    return wishlist.items.map(item => ({
      productId: item.product._id,
      productName: item.product.name,
      categoryId: item.product.category?._id,
      categoryName: item.product.category?.name
    }));
  }

  /**
   * Utility: Extract categories from cart
   */
  extractCategoriesFromCart(cart) {
    if (!cart?.items) return [];
    
    return cart.items.map(item => ({
      productId: item.productVariant?.product?._id,
      productName: item.productVariant?.product?.name,
      categoryId: item.productVariant?.product?.category?._id,
      categoryName: item.productVariant?.product?.category?.name,
      quantity: item.quantity
    }));
  }
}

module.exports = PersonalizationController;
