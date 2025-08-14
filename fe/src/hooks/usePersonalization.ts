import { useState, useEffect, useCallback, useMemo } from 'react';
import { personalizationService, PersonalizationResponse, PersonalizationFilters, PersonalizedCategory } from '@/services/personalizationService';
import { useAuth } from '@/contexts';

/**
 * Hook để xử lý personalized categories cho CategorySidebar
 */
export function usePersonalization(filters?: PersonalizationFilters) {
  const { user } = useAuth();
  const [data, setData] = useState<PersonalizationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPersonalizedCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🎯 usePersonalization: Fetching personalized categories', { 
        userId: user?._id, 
        filters 
      });

      const response = await personalizationService.getPersonalizedCategories(filters);
      
      console.log('✅ usePersonalization: Categories fetched', {
        categoriesCount: response.categories.length,
        personalizationLevel: response.userBehaviorSummary.personalizationLevel,
        autoExpandCount: response.categories.filter(cat => 
          personalizationService.shouldAutoExpandCategory(cat)
        ).length
      });

      setData(response);
    } catch (err: any) {
      console.error('❌ usePersonalization Error:', err);
      setError(err.message || 'Failed to fetch personalized categories');
    } finally {
      setLoading(false);
    }
  }, [user?._id, filters]);

  // Fetch only once on mount or when user/filters change - FIXED: Support guest users
  useEffect(() => {
    // Always fetch regardless of user login status (supports guest users)
    fetchPersonalizedCategories();
  }, [user?._id, JSON.stringify(filters)]); // user?._id will be undefined for guests

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await personalizationService.getPersonalizedCategories(filters);
      setData(response);
    } catch (err: any) {
      console.error('❌ usePersonalization Refetch Error:', err);
      setError(err.message || 'Failed to refetch personalized categories');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const getAutoExpandedCategories = useMemo((): string[] => {
    if (!data?.categories) return [];
    
    // FIXED: Chỉ lấy 1 danh mục cha có điểm cao nhất để auto-expand
    const categoriesWithAutoExpand = data.categories
      .filter(category => personalizationService.shouldAutoExpandCategory(category))
      .sort((a, b) => b.personalization.score - a.personalization.score); // Sort by score descending
    
    // Chỉ trả về danh mục đầu tiên (điểm cao nhất)
    return categoriesWithAutoExpand.length > 0 ? [categoriesWithAutoExpand[0]._id] : [];
  }, [data?.categories]);

  const getCategoriesByBadgeType = useCallback((badgeType: PersonalizedCategory['badge']['type']): PersonalizedCategory[] => {
    if (!data?.categories) return [];
    
    return data.categories.filter(category => category.badge.type === badgeType);
  }, [data?.categories]);

  const getHighPriorityCategories = useCallback((): PersonalizedCategory[] => {
    if (!data?.categories) return [];
    
    return data.categories
      .filter(category => category.personalization.score > 30)
      .sort((a, b) => b.personalization.score - a.personalization.score);
  }, [data?.categories]);

  return {
    // Data
    categories: data?.categories || [],
    userBehaviorSummary: data?.userBehaviorSummary,
    
    // State
    loading,
    error,
    
    // Actions
    refetch,
    clearError: () => setError(null),
    
    // Computed values
    hasData: !!data,
    isEmpty: !data?.categories?.length,
    autoExpandedCategories: getAutoExpandedCategories, // Remove () since it's now a memoized value
    
    // Utility functions
    getCategoriesByBadgeType,
    getHighPriorityCategories,
    
    // Helper for individual categories
    shouldAutoExpand: (categoryId: string) => {
      const category = data?.categories.find(cat => cat._id === categoryId);
      return category ? personalizationService.shouldAutoExpandCategory(category) : false;
    },
    
    getBadgeStyle: (categoryId: string) => {
      const category = data?.categories.find(cat => cat._id === categoryId);
      return category ? personalizationService.getBadgeStyle(category.badge.type) : null;
    },
    
    getPersonalizationLevel: () => {
      return data?.userBehaviorSummary?.personalizationLevel || 'new';
    },
    
    getPersonalizationDescription: () => {
      const level = data?.userBehaviorSummary?.personalizationLevel || 'new';
      return personalizationService.getPersonalizationLevelDescription(level);
    }
  };
}

/**
 * Hook để debug user behavior (chỉ dành cho development)
 */
export function useUserBehaviorAnalysis() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = useCallback(async () => {
    if (!user) {
      setError('User must be logged in to view behavior analysis');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await personalizationService.getUserBehaviorAnalysis();
      setData(response);
    } catch (err: any) {
      console.error('useUserBehaviorAnalysis Error:', err);
      setError(err.message || 'Failed to fetch user behavior analysis');
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    data,
    loading,
    error,
    fetchAnalysis,
    clearError: () => setError(null),
    canFetch: !!user
  };
}
