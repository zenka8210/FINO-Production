"use client";
import { useEffect, useState } from "react";
import styles from "./adUsers.module.css";

interface User {
  id?: number | string;
  name: string;
  username: string;
  password: string;
  role: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState<User>({
    name: "",
    username: "",
    password: "",
    role: "",
  });
  const [editId, setEditId] = useState<number | string | null>(null);
  const [error, setError] = useState<string>("");

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error("Lỗi tải danh sách người dùng", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const method = editId ? "PUT" : "POST";
    const url = editId ? `/api/users/${editId}` : "/api/users";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Có lỗi xảy ra khi lưu.");
        return;
      }

      // Cập nhật lại danh sách & reset form
      fetchUsers();
      setForm({ name: "", username: "", password: "", role: "" });
      setEditId(null);
    } catch (err) {
      console.error("Lỗi gửi dữ liệu:", err);
      setError("Không thể kết nối server.");
    }
  };

  const handleEdit = (user: User) => {
    setForm({ ...user, password: "" }); // không hiện mật khẩu cũ
    setEditId(user.id ?? null);
  };

  const handleDelete = async (id?: number | string) => {
    if (!id) return;
    try {
      await fetch(`/api/users/${id}`, { method: "DELETE" });
      fetchUsers();
    } catch (err) {
      console.error("Lỗi khi xóa người dùng:", err);
    }
  };

  return (
    <div className={styles.userContainer}>
      <h1>Quản lý người dùng</h1>

      <form className={styles.formGroup} onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="Tên người dùng"
          value={form.name}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="username"
          placeholder="Tài khoản"
          value={form.username}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Mật khẩu"
          value={form.password}
          onChange={handleChange}
          required={!editId}
        />
        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          required
        >
          <option value="">-- Chọn vai trò --</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
        </select>
        <button type="submit">{editId ? "Cập nhật" : "Thêm"}</button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <table className={styles.userTable}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Tên</th>
            <th>Tài khoản</th>
            <th>Vai trò</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id?.toString()}>
              <td>{user.id}</td>
              <td>{user.name}</td>
              <td>{user.username}</td>
              <td>{user.role}</td>
              <td>
                <button
                  onClick={() => handleEdit(user)}
                  className={styles.editBtn}
                >
                  Sửa
                </button>
                <button
                  onClick={() => handleDelete(user.id)}
                  className={styles.deleteBtn}
                >
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
