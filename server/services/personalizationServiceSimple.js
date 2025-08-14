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
      
      // Lấy đơn hàng đã đặt trong 90 ngày gần đây (tất cả status trừ cancelled)
      const validOrders = await Order.find({ 
        user: userId,
        status: { $nin: ['cancelled'] }, // Lấy tất cả orders trừ cancelled
        createdAt: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
      })
      .populate({
        path: 'items.productVariant',
        populate: {
          path: 'product',
          populate: {
            path: 'category',
            select: 'name _id'
          }
        }
      })
      .lean();

      // Lấy số lượng đơn hàng đơn giản (không populate)
      const recentOrdersCount = validOrders.length;
      
      // Tính tổng giá trị đơn hàng
      const totalOrderValue = validOrders.reduce((sum, order) => sum + (order.finalTotal || 0), 0);
      const totalOrderItems = validOrders.reduce((sum, order) => 
        sum + (order.items?.length || 0), 0);

      console.log('📦 Order analysis:', {
        validOrdersCount: validOrders.length,
        totalOrderValue,
        totalOrderItems
      });

      // Lấy wishlist với populate để phân tích categories
      const wishlist = await WishList.findOne({ user: userId })
        .populate({
          path: 'items.product',
          populate: {
            path: 'category',
            select: 'name _id parent'
          }
        })
        .lean();
      const wishlistItemsCount = wishlist?.items?.length || 0;

      // Lấy cart với populate để phân tích categories  
      const cart = await Cart.findOne({ user: userId })
        .populate({
          path: 'items.productVariant',
          populate: {
            path: 'product',
            populate: {
              path: 'category',
              select: 'name _id'
            }
          }
        })
        .lean();
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
        totalOrderValue,
        totalOrderItems,
        recentOrders: validOrders, // Include detailed order data for analysis
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
      // FIXED: Phân tích thực tế từ wishlist items (đã được populate)
      if (behaviorData.currentWishlist?.items?.length > 0) {
        for (const item of behaviorData.currentWishlist.items) {
          try {
            // Data đã được populate trong analyzeUserBehaviorSimple
            const product = item.product;
            
            if (product?.category) {
              const categoryId = product.category._id.toString();
              let categoryScore = categoryScores.get(categoryId);
              
              // If child category not found, try to find parent category
              if (!categoryScore && product.category.parent) {
                const parentId = product.category.parent.toString();
                categoryScore = categoryScores.get(parentId);
              }
              
              if (categoryScore) {
                categoryScore.score += 50; // Mỗi item wishlist = 50 điểm
                categoryScore.wishlistCount += 1;
              }
            }
          } catch (itemError) {
            console.error('❌ Error analyzing wishlist item:', itemError);
          }
        }
      }

      // FIXED: Phân tích từ cart items (đã được populate)
      if (behaviorData.currentCart?.items?.length > 0) {
        for (const item of behaviorData.currentCart.items) {
          try {
            // Data đã được populate trong analyzeUserBehaviorSimple
            const product = item.productVariant?.product;
            
            if (product?.category) {
              const categoryId = product.category._id.toString();
              let categoryScore = categoryScores.get(categoryId);
              
              // If child category not found, try to find parent category
              if (!categoryScore && product.category.parent) {
                const parentId = product.category.parent.toString();
                categoryScore = categoryScores.get(parentId);
              }
              
              if (categoryScore) {
                const itemScore = 30 * (item.quantity || 1); // Mỗi item cart = 30 điểm * quantity
                categoryScore.score += itemScore;
                categoryScore.cartCount += item.quantity || 1;
              }
            }
          } catch (itemError) {
            console.error('❌ Error analyzing cart item:', itemError);
          }
        }
      }

      // IMPLEMENTED: Phân tích từ recent orders
      if (behaviorData.recentOrders?.length > 0) {
        console.log('📦 Analyzing order history for category preferences...');
        
        for (const order of behaviorData.recentOrders) {
          if (order.items?.length > 0) {
            for (const orderItem of order.items) {
              try {
                // Order items đã được populate: items.productVariant.product.category
                const product = orderItem.productVariant?.product;
                if (product?.category) {
                  const categoryId = product.category._id.toString();
                  const categoryScore = categoryScores.get(categoryId);
                  
                  if (categoryScore) {
                    // Điểm cao hơn cho orders vì thể hiện hành vi mua thực tế
                    const orderPoints = 100;
                    const quantityBonus = (orderItem.quantity || 1) * 10; // Bonus cho số lượng
                    const totalPoints = orderPoints + quantityBonus;
                    
                    categoryScore.score += totalPoints;
                    categoryScore.orderFrequency += 1;
                    categoryScore.totalValue += (orderItem.price * orderItem.quantity) || 0;
                    console.log(`➕ Category "${product.category.name}" +${totalPoints} points from order (qty: ${orderItem.quantity})`);
                  }
                }
              } catch (itemError) {
                console.error('❌ Error analyzing order item:', itemError);
              }
            }
          }
        }
      }
      
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
   * Lấy top sản phẩm bán chạy trong 30 ngày (cho guest/new users)
   */
  async getTopSellingProducts(limit = 12, excludeIds = []) {
    try {
      console.log('🔥 Getting top selling products in last 30 days...');
      
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      // Aggregate để tính sản phẩm bán chạy (sử dụng productVariant)
      const topSellingAggregation = await Order.aggregate([
        {
          $match: {
            status: { $nin: ['cancelled'] },
            createdAt: { $gte: thirtyDaysAgo },
            items: { $exists: true, $ne: [] }
          }
        },
        { $unwind: '$items' },
        {
          $match: {
            'items.productVariant': { $exists: true, $ne: null }
          }
        },
        {
          $group: {
            _id: '$items.productVariant', // Sử dụng productVariant thay vì product
            totalQuantity: { $sum: '$items.quantity' },
            totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
            orderCount: { $sum: 1 }
          }
        },
        {
          $sort: { 
            totalQuantity: -1,  // Ưu tiên số lượng bán
            totalRevenue: -1     // Rồi đến doanh thu
          }
        },
        { $limit: limit * 2 } // Lấy nhiều hơn để filter
      ]);

      console.log('📊 Top selling aggregation found:', topSellingAggregation.length, 'product variants');

      if (topSellingAggregation.length === 0) {
        // Fallback: Lấy products mới nhất nếu không có sales data
        console.log('⚠️ No sales data, falling back to newest products');
        return await Product.find({
          isActive: true,
          _id: { $nin: excludeIds }
        })
        .populate('category', 'name parent')
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
      }

      // Lấy productVariant IDs và populate để lấy product thông tin
      const productVariantIds = topSellingAggregation
        .map(item => item._id)
        .filter(id => id) // Loại bỏ null values
        .slice(0, limit);

      console.log('🔍 Found productVariant IDs:', productVariantIds.length);
      console.log('🔍 ProductVariant IDs:', productVariantIds.slice(0, 3)); // Show first 3

      // Populate ProductVariant để lấy product thông tin
      const ProductVariant = require('../models/ProductVariantSchema');
      const topVariants = await ProductVariant.find({
        _id: { $in: productVariantIds },
        isActive: true
      })
      .populate({
        path: 'product',
        match: { 
          isActive: true,
          _id: { $nin: excludeIds }
        },
        populate: {
          path: 'category',
          select: 'name parent'
        }
      })
      .lean();

      console.log('🔍 ProductVariants found:', topVariants.length);
      console.log('🔍 ProductVariants with valid products:', topVariants.filter(v => v.product).length);

      // Lọc và lấy unique products (có thể có nhiều variants của cùng 1 product)
      const uniqueProducts = [];
      const seenProductIds = new Set();

      console.log('🔍 Processing variants for unique products...');
      for (const variant of topVariants) {
        console.log('🔍 Variant:', variant._id, 'Has product:', !!variant.product);
        
        if (variant.product && !seenProductIds.has(variant.product._id.toString())) {
          seenProductIds.add(variant.product._id.toString());
          
          // Thêm sales data từ aggregation
          const salesData = topSellingAggregation.find(item => 
            item._id && item._id.toString() === variant._id.toString()
          );
          
          const productWithSales = {
            ...variant.product,
            totalSold: salesData?.totalQuantity || 0,
            totalRevenue: salesData?.totalRevenue || 0,
            orderCount: salesData?.orderCount || 0
          };
          
          uniqueProducts.push(productWithSales);
          console.log('✅ Added unique product:', variant.product.name);
          
          if (uniqueProducts.length >= limit) break;
        } else if (!variant.product) {
          console.log('⚠️ Variant has no product:', variant._id);
        } else {
          console.log('⚠️ Product already seen:', variant.product._id);
        }
      }

      console.log('✅ Top selling products fetched:', uniqueProducts.length);
      
      // If we don't have enough products from top selling, fill with newest products
      if (uniqueProducts.length < limit) {
        console.log(`⚠️ Not enough top selling products (${uniqueProducts.length}/${limit}), filling with newest...`);
        
        const existingProductIds = uniqueProducts.map(p => p._id.toString());
        const allExcludeIds = [...excludeIds.map(id => id.toString()), ...existingProductIds];
        
        const newestProducts = await Product.find({
          isActive: true,
          _id: { $nin: allExcludeIds }
        })
        .populate('category', 'name parent')
        .sort({ createdAt: -1 })
        .limit(limit - uniqueProducts.length)
        .lean();
        
        console.log('📦 Added newest products:', newestProducts.length);
        uniqueProducts.push(...newestProducts);
      }
      
      console.log('✅ Final products count:', uniqueProducts.length);
      
      // ✅ ADD SALE PROCESSING - Apply sale info to products before returning
      console.log('💰 Processing sale information for top selling products...');
      const productsWithSales = await this.addSaleInfoToProducts(uniqueProducts);
      
      return productsWithSales;

    } catch (error) {
      console.error('❌ Error getting top selling products:', error);
      
      // Final fallback: newest products
      return await Product.find({
        isActive: true,
        _id: { $nin: excludeIds }
      })
      .populate('category', 'name parent')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    }
  }

  /**
   * Lấy sản phẩm được cá nhân hóa dựa trên hành vi user
   */
  async getPersonalizedProducts(userId, options = {}) {
    try {
      const { limit = 12, excludeIds = [], categoryFilters = [] } = options;
      
      console.log('🎯 PersonalizationService: Getting personalized products for user:', userId);
      console.log('🔧 Options:', { limit, excludeIds: excludeIds.length, categoryFilters: categoryFilters.length });

      // 1. Lấy personalized categories trước
      const personalizedCategoriesResponse = await this.getPersonalizedCategories(userId, {
        limit: 20,
        includeSubcategories: true
      });

      const personalizedCategories = personalizedCategoriesResponse.categories;
      const userBehaviorSummary = personalizedCategoriesResponse.userBehaviorSummary;

      console.log('📂 Got personalized categories:', personalizedCategories.length);
      console.log('🎚️ Personalization level:', userBehaviorSummary.personalizationLevel);

      // SPECIAL CASE: For guest users or users with NO personalization data, use top selling products
      if (!userId || userBehaviorSummary.personalizationLevel === 'new') {
        console.log('🔥 User has no personalization data - using top selling products');
        
        const topSellingProducts = await this.getTopSellingProducts(limit, excludeIds);
        
        return {
          products: topSellingProducts,
          personalizationLevel: userBehaviorSummary.personalizationLevel || 'new',
          basedOn: {
            categories: [],
            recentOrders: false,
            wishlist: false,
            cart: false,
            topSelling: true // Indicator that we used top selling
          },
          userBehaviorSummary: {
            totalOrders: userBehaviorSummary.totalOrders || 0,
            totalOrderValue: userBehaviorSummary.totalOrderValue || 0,
            wishlistItems: userBehaviorSummary.wishlistItems || 0,
            cartItems: userBehaviorSummary.cartItems || 0
          }
        };
      }

      // 2. Extract category IDs với priority scoring (for medium/high personalization users)
      const categoryScores = {};
      
      // Priority categories from personalization
      personalizedCategories.forEach(category => {
        const score = category.personalization?.score || 0;
        categoryScores[category._id.toString()] = score;
        
        // Include child categories with slightly lower score
        if (category.children && category.children.length > 0) {
          category.children.forEach(child => {
            categoryScores[child._id.toString()] = score * 0.8;
          });
        }
      });

      // Sort categories by score
      const prioritizedCategoryIds = Object.entries(categoryScores)
        .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
        .slice(0, 10) // Top 10 categories
        .map(([categoryId]) => categoryId);

      console.log('🏷️ Priority categories for products:', prioritizedCategoryIds.length);

      // 3. Build query for products
      const productQuery = {
        isActive: true
      };

      // Exclude specified products
      if (excludeIds.length > 0) {
        productQuery._id = { $nin: excludeIds };
      }

      // Category filtering
      let categoryFilter = categoryFilters.length > 0 ? categoryFilters : prioritizedCategoryIds;
      
      if (categoryFilter.length > 0) {
        productQuery.category = { $in: categoryFilter.slice(0, 5) }; // Use top 5 categories
      }

      console.log('🔍 Product query:', {
        categoryCount: categoryFilter.length,
        excludeCount: excludeIds.length
      });

      // 4. Fetch products với populate
      let products = await Product.find(productQuery)
        .populate('category', 'name parent')
        .limit(limit)
        .sort({ createdAt: -1 }) // Sort by newest first
        .lean();

      console.log('📦 Found products from personalized categories:', products.length);

      // 5. If not enough products, fill with top selling products
      if (products.length < limit) {
        const remainingLimit = limit - products.length;
        const existingIds = products.map(p => p._id.toString());
        
        console.log('📈 Need more products, fetching top selling fallback:', remainingLimit);
        
        const fallbackProducts = await this.getTopSellingProducts(remainingLimit * 2, [...existingIds, ...excludeIds]);
        const limitedFallback = fallbackProducts.slice(0, remainingLimit);

        products = [...products, ...limitedFallback];
        console.log('✅ Total products after top selling fallback:', products.length);
      }

      // 6. Determine what the personalization is based on
      const basedOn = {
        categories: prioritizedCategoryIds.slice(0, 3),
        recentOrders: userBehaviorSummary.totalOrders > 0,
        wishlist: userBehaviorSummary.wishlistItems > 0,
        cart: userBehaviorSummary.cartItems > 0
      };

      // ✅ ADD SALE PROCESSING - Apply sale info to products before returning
      console.log('💰 Processing sale information for personalized products...');
      const productsWithSales = await this.addSaleInfoToProducts(products.slice(0, limit));

      // 7. Format response
      const response = {
        products: productsWithSales,
        personalizationLevel: userBehaviorSummary.personalizationLevel,
        basedOn,
        userBehaviorSummary: {
          totalOrders: userBehaviorSummary.totalOrders,
          totalOrderValue: userBehaviorSummary.totalOrderValue,
          wishlistItems: userBehaviorSummary.wishlistItems,
          cartItems: userBehaviorSummary.cartItems
        }
      };

      console.log('✅ PersonalizationService: Products response ready:', {
        productsCount: response.products.length,
        personalizationLevel: response.personalizationLevel,
        basedOnCategories: response.basedOn.categories.length
      });

      return response;

    } catch (error) {
      console.error('❌ PersonalizationService getPersonalizedProducts Error:', error);
      
      // Fallback: Return regular products
      try {
        console.log('🔄 Fallback: Getting regular products');
        
        const fallbackQuery = {
          isActive: true
        };
        
        if (excludeIds.length > 0) {
          fallbackQuery._id = { $nin: excludeIds };
        }
        
        const fallbackProducts = await Product.find(fallbackQuery)
          .populate('category', 'name parent')
          .limit(limit)
          .sort({ createdAt: -1 })
          .lean();

        return {
          products: fallbackProducts,
          personalizationLevel: 'error',
          basedOn: {
            categories: [],
            recentOrders: false,
            wishlist: false,
            cart: false
          },
          userBehaviorSummary: {
            totalOrders: 0,
            totalOrderValue: 0,
            wishlistItems: 0,
            cartItems: 0
          }
        };
      } catch (fallbackError) {
        console.error('❌ PersonalizationService: Fallback also failed:', fallbackError);
        throw new Error('Failed to get personalized products');
      }
    }
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

  /**
   * Add sale information to products
   * Consistent with productService logic
   */
  async addSaleInfoToProducts(products) {
    try {
      console.log('💰 Adding sale information to', products.length, 'products');
      
      const productsWithSaleInfo = products.map(product => {
        const productObj = product.toObject ? product.toObject() : { ...product };
        
        // Check if product has sale price and valid sale logic
        const hasValidSale = productObj.salePrice && 
                           productObj.salePrice > 0 && 
                           productObj.salePrice < productObj.price;
        
        let isOnSale = false;
        let discountPercent = 0;
        
        if (hasValidSale) {
          // Check date range if specified
          if (productObj.saleStartDate || productObj.saleEndDate) {
            const now = new Date();
            const saleStart = productObj.saleStartDate ? new Date(productObj.saleStartDate) : null;
            const saleEnd = productObj.saleEndDate ? new Date(productObj.saleEndDate) : null;
            
            isOnSale = (!saleStart || now >= saleStart) && (!saleEnd || now <= saleEnd);
          } else {
            // No date restrictions, assume on sale
            isOnSale = true;
          }
          
          if (isOnSale) {
            discountPercent = Math.round((1 - productObj.salePrice / productObj.price) * 100);
          }
        }
        
        // Add sale information to product
        return {
          ...productObj,
          isOnSale,
          discountPercent,
          currentPrice: isOnSale ? productObj.salePrice : productObj.price
        };
      });
      
      console.log('✅ Sale processing complete:', {
        total: productsWithSaleInfo.length,
        onSale: productsWithSaleInfo.filter(p => p.isOnSale).length
      });
      
      return productsWithSaleInfo;
    } catch (error) {
      console.error('❌ Error adding sale info to products:', error);
      return products; // Return original if error
    }
  }
}

module.exports = PersonalizationService;
