"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts";
import { useApiNotification } from "@/hooks";
import { isValidEmail, FormErrors } from "@/utils/validation";
import { authService } from "@/services/authService";
import { Button, LoadingSpinner } from "@/app/components/ui";
import FormError from "../components/FormError";
import { FaEnvelope, FaArrowLeft, FaLock } from "react-icons/fa";
import styles from "./ForgotPasswordPage.module.css";

function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isEmailValid, setIsEmailValid] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const { showError, showSuccess } = useApiNotification();

  // Handle navigation efficiently
  const handleNavigation = (path: string) => {
    router.push(path);
  };

  // Simple forgot password implementation using authService
  const forgotPassword = async ({ email }: { email: string }) => {
    return await authService.forgotPassword(email);
  };

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  // Real-time validation
  const validateField = (value: string) => {
    const emailError = !isValidEmail(value) ? 'Email không hợp lệ' : '';
    const isValid = isValidEmail(value) && value.trim().length > 0;
    
    setIsEmailValid(isValid);
    setErrors(prev => ({
      ...prev,
      email: emailError
    }));
    
    return isValid;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    // Always validate on change for real-time feedback
    validateField(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate email first
    const isValid = validateField(email);
    if (!isValid) {
      showError('Vui lòng nhập email hợp lệ');
      return;
    }

    try {
      setLoading(true);
      console.log('Attempting forgot password with:', { email });
      const result = await forgotPassword({ email });
      setIsEmailSent(true);
      showSuccess('Email khôi phục mật khẩu đã được gửi! Vui lòng kiểm tra hộp thư của bạn.');
    } catch (error: any) {
      console.error('Forgot password error:', error);
      
      // Handle specific API errors
      if (error.message.includes('không tồn tại') || error.status === 404) {
        setErrors({ email: 'Email này chưa được đăng ký trong hệ thống' });
        setIsEmailValid(false);
        showError('Email này chưa được đăng ký trong hệ thống. Vui lòng kiểm tra lại hoặc đăng ký tài khoản mới.');
      } else if (error.message.includes('Resource not found')) {
        setErrors({ email: 'Email này chưa được đăng ký trong hệ thống' });
        setIsEmailValid(false);
        showError('Email này chưa được đăng ký trong hệ thống. Vui lòng kiểm tra lại hoặc đăng ký tài khoản mới.');
      } else {
        showError('Có lỗi xảy ra khi kiểm tra email. Vui lòng thử lại sau.', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    try {
      setLoading(true);
      await forgotPassword({ email });
      showSuccess('Email khôi phục mật khẩu đã được gửi lại!');
    } catch (error: any) {
      showError('Gửi lại email thất bại', error);
    } finally {
      setLoading(false);
    }
  };

  if (isEmailSent) {
    return (
      <div className={styles.forgotPasswordPage}>
        <div className={styles.backgroundOverlay}></div>
        
        <div className={styles.mainContainer}>
          <div className={styles.forgotPasswordCard}>
            {/* Success Header */}
            <div className={styles.forgotPasswordHeader}>
              <h2 className={styles.forgotPasswordTitle}>Email đã được gửi!</h2>
              <p className={styles.forgotPasswordSubtitle}>
                Chúng tôi đã gửi liên kết khôi phục mật khẩu đến
              </p>
              <p className={styles.emailAddress}>{email}</p>
            </div>

            {/* Instructions */}
            <div className={styles.instructionsCard}>
              <div className={styles.instructionsIcon}>
                <FaLock />
              </div>
              <div className={styles.instructionsContent}>
                <h3 className={styles.instructionsTitle}>Làm theo hướng dẫn</h3>
                <ul className={styles.instructionsList}>
                  <li>Kiểm tra hộp thư email của bạn</li>
                  <li>Nhấp vào liên kết trong email</li>
                  <li>Tạo mật khẩu mới cho tài khoản</li>
                  <li>Đăng nhập với mật khẩu mới</li>
                </ul>
              </div>
            </div>

            {/* Actions */}
            <div className={styles.emailActions}>
              <Button
                type="button"
                variant="primary"
                size="lg"
                className={styles.resendButton}
                onClick={handleResendEmail}
                isLoading={loading}
                disabled={loading}
              >
                Gửi lại email
              </Button>

              <button 
                type="button"
                onClick={() => handleNavigation('/login')}
                className={styles.backToLoginButton}
              >
                <FaArrowLeft className={styles.buttonIcon} />
                Quay lại đăng nhập
              </button>
            </div>

            {/* Help Text */}
            <div className={styles.helpSection}>
              <p className={styles.helpText}>
                Không nhận được email? Kiểm tra thư mục spam hoặc{' '}
                <button 
                  type="button" 
                  className={styles.helpLink}
                  onClick={handleResendEmail}
                  disabled={loading}
                >
                  gửi lại
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.forgotPasswordPage}>
      {/* Background Overlay for Focus Effect */}
      <div className={styles.backgroundOverlay}></div>
      
      {/* Main Content - Centered */}
      <div className={styles.mainContainer}>
        <div className={styles.forgotPasswordCard}>
          {/* Forgot Password Header */}
          <div className={styles.forgotPasswordHeader}>
            <h2 className={styles.forgotPasswordTitle}>Quên mật khẩu?</h2>
            <p className={styles.forgotPasswordSubtitle}>
              Nhập email của bạn để nhận liên kết khôi phục mật khẩu
            </p>
          </div>

          {/* Forgot Password Form */}
          <form className={styles.forgotPasswordForm} onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.fieldLabel}>
                <FaEnvelope className={styles.labelIcon} />
                Email đã đăng ký
              </label>
              <div className={styles.inputWrapper}>
                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="Nhập email của bạn"
                  className={`${styles.input} ${errors.email ? styles.inputError : isEmailValid ? styles.inputSuccess : ''}`}
                  value={email}
                  onChange={handleEmailChange}
                  onBlur={() => validateField(email)}
                  required
                  autoComplete="email"
                  autoFocus
                />
              </div>
              <FormError error={errors.email} />
              
              {/* Helper message for unregistered email */}
              {errors.email && errors.email.includes('chưa được đăng ký') && (
                <div className={styles.helpMessage}>
                  <p>Email này chưa có tài khoản. Bạn có thể:</p>
                  <ul>
                    <li>Kiểm tra lại địa chỉ email</li>
                    <li>
                      <button 
                        type="button"
                        onClick={() => handleNavigation('/register')}
                        className={styles.helpLink}
                      >
                        Đăng ký tài khoản mới
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className={styles.submitButton}
              isLoading={loading}
              disabled={loading || !isEmailValid}
            >
              Gửi email khôi phục
            </Button>
          </form>

          {/* Footer */}
          <div className={styles.forgotPasswordFooter}>
            <p className={styles.backPrompt}>
              Nhớ ra mật khẩu?{' '}
              <button 
                type="button"
                onClick={() => handleNavigation('/login')}
                className={styles.backLink}
              >
                <FaArrowLeft className={styles.linkIcon} />
                Quay lại đăng nhập
              </button>
            </p>
            
            <div className={styles.signupPrompt}>
              <p>
                Chưa có tài khoản?{' '}
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
    </div>
  );
}

export default function ForgotPassword() {
  return (
    <Suspense fallback={
      <div className="container">
        <div className={styles.loadingContainer}>
          <LoadingSpinner size="lg" />
          <p>Đang tải trang khôi phục mật khẩu...</p>
        </div>
      </div>
    }>
      <ForgotPasswordForm />
    </Suspense>
  );
}
