"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts";
import { useApiNotification } from "@/hooks";
import styles from "./SimpleLogin.module.css";

export default function SimpleLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();
  const { showError, showSuccess } = useApiNotification();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      showError("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    setLoading(true);
    try {
      await login({ email, password });
      showSuccess("Đăng nhập thành công");
      router.push("/");
    } catch (error: any) {
      showError(error.message || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <h2 className={styles.title}>Đăng Nhập</h2>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              disabled={loading}
            />
          </div>

          <div className={styles.inputGroup}>
            <input
              type="password"
              placeholder="Mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
          >
            {loading ? "Đang đăng nhập..." : "Đăng Nhập"}
          </button>
        </form>

        <div className={styles.links}>
          <a href="/register" className={styles.link}>
            Chưa có tài khoản? Đăng ký
          </a>
          <a href="/forgot-password" className={styles.link}>
            Quên mật khẩu?
          </a>
        </div>
      </div>
    </div>
  );
}
