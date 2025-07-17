"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts";
import { useNotifications } from "@/hooks";
import { validateLoginForm, hasFormErrors, FormErrors } from "@/utils/validation";
import FormError from "../components/FormError";
import styles from "./login-new.module.css";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, user } = useAuth();
  const { showError, showSuccess } = useNotifications();
  const redirectPath = searchParams.get('redirect') || '/';

  // Redirect nếu đã đăng nhập
  useEffect(() => {
    if (user) {
      router.push(redirectPath);
    }
  }, [user, router, redirectPath]);

  // Real-time validation
  const validateField = (field: string, value: string) => {
    const formErrors = validateLoginForm(
      field === 'email' ? value : email,
      field === 'password' ? value : password
    );
    
    setErrors(prev => ({
      ...prev,
      [field]: formErrors[field]
    }));
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (errors.email) {
      validateField('email', value);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (errors.password) {
      validateField('password', value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const formErrors = validateLoginForm(email, password);
    setErrors(formErrors);

    if (hasFormErrors(formErrors)) {
      showError('Vui lòng sửa các lỗi trong form');
      return;
    }

    try {
      setLoading(true);
      console.log('Attempting login with:', { email, password: '***' });
      await login({ email, password });
      showSuccess('Thành công!', 'Đăng nhập thành công! Chào mừng bạn trở lại.');
      
      // Redirect sẽ được xử lý tự động trong AuthContext
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Handle specific API errors
      if (error.message.includes('không tồn tại')) {
        setErrors({ email: 'Email không tồn tại trong hệ thống' });
      } else if (error.message.includes('mật khẩu')) {
        setErrors({ password: 'Mật khẩu không chính xác' });
      } else {
        showError('Lỗi đăng nhập', error.message || 'Đăng nhập thất bại');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginCard}>
        <h1 className={styles.title}>ĐĂNG NHẬP</h1>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>EMAIL</label>
            <input
              type="email"
              name="email"
              placeholder="Nhập email của bạn"
              className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
              value={email}
              onChange={handleEmailChange}
              onBlur={() => validateField('email', email)}
              required
            />
            <FormError error={errors.email} />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>MẬT KHẨU</label>
            <div className={styles.passwordWrapper}>
              <input
                type="password"
                name="password"
                placeholder="Nhập mật khẩu"
                className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
                value={password}
                onChange={handlePasswordChange}
                onBlur={() => validateField('password', password)}
                required
              />
            </div>
            <FormError error={errors.password} />
          </div>

          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? 'ĐANG ĐĂNG NHẬP...' : 'ĐĂNG NHẬP'}
          </button>
        </form>

        <div className={styles.links}>
          <p>
            <span>Chưa có tài khoản? </span>
            <a href="/register" className={styles.link}>
              Đăng ký ngay
            </a>
          </p>
          <p>
            <a href="/forgot-password" className={styles.link}>
              Quên mật khẩu?
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
