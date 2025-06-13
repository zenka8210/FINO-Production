const BaseController = require('./baseController');
const StatisticsService = require('../services/statisticsService');
const ResponseHandler = require('../services/responseHandler');

class StatisticsController extends BaseController {
  constructor() {
    super();
    this.statisticsService = new StatisticsService();
  }

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
}

module.exports = StatisticsController;
