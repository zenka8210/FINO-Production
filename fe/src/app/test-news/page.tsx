'use client';

import { useState, useEffect } from 'react';
import { postService } from '@/services';
import { PostWithAuthor } from '@/types';

export default function TestNewsPage() {
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testApi = async () => {
      try {
        console.log('🔥 Testing Post API...');
        setLoading(true);
        setError(null);

        // Test published posts API
        const response = await postService.getPublishedPosts(1, 5);
        console.log('✅ API Response:', response);
        
        setPosts(response.data);
      } catch (err: any) {
        console.error('❌ API Error:', err);
        setError(err.message || 'Failed to fetch posts');
      } finally {
        setLoading(false);
      }
    };

    testApi();
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🧪 Test Trang Tin Tức - API Thật</h1>
      
      <div style={{ marginBottom: '20px', padding: '15px', background: '#f0f9ff', borderRadius: '8px' }}>
        <h3>📊 Trạng thái API:</h3>
        <p><strong>Loading:</strong> {loading ? '✅ Đang tải...' : '❌ Hoàn thành'}</p>
        <p><strong>Error:</strong> {error || '✅ Không có lỗi'}</p>
        <p><strong>Số bài viết:</strong> {posts.length}</p>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '24px' }}>🔄</div>
          <p>Đang test API...</p>
        </div>
      )}

      {error && (
        <div style={{ 
          background: '#fee2e2', 
          color: '#dc2626', 
          padding: '15px', 
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3>❌ Lỗi API:</h3>
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && posts.length === 0 && (
        <div style={{ 
          background: '#fef3c7', 
          color: '#92400e', 
          padding: '15px', 
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3>⚠️ Không có dữ liệu:</h3>
          <p>API hoạt động nhưng chưa có bài viết nào trong database.</p>
        </div>
      )}

      {posts.length > 0 && (
        <div>
          <h3>✅ Dữ liệu từ API thật:</h3>
          {posts.map((post, index) => (
            <div key={post._id} style={{ 
              border: '1px solid #e5e7eb', 
              borderRadius: '8px', 
              padding: '15px', 
              marginBottom: '15px',
              background: '#f9fafb'
            }}>
              <h4 style={{ color: '#1f2937', marginBottom: '8px' }}>
                {index + 1}. {post.title}
              </h4>
              <p style={{ color: '#6b7280', marginBottom: '8px' }}>
                {post.describe}
              </p>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                <p><strong>ID:</strong> {post._id}</p>
                <p><strong>Tác giả:</strong> {post.author?.name || 'Không có'}</p>
                <p><strong>Trạng thái:</strong> {post.isPublished ? '✅ Published' : '⏸️ Draft'}</p>
                <p><strong>Ngày tạo:</strong> {new Date(post.createdAt).toLocaleString('vi-VN')}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ 
        marginTop: '30px', 
        padding: '15px', 
        background: '#f3f4f6', 
        borderRadius: '8px' 
      }}>
        <h4>🔍 Kiểm tra thêm:</h4>
        <ul>
          <li>API URL: <code>/api/posts/published</code></li>
          <li>Method: <code>getPublishedPosts()</code></li>
          <li>Service: <code>postService</code></li>
          <li>Đây là dữ liệu thật từ database backend</li>
        </ul>
      </div>
    </div>
  );
}
