import { useState, useEffect, useCallback } from 'react';
import { postService } from '@/services/postService';
import { PostWithAuthor, PaginatedResponse, CreatePostRequest, Post } from '@/types';
import { useApiNotification } from './useApiNotification';

export const usePosts = () => {
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    total: 0,
    limit: 9,
    totalPages: 0
  });

  const { showSuccess, showError } = useApiNotification();

  const fetchPosts = async (page: number = 1, limit: number = 9) => {
    try {
      setLoading(true);
      setError(null);
      const response: PaginatedResponse<PostWithAuthor> = await postService.getPublishedPosts(page, limit);
      
      setPosts(response.data);
      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  };

  // Admin method to get all posts (including drafts)
  const getPosts = useCallback(async (page = 1, limit = 10): Promise<PaginatedResponse<PostWithAuthor>> => {
    try {
      setLoading(true);
      setError(null);
      return await postService.getAllPosts(page, limit);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch posts';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create post (Admin only)
  const createPost = useCallback(async (data: CreatePostRequest): Promise<Post> => {
    try {
      const result = await postService.createPost(data);
      showSuccess('Tạo bài viết thành công!');
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create post';
      setError(errorMessage);
      showError('Lỗi tạo bài viết', err);
      throw new Error(errorMessage);
    }
  }, [showSuccess, showError]);

  // Update post (Admin only)
  const updatePost = useCallback(async (id: string, data: Partial<CreatePostRequest>): Promise<Post> => {
    try {
      const result = await postService.updatePost(id, data);
      showSuccess('Cập nhật bài viết thành công!');
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update post';
      setError(errorMessage);
      showError('Lỗi cập nhật bài viết', err);
      throw new Error(errorMessage);
    }
  }, [showSuccess, showError]);

  // Delete post (Admin only)
  const deletePost = useCallback(async (id: string): Promise<void> => {
    try {
      await postService.deletePost(id);
      showSuccess('Xóa bài viết thành công!');
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete post';
      setError(errorMessage);
      showError('Lỗi xóa bài viết', err);
      throw new Error(errorMessage);
    }
  }, [showSuccess, showError]);

  // Toggle post status (Admin only)
  const togglePostStatus = useCallback(async (id: string, status: 'draft' | 'published'): Promise<Post> => {
    try {
      const result = await postService.updatePublishStatus(id, status);
      showSuccess(`${status === 'published' ? 'Xuất bản' : 'Chuyển thành bản nháp'} thành công!`);
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to toggle post status';
      setError(errorMessage);
      showError('Lỗi thay đổi trạng thái', err);
      throw new Error(errorMessage);
    }
  }, [showSuccess, showError]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    fetchPosts();
  }, []);

  const refetch = (page?: number, limit?: number) => {
    return fetchPosts(page, limit);
  };

  return {
    posts,
    loading,
    error,
    pagination,
    refetch,
    // Admin methods
    getPosts,
    createPost,
    updatePost,
    deletePost,
    togglePostStatus,
    clearError
  };
};
