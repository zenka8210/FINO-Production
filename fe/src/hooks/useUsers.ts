import { useState } from 'react';
import { userService } from '@/services';
import { User, PaginatedResponse } from '@/types';
import { useApiNotification } from './useApiNotification';

interface UserFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  role?: 'customer' | 'admin';
  isActive?: boolean;
}

export const useUsers = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showError, showSuccess } = useApiNotification();

  const clearError = () => setError(null);

  const getUsers = async (filters?: UserFilters): Promise<PaginatedResponse<User>> => {
    setLoading(true);
    setError(null);
    try {
      const result = await userService.getAllUsers(filters);
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch users';
      setError(errorMessage);
      showError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (userData: {
    email: string;
    password: string;
    name?: string;
    phone?: string;
    role?: 'customer' | 'admin';
    isActive?: boolean;
  }): Promise<User> => {
    setLoading(true);
    setError(null);
    try {
      const result = await userService.createUser(userData);
      showSuccess('User created successfully');
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create user';
      setError(errorMessage);
      showError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (id: string, userData: {
    name?: string;
    phone?: string;
    isActive?: boolean;
  }): Promise<User> => {
    setLoading(true);
    setError(null);
    try {
      const result = await userService.updateUserByAdmin(id, userData);
      showSuccess('User updated successfully');
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update user';
      setError(errorMessage);
      showError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await userService.deleteUserByAdmin(id);
      showSuccess('User deleted successfully');
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete user';
      setError(errorMessage);
      showError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (id: string): Promise<User> => {
    setLoading(true);
    setError(null);
    try {
      const result = await userService.toggleUserActiveStatus(id);
      showSuccess('User status updated successfully');
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to toggle user status';
      setError(errorMessage);
      showError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (id: string, role: 'customer' | 'admin'): Promise<User> => {
    setLoading(true);
    setError(null);
    try {
      const result = await userService.updateUserRole(id, role);
      showSuccess('User role updated successfully');
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update user role';
      setError(errorMessage);
      showError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    getUsers,
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    updateUserRole,
    clearError
  };
};
