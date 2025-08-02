import { useState } from 'react';
import { postService } from '../services/postService';
import { PostWithAuthor } from '../types';

export const useAdminPosts = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const getPosts = async (filters: any = {}) => {
    try {
      setLoading(true);
      setError(null);
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const searchFilters = {
        search: filters.search,
        isPublished: filters.isPublished,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      };
      const response = await postService.getAllPosts(page, limit, searchFilters);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Có lỗi xảy ra';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createPost = async (postData: any) => {
    try {
      setLoading(true);
      setError(null);
      const response = await postService.createPost(postData);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Có lỗi xảy ra';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updatePost = async (id: string, postData: any) => {
    try {
      setLoading(true);
      setError(null);
      const response = await postService.updatePost(id, postData);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Có lỗi xảy ra';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deletePost = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await postService.deletePost(id);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Có lỗi xảy ra';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getPostStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all posts to calculate statistics (using high limit to get all posts)
      const response = await postService.getAllPosts(1, 1000);
      const allPosts = response.data || [];
      
      const totalPosts = allPosts.length;
      const publishedPosts = allPosts.filter((post: PostWithAuthor) => post.isPublished === true).length;
      const draftPosts = allPosts.filter((post: PostWithAuthor) => post.isPublished === false).length;
      
      return {
        totalPosts,
        publishedPosts,
        draftPosts,
      };
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Có lỗi xảy ra';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    clearError,
    getPosts,
    createPost,
    updatePost,
    deletePost,
    getPostStatistics,
  };
};
