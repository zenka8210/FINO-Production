"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts";
import { useApiNotification } from "@/hooks";
import { validateRegisterForm, hasFormErrors, FormErrors } from "@/utils/validation";
import { Button, LoadingSpinner, GoogleSignInButton } from "@/app/components/ui";
import FormError from "../components/FormError";
import { FaUser, FaLock, FaEye, FaEyeSlash, FaEnvelope, FaPhone } from "react-icons/fa";
import styles from "./RegisterPage.module.css";

function RegisterForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register, user, setUser } = useAuth();
  const { showError, showSuccess } = useApiNotification();
  const redirectPath = searchParams.get('redirect') || '/';

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

  // Real-time validation
  const validateField = (field: string, value: string) => {
    const formErrors = validateRegisterForm(
      field === 'name' ? value : formData.name,
      field === 'email' ? value : formData.email,
      field === 'phone' ? value : formData.phone,
      field === 'password' ? value : formData.password,
      field === 'confirmPassword' ? value : formData.confirmPassword
    );
    
    setErrors(prev => ({
      ...prev,
      [field]: formErrors[field]
    }));
  };

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      validateField(field, value);
    }
  };

  // Handle Google Sign-In Success
  const handleGoogleSuccess = async (googleAuthResponse: any) => {
    try {
      // Check if this is a new user or existing user
      if (googleAuthResponse.isNewUser === false) {
        // User already exists - should not auto-login from register page
        // Show error and redirect to login page
        showError(`Tài khoản Gmail ${googleAuthResponse.user.email} đã tồn tại. Vui lòng đăng nhập thay vì đăng ký.`);
        
        // Redirect to login page after showing error
        setTimeout(() => {
          router.push(`/login?email=${encodeURIComponent(googleAuthResponse.user.email)}`);
        }, 2000);
        return;
      }
      
      // New user registration via Google - proceed with login
      if (setUser) {
        setUser(googleAuthResponse.user, googleAuthResponse.token);
      }
      
      showSuccess(`Chào mừng ${googleAuthResponse.user.name} đến với FINO Store!`);
      
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
    const formErrors = validateRegisterForm(
      formData.name,
      formData.email,
      formData.phone,
      formData.password,
      formData.confirmPassword
    );
    setErrors(formErrors);

    if (hasFormErrors(formErrors)) {
      showError('Vui lòng sửa các lỗi trong form');
      return;
    }

    try {
      setLoading(true);
      console.log('Attempting register with:', { ...formData, password: '***', confirmPassword: '***' });
      await register(formData);
      showSuccess('Đăng ký thành công! Chào mừng bạn đến với FINO SHOP.');
      
      // Redirect will be handled automatically in AuthContext
    } catch (error: any) {
      console.error('Register error:', error);
      
      // Handle specific API errors
      if (error.message.includes('email đã tồn tại')) {
        setErrors({ email: 'Email này đã được sử dụng' });
      } else if (error.message.includes('số điện thoại')) {
        setErrors({ phone: 'Số điện thoại này đã được sử dụng' });
      } else {
        showError('Đăng ký thất bại', error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.registerPage}>
      {/* Background Overlay for Focus Effect */}
      <div className={styles.backgroundOverlay}></div>
      
      {/* Main Content - Centered */}
      <div className={styles.mainContainer}>
        <div className={styles.registerCard}>
          {/* Register Header */}
          <div className={styles.registerHeader}>
            <h2 className={styles.registerTitle}>Đăng ký tài khoản</h2>
            <p className={styles.registerSubtitle}>
              Tạo tài khoản mới để tham gia FINO SHOP
            </p>
          </div>

          {/* Register Form */}
          <form className={styles.registerForm} onSubmit={handleSubmit}>
            {/* Name Field */}
            <div className={styles.formGroup}>
              <label htmlFor="name" className={styles.fieldLabel}>
                <FaUser className={styles.labelIcon} />
                Họ tên
              </label>
              <div className={styles.inputWrapper}>
                <input
                  id="name"
                  type="text"
                  name="name"
                  placeholder="Nhập họ tên đầy đủ của bạn"
                  className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                  value={formData.name}
                  onChange={handleInputChange('name')}
                  onBlur={() => validateField('name', formData.name)}
                  required
                  autoComplete="name"
                />
              </div>
              <FormError error={errors.name} />
            </div>

            {/* Email Field */}
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
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  onBlur={() => validateField('email', formData.email)}
                  required
                  autoComplete="email"
                />
              </div>
              <FormError error={errors.email} />
            </div>

            {/* Phone Field */}
            <div className={styles.formGroup}>
              <label htmlFor="phone" className={styles.fieldLabel}>
                <FaPhone className={styles.labelIcon} />
                Số điện thoại
              </label>
              <div className={styles.inputWrapper}>
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  placeholder="Nhập số điện thoại của bạn"
                  className={`${styles.input} ${errors.phone ? styles.inputError : ''}`}
                  value={formData.phone}
                  onChange={handleInputChange('phone')}
                  onBlur={() => validateField('phone', formData.phone)}
                  required
                  autoComplete="tel"
                />
              </div>
              <FormError error={errors.phone} />
            </div>

            {/* Password Field */}
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
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  onBlur={() => validateField('password', formData.password)}
                  required
                  autoComplete="new-password"
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

            {/* Confirm Password Field */}
            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword" className={styles.fieldLabel}>
                <FaLock className={styles.labelIcon} />
                Xác nhận mật khẩu
              </label>
              <div className={styles.inputWrapper}>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Nhập lại mật khẩu của bạn"
                  className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ''}`}
                  value={formData.confirmPassword}
                  onChange={handleInputChange('confirmPassword')}
                  onBlur={() => validateField('confirmPassword', formData.confirmPassword)}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              <FormError error={errors.confirmPassword} />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className={styles.submitButton}
              isLoading={loading}
              disabled={loading}
            >
              Đăng ký tài khoản
            </Button>
          </form>

          {/* Social Register */}
          <div className={styles.socialSection}>
            <div className={styles.divider}>
              <span className={styles.dividerText}>Hoặc đăng ký với</span>
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
          <div className={styles.registerFooter}>
            <p className={styles.loginPrompt}>
              Đã có tài khoản FINO SHOP?{' '}
              <button 
                type="button"
                onClick={() => handleNavigation('/login')}
                className={styles.loginLink}
              >
                Đăng nhập ngay
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Register() {
  return (
    <Suspense fallback={
      <div className="container">
        <div className={styles.loadingContainer}>
          <LoadingSpinner size="lg" />
          <p>Đang tải trang đăng ký...</p>
        </div>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
