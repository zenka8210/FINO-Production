import { useNotification } from '@/contexts';
import { translateError, translateSuccess } from '@/lib/messageTranslator';

/**
 * Custom hook for handling API responses with Vietnamese notifications
 */
export function useApiNotification() {
  const { success, error, warning, info } = useNotification();

  /**
   * Show success notification with Vietnamese message
   */
  const showSuccess = (message: string, details?: string) => {
    return success(translateSuccess(message), details ? translateSuccess(details) : undefined);
  };

  /**
   * Show error notification with Vietnamese message
   * Handles error objects from API responses
   */
  const showError = (title: string, errorObj?: any) => {
    let message = '';
    
    if (typeof errorObj === 'string') {
      message = errorObj;
    } else if (errorObj?.response?.data?.message) {
      message = errorObj.response.data.message;
    } else if (errorObj?.message) {
      message = errorObj.message;
    }
    
    return error(translateError(title), message ? translateError(message) : undefined);
  };

  /**
   * Show warning notification with Vietnamese message
   */
  const showWarning = (title: string, message?: string) => {
    return warning(translateError(title), message ? translateError(message) : undefined);
  };

  /**
   * Show info notification with Vietnamese message
   */
  const showInfo = (title: string, message?: string) => {
    return info(translateSuccess(title), message ? translateSuccess(message) : undefined);
  };

  /**
   * Handle API response and show appropriate notification
   */
  const handleApiResponse = (response: any, successMessage?: string) => {
    if (response?.success) {
      const message = successMessage || response.message || 'Thao tác thành công';
      showSuccess(message);
    } else {
      const message = response?.message || 'Có lỗi xảy ra';
      showError('Thao tác thất bại', message);
    }
  };

  /**
   * Handle API error and show error notification
   */
  const handleApiError = (errorObj: any, customTitle?: string) => {
    const title = customTitle || 'Có lỗi xảy ra';
    showError(title, errorObj);
  };

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    handleApiResponse,
    handleApiError,
  };
}
