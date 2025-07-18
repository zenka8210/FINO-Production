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
