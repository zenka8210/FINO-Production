import { apiClient } from '@/lib/api';
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
      const response = await apiClient.post<AuthResponse>('/api/auth/register', userData);
      
      if (response.success && response.data?.token) {
        apiClient.setAuthToken(response.data.token);
      }
      
      return response.data || response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  }

  /**
   * Login user
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/api/auth/login', credentials);
      
      if (response.success && response.data?.token) {
        apiClient.setAuthToken(response.data.token);
      }
      
      return response.data || response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      apiClient.clearAuthToken();
    } catch (error: any) {
      console.error('Logout error:', error);
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User> {
    try {
      const response = await apiClient.get<User>('/api/users/profile');
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get user profile');
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userData: Partial<User>): Promise<User> {
    try {
      const response = await apiClient.put<User>('/api/users/profile', userData);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update profile');
    }
  }

  /**
   * Change password
   */
  async changePassword(oldPassword: string, newPassword: string): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.put('/api/users/change-password', {
        oldPassword,
        newPassword
      });
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to change password');
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
