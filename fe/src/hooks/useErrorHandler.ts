import { useState } from 'react';

interface ErrorState {
  hasError: boolean;
  errorType?: 'network' | 'timeout' | 'server' | 'forbidden' | 'notfound' | 'maintenance';
  statusCode?: number;
  message?: string;
  customTitle?: string;
}

export const useErrorHandler = () => {
  const [errorState, setErrorState] = useState<ErrorState>({ hasError: false });

  const handleApiError = (error: any) => {
    console.error('API Error:', error);
    
    if (!error.response) {
      // Network error
      setErrorState({
        hasError: true,
        errorType: 'network',
        message: 'Không thể kết nối tới máy chủ. Vui lòng kiểm tra kết nối mạng.'
      });
      return;
    }

    const status = error.response.status;
    const errorMessage = error.response.data?.message || error.message;

    if (error.code === 'ECONNABORTED') {
      // Timeout error
      setErrorState({
        hasError: true,
        errorType: 'timeout',
        message: 'Yêu cầu đã hết thời gian chờ. Vui lòng thử lại.'
      });
      return;
    }

    // Handle specific status codes
    setErrorState({
      hasError: true,
      statusCode: status,
      message: errorMessage
    });
  };

  const setCustomError = (
    title: string, 
    message: string, 
    errorCode: string = 'ERR'
  ) => {
    setErrorState({
      hasError: true,
      customTitle: title,
      message,
      statusCode: parseInt(errorCode) || undefined
    });
  };

  const clearError = () => {
    setErrorState({ hasError: false });
  };

  const retryAction = (retryFn?: () => void) => {
    clearError();
    if (retryFn) {
      retryFn();
    }
  };

  const getErrorInfo = () => {
    if (!errorState.hasError) return null;
    
    return {
      type: errorState.errorType,
      statusCode: errorState.statusCode,
      message: errorState.message,
      title: errorState.customTitle
    };
  };

  return {
    errorState,
    handleApiError,
    setCustomError,
    clearError,
    retryAction,
    getErrorInfo,
    hasError: errorState.hasError
  };
};
