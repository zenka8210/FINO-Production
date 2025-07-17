import { apiClient } from '@/lib/api';
import { 
  Order, 
  OrderWithRefs, 
  CreateOrderRequest, 
  PaginatedResponse, 
  ApiResponse 
} from '@/types';

interface OrderFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  startDate?: string;
  endDate?: string;
  search?: string;
  paymentMethod?: string;
  userId?: string;
}

interface OrderStatistics {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  monthlyStats: { month: string; orders: number; revenue: number }[];
}

interface OrderTrends {
  dailyOrders: { date: string; orders: number; revenue: number }[];
  weeklyOrders: { week: string; orders: number; revenue: number }[];
  monthlyOrders: { month: string; orders: number; revenue: number }[];
}

interface TopSellingProduct {
  productId: string;
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
  orderCount: number;
}

interface CalculateOrderTotalRequest {
  items: Array<{
    productVariant: string;
    quantity: number;
  }>;
  voucher?: string;
  addressId: string;
}

interface CalculateOrderTotalResponse {
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  finalTotal: number;
  voucherApplied?: {
    code: string;
    discountValue: number;
    discountType: 'percentage' | 'fixed';
  };
}

export class OrderService {
  private static instance: OrderService;

  private constructor() {}

  public static getInstance(): OrderService {
    if (!OrderService.instance) {
      OrderService.instance = new OrderService();
    }
    return OrderService.instance;
  }

  // ========== USER ORDER METHODS ==========

  /**
   * Get user's orders with pagination and filters
   * GET /api/orders
   */
  async getUserOrders(filters?: OrderFilters): Promise<PaginatedResponse<OrderWithRefs>> {
    try {
      const response = await apiClient.getPaginated<OrderWithRefs>('/api/orders', filters);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch orders');
    }
  }

  /**
   * Create new order
   * POST /api/orders
   */
  async createOrder(orderData: CreateOrderRequest): Promise<OrderWithRefs> {
    try {
      const response = await apiClient.post<OrderWithRefs>('/api/orders', orderData);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create order');
    }
  }

  /**
   * Calculate order total before placing order
   * POST /api/orders/calculate-total
   */
  async calculateOrderTotal(data: CalculateOrderTotalRequest): Promise<CalculateOrderTotalResponse> {
    try {
      const response = await apiClient.post<CalculateOrderTotalResponse>('/api/orders/calculate-total', data);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to calculate order total');
    }
  }

  /**
   * Calculate shipping fee for address
   * GET /api/orders/shipping-fee/:addressId
   */
  async calculateShippingFee(addressId: string): Promise<{ shippingFee: number }> {
    try {
      const response = await apiClient.get<{ shippingFee: number }>(`/api/orders/shipping-fee/${addressId}`);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to calculate shipping fee');
    }
  }

  /**
   * Get order by ID (user can only see their own orders)
   * GET /api/orders/:id
   */
  async getOrderById(id: string): Promise<OrderWithRefs> {
    try {
      const response = await apiClient.get<OrderWithRefs>(`/api/orders/${id}`);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch order');
    }
  }

  /**
   * Cancel order (user can only cancel their own orders)
   * PUT /api/orders/:id/cancel
   */
  async cancelOrder(id: string): Promise<OrderWithRefs> {
    try {
      const response = await apiClient.put<OrderWithRefs>(`/api/orders/${id}/cancel`);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to cancel order');
    }
  }

  /**
   * Check if user can review product
   * GET /api/orders/:productId/can-review
   */
  async canReviewProduct(productId: string): Promise<{ canReview: boolean; reason?: string }> {
    try {
      const response = await apiClient.get<{ canReview: boolean; reason?: string }>(`/api/orders/${productId}/can-review`);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to check review eligibility');
    }
  }

  // ========== ADMIN ORDER METHODS ==========

  /**
   * Get all orders with filters (Admin)
   * GET /api/orders/admin/all
   */
  async getAllOrders(filters?: OrderFilters): Promise<PaginatedResponse<OrderWithRefs>> {
    try {
      const response = await apiClient.getPaginated<OrderWithRefs>('/api/orders/admin/all', filters);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch all orders');
    }
  }

  /**
   * Get order statistics for admin
   * GET /api/orders/admin/stats
   */
  async getOrderStats(): Promise<OrderStatistics> {
    try {
      const response = await apiClient.get<OrderStatistics>('/api/orders/admin/stats');
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch order statistics');
    }
  }

  /**
   * Get comprehensive order statistics for admin dashboard
   * GET /api/orders/admin/statistics
   */
  async getOrderStatistics(): Promise<OrderStatistics> {
    try {
      const response = await apiClient.get<OrderStatistics>('/api/orders/admin/statistics');
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch detailed order statistics');
    }
  }

  /**
   * Get order trends by date range
   * GET /api/orders/admin/trends
   */
  async getOrderTrends(days?: number): Promise<OrderTrends> {
    try {
      const params = days ? { days } : {};
      const response = await apiClient.get<OrderTrends>('/api/orders/admin/trends', params);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch order trends');
    }
  }

  /**
   * Get all orders with Query Middleware (pagination, search, sort, filter)
   * GET /api/orders/admin/all-with-query
   */
  async getAllOrdersWithQuery(filters?: OrderFilters): Promise<PaginatedResponse<OrderWithRefs>> {
    try {
      const response = await apiClient.getPaginated<OrderWithRefs>('/api/orders/admin/all-with-query', filters);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch orders with query');
    }
  }

  /**
   * Search orders (Admin)
   * GET /api/orders/admin/search
   */
  async searchOrders(query: string): Promise<OrderWithRefs[]> {
    try {
      const response = await apiClient.get<OrderWithRefs[]>('/api/orders/admin/search', { q: query });
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to search orders');
    }
  }

  /**
   * Get top selling products (Admin)
   * GET /api/orders/admin/top-products
   */
  async getTopSellingProducts(limit?: number): Promise<TopSellingProduct[]> {
    try {
      const params = limit ? { limit } : {};
      const response = await apiClient.get<TopSellingProduct[]>('/api/orders/admin/top-products', params);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch top selling products');
    }
  }

  /**
   * Get orders by payment method (Admin)
   * GET /api/orders/admin/payment-method/:paymentMethod
   */
  async getOrdersByPaymentMethod(paymentMethod: string, filters?: OrderFilters): Promise<PaginatedResponse<OrderWithRefs>> {
    try {
      const response = await apiClient.getPaginated<OrderWithRefs>(`/api/orders/admin/payment-method/${paymentMethod}`, filters);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch orders by payment method');
    }
  }

  /**
   * Get orders by user ID (Admin)
   * GET /api/orders/admin/user/:userId
   */
  async getOrdersByUserId(userId: string, filters?: OrderFilters): Promise<PaginatedResponse<OrderWithRefs>> {
    try {
      const response = await apiClient.getPaginated<OrderWithRefs>(`/api/orders/admin/user/${userId}`, filters);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch orders by user');
    }
  }

  /**
   * Update order status ONLY (Admin restriction)
   * PUT /api/orders/admin/:id/status
   */
  async updateOrderStatus(id: string, status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'): Promise<OrderWithRefs> {
    try {
      const response = await apiClient.put<OrderWithRefs>(`/api/orders/admin/${id}/status`, { status });
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update order status');
    }
  }

  /**
   * Admin cancel order (restricted to pending/processing)
   * PUT /api/orders/admin/:id/cancel
   */
  async cancelOrderByAdmin(id: string): Promise<OrderWithRefs> {
    try {
      const response = await apiClient.put<OrderWithRefs>(`/api/orders/admin/${id}/cancel`);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to cancel order');
    }
  }

  /**
   * Delete order (Admin only, only cancelled orders)
   * DELETE /api/orders/admin/:id
   */
  async deleteOrder(id: string): Promise<ApiResponse<any>> {
    try {
      return await apiClient.delete(`/api/orders/admin/${id}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete order');
    }
  }

  /**
   * Update shipping fees for existing orders (Admin migration)
   * PUT /api/orders/admin/update-shipping-fees
   */
  async updateExistingOrdersShippingFees(): Promise<ApiResponse<any>> {
    try {
      return await apiClient.put('/api/orders/admin/update-shipping-fees');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update shipping fees');
    }
  }
}

// Create and export singleton instance
export const orderService = OrderService.getInstance();