const BaseService = require('./baseService');
const User = require('../models/UserSchema');
const Order = require('../models/OrderSchema');
const WishList = require('../models/WishListSchema');
const Cart = require('../models/CartSchema');
const Category = require('../models/CategorySchema');
const Product = require('../models/ProductSchema');

/**
 * Service để xử lý logic cá nhân hóa cho categorySidebar (Version đơn giản để debug)
 */
class PersonalizationService extends BaseService {
  constructor() {
    super();
  }

  /**
   * Lấy danh mục được cá nhân hóa cho user
   */
  async getPersonalizedCategories(userId, options = {}) {
    try {
      const { limit = 10, includeSubcategories = true } = options;
      
      console.log('🎯 PersonalizationService: Getting categories for user:', userId);
      
      // 1. Lấy tất cả categories active (đơn giản không populate)
      const allCategories = await Category.find({ isActive: true }).lean();
      console.log('📂 Found categories:', allCategories.length);

      const parentCategories = allCategories.filter(cat => !cat.parent);
      const childCategories = allCategories.filter(cat => cat.parent);

      console.log('📊 Parent categories:', parentCategories.length, 'Child categories:', childCategories.length);

      // 2. Nếu user chưa đăng nhập, trả về categories mặc định
      if (!userId) {
        console.log('👤 Guest user - returning default categories');
        return this.getDefaultCategoriesWithBadges(parentCategories, childCategories, limit);
      }

      // 3. Phân tích hành vi user (đơn giản)
      const userBehaviorData = await this.analyzeUserBehaviorSimple(userId);
      console.log('📈 User behavior analyzed:', userBehaviorData);
      
      // 3.1. Kiểm tra xem user có đủ data để phân tích không
      const totalActivity = userBehaviorData.recentOrdersCount + 
                            userBehaviorData.wishlistItemsCount + 
                            userBehaviorData.cartItemsCount;
      
      // Threshold: Cần ít nhất 3 hoạt động để có thể phân tích hành vi chính xác
      const MIN_ACTIVITY_THRESHOLD = 3;
      
      if (totalActivity < MIN_ACTIVITY_THRESHOLD) {
        console.log(`👤 User has insufficient activity (${totalActivity}/${MIN_ACTIVITY_THRESHOLD}) - treating as guest with Hot badge`);
        return this.getDefaultCategoriesWithBadges(parentCategories, childCategories, limit);
      }
      
      console.log('🎯 Experienced user with sufficient activity - using personalized logic with "Đề xuất" badge');
      
      // 4. Tính điểm cá nhân hóa cho từng category
      const categoriesWithScores = await this.calculatePersonalizationScoresSimple(
        parentCategories, 
        childCategories,
        userBehaviorData
      );

      // 5. Sắp xếp theo điểm và áp dụng logic tự động expand
      const personalizedCategories = this.applyPersonalizationLogic(
        categoriesWithScores,
        userBehaviorData,
        { limit, includeSubcategories }
      );

      console.log('✅ PersonalizationService: Success');
      return personalizedCategories;

    } catch (error) {
      console.error('❌ PersonalizationService Error:', error);
      // Fallback về categories mặc định nếu có lỗi
      try {
        const allCategories = await Category.find({ isActive: true }).limit(limit).lean();
        return this.formatDefaultResponse(allCategories);
      } catch (fallbackError) {
        console.error('❌ Fallback Error:', fallbackError);
        return {
          categories: [],
          userBehaviorSummary: { personalizationLevel: 'error' }
        };
      }
    }
  }

  /**
   * Phân tích hành vi của user (version đơn giản)
   */
  async analyzeUserBehaviorSimple(userId) {
    try {
      console.log('🔍 Analyzing user behavior for:', userId);
      
      // Lấy số lượng đơn hàng đơn giản (không populate)
      const recentOrdersCount = await Order.countDocuments({ 
        user: userId,
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      });

      // Lấy wishlist đơn giản
      const wishlist = await WishList.findOne({ user: userId }).lean();
      const wishlistItemsCount = wishlist?.items?.length || 0;

      // Lấy cart đơn giản
      const cart = await Cart.findOne({ user: userId }).lean();
      const cartItemsCount = cart?.items?.length || 0;

      console.log('📊 Behavior data:', {
        recentOrdersCount,
        wishlistItemsCount,
        cartItemsCount
      });

      return {
        recentOrdersCount,
        wishlistItemsCount,
        cartItemsCount,
        totalOrderValue: 0, // Simplified
        totalOrderItems: 0, // Simplified
        recentOrders: [], // Simplified
        currentWishlist: wishlist,
        currentCart: cart
      };
    } catch (error) {
      console.error('❌ analyzeUserBehaviorSimple Error:', error);
      return {
        recentOrdersCount: 0,
        wishlistItemsCount: 0,
        cartItemsCount: 0,
        totalOrderValue: 0,
        totalOrderItems: 0,
        recentOrders: [],
        currentWishlist: null,
        currentCart: null
      };
    }
  }

  /**
   * Tính điểm cá nhân hóa cho từng category (version đơn giản)
   */
  async calculatePersonalizationScoresSimple(parentCategories, childCategories, behaviorData) {
    console.log('🧮 Calculating personalization scores...');
    
    const categoryScores = new Map();

    // Khởi tạo điểm cho tất cả categories
    parentCategories.forEach(cat => {
      categoryScores.set(cat._id.toString(), {
        category: cat,
        score: 0,
        orderFrequency: 0,
        wishlistCount: 0,
        cartCount: 0,
        totalValue: 0,
        children: []
      });
    });

    try {
      // FIXED: Phân tích thực tế từ wishlist items
      if (behaviorData.currentWishlist?.items?.length > 0) {
        console.log('📝 Analyzing wishlist items for category preferences...');
        
        for (const item of behaviorData.currentWishlist.items) {
          try {
            // Populate product để lấy category
            const product = await Product.findById(item.product).populate('category').lean();
            if (product?.category) {
              const categoryId = product.category._id.toString();
              const categoryScore = categoryScores.get(categoryId);
              
              if (categoryScore) {
                categoryScore.score += 50; // Mỗi item wishlist = 50 điểm
                categoryScore.wishlistCount += 1;
                console.log(`➕ Category "${product.category.name}" +50 points from wishlist`);
              }
            }
          } catch (itemError) {
            console.error('❌ Error analyzing wishlist item:', itemError);
          }
        }
      }

      // FIXED: Phân tích từ cart items
      if (behaviorData.currentCart?.items?.length > 0) {
        console.log('🛒 Analyzing cart items for category preferences...');
        
        for (const item of behaviorData.currentCart.items) {
          try {
            const product = await Product.findById(item.product).populate('category').lean();
            if (product?.category) {
              const categoryId = product.category._id.toString();
              const categoryScore = categoryScores.get(categoryId);
              
              if (categoryScore) {
                categoryScore.score += 30; // Mỗi item cart = 30 điểm  
                categoryScore.cartCount += 1;
                console.log(`➕ Category "${product.category.name}" +30 points from cart`);
              }
            }
          } catch (itemError) {
            console.error('❌ Error analyzing cart item:', itemError);
          }
        }
      }

      // TODO: Phân tích từ recent orders (simplified version không implement)
      
    } catch (error) {
      console.error('❌ Error analyzing user preferences:', error);
    }

    // Gán children cho parent categories
    childCategories.forEach(child => {
      const parentScore = categoryScores.get(child.parent?.toString());
      if (parentScore) {
        parentScore.children.push({
          ...child,
          score: 0
        });
      }
    });

    const finalScores = Array.from(categoryScores.values());
    console.log('✅ Final category scores:');
    finalScores.forEach(score => {
      if (score.score > 0) {
        console.log(`   ${score.category.name}: ${score.score} points (wishlist: ${score.wishlistCount}, cart: ${score.cartCount})`);
      }
    });

    return finalScores;
  }

  /**
   * Áp dụng logic cá nhân hóa
   */
  applyPersonalizationLogic(categoriesWithScores, behaviorData, options) {
    const { limit, includeSubcategories } = options;

    // Sắp xếp theo điểm giảm dần
    const sortedCategories = categoriesWithScores
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // FIXED: Chỉ 1 danh mục cha tốt nhất được auto-expand và có badge "Hot"
    const categoriesWithAutoExpand = sortedCategories.map((categoryData, index) => {
      const category = categoryData.category;
      
      // Chỉ danh mục đầu tiên (điểm cao nhất) được auto-expand và có badge
      const shouldAutoExpand = index === 0 && categoryData.score > 0;
      const isTopCategory = index === 0 && categoryData.score > 0;

      return {
        ...category,
        children: includeSubcategories ? categoryData.children : undefined,
        badge: {
          // Chỉ danh mục tốt nhất có badge, các danh mục khác không có
          count: isTopCategory ? null : 0, // null để không hiển thị badge number
          text: isTopCategory ? 'Đề xuất' : null, // Hiển thị "Đề xuất" cho user có data
          type: isTopCategory ? 'suggested' : 'none',
          autoExpand: shouldAutoExpand
        },
        personalization: {
          score: categoryData.score,
          orderFrequency: categoryData.orderFrequency,
          wishlistCount: categoryData.wishlistCount,
          cartCount: categoryData.cartCount,
          totalValue: categoryData.totalValue,
          shouldAutoExpand
        }
      };
    });

    return {
      categories: categoriesWithAutoExpand,
      userBehaviorSummary: {
        totalOrders: behaviorData.recentOrdersCount,
        totalOrderValue: behaviorData.totalOrderValue,
        wishlistItems: behaviorData.wishlistItemsCount,
        cartItems: behaviorData.cartItemsCount,
        personalizationLevel: this.calculatePersonalizationLevel(behaviorData)
      }
    };
  }

  /**
   * Xác định loại badge dựa trên hành vi
   */
  getBadgeType(categoryData) {
    if (categoryData.orderFrequency > 2) return 'favorite';
    if (categoryData.wishlistCount > 1) return 'interested';
    if (categoryData.cartCount > 0) return 'pending';
    if (categoryData.score > 30) return 'recommended';
    return 'default';
  }

  /**
   * Tính mức độ cá nhân hóa
   */
  calculatePersonalizationLevel(behaviorData) {
    const totalActivity = 
      behaviorData.recentOrdersCount * 3 + 
      behaviorData.wishlistItemsCount + 
      behaviorData.cartItemsCount;

    if (totalActivity >= 10) return 'high';
    if (totalActivity >= 5) return 'medium';
    if (totalActivity >= 1) return 'low';
    return 'new';
  }

  /**
   * Categories mặc định cho guest user và user không đủ data - dựa trên sản phẩm bán chạy
   * Áp dụng cho:
   * - Guest users (không đăng nhập)
   * - New users (totalActivity = 0)  
   * - Users with insufficient data (totalActivity < 3)
   */
  async getDefaultCategoriesWithBadges(parentCategories, childCategories, limit) {
    try {
      // TODO: Implement logic to get most popular categories based on best-selling products
      // For now, use simple logic with first category as "Hot"
      
      const defaultCategories = parentCategories
        .slice(0, limit)
        .map((category, index) => ({
          ...category,
          children: childCategories.filter(child => 
            child.parent && child.parent.toString() === category._id.toString()
          ),
          badge: {
            count: index === 0 ? null : 0, // First category gets "Hot" badge
            text: index === 0 ? 'Hot' : null,
            type: index === 0 ? 'hot' : 'none',
            autoExpand: index === 0 // Auto-expand first category for guests
          },
          personalization: {
            score: index === 0 ? 50 : 0, // Give first category high score
            shouldAutoExpand: index === 0
          }
        }));

      return {
        categories: defaultCategories,
        userBehaviorSummary: {
          totalOrders: 0,
          totalOrderValue: 0,
          wishlistItems: 0,
          cartItems: 0,
          personalizationLevel: 'new'
        }
      };
    } catch (error) {
      console.error('❌ getDefaultCategoriesWithBadges Error:', error);
      // Fallback to simple default
      return this.getSimpleDefaultCategories(parentCategories, childCategories, limit);
    }
  }

  /**
   * Simple fallback for default categories
  /**
   * Simple fallback for default categories
   */
  getSimpleDefaultCategories(parentCategories, childCategories, limit) {
    const defaultCategories = parentCategories
      .slice(0, limit)
      .map(category => ({
        ...category,
        children: childCategories.filter(child => 
          child.parent && child.parent.toString() === category._id.toString()
        ),
        badge: {
          count: 0,
          text: null,
          type: 'none',
          autoExpand: false
        },
        personalization: {
          score: 0,
          shouldAutoExpand: false
        }
      }));

    return {
      categories: defaultCategories,
      userBehaviorSummary: {
        totalOrders: 0,
        totalOrderValue: 0,
        wishlistItems: 0,
        cartItems: 0,
        personalizationLevel: 'new'
      }
    };
  }

  /**
   * Format response mặc định khi có lỗi
   */
  formatDefaultResponse(categories) {
    return {
      categories: categories.map(cat => ({
        ...cat,
        badge: { count: 0, type: 'default', autoExpand: false },
        personalization: { score: 0, shouldAutoExpand: false }
      })),
      userBehaviorSummary: {
        personalizationLevel: 'error'
      }
    };
  }
}

module.exports = PersonalizationService;
