import { apiClient } from '@/lib/api';
import { 
  Post, 
  PostWithAuthor, 
  CreatePostRequest, 
  PaginatedResponse, 
  ApiResponse 
} from '@/types';

export class PostService {
  private static instance: PostService;

  private constructor() {}

  public static getInstance(): PostService {
    if (!PostService.instance) {
      PostService.instance = new PostService();
    }
    return PostService.instance;
  }

  /**
   * Get published posts
   */
  async getPublishedPosts(page: number = 1, limit: number = 10): Promise<PaginatedResponse<PostWithAuthor>> {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const response = await apiClient.getPaginated<PostWithAuthor>('/api/posts/published', params);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch posts');
    }
  }

  /**
   * Get post by ID
   */
  async getPostById(postId: string): Promise<PostWithAuthor> {
    try {
      const response = await apiClient.get<PostWithAuthor>(`/api/posts/${postId}`);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch post');
    }
  }

  /**
   * Get featured posts
   */
  async getFeaturedPosts(limit: number = 5): Promise<PostWithAuthor[]> {
    try {
      const response = await this.getPublishedPosts(1, limit);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch featured posts');
    }
  }

  // ========== ADMIN METHODS ==========

  /**
   * Get all posts (Admin only)
   */
  async getAllPosts(page: number = 1, limit: number = 10, filters?: { 
    search?: string; 
    isPublished?: boolean; 
    sortBy?: string; 
    sortOrder?: string 
  }): Promise<PaginatedResponse<PostWithAuthor>> {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      params.append('populate', 'author'); // Always populate author
      
      // Add optional filters
      if (filters?.search) {
        params.append('search', filters.search);
      }
      if (filters?.isPublished !== undefined) {
        params.append('isPublished', filters.isPublished.toString());
      }
      if (filters?.sortBy) {
        params.append('sortBy', filters.sortBy);
      }
      if (filters?.sortOrder) {
        params.append('sortOrder', filters.sortOrder);
      }

      const response = await apiClient.getPaginated<PostWithAuthor>('/api/posts', params);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch all posts');
    }
  }

  /**
   * Create post (Admin only)
   */
  async createPost(postData: CreatePostRequest): Promise<Post> {
    try {
      const response = await apiClient.post<Post>('/api/posts', postData);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create post');
    }
  }

  /**
   * Update post (Admin only)
   */
  async updatePost(postId: string, postData: Partial<CreatePostRequest>): Promise<Post> {
    try {
      const response = await apiClient.put<Post>(`/api/posts/${postId}`, postData);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update post');
    }
  }

  /**
   * Delete post (Admin only)
   */
  async deletePost(postId: string): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.delete(`/api/posts/${postId}`);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete post');
    }
  }

  /**
   * Toggle post visibility (Admin only)
   * PATCH /api/posts/:id/toggle-visibility
   */
  async togglePostVisibility(postId: string): Promise<Post> {
    try {
      const response = await apiClient.patch<Post>(`/api/posts/${postId}/toggle-visibility`);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to toggle post visibility');
    }
  }

  /**
   * Update post publish status (Admin only)
   * PATCH /api/posts/:id/publish-status
   */
  async updatePublishStatus(postId: string, publishStatus: 'draft' | 'published'): Promise<Post> {
    try {
      const response = await apiClient.patch<Post>(`/api/posts/${postId}/publish-status`, { publishStatus });
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update publish status');
    }
  }
}

// Export singleton instance
export const postService = PostService.getInstance();
export default postService;
