"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import styles from "./security.module.css";
import { useRouter } from "next/navigation";

export default function SecurityPage() {
  const { user, logout } = useAuth();
  const [form, setForm] = useState({
    fullname: "",
    address: "",
    password: "",
    newPassword: "",
    confirmNewPassword: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (user?.username) {
      fetch("/api/profile?username=" + encodeURIComponent(user.username))
        .then(res => res.json())
        .then(data => {
          if (data.user) {
            setForm(f => ({ ...f, fullname: data.user.fullname || data.user.name || "", address: data.user.address || "" }));
          }
        });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (form.newPassword && form.newPassword !== form.confirmNewPassword) {
      setError("Mật khẩu mới xác nhận không khớp!");
      return;
    }
    const res = await fetch("/api/security", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: user?.username,
        fullname: form.fullname,
        address: form.address,
        password: form.password,
        newPassword: form.newPassword
      })
    });
    const data = await res.json();
    if (data.success) {
      setSuccess("Cập nhật thành công!");
      setForm(f => ({ ...f, password: "", newPassword: "", confirmNewPassword: "" }));
      if (data.logout) {
        alert("Bạn cần đăng nhập lại!");
        logout();
        router.push("/login");
      }
    } else {
      setError(data.message || "Cập nhật thất bại!");
    }
  };

  return (
    <div className={styles.securityContainer}>
      <h1>Bảo mật & Thay đổi thông tin</h1>
      <form className={styles.form} onSubmit={handleSubmit}>
        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}
        <div className={styles.formGroup}>
          <label>Họ tên mới</label>
          <input type="text" name="fullname" value={form.fullname} onChange={handleChange} className={styles.input} />
        </div>
        <div className={styles.formGroup}>
          <label>Địa chỉ mới</label>
          <textarea name="address" value={form.address} onChange={handleChange} className={styles.textarea} />
        </div>
        <div className={styles.formGroup}>
          <label>Mật khẩu hiện tại</label>
          <input type="password" name="password" value={form.password} onChange={handleChange} className={styles.input} required />
        </div>
        <div className={styles.formGroup}>
          <label>Mật khẩu mới</label>
          <input type="password" name="newPassword" value={form.newPassword} onChange={handleChange} className={styles.input} />
        </div>
        <div className={styles.formGroup}>
          <label>Xác nhận mật khẩu mới</label>
          <input type="password" name="confirmNewPassword" value={form.confirmNewPassword} onChange={handleChange} className={styles.input} />
        </div>
        <button type="submit" className={styles.submitButton}>Cập nhật</button>
      </form>
    </div>
  );
}
