'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './news.module.css';

interface NewsPost {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  date: string;
  category: string;
  slug: string;
  status: 'published' | 'draft';
  author: string;
}

export default function AdminNewsPage() {
  const [news, setNews] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: '50'
      });

      if (filterCategory !== 'all') {
        params.append('category', filterCategory);
      }

      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(`/api/news?${params}`);
      const data = await response.json();

      if (data.success) {
        setNews(data.data);
      }
    } catch (error) {
      console.error('Error loading news:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
      setLoading(true);
      try {
        const response = await fetch(`/api/news/${id}`, {
          method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
          setNews(prev => prev.filter(item => item.id !== id));
        } else {
          alert('Có lỗi xảy ra khi xóa bài viết');
        }
      } catch (error) {
        console.error('Error deleting news:', error);
        alert('Có lỗi xảy ra khi xóa bài viết');
      }
      setLoading(false);
    }
  };

  const toggleStatus = async (id: number) => {
    setLoading(true);
    try {
      const currentNews = news.find(item => item.id === id);
      if (!currentNews) return;
      
      const response = await fetch(`/api/news/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...currentNews,
          status: currentNews.status === 'published' ? 'draft' : 'published'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setNews(prev => prev.map(item => 
          item.id === id 
            ? { ...item, status: item.status === 'published' ? 'draft' : 'published' }
            : item
        ));
      } else {
        alert('Có lỗi xảy ra khi cập nhật trạng thái');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Có lỗi xảy ra khi cập nhật trạng thái');
    }
    setLoading(false);
  };

  const filteredNews = news.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = [...new Set(news.map(item => item.category))];

  return (
    <div className={styles.adminNews}>
      <div className={styles.header}>
        <h1>Quản Lý Tin Tức</h1>
        <Link href="/admin/news/create" className={styles.createBtn}>
          <i className="fas fa-plus"></i>
          Thêm Tin Tức Mới
        </Link>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Tìm kiếm tin tức..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select 
          value={filterCategory} 
          onChange={(e) => setFilterCategory(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="all">Tất cả danh mục</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="published">Đã xuất bản</option>
          <option value="draft">Bản nháp</option>
        </select>
      </div>

      {/* News Table */}
      <div className={styles.tableContainer}>
        <table className={styles.newsTable}>
          <thead>
            <tr>
              <th>Hình ảnh</th>
              <th>Tiêu đề</th>
              <th>Danh mục</th>
              <th>Trạng thái</th>
              <th>Ngày tạo</th>
              <th>Tác giả</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredNews.map(item => (
              <tr key={item.id}>
                <td>
                  <div className={styles.imageCell}>
                    <Image
                      src={item.image}
                      alt={item.title}
                      width={60}
                      height={40}
                      className={styles.thumbnail}
                    />
                  </div>
                </td>
                <td>
                  <div className={styles.titleCell}>
                    <h4>{item.title}</h4>
                    <p>{item.excerpt.substring(0, 100)}...</p>
                  </div>
                </td>
                <td>
                  <span className={styles.categoryTag}>
                    {item.category}
                  </span>
                </td>
                <td>
                  <button
                    onClick={() => toggleStatus(item.id)}
                    className={`${styles.statusBtn} ${
                      item.status === 'published' ? styles.published : styles.draft
                    }`}
                  >
                    {item.status === 'published' ? 'Đã xuất bản' : 'Bản nháp'}
                  </button>
                </td>
                <td>{item.date}</td>
                <td>{item.author}</td>
                <td>
                  <div className={styles.actions}>
                    <Link 
                      href={`/admin/news/edit/${item.id}`} 
                      className={styles.editBtn}
                      title="Chỉnh sửa"
                    >
                      <i className="fas fa-edit"></i>
                    </Link>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className={styles.deleteBtn}
                      title="Xóa"
                      disabled={loading}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                    <Link 
                      href={`/blog/${item.slug}`} 
                      className={styles.viewBtn}
                      title="Xem"
                      target="_blank"
                    >
                      <i className="fas fa-eye"></i>
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredNews.length === 0 && (
          <div className={styles.emptyState}>
            <i className="fas fa-newspaper"></i>
            <h3>Không có tin tức nào</h3>
            <p>Hãy tạo tin tức đầu tiên của bạn!</p>
            <Link href="/admin/news/create" className={styles.createBtn}>
              Thêm Tin Tức Mới
            </Link>
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <i className="fas fa-newspaper"></i>
          <div>
            <h3>{news.length}</h3>
            <p>Tổng tin tức</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <i className="fas fa-check-circle"></i>
          <div>
            <h3>{news.filter(n => n.status === 'published').length}</h3>
            <p>Đã xuất bản</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <i className="fas fa-edit"></i>
          <div>
            <h3>{news.filter(n => n.status === 'draft').length}</h3>
            <p>Bản nháp</p>
          </div>
        </div>
      </div>
    </div>
  );
}
