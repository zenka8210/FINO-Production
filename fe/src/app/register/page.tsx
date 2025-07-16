'use client';
import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from './register.module.css';

export default function RegisterForm() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    address: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp!");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullname: form.fullName,
          email: form.email,
          username: form.username,
          password: form.password,
          phone: form.phoneNumber,
          address: form.address,
          role: "user"
        })
      });
      const data = await res.json();
      if (data.success) {
        alert("Đăng ký thành công! Hãy đăng nhập.");
        router.push("/login");
      } else {
        setError(data.message || "Đăng ký thất bại!");
      }
    } catch (err) {
      setError("Lỗi hệ thống!");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="container">
      <div className="row">
        <div className="col-6 col-md-8 col-sm-12" style={{margin: '0 auto'}}>
          <div className={styles.container}>
            <form className={styles.form} onSubmit={handleSubmit}>
              <h2>Đăng Ký Tài Khoản</h2>
              {error && <div style={{color:'red', marginBottom:8}}>{error}</div>}
              <div className={styles.formGroup}>
                <input
                  type="text"
                  name="fullName"
                  placeholder="Họ và tên"
                  required
                  className={styles.input}
                  value={form.fullName}
                  onChange={handleChange}
                />
              </div>
              <div className={styles.formGroup}>
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  required
                  className={styles.input}
                  value={form.email}
                  onChange={handleChange}
                />
              </div>
              <div className={styles.formGroup}>
                <input
                  type="text"
                  name="username"
                  placeholder="Tên đăng nhập"
                  required
                  className={styles.input}
                  value={form.username}
                  onChange={handleChange}
                />
              </div>
              <div className={styles.formGroup}>
                <input
                  type="password"
                  name="password"
                  placeholder="Mật khẩu"
                  required
                  className={styles.input}
                  value={form.password}
                  onChange={handleChange}
                />
              </div>
              <div className={styles.formGroup}>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Xác nhận mật khẩu"
                  required
                  className={styles.input}
                  value={form.confirmPassword}
                  onChange={handleChange}
                />
              </div>
              <div className={styles.formGroup}>
                <input
                  type="tel"
                  name="phoneNumber"
                  placeholder="Số điện thoại"
                  required
                  className={styles.input}
                  value={form.phoneNumber}
                  onChange={handleChange}
                />
              </div>
              <div className={styles.formGroup}>
                <textarea
                  name="address"
                  placeholder="Địa chỉ"
                  rows={3}
                  className={styles.textarea}
                  value={form.address}
                  onChange={handleChange}
                />
              </div>
              <button type="submit" className={styles.submitButton} disabled={loading}>
                {loading ? "Đang đăng ký..." : "Đăng Ký"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}