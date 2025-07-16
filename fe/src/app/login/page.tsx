"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import styles from "./login-new.module.css";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const redirectPath = searchParams.get('redirect') || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();      if (data.success) {
        // Lưu thông tin đầy đủ của user
        const userInfo = {
          username: data.username,
          role: data.role,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          address: data.address,
          city: data.city,
          district: data.district
        };
        
        login(userInfo); 
        alert("Đăng nhập thành công!");
        
        // Chuyển hướng về trang redirect hoặc trang mặc định
        if (data.role === "admin") {
          router.push("/admin");
        } else {
          router.push(redirectPath);
        }
      } else {
        alert("Sai tài khoản hoặc mật khẩu!");
      }
    } catch (error) {
      console.error("Lỗi khi đăng nhập:", error);
      alert("Lỗi hệ thống!");
    }
  };  return (
    <div className={styles.container}>
      <div className={styles.loginCard}>
        <h1 className={styles.title}>ĐĂNG NHẬP</h1>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>EMAIL</label>
            <input
              type="username"
              name="username"
              placeholder="Username hoặc Email"
              className={styles.input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>MẬT KHẨU</label>
            <div className={styles.passwordWrapper}>
              <input
                type="password"
                name="password"
                placeholder="Mật khẩu"
                className={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type="button" className={styles.showPasswordBtn}>
                <i className="fas fa-eye"></i>
              </button>
            </div>
          </div>

          <button type="submit" className={styles.loginButton}>
            ĐĂNG NHẬP
          </button>
        </form>

        <div className={styles.linkSection}>
          <a href="/forgot-password" className={styles.forgotLink}>Quên mật khẩu?</a>
          <a href="/register" className={styles.registerLink}>Đăng ký</a>
        </div>

        <div className={styles.socialLogin}>
          <button
            type="button"
            className={styles.googleButton}
            onClick={() => alert('Đăng nhập Google')}
          >
            <i className="fab fa-google"></i>
            ĐĂNG NHẬP GOOGLE
          </button>
          
          <button
            type="button"
            className={styles.facebookButton}
            onClick={() => alert('Đăng nhập Facebook')}
          >
            <i className="fab fa-facebook-f"></i>
            ĐĂNG NHẬP FACEBOOK
          </button>
        </div>
      </div>
    </div>
  );
}