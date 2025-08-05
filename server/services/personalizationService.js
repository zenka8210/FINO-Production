const BaseService = require('./baseService');
const Category = require('../models/CategorySchema');

/**
 * Service để xử lý logic cá nhân hóa cho categorySidebar - SIMPLE VERSION FOR DEBUG
 */
class PersonalizationService extends BaseService {
  constructor() {
    super();
  }

  /**
   * Version đơn giản để debug - không có vòng lặp phức tạp
   */
  async getPersonalizedCategories(userId, options = {}) {
    try {
      console.log('🎯 PersonalizationService: Starting getPersonalizedCategories', { userId, options });
      
      const { limit = 10, includeSubcategories = true } = options;
      
      // 1. Lấy categories cơ bản - không populate để tránh infinite loop
      console.log('📊 Fetching basic categories...');
      const allCategories = await Category.find({ isActive: true }).lean();
      console.log('✅ Categories fetched:', allCategories.length);

      if (!allCategories || allCategories.length === 0) {
        console.log('⚠️ No categories found');
        return {
          categories: [],
          userBehaviorSummary: {
            totalOrders: 0,
            totalOrderValue: 0,
            wishlistItems: 0,
            cartItems: 0,
            personalizationLevel: 'new'
          }
        };
      }

      // 2. Phân loại parent và child categories
      const parentCategories = allCategories.filter(cat => !cat.parent);
      const childCategories = allCategories.filter(cat => cat.parent);
      
      console.log('📊 Parent categories:', parentCategories.length);
      console.log('📊 Child categories:', childCategories.length);

      // 3. Nếu user chưa đăng nhập, trả về categories mặc định
      if (!userId) {
        console.log('👤 Guest user - returning default categories');
        return this.getDefaultCategoriesWithBadges(parentCategories, childCategories, limit);
      }

      // 4. User đã đăng nhập - tạm thời trả về categories đơn giản với badge mặc định
      console.log('👤 Authenticated user - returning simple personalized categories');
      const categoriesWithPersonalization = parentCategories
        .slice(0, limit)
        .map(category => {
          // Tìm children cho category này
          const children = includeSubcategories 
            ? childCategories.filter(child => 
                child.parent && child.parent.toString() === category._id.toString()
              )
            : [];

          return {
            ...category,
            children: children.length > 0 ? children : undefined,
            badge: {
              count: Math.floor(Math.random() * 5), // Random để test
              type: 'default',
              autoExpand: false
            },
            personalization: {
              score: Math.floor(Math.random() * 100), // Random để test
              orderFrequency: 0,
              wishlistCount: 0,
              cartCount: 0,
              totalValue: 0,
              shouldAutoExpand: false
            }
          };
        });

      console.log('✅ PersonalizationService: Categories processed successfully');
      
      return {
        categories: categoriesWithPersonalization,
        userBehaviorSummary: {
          totalOrders: 0,
          totalOrderValue: 0,
          wishlistItems: 0,
          cartItems: 0,
          personalizationLevel: 'low'
        }
      };

    } catch (error) {
      console.error('❌ PersonalizationService Error:', error);
      
      // Fallback về categories mặc định nếu có lỗi
      try {
        const basicCategories = await Category.find({ isActive: true }).limit(10).lean();
        return this.formatDefaultResponse(basicCategories);
      } catch (fallbackError) {
        console.error('❌ Fallback Error:', fallbackError);
        return {
          categories: [],
          userBehaviorSummary: {
            totalOrders: 0,
            totalOrderValue: 0,
            wishlistItems: 0,
            cartItems: 0,
            personalizationLevel: 'error'
          }
        };
      }
    }
  }

  /**
   * Categories mặc định cho user mới (simplified)
   */
  getDefaultCategoriesWithBadges(parentCategories, childCategories, limit) {
    console.log('🎯 Creating default categories with badges');
    
    const defaultCategories = parentCategories
      .slice(0, limit)
      .map(category => {
        const children = childCategories.filter(child => 
          child.parent && child.parent.toString() === category._id.toString()
        );

        return {
          ...category,
          children: children.length > 0 ? children : undefined,
          badge: {
            count: 0,
            type: 'default',
            autoExpand: false
          },
          personalization: {
            score: 0,
            shouldAutoExpand: false
          }
        };
      });

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
   * Format response mặc định khi có lỗi (simplified)
   */
  formatDefaultResponse(categories) {
    return {
      categories: categories.map(cat => ({
        ...cat,
        badge: { count: 0, type: 'default', autoExpand: false },
        personalization: { score: 0, shouldAutoExpand: false }
      })),
      userBehaviorSummary: {
        totalOrders: 0,
        totalOrderValue: 0,
        wishlistItems: 0,
        cartItems: 0,
        personalizationLevel: 'error'
      }
    };
  }
}

module.exports = PersonalizationService;
