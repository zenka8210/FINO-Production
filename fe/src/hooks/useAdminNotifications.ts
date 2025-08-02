import { useState, useEffect } from 'react';
import { adminNotificationService, NotificationData } from '@/services/adminNotificationService';

export const useAdminNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationData>({
    newOrdersCount: 0,
    outOfStockCount: 0,
    totalCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminNotificationService.getNotificationCounts();
      setNotifications(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch notifications');
      console.error('Error fetching admin notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return {
    notifications,
    loading,
    error,
    refetch: fetchNotifications
  };
};
