"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts";
import { useApiNotification } from "@/hooks";
import { validateLoginForm, hasFormErrors, FormErrors } from "@/utils/validation";
import { getRedirectUrl } from '@/lib/redirectUtils';
import { Button, PageHeader, LoadingSpinner, GoogleSignInButton } from "@/app/components/ui";
import FormError from "../components/FormError";
import { FaSignInAlt, FaLock, FaEye, FaEyeSlash, FaEnvelope } from "react-icons/fa";
import styles from "./LoginPage.module.css";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, user, setUser } = useAuth();
  const { showError, showSuccess } = useApiNotification();
  const redirectPath = getRedirectUrl(searchParams, '/');

  // Handle navigation efficiently
  const handleNavigation = (path: string) => {
    router.push(path);
  };

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push(redirectPath);
    }
  }, [user, router, redirectPath]);

  // Pre-fill email from query parameter (from register redirect)
  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

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

  // Handle Google Sign-In Success
  const handleGoogleSuccess = async (googleAuthResponse: any) => {
    try {
      // Google authentication was successful
      // Use AuthContext to set user state properly
      if (setUser) {
        setUser(googleAuthResponse.user, googleAuthResponse.token);
      }
      
      // Check if this is a new user or existing user  
      if (googleAuthResponse.isNewUser === true) {
        showSuccess(`Chào mừng ${googleAuthResponse.user.name} đến với FINO Store!`);
      } else {
        showSuccess(`Chào mừng ${googleAuthResponse.user.name} trở lại FINO Store!`);
      }
      
      // Redirect to desired page
      router.push(redirectPath);
    } catch (error: any) {
      console.error('❌ Google Sign-In processing error:', error);
      showError('Có lỗi xảy ra trong quá trình xử lý đăng nhập Google');
    }
  };

  // Handle Google Sign-In Error
  const handleGoogleError = (error: Error) => {
    console.error('❌ Google Sign-In error:', error);
    showError(error.message || 'Đăng nhập Google thất bại');
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
      showSuccess('Đăng nhập thành công! Chào mừng bạn trở lại.');
      
      // Redirect to the page user was trying to access, or home
      router.push(redirectPath);
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Handle specific API errors
      if (error.message.includes('không tồn tại')) {
        setErrors({ email: 'Email không tồn tại trong hệ thống' });
      } else if (error.message.includes('mật khẩu')) {
        setErrors({ password: 'Mật khẩu không chính xác' });
      } else {
        showError('Đăng nhập thất bại', error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginPage}>
      {/* Background Overlay for Focus Effect */}
      <div className={styles.backgroundOverlay}></div>
      
      {/* Main Content - Centered */}
      <div className={styles.mainContainer}>
        <div className={styles.loginCard}>
          {/* Login Header */}
          <div className={styles.loginHeader}>
            <h2 className={styles.loginTitle}>Đăng nhập</h2>
            <p className={styles.loginSubtitle}>
              {searchParams.get('email') ? 
                'Tài khoản Gmail này đã tồn tại. Vui lòng đăng nhập.' : 
                'Chào mừng bạn trở lại với FINO SHOP'
              }
            </p>
          </div>

                {/* Login Form */}
                <form className={styles.loginForm} onSubmit={handleSubmit}>
                  <div className={styles.formGroup}>
                    <label htmlFor="email" className={styles.fieldLabel}>
                      <FaEnvelope className={styles.labelIcon} />
                      Email
                    </label>
                    <div className={styles.inputWrapper}>
                      <input
                        id="email"
                        type="email"
                        name="email"
                        placeholder="Nhập email của bạn"
                        className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                        value={email}
                        onChange={handleEmailChange}
                        onBlur={() => validateField('email', email)}
                        required
                        autoComplete="email"
                      />
                    </div>
                    <FormError error={errors.email} />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="password" className={styles.fieldLabel}>
                      <FaLock className={styles.labelIcon} />
                      Mật khẩu
                    </label>
                    <div className={styles.inputWrapper}>
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Nhập mật khẩu của bạn"
                        className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
                        value={password}
                        onChange={handlePasswordChange}
                        onBlur={() => validateField('password', password)}
                        required
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        className={styles.passwordToggle}
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    <FormError error={errors.password} />
                  </div>

                  <div className={styles.formActions}>
                    <button 
                      type="button"
                      onClick={() => handleNavigation('/forgot-password')}
                      className={styles.forgotLink}
                    >
                      Quên mật khẩu?
                    </button>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className={styles.submitButton}
                    isLoading={loading}
                    disabled={loading}
                  >
                    Đăng nhập
                  </Button>
                </form>

                {/* Social Login */}
                <div className={styles.socialSection}>
                  <div className={styles.divider}>
                    <span className={styles.dividerText}>Hoặc đăng nhập với</span>
                  </div>
                  
                  <div className={styles.socialButtons}>
                    <GoogleSignInButton
                      onSuccess={handleGoogleSuccess}
                      onError={handleGoogleError}
                      disabled={loading}
                      text="Google"
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className={styles.loginFooter}>
                  <p className={styles.signupPrompt}>
                    Chưa có tài khoản FINO SHOP?{' '}
                    <button 
                      type="button"
                      onClick={() => handleNavigation('/register')}
                      className={styles.signupLink}
                    >
                      Đăng ký ngay
                    </button>
                  </p>
                </div>
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={
      <div className="container">
        <div className={styles.loadingContainer}>
          <LoadingSpinner size="lg" />
          <p>Đang tải trang đăng nhập...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
