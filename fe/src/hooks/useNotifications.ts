import { useNotification } from '@/contexts';

/**
 * Custom hook for notification operations
 * Only accesses NotificationContext - does not make direct service calls
 */
export function useNotifications() {
  const context = useNotification();

  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }

  return {
    // Actions from context
    success: context.success,
    error: context.error,
    warning: context.warning,
    info: context.info,

    // Utility methods
    showSuccess: (message: string, description?: string) => context.success(message, description),
    showError: (message: string, description?: string) => context.error(message, description),
    showWarning: (message: string, description?: string) => context.warning(message, description),
    showInfo: (message: string, description?: string) => context.info(message, description),
  };
}
