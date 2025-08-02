import { apiClient } from '@/lib/api';

export interface NotificationData {
  newOrdersCount: number;
  outOfStockCount: number;
  totalCount: number;
}

export class AdminNotificationService {
  private static instance: AdminNotificationService;

  private constructor() {}

  public static getInstance(): AdminNotificationService {
    if (!AdminNotificationService.instance) {
      AdminNotificationService.instance = new AdminNotificationService();
    }
    return AdminNotificationService.instance;
  }

  /**
   * Get notification counts for admin header
   */
  async getNotificationCounts(): Promise<NotificationData> {
    try {
      // Get new orders count (status = 'pending')
      const newOrdersResponse = await apiClient.get('/api/orders/admin/all?status=pending&limit=1');
      const newOrdersCount = newOrdersResponse.data?.pagination?.total || 0;

      // Get out of stock variants count
      const outOfStockResponse = await apiClient.get('/api/product-variants/admin/out-of-stock');
      const outOfStockCount = outOfStockResponse.data?.length || 0;

      const totalCount = newOrdersCount + outOfStockCount;

      return {
        newOrdersCount,
        outOfStockCount,
        totalCount
      };
    } catch (error: any) {
      console.error('Failed to fetch notification counts:', error);
      return {
        newOrdersCount: 0,
        outOfStockCount: 0,
        totalCount: 0
      };
    }
  }
}

export const adminNotificationService = AdminNotificationService.getInstance();
export default adminNotificationService;
