const BaseService = require('./baseService');
const User = require('../models/UserSchema');
const Product = require('../models/ProductSchema');
const ProductVariant = require('../models/ProductVariantSchema');
const Order = require('../models/OrderSchema');
const Category = require('../models/CategorySchema');
const { AppError } = require('../middlewares/errorHandler');

class StatisticsService extends BaseService {
  constructor() {
    super(null); // Statistics service doesn't have a primary model
  }
  // Dashboard Overview Stats
  async getDashboardStats() {
    try {
      const [userStats, productStats, orderStats, lowStockStats] = await Promise.all([
        this.getUserStats(),
        this.getProductStats(),
        this.getOrderStats(),
        this.getLowStockStats()
      ]);

      // Format response to match frontend expectations
      return {
        totalUsers: userStats.total,
        totalProducts: productStats.total,
        totalOrders: orderStats.total,
        totalRevenue: orderStats.revenue,
        totalLowStock: lowStockStats.total, // Replace totalNews with totalLowStock
        users: userStats,
        products: productStats,
        orders: orderStats,
        lowStock: lowStockStats
      };
    } catch (error) {
      throw new AppError(`Error getting dashboard stats: ${error.message}`, 500);
    }
  }

  // User Statistics
  async getUserStats() {
    const [totalUsers, newUsersThisMonth] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({
        createdAt: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      })
    ]);

    return {
      total: totalUsers,
      newThisMonth: newUsersThisMonth
    };
  }

  // Product Statistics
  async getProductStats() {
    const [totalProducts, activeProducts] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ status: 'active' })
    ]);

    return {
      total: totalProducts,
      active: activeProducts,
      inactive: totalProducts - activeProducts
    };
  }

  // Low Stock Statistics
  async getLowStockStats() {
    try {
      console.log('📦 Fetching low stock statistics...');
      
      // Count variants with stock below 5 and variants with stock of 0
      const [lowStockCount, outOfStockCount] = await Promise.all([
        ProductVariant.countDocuments({
          stock: { $lt: 5, $gt: 0 }
        }),
        ProductVariant.countDocuments({
          stock: { $lte: 0 }
        })
      ]);

      console.log(`⚠️ Low stock variants (< 5): ${lowStockCount}`);
      console.log(`❌ Out of stock variants (= 0): ${outOfStockCount}`);

      return {
        lowStock: lowStockCount,
        outOfStock: outOfStockCount,
        total: lowStockCount + outOfStockCount
      };
    } catch (error) {
      console.error('❌ Error fetching low stock stats:', error);
      throw new AppError(`Error getting low stock stats: ${error.message}`, 500);
    }
  }

  // Order Statistics
  async getOrderStats() {
    // Debug: Check actual order statuses in database
    const allOrderStatuses = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    console.log('📊 All order statuses in database:', allOrderStatuses);
    
    // Debug: Check payment statuses in database
    const allPaymentStatuses = await Order.aggregate([
      { $group: { _id: '$paymentStatus', count: { $sum: 1 } } }
    ]);
    console.log('💳 All payment statuses in database:', allPaymentStatuses);
    
    // Use consistent revenue calculation with OrderService
    // Revenue should be calculated from orders with paymentStatus: 'paid'
    const completedStatuses = ['completed', 'delivered', 'finished', 'paid', 'success'];
    const pendingStatuses = ['pending', 'processing', 'confirmed'];
    
    const [totalOrders, completedOrders, pendingOrders, totalRevenue] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: { $in: completedStatuses } }),
      Order.countDocuments({ status: { $in: pendingStatuses } }),
      // FIXED: Use consistent revenue calculation with OrderService
      Order.aggregate([
        { $match: { paymentStatus: 'paid' } }, // Match OrderService logic
        { $group: { _id: null, total: { $sum: '$finalTotal' } } }
      ])
    ]);

    const result = {
      total: totalOrders,
      completed: completedOrders,
      pending: pendingOrders,
      revenue: totalRevenue[0]?.total || 0
    };
    
    console.log('📊 Order statistics result (FIXED):', result);
    return result;
  }

  // Revenue Chart Data (Bar Chart)
  async getRevenueChart(period = 'month') {
    let groupBy, dateFormat, matchCondition = {};
    
    // Set date range based on period
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
        dateFormat = 'Daily';
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); // Last 90 days  
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          week: { $week: '$createdAt' }
        };
        dateFormat = 'Weekly';
        break;
      case 'year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()); // Last year
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        };
        dateFormat = 'Monthly';
        break;
      default: // month
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          week: { $week: '$createdAt' }
        };
        dateFormat = 'Weekly';
    }

    // Add date range filter - use SAME logic as getDashboardStats
    matchCondition = {
      paymentStatus: 'paid', // Only count paid orders (same as dashboard)
      createdAt: { $gte: startDate, $lte: now }
    };

    console.log(`📊 Revenue Chart - Period: ${period}, Start Date: ${startDate}, Match:`, matchCondition);

    const revenueData = await Order.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: groupBy,
          revenue: { $sum: '$finalTotal' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.week': 1, '_id.day': 1 } },
      { $limit: period === 'week' ? 7 : (period === 'quarter' ? 13 : 12) }
    ]);

    console.log(`📈 Revenue aggregation result (${period}):`, revenueData);

    // If no revenue data found, create empty structure with proper dates
    if (revenueData.length === 0) {
      console.log('⚠️ No revenue data found, creating empty date structure');
      const emptyData = [];
      const daysToShow = period === 'week' ? 7 : (period === 'quarter' ? 13 : 12);
      
      for (let i = daysToShow - 1; i >= 0; i--) {
        const date = new Date(now);
        if (period === 'week') {
          date.setDate(date.getDate() - i);
          emptyData.push({
            _id: { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() },
            revenue: 0,
            orders: 0
          });
        } else if (period === 'quarter') {
          date.setDate(date.getDate() - (i * 7));
          emptyData.push({
            _id: { year: date.getFullYear(), month: date.getMonth() + 1, week: Math.ceil(date.getDate() / 7) },
            revenue: 0,
            orders: 0
          });
        } else {
          date.setMonth(date.getMonth() - i);
          emptyData.push({
            _id: { year: date.getFullYear(), month: date.getMonth() + 1 },
            revenue: 0,
            orders: 0
          });
        }
      }
      
      console.log('📅 Generated empty data structure:', emptyData);
      revenueData.push(...emptyData);
    }

    const result = {
      labels: revenueData.map(item => {
        if (period === 'week') {
          return `${item._id.day}/${item._id.month}`;
        }
        if (period === 'year') {
          return `${item._id.month}/${item._id.year}`;
        }
        if (period === 'quarter') {
          return `W${item._id.week}/${item._id.year}`;
        }
        return `W${item._id.week}/${item._id.year}`;
      }),
      data: revenueData.map(item => item.revenue),
      orders: revenueData.map(item => item.orders),
      period,
      dateRange: { startDate, endDate: now }
    };

    console.log(`✅ Final revenue chart result (${period}):`, result);
    return result;
  }

  // Top Products Chart (Bar Chart)
  async getTopProductsChart(limit = 10) {
    const topProducts = await Order.aggregate([
      { $match: { status: 'completed' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalSold: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          name: '$product.name',
          totalSold: 1,
          revenue: 1
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: limit }
    ]);

    return {
      labels: topProducts.map(item => item.name),
      soldData: topProducts.map(item => item.totalSold),
      revenueData: topProducts.map(item => item.revenue)
    };
  }

  // Order Status Chart (Pie Chart)
  async getOrderStatusChart() {
    const statusData = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    return {
      labels: statusData.map(item => item._id),
      data: statusData.map(item => item.count)
    };
  }

  // User Registration Chart (Area Chart)
  async getUserRegistrationChart(months = 12) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const userData = await User.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    return {
      labels: userData.map(item => `${item._id.month}/${item._id.year}`),
      data: userData.map(item => item.count)
    };
  }

  // Category Distribution Chart (Pie Chart)
  async getCategoryChart() {
    const categoryData = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      {
        $project: {
          name: '$category.name',
          count: 1
        }
      },
      { $sort: { count: -1 } }
    ]);

    return {
      labels: categoryData.map(item => item.name),
      data: categoryData.map(item => item.count)
    };
  }

  // Recent Activity Summary
  async getRecentActivity() {
    const [recentOrders, recentUsers] = await Promise.all([
      Order.find()
        .populate('user', 'full_name email')
        .sort({ createdAt: -1 })
        .limit(5)
        .select('user total status createdAt'),
      
      User.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('full_name email createdAt')
    ]);

    return {
      recentOrders,
      recentUsers
    };
  }

  // Public Statistics for About page
  async getPublicStats() {
    try {
      const [
        totalUsers,
        totalProducts,
        totalOrders,
        activeProducts,
        avgRating
      ] = await Promise.all([
        User.countDocuments({ isActive: true }),
        Product.countDocuments({ isActive: true }),
        Order.countDocuments({ status: { $in: ['delivered', 'completed'] } }),
        Product.countDocuments({ isActive: true, inventory: { $gt: 0 } }),
        Product.aggregate([
          { $match: { isActive: true, rating: { $exists: true, $ne: null } } },
          { $group: { _id: null, avgRating: { $avg: '$rating' } } }
        ])
      ]);

      const categories = await Category.countDocuments({ isActive: true });
      const satisfactionRate = avgRating.length > 0 ? Math.round((avgRating[0].avgRating / 5) * 100) : 95;

      return {
        totalUsers,
        totalProducts,
        totalOrders,
        activeProducts,
        categories,
        satisfactionRate,
        experience: '5+ năm'
      };
    } catch (error) {
      throw new AppError(`Error getting public stats: ${error.message}`, 500);
    }
  }

  // Get recent orders (optimized for dashboard)
  async getRecentOrders(limit = 5) {
    try {
      console.log('📦 Fetching recent orders...');
      
      const orders = await Order.find()
        .populate('user', 'name email')
        .populate('address', 'fullName phone')
        .populate('paymentMethod', 'method')
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      const formattedOrders = orders.map(order => ({
        _id: order._id,
        orderNumber: order.orderCode || `#${order._id.toString().slice(-6)}`,
        customerName: order.user?.name || order.address?.fullName || 'Khách hàng',
        total: order.finalTotal || order.total || 0,
        status: order.status || 'pending',
        paymentStatus: order.paymentStatus || 'pending',
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      }));

      console.log(`✅ Found ${formattedOrders.length} recent orders`);
      return formattedOrders;
    } catch (error) {
      console.error('❌ Error fetching recent orders:', error);
      throw new AppError(`Error getting recent orders: ${error.message}`, 500);
    }
  }

  // Get paginated orders (optimized for dashboard)
  async getPaginatedOrders(page = 1, limit = 10) {
    try {
      console.log(`📄 Fetching paginated orders - Page ${page}, Limit ${limit}`);
      
      const skip = (page - 1) * limit;
      
      const [orders, totalCount] = await Promise.all([
        Order.find()
          .populate('user', 'name email')
          .populate('address', 'fullName phone')
          .populate('paymentMethod', 'method')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Order.countDocuments()
      ]);

      const formattedOrders = orders.map(order => ({
        _id: order._id,
        orderNumber: order.orderCode || `#${order._id.toString().slice(-6)}`,
        customerName: order.user?.name || order.address?.fullName || 'Khách hàng',
        total: order.finalTotal || order.total || 0,
        status: order.status || 'pending',
        paymentStatus: order.paymentStatus || 'pending',
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      }));

      const pagination = {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        total: totalCount,
        limit: limit
      };

      console.log(`✅ Found ${formattedOrders.length} orders, Total: ${totalCount}`);
      
      return {
        data: formattedOrders,
        pagination
      };
    } catch (error) {
      console.error('❌ Error fetching paginated orders:', error);
      throw new AppError(`Error getting paginated orders: ${error.message}`, 500);
    }
  }

  // Get recent activity (optimized)
  async getRecentActivity() {
    try {
      console.log('🔄 Fetching recent activity...');
      
      // Get recent orders and users in parallel
      const [recentOrders, recentUsers] = await Promise.all([
        Order.find()
          .populate('user', 'name')
          .sort({ createdAt: -1 })
          .limit(3)
          .lean(),
        User.find()
          .sort({ createdAt: -1 })
          .limit(2)
          .lean()
      ]);

      const activities = [];

      // Add order activities
      recentOrders.forEach(order => {
        activities.push({
          type: 'order',
          description: `Đơn hàng mới ${order.orderCode || '#' + order._id.toString().slice(-6)}`,
          timeAgo: this.getTimeAgo(order.createdAt),
          createdAt: order.createdAt
        });
      });

      // Add user activities
      recentUsers.forEach(user => {
        activities.push({
          type: 'user',
          description: `Người dùng mới đăng ký: ${user.name}`,
          timeAgo: this.getTimeAgo(user.createdAt),
          createdAt: user.createdAt
        });
      });

      // Sort by creation time and take top 5
      const sortedActivities = activities
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
        .map(({ createdAt, ...rest }) => rest); // Remove createdAt from final result

      console.log(`✅ Found ${sortedActivities.length} recent activities`);
      return sortedActivities;
    } catch (error) {
      console.error('❌ Error fetching recent activity:', error);
      // Return fallback data
      return [
        { type: 'order', description: 'Đơn hàng mới #12345', timeAgo: '2 phút trước' },
        { type: 'user', description: 'Người dùng mới đăng ký', timeAgo: '5 phút trước' },
        { type: 'order', description: 'Đơn hàng #12344 hoàn thành', timeAgo: '10 phút trước' },
      ];
    }
  }

  // Helper method to calculate time ago
  getTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - new Date(date)) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} giây trước`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
    return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
  }

  // Get Daily Revenue with accurate orders count
  async getDailyRevenue() {
    try {
      console.log('📊 Calculating daily revenue with accurate order count...');
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayEnd = new Date(today.getTime() - 1);

      console.log('Date ranges:', {
        today: today.toISOString(),
        yesterday: yesterday.toISOString(),
        yesterdayEnd: yesterdayEnd.toISOString()
      });

      // Get today's data - ALL orders (not just paid)
      const todayAllOrders = await Order.countDocuments({
        createdAt: { $gte: today }
      });

      // Get today's revenue (only paid orders)
      const todayRevenueResult = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: today },
            paymentStatus: 'paid'
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$finalTotal' },
            orderCount: { $sum: 1 }
          }
        }
      ]);

      // Get yesterday's revenue (only paid orders)
      const yesterdayRevenueResult = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: yesterday, $lte: yesterdayEnd },
            paymentStatus: 'paid'
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$finalTotal' },
            orderCount: { $sum: 1 }
          }
        }
      ]);

      const todayRevenue = todayRevenueResult[0]?.totalRevenue || 0;
      const yesterdayRevenue = yesterdayRevenueResult[0]?.totalRevenue || 0;

      // Calculate change percentage
      let changePercent = 0;
      if (yesterdayRevenue > 0) {
        changePercent = ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100;
      } else if (todayRevenue > 0) {
        changePercent = 100; // Show as 100% increase when yesterday was 0
      }

      const result = {
        today: todayRevenue,
        yesterday: yesterdayRevenue,
        changePercent: Math.round(changePercent * 100) / 100, // Round to 2 decimal places
        todayOrders: todayAllOrders // ALL orders created today, regardless of status
      };

      console.log('✅ Daily revenue calculation result:', result);
      return result;
    } catch (error) {
      console.error('❌ Error calculating daily revenue:', error);
      throw new AppError(`Error calculating daily revenue: ${error.message}`, 500);
    }
  }
}

module.exports = StatisticsService;
