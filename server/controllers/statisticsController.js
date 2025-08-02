const BaseController = require('./baseController');
const StatisticsService = require('../services/statisticsService');
const ResponseHandler = require('../services/responseHandler');

class StatisticsController extends BaseController {
  constructor() {
    super();
    this.statisticsService = new StatisticsService();
  }

  // Dashboard Overview with all data in one call
  getCompleteDashboard = async (req, res, next) => {
    try {
      const { ordersPage = 1, ordersLimit = 10, revenueChartPeriod = 'week' } = req.query;
      
      console.log('🚀 Starting complete dashboard data fetch...');
      
      // Fetch all data in parallel for maximum performance
      const [
        dashboardStats,
        recentOrders,
        paginatedOrders,
        revenueChart,
        recentActivity
      ] = await Promise.all([
        this.statisticsService.getDashboardStats(),
        this.statisticsService.getRecentOrders(5),
        this.statisticsService.getPaginatedOrders(parseInt(ordersPage), parseInt(ordersLimit)),
        this.statisticsService.getRevenueChart(revenueChartPeriod),
        this.statisticsService.getRecentActivity()
      ]);

      console.log('✅ Complete dashboard data fetched successfully');

      const completeData = {
        ...dashboardStats,
        recentOrders,
        paginatedOrders,
        revenueChart,
        recentActivity
      };

      ResponseHandler.success(res, 'Complete dashboard data retrieved successfully', completeData);
    } catch (error) {
      console.error('❌ Error fetching complete dashboard:', error);
      next(error);
    }
  };

  // Low Stock Statistics
  getLowStockStats = async (req, res, next) => {
    try {
      const lowStockStats = await this.statisticsService.getLowStockStats();
      ResponseHandler.success(res, 'Low stock statistics retrieved successfully', lowStockStats);
    } catch (error) {
      next(error);
    }
  };

  // Dashboard Overview
  getDashboardStats = async (req, res, next) => {
    try {
      const stats = await this.statisticsService.getDashboardStats();
      ResponseHandler.success(res, 'Dashboard statistics retrieved successfully', stats);
    } catch (error) {
      next(error);
    }
  };

  // Revenue Chart Data
  getRevenueChart = async (req, res, next) => {
    try {
      const { period = 'month' } = req.query;
      const chartData = await this.statisticsService.getRevenueChart(period);
      ResponseHandler.success(res, 'Revenue chart data retrieved successfully', chartData);
    } catch (error) {
      next(error);
    }
  };

  // Top Products Chart
  getTopProductsChart = async (req, res, next) => {
    try {
      const { limit = 10 } = req.query;
      const chartData = await this.statisticsService.getTopProductsChart(parseInt(limit));
      ResponseHandler.success(res, 'Top products chart data retrieved successfully', chartData);
    } catch (error) {
      next(error);
    }
  };

  // Order Status Distribution
  getOrderStatusChart = async (req, res, next) => {
    try {
      const chartData = await this.statisticsService.getOrderStatusChart();
      ResponseHandler.success(res, 'Order status chart data retrieved successfully', chartData);
    } catch (error) {
      next(error);
    }
  };

  // User Registration Trend
  getUserRegistrationChart = async (req, res, next) => {
    try {
      const { months = 12 } = req.query;
      const chartData = await this.statisticsService.getUserRegistrationChart(parseInt(months));
      ResponseHandler.success(res, 'User registration chart data retrieved successfully', chartData);
    } catch (error) {
      next(error);
    }
  };

  // Category Distribution
  getCategoryChart = async (req, res, next) => {
    try {
      const chartData = await this.statisticsService.getCategoryChart();
      ResponseHandler.success(res, 'Category chart data retrieved successfully', chartData);
    } catch (error) {
      next(error);
    }
  };

  // Recent Activity
  getRecentActivity = async (req, res, next) => {
    try {
      const activity = await this.statisticsService.getRecentActivity();
      ResponseHandler.success(res, 'Recent activity retrieved successfully', activity);
    } catch (error) {
      next(error);
    }
  };

  // Public basic statistics for About page
  getPublicStats = async (req, res, next) => {
    try {
      const stats = await this.statisticsService.getPublicStats();
      ResponseHandler.success(res, 'Public statistics retrieved successfully', stats);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = StatisticsController;
