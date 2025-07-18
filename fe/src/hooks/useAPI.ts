import { useState, useCallback } from 'react';
import { useNotification } from '../contexts';

/**
 * Generic hook for API operations with loading, error handling, and notifications
 * Use this to reduce boilerplate code in service hooks
 */
export function useAPI<T = any>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { success, error: showError } = useNotification();

  const execute = useCallback(async (
    apiCall: () => Promise<T>,
    options?: {
      successMessage?: string;
      errorMessage?: string;
      showSuccessNotification?: boolean;
      showErrorNotification?: boolean;
    }
  ): Promise<T> => {
    const {
      successMessage,
      errorMessage,
      showSuccessNotification = false,
      showErrorNotification = true,
    } = options || {};

    try {
      setLoading(true);
      setError(null);
      const result = await apiCall();
      
      if (showSuccessNotification && successMessage) {
        success(successMessage);
      }
      
      return result;
    } catch (err: any) {
      const errorMsg = errorMessage || err.message || 'An error occurred';
      setError(errorMsg);
      
      if (showErrorNotification) {
        showError('Error', errorMsg);
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, [success, showError]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    execute,
    clearError,
  };
}

/**
 * Hook for handling async operations with loading states
 * Use this for operations that don't need notifications
 */
export function useAsyncOperation<T = any>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);

  const execute = useCallback(async (
    apiCall: () => Promise<T>,
    options?: {
      resetDataOnStart?: boolean;
    }
  ): Promise<T> => {
    const { resetDataOnStart = false } = options || {};

    try {
      setLoading(true);
      setError(null);
      
      if (resetDataOnStart) {
        setData(null);
      }
      
      const result = await apiCall();
      setData(result);
      return result;
    } catch (err: any) {
      const errorMsg = err.message || 'An error occurred';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    data,
    execute,
    reset,
    clearError,
  };
}

/**
 * Hook for handling form submissions with loading and error states
 */
export function useFormSubmission<T = any>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { success: showSuccess, error: showError } = useNotification();

  const submit = useCallback(async (
    submitFunction: () => Promise<T>,
    options?: {
      successMessage?: string;
      errorMessage?: string;
      resetSuccessAfter?: number;
    }
  ): Promise<T> => {
    const {
      successMessage = 'Operation completed successfully',
      errorMessage,
      resetSuccessAfter = 3000,
    } = options || {};

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      
      const result = await submitFunction();
      
      setSuccess(true);
      showSuccess('Success', successMessage);
      
      // Reset success state after specified time
      if (resetSuccessAfter > 0) {
        setTimeout(() => setSuccess(false), resetSuccessAfter);
      }
      
      return result;
    } catch (err: any) {
      const errorMsg = errorMessage || err.message || 'An error occurred';
      setError(errorMsg);
      showError('Error', errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showSuccess, showError]);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setSuccess(false);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    success,
    submit,
    reset,
    clearError,
  };
}
