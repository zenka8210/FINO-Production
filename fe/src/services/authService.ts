import { apiClient, ApiError } from '@/lib/api';
import { 
  AuthResponse, 
  LoginRequest, 
  RegisterRequest, 
  User, 
  ApiResponse 
} from '@/types';

export class AuthService {
  private static instance: AuthService;

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Register a new user
   */
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      console.log('AuthService register called with:', { email: userData.email });
      const response = await apiClient.post<any>('/api/auth/register', userData);
      console.log('Register response:', response);
      
      if (response?.success && response?.data?.token) {
        apiClient.setAuthData(response.data.token, response.data.user);
      }
      
      return response?.data || response;
    } catch (error: any) {
      console.error('AuthService register error:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(error.message || 'Registration failed');
    }
  }

  /**
   * Login user
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      console.log('AuthService login called with:', { email: credentials.email });
      const response = await apiClient.post<any>('/api/auth/login', credentials);
      console.log('Login response:', response);
      
      if (response?.success && response?.data?.token) {
        apiClient.setAuthData(response.data.token, response.data.user);
      }
      
      return response?.data || response;
    } catch (error: any) {
      console.error('AuthService login error:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(error.message || 'Login failed');
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      apiClient.clearAllAuthData();
    } catch (error: any) {
      console.error('Logout error:', error);
      throw new ApiError('Logout failed');
    }
  }

  /**
   * Send forgot password email
   */
  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('AuthService forgotPassword called with:', { email });
      
      // Call actual forgot password API endpoint
      const response = await apiClient.post<ApiResponse<{ message: string }>>('/api/auth/forgot-password', { email });
      console.log('Forgot password response:', response);
      
      if (response?.success) {
        return { 
          success: true, 
          message: response.data?.message || 'Email khôi phục đã được gửi' 
        };
      } else {
        throw new ApiError(response?.message || 'Không thể gửi email khôi phục');
      }
    } catch (error: any) {
      console.error('AuthService forgotPassword error:', error);
      
      // Handle specific error status codes
      if (error.status === 404) {
        throw new ApiError('Email không tồn tại trong hệ thống');
      } else if (error.status === 429) {
        throw new ApiError('Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau.');
      } else if (error.status >= 500) {
        throw new ApiError('Lỗi server. Vui lòng thử lại sau.');
      }
      
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Có lỗi xảy ra khi gửi email khôi phục');
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('AuthService resetPassword called with token:', token.substring(0, 10) + '...');
      
      const response = await apiClient.post<ApiResponse<{ message: string }>>('/api/auth/reset-password', {
        token,
        newPassword
      });
      console.log('Reset password response:', response);
      
      if (response?.success) {
        return { 
          success: true, 
          message: response.data?.message || 'Mật khẩu đã được đặt lại thành công' 
        };
      } else {
        throw new ApiError(response?.message || 'Không thể đặt lại mật khẩu');
      }
    } catch (error: any) {
      console.error('AuthService resetPassword error:', error);
      
      if (error.status === 400) {
        throw new ApiError('Token không hợp lệ hoặc đã hết hạn');
      } else if (error.status === 404) {
        throw new ApiError('Token không tồn tại');
      }
      
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Có lỗi xảy ra khi đặt lại mật khẩu');
    }
  }

  /**
   * Verify reset password token
   */
  async verifyResetToken(token: string): Promise<{ success: boolean; valid: boolean }> {
    try {
      console.log('AuthService verifyResetToken called with token:', token.substring(0, 10) + '...');
      
      const response = await apiClient.get<ApiResponse<{ valid: boolean }>>(`/api/auth/verify-reset-token/${token}`);
      console.log('Verify token response:', response);
      
      return { 
        success: response?.success || false, 
        valid: (response?.data as any)?.valid || false 
      };
    } catch (error: any) {
      console.error('AuthService verifyResetToken error:', error);
      return { success: false, valid: false };
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return typeof window !== 'undefined' && !!localStorage.getItem('authToken');
  }

  /**
   * Get stored auth token
   */
  getAuthToken(): string | null {
    return typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();
export default authService;
