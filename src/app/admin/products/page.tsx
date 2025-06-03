"use client";
import { useEffect, useState } from "react";
import { Product } from "../../component/interface";
import styles from "./adProducts.module.css";

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<Product>({ name: "", price: 0, image: "" });
  const [editId, setEditId] = useState<number | string | null>(null);

  const fetchProducts = async () => {
    try {
      const res = await fetch("http://localhost:3450/product");
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error("Lỗi tải danh sách sản phẩm", err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: name === "price" ? +value : value });
  };

  const handleSubmit = async () => {
    const method = editId ? "PUT" : "POST";
    const url = editId
      ? `http://localhost:3450/product/${editId}`
      : "http://localhost:3450/product";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setForm({ name: "", price: 0, image: "" });
    setEditId(null);
    fetchProducts();
  };

  const handleEdit = (product: Product) => {
    setForm(product);
    setEditId(product.id ?? null);
  };

  const handleDelete = async (id: number | string | undefined) => {
    if (!id) return;
    await fetch(`http://localhost:3450/product/${id}`, { method: "DELETE" });
    fetchProducts();
  };

  return (
    <div className={styles.adminContainer}>
      <h1>Quản lý sản phẩm</h1>

      <div className={styles.formGroup}>
        <input
          type="text"
          name="name"
          placeholder="Tên sản phẩm"
          value={form.name}
          onChange={handleChange}
        />
        <input
          type="number"
          name="price"
          placeholder="Giá"
          value={form.price?.toString() ?? ""} // CHUYỂN SANG STRING
          onChange={handleChange}
        />
        <input
          type="text"
          name="image"
          placeholder="Link ảnh"
          value={form.image}
          onChange={handleChange}
        />
        <button onClick={handleSubmit}>
          {editId ? "Cập nhật" : "Thêm"}
        </button>
      </div>

      <table className={styles.productTable}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Tên sản phẩm</th>
            <th>Giá</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id?.toString()}>
              <td>{product.id}</td>
              <td>{product.name}</td>
              <td>{product.price} VND</td>
              <td>
                <button onClick={() => handleEdit(product)} className={styles.editBtn}>
                  Sửa
                </button>
                <button onClick={() => handleDelete(product.id)} className={styles.deleteBtn}>
                  Xóa
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
