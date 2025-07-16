"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import ActionButtons from "../../components/ActionButtons";
import styles from "./category-admin.module.css";

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  image: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export default function CategoryAdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    image: "",
    isActive: true,
    displayOrder: 1
  });

  useEffect(() => {
    if (!user || user.role !== "admin") {
      router.replace("/login");
      return;
    }
    fetchCategories();
  }, [user, router]);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingCategory ? "/api/categories" : "/api/categories";
      const method = editingCategory ? "PUT" : "POST";
      const body = editingCategory 
        ? { id: editingCategory.id, ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      
      if (data.success) {
        alert(editingCategory ? "Cập nhật danh mục thành công!" : "Thêm danh mục thành công!");
        setFormData({ name: "", slug: "", description: "", image: "", isActive: true, displayOrder: 1 });
        setShowAddForm(false);
        setEditingCategory(null);
        fetchCategories();
      } else {
        alert("Có lỗi xảy ra!");
      }
    } catch (error) {
      console.error("Error saving category:", error);
      alert("Có lỗi xảy ra!");
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description,
      image: category.image,
      isActive: category.isActive,
      displayOrder: category.displayOrder
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa danh mục này?")) return;

    try {
      const response = await fetch(`/api/categories?id=${id}`, {
        method: "DELETE"
      });

      const data = await response.json();
      
      if (data.success) {
        alert("Xóa danh mục thành công!");
        fetchCategories();
      } else {
        alert("Có lỗi xảy ra khi xóa!");
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("Có lỗi xảy ra!");
    }
  };

  const resetForm = () => {
    setFormData({ name: "", slug: "", description: "", image: "", isActive: true, displayOrder: 1 });
    setEditingCategory(null);
    setShowAddForm(false);
  };

  if (!user || user.role !== "admin") {
    return null;
  }

  if (loading) {
    return <div className={styles.loading}>Đang tải dữ liệu...</div>;
  }

  return (
    <div className={styles.categoryAdmin}>
      <div className={styles.header}>
        <h1>Quản lý danh mục</h1>
        <button 
          className={`${styles.btn} ${styles.btnPrimary}`}
          onClick={() => setShowAddForm(true)}
        >
          Thêm danh mục mới
        </button>
      </div>

      {/* Form thêm/sửa danh mục */}
      {showAddForm && (
        <div className={styles.formOverlay}>
          <div className={styles.formContainer}>
            <h2>{editingCategory ? "Sửa danh mục" : "Thêm danh mục mới"}</h2>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label>Tên danh mục:</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Slug (URL):</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({...formData, slug: e.target.value})}
                  required
                  placeholder="vd: ao-thun-nam"
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Mô tả:</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Hình ảnh (URL):</label>
                <input
                  type="text"
                  value={formData.image}
                  onChange={(e) => setFormData({...formData, image: e.target.value})}
                  placeholder="/images/category-name.jpg"
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Thứ tự hiển thị:</label>
                <input
                  type="number"
                  value={formData.displayOrder || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    const numValue = parseInt(value) || 1;
                    setFormData({...formData, displayOrder: numValue});
                  }}
                  min="1"
                />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  />
                  Kích hoạt danh mục
                </label>
              </div>
              
              <div className={styles.formActions}>
                <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>
                  {editingCategory ? "Cập nhật" : "Thêm mới"}
                </button>
                <button 
                  type="button" 
                  className={`${styles.btn} ${styles.btnSecondary}`}
                  onClick={resetForm}
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Danh sách danh mục */}
      <div className={styles.categoryList}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Hình ảnh</th>
              <th>Tên danh mục</th>
              <th>Slug</th>
              <th>Mô tả</th>
              <th>Trạng thái</th>
              <th>Thứ tự</th>
              <th>Ngày tạo</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id}>
                <td>{category.id}</td>
                <td>
                  {category.image && (
                    <img 
                      src={category.image} 
                      alt={category.name}
                      className={styles.categoryImage}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/no-image.png';
                      }}
                    />
                  )}
                </td>
                <td>{category.name}</td>
                <td><code>{category.slug}</code></td>
                <td className={styles.description}>{category.description}</td>
                <td>
                  <span className={`${styles.status} ${category.isActive ? styles.active : styles.inactive}`}>
                    {category.isActive ? 'Kích hoạt' : 'Tạm dừng'}
                  </span>
                </td>
                <td>{category.displayOrder}</td>
                <td>{new Date(category.createdAt).toLocaleDateString('vi-VN')}</td>
                <td>
                  <ActionButtons 
                    customActions={[
                      {
                        label: "Chỉnh sửa",
                        action: () => handleEdit(category),
                        type: "primary",
                        icon: "fas fa-edit"
                      },
                      {
                        label: "Xóa",
                        action: () => handleDelete(category.id),
                        type: "danger", 
                        icon: "fas fa-trash"
                      }
                    ]}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {categories.length === 0 && (
          <div className={styles.emptyState}>
            <p>Chưa có danh mục nào. Hãy thêm danh mục đầu tiên!</p>
          </div>
        )}
      </div>
    </div>
  );
}
