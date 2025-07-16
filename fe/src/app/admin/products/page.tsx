"use client";
import { useEffect, useState } from "react";
import ActionButtons from "../../components/ActionButtons";
import styles from "./product-admin.module.css";

function ProductForm({ onSave, product, onCancel }: any) {
  const [form, setForm] = useState(product || { name: "", price: "", image: "", description: "", category: "" });
  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        onSave(form);
      }}
      style={{ display: "flex", flexDirection: "column", gap: 8 }}
    >
      <input className={styles.adminFormInput} required placeholder="Tên sản phẩm" value={form.name} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} />
      <input className={styles.adminFormInput} required type="number" placeholder="Giá" value={form.price} onChange={e => setForm((f: any) => ({ ...f, price: e.target.value }))} />
      <input className={styles.adminFormInput} required placeholder="Link ảnh" value={form.image} onChange={e => setForm((f: any) => ({ ...f, image: e.target.value }))} />
      <input className={styles.adminFormInput} required placeholder="Mô tả" value={form.description} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} />
      <input className={styles.adminFormInput} required placeholder="Danh mục (số)" value={form.category} onChange={e => setForm((f: any) => ({ ...f, category: e.target.value }))} />
      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit">Lưu</button>
        {onCancel && <button type="button" onClick={onCancel}>Hủy</button>}
      </div>
    </form>
  );
}

export default function ProductAdminPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    async function fetchProducts() {
      const res = await fetch("/api/products");
      const data = await res.json();
      setProducts(data.products || []);
    }
    fetchProducts();
  }, []);

  async function handleAdd(product: any) {
    const res = await fetch("/api/products", { method: "POST", body: JSON.stringify(product) });
    if (res.ok) {
      const data = await res.json();
      setProducts(p => [...p, data.product]);
      setShowForm(false);
    }
  }
  async function handleEdit(product: any) {
    const res = await fetch("/api/products", { method: "PUT", body: JSON.stringify(product) });
    if (res.ok) {
      const data = await res.json();
      setProducts(p => p.map(i => (i.id === data.product.id ? data.product : i)));
      setEditing(null);
    }
  }
  async function handleDelete(id: string) {
    if (!window.confirm("Xóa sản phẩm này?")) return;
    const res = await fetch("/api/products", { method: "DELETE", body: JSON.stringify({ id }) });
    if (res.ok) setProducts(p => p.filter(i => i.id !== id));
  }

  return (
    <div className={styles.adminContainer}>
      <h2>Quản lý sản phẩm</h2>
      <button onClick={() => { setShowForm(true); setEditing(null); }}>Thêm sản phẩm</button>
      {showForm && <ProductForm onSave={handleAdd} onCancel={() => setShowForm(false)} />}
      {editing && <ProductForm product={editing} onSave={handleEdit} onCancel={() => setEditing(null)} />}
      <table className={styles.adminTable}>
        <thead>
          <tr>
            <th>Tên</th><th>Giá</th><th>Ảnh</th><th>Mô tả</th><th>Danh mục</th><th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {products.map(p => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.price}</td>
              <td><img src={p.image} alt={p.name} width={50} /></td>
              <td>{p.description}</td>
              <td>{p.category}</td>
              <td>
                <ActionButtons 
                  customActions={[
                    {
                      label: "Chỉnh sửa",
                      action: () => { setEditing(p); setShowForm(false); },
                      type: "primary",
                      icon: "fas fa-edit"
                    },
                    {
                      label: "Xóa",
                      action: () => handleDelete(p.id),
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
    </div>
  );
}
