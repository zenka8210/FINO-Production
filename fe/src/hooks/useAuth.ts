import { useAuth as useAuthContext } from '@/contexts';

/**
 * Custom hook for authentication operations
 * Only accesses AuthContext - does not make direct service calls
 */
export function useAuth() {
  const context = useAuthContext();

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return {
    // State from context
    user: context.user,
    isAuthenticated: context.isAuthenticated,
    isLoading: context.isLoading,
    error: context.error,

    // Actions from context
    login: context.login,
    register: context.register,
    logout: context.logout,
    updateProfile: context.updateProfile,
    clearError: context.clearError,

    // Computed values
    isAdmin: context.user?.role === 'admin',
    isCustomer: context.user?.role === 'customer',
    userName: context.user?.name || context.user?.email || 'Guest',
  };
}

/**
 * Hook for authentication guards - uses useAuth context
 */
export function useAuthGuard() {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();

  return {
    isAuthenticated,
    isLoading,
    requireAuth: () => {
      if (!isLoading && !isAuthenticated) {
        throw new Error('Authentication required');
      }
    },
    requireAdmin: () => {
      if (!isLoading && !isAdmin) {
        throw new Error('Admin access required');
      }
    }
  };
}
