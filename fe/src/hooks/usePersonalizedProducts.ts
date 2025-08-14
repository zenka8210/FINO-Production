import { useState, useEffect, useCallback, useMemo } from 'react';
import { personalizationService } from '@/services/personalizationService';
import { productService } from '@/services';
import { useAuth } from '@/contexts';
import { ProductWithCategory } from '@/types';

export interface PersonalizedProductsFilters {
  limit?: number;
  excludeIds?: string[];
  categoryFilters?: string[];
}

export interface PersonalizedProductsResponse {
  products: ProductWithCategory[];
  personalizationLevel: 'new' | 'low' | 'medium' | 'high' | 'error';
  basedOn: {
    categories: string[];
    recentOrders: boolean;
    wishlist: boolean;
    cart: boolean;
  };
  userBehaviorSummary: {
    totalOrders: number;
    totalOrderValue: number;
    wishlistItems: number;
    cartItems: number;
  };
}

/**
 * Hook để lấy sản phẩm được cá nhân hóa dựa trên hành vi người dùng
 */
export function usePersonalizedProducts(filters?: PersonalizedProductsFilters) {
  const { user } = useAuth();
  const [data, setData] = useState<PersonalizedProductsResponse | null>(null);
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  // Memoize filters to prevent unnecessary re-renders
  const stableFilters = useMemo(() => ({
    limit: filters?.limit || 6,
    excludeIds: filters?.excludeIds || [],
    categoryFilters: filters?.categoryFilters || []
  }), [filters?.limit, filters?.excludeIds?.length, filters?.categoryFilters?.length]);

  // Prevent multiple rapid calls
  const shouldFetch = () => {
    const now = Date.now();
    return now - lastFetchTime > 1000; // Min 1 second between calls
  };

  const fetchPersonalizedProducts = useCallback(async () => {
    if (!shouldFetch()) {
      console.log('🚫 [DEBUG] Fetch skipped - too soon');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setLastFetchTime(Date.now());
      
      console.log('🔄 [DEBUG] usePersonalizedProducts: API call started', { 
        timestamp: new Date().toISOString(),
        limit: stableFilters.limit
      });

      // Use backend API for personalized products
      const personalizedResponse = await personalizationService.getPersonalizedProducts({
        limit: stableFilters.limit,
        excludeIds: stableFilters.excludeIds,
        categoryFilters: stableFilters.categoryFilters
      });

      console.log('✅ [DEBUG] usePersonalizedProducts: Raw API response:', personalizedResponse);

      // API returns: { success: true, data: { products: [...], ... } }
      // Extract the actual data object
      const apiData = personalizedResponse.data || personalizedResponse;

      console.log('✅ [DEBUG] usePersonalizedProducts: Extracted API data', {
        timestamp: new Date().toISOString(),
        productsCount: apiData.products?.length,
        firstProductId: apiData.products?.[0]?._id,
        personalizationLevel: apiData.personalizationLevel
      });

      // Extract data from API response - products are at root level
      const responseData: PersonalizedProductsResponse = {
        products: apiData.products || [],
        personalizationLevel: apiData.personalizationLevel || 'new',
        basedOn: apiData.basedOn || {
          categories: [],
          recentOrders: false,
          wishlist: false,
          cart: false
        },
        userBehaviorSummary: apiData.userBehaviorSummary || {
          totalOrders: 0,
          totalOrderValue: 0,
          wishlistItems: 0,
          cartItems: 0
        }
      };

      setData(responseData);
      setProducts(responseData.products);

    } catch (err: any) {
      console.error('❌ [DEBUG] usePersonalizedProducts: Error occurred', {
        timestamp: new Date().toISOString(),
        error: err.message
      });
      setError(err.message || 'Failed to fetch personalized products');
      
      // Fallback: Get regular products if personalization fails
      try {
        const fallbackResponse = await productService.getProducts({
          limit: stableFilters.limit,
          sort: 'createdAt',
          order: 'desc'
        });

        const fallbackArray = Array.isArray(fallbackResponse.data) 
          ? fallbackResponse.data 
          : (fallbackResponse.data as any)?.data || [];

        setProducts(fallbackArray);
        
        // Set minimal response data for fallback
        setData({
          products: fallbackArray,
          personalizationLevel: 'error',
          basedOn: {
            categories: [],
            recentOrders: false,
            wishlist: false,
            cart: false
          },
          userBehaviorSummary: {
            totalOrders: 0,
            totalOrderValue: 0,
            wishlistItems: 0,
            cartItems: 0
          }
        });
      } catch (fallbackError) {
        // Fallback failed too
      }
    } finally {
      setLoading(false);
    }
  }, [user?._id, !!user, stableFilters.limit, stableFilters.excludeIds.length, stableFilters.categoryFilters.length]); // Track both userId and auth state

  // Fetch on mount and when dependencies change
  useEffect(() => {
    console.log('🎬 [DEBUG] useEffect triggered - calling fetchPersonalizedProducts');
    fetchPersonalizedProducts();
  }, [fetchPersonalizedProducts]);

  // Clear state when user logs out and refetch guest data
  useEffect(() => {
    if (!user) {
      console.log('🚪 [DEBUG] User logged out - clearing personalized products state and fetching guest data');
      setData(null);
      setProducts([]);
      setError(null);
      setLoading(true); // Show loading state during refetch
      setLastFetchTime(0); // Reset fetch throttle
      // Immediately fetch guest data
      setTimeout(() => {
        fetchPersonalizedProducts();
      }, 100); // Small delay to ensure state clear is processed
    }
  }, [user, fetchPersonalizedProducts]);

  const refetch = useCallback(async () => {
    await fetchPersonalizedProducts();
  }, [fetchPersonalizedProducts]);

  // Computed values
  const personalizationInfo = useMemo(() => {
    if (!data) return null;

    const { personalizationLevel, basedOn, userBehaviorSummary } = data;
    
    let description = '';
    let icon = '🎯';
    
    switch (personalizationLevel) {
      case 'high':
        description = 'Dựa trên lịch sử mua hàng và sở thích của bạn';
        icon = '🌟';
        break;
      case 'medium':
        description = 'Dựa trên hoạt động gần đây của bạn';
        icon = '🎯';
        break;
      case 'low':
        description = 'Dựa trên danh mục bạn quan tâm';
        icon = '💡';
        break;
      case 'new':
      default:
        description = 'Sản phẩm phổ biến và mới nhất';
        icon = '✨';
        break;
    }

    return {
      level: personalizationLevel,
      description,
      icon,
      basedOn,
      userBehaviorSummary
    };
  }, [data]);

  return {
    // Data
    products,
    data,
    personalizationInfo,
    
    // State
    loading,
    error,
    
    // Actions
    refetch,
    clearError: () => setError(null),
    
    // Computed
    hasData: !!data,
    isEmpty: products.length === 0,
    isPersonalized: data?.personalizationLevel && data.personalizationLevel !== 'new',
    
    // Utility
    getPersonalizationDescription: () => personalizationInfo?.description || '',
    getPersonalizationIcon: () => personalizationInfo?.icon || '🎯'
  };
}
