import { apiClient } from '@/lib/api';

export interface StatisticsData {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  recentOrders: any[];
  topProducts: any[];
  salesByMonth: any[];
  ordersByStatus: any[];
}

export interface RevenueChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
  }>;
}

export interface TopProductsChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string[];
  }>;
}

export interface OrderStatusChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string[];
  }>;
}

export interface UserRegistrationChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
  }>;
}

export interface CategoryChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string[];
  }>;
}

export interface RecentActivity {
  id: string;
  type: 'order' | 'user' | 'product' | 'review';
  title: string;
  description: string;
  timestamp: string;
  userId?: string;
  userName?: string;
}

export class StatisticsService {
  private static instance: StatisticsService;

  private constructor() {}

  public static getInstance(): StatisticsService {
    if (!StatisticsService.instance) {
      StatisticsService.instance = new StatisticsService();
    }
    return StatisticsService.instance;
  }

  /**
   * Get dashboard statistics (Admin only)
   */
  async getDashboardStats(): Promise<StatisticsData> {
    try {
      const response = await apiClient.get<StatisticsData>('/api/statistics/dashboard');
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch dashboard statistics');
    }
  }

  /**
   * Get revenue chart data (Admin only)
   */
  async getRevenueChart(period?: 'day' | 'week' | 'month' | 'year'): Promise<RevenueChartData> {
    try {
      const params = period ? { period } : {};
      const response = await apiClient.get<RevenueChartData>('/api/statistics/revenue-chart', params);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch revenue chart data');
    }
  }

  /**
   * Get top products chart data (Admin only)
   */
  async getTopProductsChart(limit?: number): Promise<TopProductsChartData> {
    try {
      const params = limit ? { limit } : {};
      const response = await apiClient.get<TopProductsChartData>('/api/statistics/top-products', params);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch top products chart data');
    }
  }

  /**
   * Get order status chart data (Admin only)
   */
  async getOrderStatusChart(): Promise<OrderStatusChartData> {
    try {
      const response = await apiClient.get<OrderStatusChartData>('/api/statistics/order-status');
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch order status chart data');
    }
  }

  /**
   * Get user registration chart data (Admin only)
   */
  async getUserRegistrationChart(period?: 'day' | 'week' | 'month' | 'year'): Promise<UserRegistrationChartData> {
    try {
      const params = period ? { period } : {};
      const response = await apiClient.get<UserRegistrationChartData>('/api/statistics/user-registration', params);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch user registration chart data');
    }
  }

  /**
   * Get category distribution chart data (Admin only)
   */
  async getCategoryChart(): Promise<CategoryChartData> {
    try {
      const response = await apiClient.get<CategoryChartData>('/api/statistics/category-distribution');
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch category chart data');
    }
  }

  /**
   * Get recent activity data (Admin only)
   */
  async getRecentActivity(limit?: number): Promise<RecentActivity[]> {
    try {
      const params = limit ? { limit } : {};
      const response = await apiClient.get<RecentActivity[]>('/api/statistics/recent-activity', params);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch recent activity data');
    }
  }

  // ========== LEGACY METHODS (kept for backward compatibility) ==========

  /**
   * @deprecated Use getRevenueChart() instead
   */
  async getSalesStats(startDate?: string, endDate?: string): Promise<any> {
    try {
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await apiClient.get('/api/statistics/revenue-chart', params);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch sales statistics');
    }
  }

  /**
   * @deprecated Use getTopProductsChart() instead
   */
  async getProductStats(): Promise<any> {
    try {
      const response = await apiClient.get('/api/statistics/top-products');
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch product statistics');
    }
  }

  /**
   * @deprecated Use getUserRegistrationChart() instead
   */
  async getUserStats(): Promise<any> {
    try {
      const response = await apiClient.get('/api/statistics/user-registration');
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch user statistics');
    }
  }

  /**
   * @deprecated Use getOrderStatusChart() instead
   */
  async getOrderStats(period?: 'day' | 'week' | 'month' | 'year'): Promise<any> {
    try {
      const params = period ? { period } : {};
      const response = await apiClient.get('/api/statistics/order-status', params);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch order statistics');
    }
  }
}

// Export singleton instance
export const statisticsService = StatisticsService.getInstance();
export default statisticsService;
