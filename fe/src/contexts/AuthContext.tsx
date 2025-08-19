'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { 
  AuthContextType, 
  User, 
  LoginRequest, 
  RegisterRequest 
} from '@/types';
import { authService } from '@/services';
import { userService } from '@/services/userService';
import { wishlistService } from '@/services/wishlistService';

// Auth State
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Auth Actions
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: User }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'CLEAR_ERROR' };

// Initial State
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Auth Reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
}

// Auth Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider
interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      console.log('AuthContext: Checking auth status...');
      if (authService.isAuthenticated()) {
        console.log('AuthContext: Token found, getting user...');
        const user = await userService.getCurrentUserProfile();
        console.log('AuthContext: User retrieved:', user);
        dispatch({ type: 'AUTH_SUCCESS', payload: user });
      } else {
        console.log('AuthContext: No token found');
        dispatch({ type: 'AUTH_FAILURE', payload: 'Not authenticated' });
      }
    } catch (error) {
      console.error('AuthContext: Auth check failed:', error);
      dispatch({ type: 'AUTH_FAILURE', payload: 'Authentication check failed' });
    }
  };

  const login = async (credentials: LoginRequest): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_START' });
      const response = await authService.login(credentials);
      console.log('AuthContext login response:', response);
      
      if (response && response.user) {
        dispatch({ type: 'AUTH_SUCCESS', payload: response.user });
        
        // Sync session wishlist to user account after successful login
        try {
          // Backend automatically reads session wishlist, no params needed
          await wishlistService.syncWishlistFromSession();
          console.log('AuthContext: Session wishlist synced successfully');
        } catch (syncError) {
          console.warn('AuthContext: Failed to sync session wishlist:', syncError);
          // Don't throw - login was successful, sync is optional
        }
      } else {
        throw new Error('Login response invalid');
      }
    } catch (error: any) {
      dispatch({ type: 'AUTH_FAILURE', payload: error.message || 'Login failed' });
      throw error;
    }
  };

  const register = async (userData: RegisterRequest): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_START' });
      const response = await authService.register(userData);
      console.log('AuthContext register response:', response);
      
      if (response && response.user) {
        dispatch({ type: 'AUTH_SUCCESS', payload: response.user });
        
        // Sync session wishlist to user account after successful registration
        try {
          // Backend automatically reads session wishlist, no params needed
          await wishlistService.syncWishlistFromSession();
          console.log('AuthContext: Session wishlist synced successfully after registration');
        } catch (syncError) {
          console.warn('AuthContext: Failed to sync session wishlist:', syncError);
          // Don't throw - registration was successful, sync is optional
        }
      } else {
        throw new Error('Registration response invalid');
      }
    } catch (error: any) {
      dispatch({ type: 'AUTH_FAILURE', payload: error.message || 'Registration failed' });
      throw error;
    }
  };

  const logout = (): void => {
    authService.logout();
    dispatch({ type: 'LOGOUT' });
  };

  const updateProfile = async (userData: Partial<User>): Promise<void> => {
    try {
      const updatedUser = await userService.updateCurrentUserProfile(userData);
      dispatch({ type: 'UPDATE_USER', payload: updatedUser });
    } catch (error: any) {
      throw error;
    }
  };

  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Set user directly (for Google OAuth and other external auth)
  const setUser = (user: User, token?: string) => {
    if (token) {
      localStorage.setItem('authToken', token);
    }
    dispatch({ type: 'AUTH_SUCCESS', payload: user });
  };

  const contextValue: AuthContextType = {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    login,
    register,
    logout,
    updateProfile,
    clearError,
    setUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
