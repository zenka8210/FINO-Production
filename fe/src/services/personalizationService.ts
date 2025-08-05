import { apiClient } from '@/lib/api';

// Types for personalization
export interface PersonalizedCategory {
  _id: string;
  name: string;
  parent?: string;
  isActive: boolean;
  children?: PersonalizedCategory[];
  badge: {
    count: number | null; // null to hide badge number
    text?: string; // Badge text like "Hot"
    type: 'favorite' | 'interested' | 'pending' | 'recommended' | 'hot' | 'suggested' | 'none' | 'default';
    autoExpand: boolean;
  };
  personalization: {
    score: number;
    orderFrequency: number;
    wishlistCount: number;
    cartCount: number;
    totalValue: number;
    shouldAutoExpand: boolean;
  };
}

export interface UserBehaviorSummary {
  totalOrders: number;
  totalOrderValue: number;
  wishlistItems: number;
  cartItems: number;
  personalizationLevel: 'new' | 'low' | 'medium' | 'high' | 'error';
}

export interface PersonalizationResponse {
  categories: PersonalizedCategory[];
  userBehaviorSummary: UserBehaviorSummary;
}

export interface PersonalizationFilters {
  limit?: number;
  includeSubcategories?: boolean;
}

/**
 * Service để handle personalization APIs
 */
export class PersonalizationService {
  private static instance: PersonalizationService;

  private constructor() {}

  public static getInstance(): PersonalizationService {
    if (!PersonalizationService.instance) {
      PersonalizationService.instance = new PersonalizationService();
    }
    return PersonalizationService.instance;
  }

  /**
   * Lấy danh mục được cá nhân hóa cho user hiện tại
   */
  async getPersonalizedCategories(filters?: PersonalizationFilters): Promise<PersonalizationResponse> {
    try {
      const params = new URLSearchParams();
      
      if (filters?.limit) {
        params.append('limit', filters.limit.toString());
      }
      
      if (filters?.includeSubcategories !== undefined) {
        params.append('includeSubcategories', filters.includeSubcategories.toString());
      }

      const queryString = params.toString();
      const url = `/api/personalization/categories${queryString ? `?${queryString}` : ''}`;
      
      const response = await apiClient.get<PersonalizationResponse>(url);
      return response.data!;
    } catch (error: any) {
      console.error('PersonalizationService.getPersonalizedCategories Error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch personalized categories');
    }
  }

  /**
   * Lấy phân tích hành vi user (dành cho debugging)
   */
  async getUserBehaviorAnalysis(): Promise<any> {
    try {
      const response = await apiClient.get('/api/personalization/user-behavior');
      return response.data!;
    } catch (error: any) {
      console.error('PersonalizationService.getUserBehaviorAnalysis Error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch user behavior analysis');
    }
  }

  /**
   * Utility: Get badge styling based on type
   */
  getBadgeStyle(badgeType: PersonalizedCategory['badge']['type']): {
    className: string;
    color: string;
    label: string;
  } {
    const badgeStyles = {
      favorite: {
        className: 'badge-favorite',
        color: '#DC2626', // Red
        label: 'Yêu thích'
      },
      interested: {
        className: 'badge-interested', 
        color: '#1E40AF', // Blue
        label: 'Quan tâm'
      },
      pending: {
        className: 'badge-pending',
        color: '#D97706', // Orange
        label: 'Đang chờ'
      },
      recommended: {
        className: 'badge-recommended',
        color: '#10B981', // Green
        label: 'Gợi ý'
      },
      hot: {
        className: 'badge-hot',
        color: '#DC2626', // Red for "Hot"
        label: 'Hot'
      },
      suggested: {
        className: 'badge-suggested',
        color: '#10B981', // Green for "Đề xuất"
        label: 'Đề xuất'
      },
      none: {
        className: 'badge-none',
        color: 'transparent', // No visible badge
        label: ''
      },
      default: {
        className: 'badge-default',
        color: '#6B7280', // Gray
        label: ''
      }
    };

    return badgeStyles[badgeType] || badgeStyles.default;
  }

  /**
   * Utility: Get personalization level description
   */
  getPersonalizationLevelDescription(level: UserBehaviorSummary['personalizationLevel']): string {
    const descriptions = {
      new: 'Người dùng mới - Hiển thị danh mục phổ biến',
      low: 'Ít hoạt động - Gợi ý dựa trên hành vi cơ bản',
      medium: 'Hoạt động vừa phải - Cá nhân hóa tốt',
      high: 'Hoạt động cao - Cá nhân hóa tối ưu',
      error: 'Có lỗi xảy ra - Hiển thị danh mục mặc định'
    };

    return descriptions[level] || descriptions.new;
  }

  /**
   * Utility: Check if category should be auto-expanded
   */
  shouldAutoExpandCategory(category: PersonalizedCategory): boolean {
    return category.badge.autoExpand || category.personalization.shouldAutoExpand;
  }

  /**
   * Utility: Get category priority score for sorting
   */
  getCategoryPriority(category: PersonalizedCategory): number {
    return category.personalization.score;
  }
}

// Export singleton instance
export const personalizationService = PersonalizationService.getInstance();
