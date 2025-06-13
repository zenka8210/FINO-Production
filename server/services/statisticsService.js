const BaseService = require('./baseService');
const User = require('../models/UserSchema');
const Product = require('../models/ProductSchema');
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
      const [userStats, productStats, orderStats] = await Promise.all([
        this.getUserStats(),
        this.getProductStats(),
        this.getOrderStats()
      ]);

      return {
        users: userStats,
        products: productStats,
        orders: orderStats
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

  // Order Statistics
  async getOrderStats() {
    const [totalOrders, completedOrders, pendingOrders, totalRevenue] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: 'completed' }),
      Order.countDocuments({ status: 'pending' }),
      Order.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ])
    ]);

    return {
      total: totalOrders,
      completed: completedOrders,
      pending: pendingOrders,
      revenue: totalRevenue[0]?.total || 0
    };
  }

  // Revenue Chart Data (Line Chart)
  async getRevenueChart(period = 'month') {
    let groupBy, dateFormat;
    
    switch (period) {
      case 'week':
        groupBy = {
          year: { $year: '$createdAt' },
          week: { $week: '$createdAt' }
        };
        dateFormat = 'Week';
        break;
      case 'year':
        groupBy = {
          year: { $year: '$createdAt' }
        };
        dateFormat = 'Year';
        break;
      default: // month
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        };
        dateFormat = 'Month';
    }

    const revenueData = await Order.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: groupBy,
          revenue: { $sum: '$total' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.week': 1 } },
      { $limit: 12 }
    ]);

    return {
      labels: revenueData.map(item => {
        if (period === 'year') return item._id.year.toString();
        if (period === 'week') return `W${item._id.week}/${item._id.year}`;
        return `${item._id.month}/${item._id.year}`;
      }),
      data: revenueData.map(item => item.revenue),
      orders: revenueData.map(item => item.orders)
    };
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
}

module.exports = StatisticsService;
