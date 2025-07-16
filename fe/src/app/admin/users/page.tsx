"use client";
import { useEffect, useState } from "react";
import ActionButtons from "../../components/ActionButtons";
import styles from "./user-admin.module.css";

export default function UserAdminPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    async function fetchUsers() {
      const res = await fetch("/data/users.json");
      const data = await res.json();
      setUsers(data);
    }
    fetchUsers();
  }, []);

  // Chỉ cho phép sửa tên, email, role, không cho sửa username, password ở đây
  function UserForm({ user, onSave, onCancel }: any) {
    const [form, setForm] = useState(user || { name: "", email: "", role: "user" });
    return (
      <form
        onSubmit={e => {
          e.preventDefault();
          onSave(form);
        }}
        style={{ display: "flex", flexDirection: "column", gap: 8 }}
      >
        <input className={styles.adminFormInput} required placeholder="Tên" value={form.name} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} />
        <input className={styles.adminFormInput} required placeholder="Email" value={form.email} onChange={e => setForm((f: any) => ({ ...f, email: e.target.value }))} />
        <select className={styles.adminFormInput} value={form.role} onChange={e => setForm((f: any) => ({ ...f, role: e.target.value }))}>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit">Lưu</button>
          {onCancel && <button type="button" onClick={onCancel}>Hủy</button>}
        </div>
      </form>
    );
  }

  function handleEdit(user: any) {
    setEditing(user);
    setShowForm(true);
  }

  function handleSaveEdit(edited: any) {
    setUsers(users => users.map(u => (u.username === edited.username ? { ...u, ...edited } : u)));
    setEditing(null);
  }

  function handleDelete(username: string) {
    if (!window.confirm("Xóa người dùng này?")) return;
    setUsers(users => users.filter(u => u.username !== username));
  }

  return (
    <div className={styles.adminContainer}>
      <h2>Quản lý người dùng</h2>
      {editing && <UserForm user={editing} onSave={handleSaveEdit} onCancel={() => setEditing(null)} />}
      <table className={styles.adminTable}>
        <thead>
          <tr>
            <th>Tên</th><th>Email</th><th>Username</th><th>Role</th><th>Ngày tạo</th><th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.username}>
              <td>{u.name || u.fullname}</td>
              <td>{u.email}</td>
              <td>{u.username}</td>
              <td>{u.role}</td>
              <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : ""}</td>
              <td>
                <ActionButtons 
                  customActions={[
                    {
                      label: "Chỉnh sửa",
                      action: () => handleEdit(u),
                      type: "primary",
                      icon: "fas fa-edit"
                    },
                    {
                      label: "Xóa",
                      action: () => handleDelete(u.username),
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
