"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts";
import { useApiNotification } from "@/hooks";
import { FaUser, FaLock, FaEye, FaEyeSlash, FaArrowRight } from "react-icons/fa";
import styles from "./SimpleLogin.module.css";

export default function SimpleLogin() {
  const [credentials, setCredentials] = useState({
    email: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  const router = useRouter();
  const { login } = useAuth();
  const { showError, showSuccess } = useApiNotification();

  // Typing animation effect
  const [displayText, setDisplayText] = useState("");
  const fullText = "Chào mừng trở lại!";

  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      if (index < fullText.length) {
        setDisplayText(fullText.slice(0, index + 1));
        index++;
      } else {
        clearInterval(timer);
      }
    }, 100);

    return () => clearInterval(timer);
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!credentials.email.trim()) {
      showError("Email không được để trống");
      return false;
    }
    if (!credentials.email.includes("@")) {
      showError("Email không hợp lệ");
      return false;
    }
    if (!credentials.password.trim()) {
      showError("Mật khẩu không được để trống");
      return false;
    }
    if (credentials.password.length < 6) {
      showError("Mật khẩu phải có ít nhất 6 ký tự");
      return false;
    }
    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await login(credentials);
      showSuccess("Đăng nhập thành công! Chuyển hướng...");
      
      // Save remember me preference
      if (rememberMe) {
        localStorage.setItem("rememberEmail", credentials.email);
      } else {
        localStorage.removeItem("rememberEmail");
      }
      
      // Delay for better UX
      setTimeout(() => {
        router.push("/");
      }, 1000);
    } catch (error: any) {
      showError(error.message || "Đăng nhập thất bại. Vui lòng thử lại!");
    } finally {
      setIsLoading(false);
    }
  };

  // Load remembered email
  useEffect(() => {
    const rememberedEmail = localStorage.getItem("rememberEmail");
    if (rememberedEmail) {
      setCredentials(prev => ({ ...prev, email: rememberedEmail }));
      setRememberMe(true);
    }
  }, []);

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        {/* Header Section */}
        <div className={styles.headerSection}>
          <div className={styles.logoArea}>
            <div className={styles.logoIcon}>🔐</div>
            <h1 className={styles.brandName}>FINO</h1>
          </div>
          <h2 className={styles.welcomeText}>{displayText}</h2>
          <p className={styles.subText}>Đăng nhập để tiếp tục mua sắm</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className={styles.loginForm}>
          {/* Email Input */}
          <div className={styles.inputWrapper}>
            <div className={styles.inputIcon}>
              <FaUser />
            </div>
            <input
              type="email"
              placeholder="Nhập email của bạn"
              value={credentials.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className={styles.formInput}
              disabled={isLoading}
              autoComplete="email"
            />
          </div>

          {/* Password Input */}
          <div className={styles.inputWrapper}>
            <div className={styles.inputIcon}>
              <FaLock />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Nhập mật khẩu"
              value={credentials.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              className={styles.formInput}
              disabled={isLoading}
              autoComplete="current-password"
            />
            <button
              type="button"
              className={styles.passwordToggle}
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className={styles.formOptions}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className={styles.checkbox}
                disabled={isLoading}
              />
              <span className={styles.checkboxText}>Ghi nhớ đăng nhập</span>
            </label>
            <a href="/forgot-password" className={styles.forgotLink}>
              Quên mật khẩu?
            </a>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className={`${styles.loginButton} ${isLoading ? styles.loading : ""}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className={styles.spinner}></div>
            ) : (
              <>
                <span>Đăng nhập</span>
                <FaArrowRight className={styles.buttonIcon} />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className={styles.formFooter}>
          <p className={styles.registerPrompt}>
            Chưa có tài khoản?{" "}
            <a href="/register" className={styles.registerLink}>
              Đăng ký ngay
            </a>
          </p>
        </div>
      </div>

      {/* Background Decoration */}
      <div className={styles.backgroundDecor}>
        <div className={styles.circle1}></div>
        <div className={styles.circle2}></div>
        <div className={styles.circle3}></div>
      </div>
    </div>
  );
}
