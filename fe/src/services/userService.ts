import { apiClient } from '@/lib/api';
import { 
  User, 
  Address, 
  CreateAddressRequest, 
  ApiResponse,
  PaginatedResponse 
} from '@/types';

interface UserFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  role?: 'customer' | 'admin';
  isActive?: boolean;
}

interface UserStatistics {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  customerCount: number;
  adminCount: number;
  monthlyRegistrations: { month: string; count: number }[];
}

export class UserService {
  private static instance: UserService;

  private constructor() {}

  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  // ========== ADMIN USER MANAGEMENT ==========

  /**
   * Create user (Admin only)
   */
  async createUser(userData: {
    email: string;
    password: string;
    name?: string;
    phone?: string;
    role?: 'customer' | 'admin';
    isActive?: boolean;
  }): Promise<User> {
    try {
      const response = await apiClient.post<User>('/api/users', userData);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create user');
    }
  }

  /**
   * Get all users with filters (Admin only)
   */
  async getAllUsers(filters?: UserFilters): Promise<PaginatedResponse<User>> {
    try {
      const response = await apiClient.getPaginated<User>('/api/users', filters);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch users');
    }
  }

  /**
   * Get user statistics (Admin only)
   */
  async getUserStatistics(): Promise<UserStatistics> {
    try {
      const response = await apiClient.get<UserStatistics>('/api/users/stats');
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch user statistics');
    }
  }

  /**
   * Get user by ID (Admin only)
   */
  async getUserById(id: string): Promise<User> {
    try {
      const response = await apiClient.get<User>(`/api/users/${id}`);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch user');
    }
  }

  /**
   * Update user by admin
   */
  async updateUserByAdmin(id: string, userData: {
    name?: string;
    phone?: string;
    isActive?: boolean;
  }): Promise<User> {
    try {
      const response = await apiClient.put<User>(`/api/users/${id}`, userData);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update user');
    }
  }

  /**
   * Delete user by admin
   */
  async deleteUserByAdmin(id: string): Promise<ApiResponse<any>> {
    try {
      return await apiClient.delete(`/api/users/${id}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete user');
    }
  }

  /**
   * Update user role (Admin only)
   */
  async updateUserRole(id: string, role: 'customer' | 'admin'): Promise<User> {
    try {
      const response = await apiClient.patch<User>(`/api/users/${id}/role`, { role });
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update user role');
    }
  }

  /**
   * Toggle user active status (Admin only)
   */
  async toggleUserActiveStatus(id: string): Promise<User> {
    try {
      const response = await apiClient.patch<User>(`/api/users/${id}/status`);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to toggle user status');
    }
  }

  // ========== CURRENT USER PROFILE ==========

  /**
   * Get current user profile
   */
  async getCurrentUserProfile(): Promise<User> {
    try {
      const response = await apiClient.get<User>('/api/users/me/profile');
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch profile');
    }
  }

  /**
   * Update current user profile
   */
  async updateCurrentUserProfile(userData: {
    name?: string;
    phone?: string;
  }): Promise<User> {
    try {
      const response = await apiClient.put<User>('/api/users/me/profile', userData);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update profile');
    }
  }

  /**
   * Change current user password
   */
  async changeCurrentUserPassword(currentPassword: string, newPassword: string): Promise<ApiResponse<any>> {
    try {
      return await apiClient.put('/api/users/me/password', {
        currentPassword,
        newPassword
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to change password');
    }
  }

  // ========== USER ADDRESS MANAGEMENT ==========

  /**
   * Add user address
   */
  async addUserAddress(addressData: CreateAddressRequest): Promise<Address> {
    try {
      const response = await apiClient.post<Address>('/api/users/me/addresses', addressData);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to add address');
    }
  }

  /**
   * Debug endpoint for testing address creation
   */
  async debugAddUserAddress(addressData: CreateAddressRequest): Promise<Address> {
    try {
      const response = await apiClient.post<Address>('/api/users/me/addresses-debug', addressData);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to debug add address');
    }
  }

  /**
   * Get user addresses
   */
  async getUserAddresses(): Promise<Address[]> {
    try {
      const response = await apiClient.get<Address[]>('/api/users/me/addresses');
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch addresses');
    }
  }

  /**
   * Get user address by ID
   */
  async getUserAddressById(addressId: string): Promise<Address> {
    try {
      const response = await apiClient.get<Address>(`/api/users/me/addresses/${addressId}`);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch address');
    }
  }

  /**
   * Update user address
   */
  async updateUserAddress(addressId: string, addressData: Partial<CreateAddressRequest>): Promise<Address> {
    try {
      const response = await apiClient.put<Address>(`/api/users/me/addresses/${addressId}`, addressData);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update address');
    }
  }

  /**
   * Delete user address
   */
  async deleteUserAddress(addressId: string): Promise<ApiResponse<any>> {
    try {
      return await apiClient.delete(`/api/users/me/addresses/${addressId}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete address');
    }
  }

  /**
   * Set default user address
   */
  async setDefaultUserAddress(addressId: string): Promise<Address> {
    try {
      const response = await apiClient.patch<Address>(`/api/users/me/addresses/${addressId}/set-default`);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to set default address');
    }
  }

  // ========== LEGACY METHODS (for backward compatibility) ==========

  /**
   * @deprecated Use getUserAddresses() instead
   */
  async getAddresses(): Promise<Address[]> {
    return this.getUserAddresses();
  }

  /**
   * @deprecated Use getUserAddressById() instead
   */
  async getAddressById(addressId: string): Promise<Address> {
    return this.getUserAddressById(addressId);
  }

  /**
   * @deprecated Use addUserAddress() instead
   */
  async createAddress(addressData: CreateAddressRequest): Promise<Address> {
    return this.addUserAddress(addressData);
  }

  /**
   * @deprecated Use updateUserAddress() instead
   */
  async updateAddress(addressId: string, addressData: Partial<CreateAddressRequest>): Promise<Address> {
    return this.updateUserAddress(addressId, addressData);
  }

  /**
   * @deprecated Use deleteUserAddress() instead
   */
  async deleteAddress(addressId: string): Promise<ApiResponse<any>> {
    return this.deleteUserAddress(addressId);
  }

  /**
   * @deprecated Use setDefaultUserAddress() instead
   */
  async setDefaultAddress(addressId: string): Promise<Address> {
    return this.setDefaultUserAddress(addressId);
  }

  // ========== UTILITY METHODS ==========

  /**
   * Get default address
   */
  async getDefaultAddress(): Promise<Address | null> {
    try {
      const addresses = await this.getUserAddresses();
      return addresses.find(addr => addr.isDefault) || null;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get default address');
    }
  }

  /**
   * @deprecated Use toggleUserActiveStatus() instead
   */
  async updateUserStatus(userId: string, isActive: boolean): Promise<User> {
    try {
      const response = await apiClient.patch<User>(`/api/users/${userId}/status`, { isActive });
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update user status');
    }
  }
}

// Export singleton instance
export const userService = UserService.getInstance();
export default userService;
