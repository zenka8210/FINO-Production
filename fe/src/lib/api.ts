import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { ApiResponse, PaginatedResponse } from '@/types';

// API Configuration
const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  timeout: 15000, // Increased timeout for better stability
  withCredentials: true, // Enable cookies/session support for guest users
  headers: {
    'Content-Type': 'application/json',
  },
};

// Token management keys
const TOKEN_KEY = 'authToken';
const USER_KEY = 'currentUser';

// Custom error class for better error handling
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create(API_CONFIG);
    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - add auth token and logging
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Log request in development (reduced)
        if (process.env.NODE_ENV === 'development') {
          // Only log non-GET requests or important ones
          if (config.method !== 'get' || config.url?.includes('batch') || config.url?.includes('auth')) {
            console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
          }
        }
        
        return config;
      },
      (error) => {
        console.error('❌ Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor - handle common responses and errors
    this.client.interceptors.response.use(
      (response: AxiosResponse<ApiResponse<any> | PaginatedResponse<any>>) => {
        // Log response in development (reduced)
        if (process.env.NODE_ENV === 'development') {
          // Only log non-GET responses or important ones
          if (response.config.method !== 'get' || response.config.url?.includes('batch') || response.config.url?.includes('auth')) {
            console.log(`✅ API Response: ${response.status} ${response.config.url}`);
          }
        }
        
        return response;
      },
      (error: AxiosError<ApiResponse<any>>) => {
        const errorMessage = this.handleError(error);
        
        // Log error in development
        if (process.env.NODE_ENV === 'development') {
          console.error(`❌ API Error: ${error.response?.status} ${error.config?.url}`, errorMessage);
        }
        
        return Promise.reject(new ApiError(errorMessage, error.response?.status, error.response?.data));
      }
    );
  }

  private handleError(error: AxiosError<ApiResponse<any>>): string {
    // Handle different error scenarios
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          this.handleUnauthorized();
          return data?.message || 'Unauthorized access. Please login again.';
        case 403:
          return data?.message || 'You do not have permission to perform this action.';
        case 404:
          return data?.message || 'Resource not found.';
        case 422:
          return data?.message || 'Validation error. Please check your input.';
        case 500:
          return data?.message || 'Server error. Please try again later.';
        default:
          return data?.message || `Request failed with status ${status}`;
      }
    }
    
    if (error.request) {
      return 'Network error. Please check your connection and try again.';
    }
    
    return error.message || 'An unexpected error occurred.';
  }

  private handleUnauthorized(): void {
    this.clearAuthData();
    
    // Redirect to login if in browser
    if (typeof window !== 'undefined') {
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
  }

  // Token and user management
  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(TOKEN_KEY);
    }
    return null;
  }

  private setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, token);
    }
  }

  private removeToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  private setUser(user: any): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  }

  private getUser(): any {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem(USER_KEY);
      return user ? JSON.parse(user) : null;
    }
    return null;
  }

  private removeUser(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(USER_KEY);
    }
  }

  private clearAuthData(): void {
    this.removeToken();
    this.removeUser();
  }

  // HTTP Methods with improved error handling
  async get<T = any>(url: string, params?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.get<ApiResponse<T>>(url, { params });
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('GET request failed', undefined, error);
    }
  }

  async getPaginated<T = any>(url: string, params?: any): Promise<PaginatedResponse<T>> {
    try {
      // Increase timeout for large data requests
      const isLargeRequest = params && (parseInt(params.limit) > 100 || params.limit === '1000');
      const requestConfig = isLargeRequest ? 
        { params, timeout: 60000 } : // 60 seconds for large requests
        { params };
        
      const response = await this.client.get<any>(url, requestConfig);
      const responseData = response.data;
      
      // Log response structure for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 getPaginated response structure:', responseData);
      }
      
      // Handle nested data structure from backend (reviews case)
      // Backend returns: {success, message, data: {data: [], pagination: {page, limit, total, totalPages}}}
      if (responseData && responseData.success && responseData.data) {
        const backendData = responseData.data;
        
        // Check if backend data has nested structure with data array and pagination object
        if (backendData.data && Array.isArray(backendData.data) && backendData.pagination) {
          const backendPagination = backendData.pagination;
          return {
            success: responseData.success,
            message: responseData.message,
            data: backendData.data,
            total: backendPagination.total,
            page: backendPagination.page,
            limit: backendPagination.limit,
            totalPages: backendPagination.totalPages
          };
        }
        
        // Check if backend data has flat pagination structure
        if (backendData.data && Array.isArray(backendData.data) && 
            typeof backendData.total === 'number' && typeof backendData.page === 'number') {
          return {
            success: responseData.success,
            message: responseData.message,
            data: backendData.data,
            total: backendData.total,
            page: backendData.page,
            limit: backendData.limit,
            totalPages: backendData.totalPages
          };
        }
      }
      
      // Handle flat structure from backend
      // Backend returns: {success, message, data: [], pagination: {page, limit, total, totalPages}}
      if (responseData && responseData.pagination) {
        const backendPagination = responseData.pagination;
        return {
          success: responseData.success,
          message: responseData.message,
          data: responseData.data,
          pagination: {
            current: backendPagination.page || backendPagination.currentPage,
            total: backendPagination.total || backendPagination.totalItems,
            limit: backendPagination.limit || backendPagination.itemsPerPage,
            totalPages: backendPagination.totalPages
          }
        };
      }
      
      // Handle nested data structure from backend (if exists)
      // Backend returns: {success, message, data: {data: [], pagination}}
      if (responseData && responseData.data && responseData.data.data && responseData.data.pagination) {
        const backendPagination = responseData.data.pagination;
        return {
          success: responseData.success,
          message: responseData.message,
          data: responseData.data.data,
          pagination: {
            current: backendPagination.currentPage || backendPagination.current,
            total: backendPagination.totalItems || backendPagination.total,
            limit: backendPagination.itemsPerPage || backendPagination.limit,
            totalPages: backendPagination.totalPages
          }
        };
      }
      
      // Fallback to original structure
      return responseData;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('GET paginated request failed', undefined, error);
    }
  }

  async post<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.post<ApiResponse<T>>(url, data);
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('POST request failed', undefined, error);
    }
  }

  async put<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.put<ApiResponse<T>>(url, data);
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('PUT request failed', undefined, error);
    }
  }

  async patch<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.patch<ApiResponse<T>>(url, data);
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('PATCH request failed', undefined, error);
    }
  }

  async delete<T = any>(url: string): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.delete<ApiResponse<T>>(url);
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('DELETE request failed', undefined, error);
    }
  }

  // File upload methods with progress tracking
  async uploadFile<T = any>(
    url: string, 
    file: File, 
    onUploadProgress?: (progress: number) => void
  ): Promise<ApiResponse<T>> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await this.client.post<ApiResponse<T>>(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onUploadProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onUploadProgress(progress);
          }
        },
      });
      
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('File upload failed', undefined, error);
    }
  }

  async uploadFiles<T = any>(
    url: string, 
    files: File[], 
    onUploadProgress?: (progress: number) => void
  ): Promise<ApiResponse<T>> {
    try {
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append(`files[${index}]`, file);
      });
      
      const response = await this.client.post<ApiResponse<T>>(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onUploadProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onUploadProgress(progress);
          }
        },
      });
      
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Files upload failed', undefined, error);
    }
  }

  // Authentication methods
  setAuthToken(token: string): void {
    this.setToken(token);
  }

  getAuthToken(): string | null {
    return this.getToken();
  }

  clearAuthToken(): void {
    this.removeToken();
  }

  // User management methods
  setCurrentUser(user: any): void {
    this.setUser(user);
  }

  getCurrentUser(): any {
    return this.getUser();
  }

  clearCurrentUser(): void {
    this.removeUser();
  }

  // Complete auth data management
  setAuthData(token: string, user: any): void {
    this.setToken(token);
    this.setUser(user);
  }

  clearAllAuthData(): void {
    this.clearAuthData();
  }

  // JWT token utilities
  private parseJwtToken(token: string): any {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload;
    } catch {
      return null;
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    try {
      const payload = this.parseJwtToken(token);
      return payload && Date.now() < payload.exp * 1000;
    } catch {
      return false;
    }
  }

  // Get user info from token
  getUserFromToken(): any {
    const token = this.getToken();
    if (!token) return null;
    
    return this.parseJwtToken(token);
  }

  // Network status utilities
  async checkHealth(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch {
      return false;
    }
  }

  // Request timeout configuration
  setTimeout(timeout: number): void {
    this.client.defaults.timeout = timeout;
  }

  // Custom headers management
  setHeader(key: string, value: string): void {
    this.client.defaults.headers.common[key] = value;
  }

  removeHeader(key: string): void {
    delete this.client.defaults.headers.common[key];
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient();

// Export default
export default apiClient;

// Utility functions for common API operations
export const createApiHandler = <T>(
  apiCall: () => Promise<T>,
  errorMessage?: string
) => {
  return async (): Promise<T> => {
    try {
      return await apiCall();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(errorMessage || 'API operation failed', undefined, error);
    }
  };
};

// Utility for handling paginated requests
export const createPaginatedHandler = <T>(
  apiCall: (page: number, limit: number) => Promise<PaginatedResponse<T>>,
  errorMessage?: string
) => {
  return async (page: number = 1, limit: number = 10): Promise<PaginatedResponse<T>> => {
    try {
      return await apiCall(page, limit);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(errorMessage || 'Paginated request failed', undefined, error);
    }
  };
};

// Utility for handling file uploads with progress
export const createUploadHandler = <T>(
  apiCall: (file: File, onProgress?: (progress: number) => void) => Promise<ApiResponse<T>>,
  errorMessage?: string
) => {
  return async (file: File, onProgress?: (progress: number) => void): Promise<ApiResponse<T>> => {
    try {
      return await apiCall(file, onProgress);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(errorMessage || 'File upload failed', undefined, error);
    }
  };
};
