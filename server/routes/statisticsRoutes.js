const express = require('express');
const router = express.Router();
const StatisticsController = require('../controllers/statisticsController');
const authenticateToken = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

const statisticsController = new StatisticsController();

// Public routes - no authentication required
router.get('/public', statisticsController.getPublicStats);

// Admin routes - require authentication and admin role
router.use(authenticateToken, adminMiddleware);

// GET /api/statistics/complete-dashboard - Get all dashboard data in one call (OPTIMIZED)
router.get('/complete-dashboard', statisticsController.getCompleteDashboard);

// GET /api/statistics/low-stock - Get low stock statistics
router.get('/low-stock', statisticsController.getLowStockStats);

// GET /api/statistics/dashboard - Get dashboard overview stats
router.get('/dashboard', statisticsController.getDashboardStats);

// GET /api/statistics/daily-revenue - Get daily revenue with accurate order count
router.get('/daily-revenue', statisticsController.getDailyRevenue);

// GET /api/statistics/revenue-chart - Get revenue chart data
router.get('/revenue-chart', statisticsController.getRevenueChart);

// GET /api/statistics/top-products - Get top products chart data
router.get('/top-products', statisticsController.getTopProductsChart);

// GET /api/statistics/order-status - Get order status chart data
router.get('/order-status', statisticsController.getOrderStatusChart);

// GET /api/statistics/user-registration - Get user registration chart data
router.get('/user-registration', statisticsController.getUserRegistrationChart);

// GET /api/statistics/category-distribution - Get category distribution chart data
router.get('/category-distribution', statisticsController.getCategoryChart);

// GET /api/statistics/recent-activity - Get recent activity
router.get('/recent-activity', statisticsController.getRecentActivity);

module.exports = router;
