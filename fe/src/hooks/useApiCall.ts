import { useState, useCallback } from 'react';
import { ApiError } from '@/lib/api';
import { useNotification } from '@/contexts/NotificationContext';

interface UseApiCallOptions {
  showSuccessMessage?: boolean;
  showErrorMessage?: boolean;
  successMessage?: string;
  errorMessage?: string;
}

interface UseApiCallResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (...args: any[]) => Promise<T>;
  reset: () => void;
}

/**
 * Custom hook for handling API calls with loading, error states, and notifications
 * 
 * @param apiCall - The API function to call
 * @param options - Configuration options
 * @returns Object with data, loading, error states and execute function
 */
export function useApiCall<T>(
  apiCall: (...args: any[]) => Promise<T>,
  options: UseApiCallOptions = {}
): UseApiCallResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { success, error: showError } = useNotification();

  const {
    showSuccessMessage = false,
    showErrorMessage = true,
    successMessage = 'Operation completed successfully',
    errorMessage = 'Operation failed'
  } = options;

  const execute = useCallback(async (...args: any[]): Promise<T> => {
    try {
      setLoading(true);
      setError(null);

      const result = await apiCall(...args);
      setData(result);

      if (showSuccessMessage) {
        success('Success', successMessage);
      }

      return result;
    } catch (err: any) {
      const errorMsg = err instanceof ApiError ? err.message : errorMessage;
      setError(errorMsg);

      if (showErrorMessage) {
        showError('Error', errorMsg);
      }

      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiCall, showSuccessMessage, showErrorMessage, successMessage, errorMessage, success, showError]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset
  };
}

/**
 * Custom hook for handling paginated API calls
 */
interface UsePaginatedApiCallOptions extends UseApiCallOptions {
  initialPage?: number;
  initialLimit?: number;
}

interface UsePaginatedApiCallResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  pagination: {
    current: number;
    total: number;
    limit: number;
    totalPages: number;
  } | null;
  loadPage: (page: number, limit?: number) => Promise<void>;
  loadNextPage: () => Promise<void>;
  loadPreviousPage: () => Promise<void>;
  reset: () => void;
}

export function usePaginatedApiCall<T>(
  apiCall: (page: number, limit: number, ...args: any[]) => Promise<{ data: T[]; pagination: any }>,
  options: UsePaginatedApiCallOptions = {}
): UsePaginatedApiCallResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<any>(null);
  const { error: showError } = useNotification();

  const {
    initialPage = 1,
    initialLimit = 10,
    showErrorMessage = true,
    errorMessage = 'Failed to load data'
  } = options;

  const loadPage = useCallback(async (page: number, limit: number = initialLimit, ...args: any[]): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const result = await apiCall(page, limit, ...args);
      setData(result.data);
      setPagination(result.pagination);
    } catch (err: any) {
      const errorMsg = err instanceof ApiError ? err.message : errorMessage;
      setError(errorMsg);

      if (showErrorMessage) {
        showError('Error', errorMsg);
      }

      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiCall, initialLimit, errorMessage, showErrorMessage, showError]);

  const loadNextPage = useCallback(async (): Promise<void> => {
    if (pagination && pagination.current < pagination.totalPages) {
      await loadPage(pagination.current + 1, pagination.limit);
    }
  }, [pagination, loadPage]);

  const loadPreviousPage = useCallback(async (): Promise<void> => {
    if (pagination && pagination.current > 1) {
      await loadPage(pagination.current - 1, pagination.limit);
    }
  }, [pagination, loadPage]);

  const reset = useCallback(() => {
    setData([]);
    setError(null);
    setLoading(false);
    setPagination(null);
  }, []);

  return {
    data,
    loading,
    error,
    pagination,
    loadPage,
    loadNextPage,
    loadPreviousPage,
    reset
  };
}

/**
 * Custom hook for handling file uploads with progress
 */
interface UseFileUploadOptions extends UseApiCallOptions {
  onProgress?: (progress: number) => void;
}

interface UseFileUploadResult {
  uploading: boolean;
  progress: number;
  error: string | null;
  upload: (file: File) => Promise<any>;
  uploadMultiple: (files: File[]) => Promise<any>;
  reset: () => void;
}

export function useFileUpload(
  uploadUrl: string,
  options: UseFileUploadOptions = {}
): UseFileUploadResult {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { success, error: showError } = useNotification();

  const {
    showSuccessMessage = true,
    showErrorMessage = true,
    successMessage = 'File uploaded successfully',
    errorMessage = 'File upload failed',
    onProgress
  } = options;

  const upload = useCallback(async (file: File): Promise<any> => {
    try {
      setUploading(true);
      setError(null);
      setProgress(0);

      const { apiClient } = await import('@/lib/api');
      
      const result = await apiClient.uploadFile(uploadUrl, file, (progress) => {
        setProgress(progress);
        if (onProgress) {
          onProgress(progress);
        }
      });

      if (showSuccessMessage) {
        success('Success', successMessage);
      }

      return result;
    } catch (err: any) {
      const errorMsg = err instanceof ApiError ? err.message : errorMessage;
      setError(errorMsg);

      if (showErrorMessage) {
        showError('Error', errorMsg);
      }

      throw err;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [uploadUrl, showSuccessMessage, showErrorMessage, successMessage, errorMessage, onProgress, success, showError]);

  const uploadMultiple = useCallback(async (files: File[]): Promise<any> => {
    try {
      setUploading(true);
      setError(null);
      setProgress(0);

      const { apiClient } = await import('@/lib/api');
      
      const result = await apiClient.uploadFiles(uploadUrl, files, (progress) => {
        setProgress(progress);
        if (onProgress) {
          onProgress(progress);
        }
      });

      if (showSuccessMessage) {
        success('Success', successMessage);
      }

      return result;
    } catch (err: any) {
      const errorMsg = err instanceof ApiError ? err.message : errorMessage;
      setError(errorMsg);

      if (showErrorMessage) {
        showError('Error', errorMsg);
      }

      throw err;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [uploadUrl, showSuccessMessage, showErrorMessage, successMessage, errorMessage, onProgress, success, showError]);

  const reset = useCallback(() => {
    setError(null);
    setUploading(false);
    setProgress(0);
  }, []);

  return {
    uploading,
    progress,
    error,
    upload,
    uploadMultiple,
    reset
  };
}
