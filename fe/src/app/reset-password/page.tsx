"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts";
import { useApiNotification } from "@/hooks";
import { validatePassword, FormErrors } from "@/utils/validation";
import { authService } from "@/services/authService";
import { Button, LoadingSpinner } from "@/app/components/ui";
import FormError from "../components/FormError";
import { FaLock, FaArrowLeft, FaEye, FaEyeSlash, FaKey, FaCheckCircle } from "react-icons/fa";
import styles from "./ResetPasswordPage.module.css";

function ResetPasswordForm() {
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifyingToken, setVerifyingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [passwordStrength, setPasswordStrength] = useState({
    isValid: false,
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { showError, showSuccess } = useApiNotification();

  // Handle navigation efficiently
  const handleNavigation = (path: string) => {
    router.push(path);
  };

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  // Get token from URL and verify it
  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    console.log('Token from URL:', tokenFromUrl);
    
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      verifyToken(tokenFromUrl);
    } else {
      setVerifyingToken(false);
      setTokenValid(false);
    }
  }, [searchParams]);

  // Verify token validity
  const verifyToken = async (tokenToVerify: string) => {
    try {
      setVerifyingToken(true);
      console.log('🔍 Token from URL:', tokenToVerify);
      console.log('🔍 Token length:', tokenToVerify.length);
      console.log('🔍 Verifying token:', tokenToVerify.substring(0, 10) + '...');
      
      const result = await authService.verifyResetToken(tokenToVerify);
      console.log('✅ Token verification result:', result);
      
      if (result.success && result.valid) {
        setTokenValid(true);
        showSuccess('Token hợp lệ! Bạn có thể đặt lại mật khẩu.');
      } else {
        console.log('❌ Token invalid:', result);
        setTokenValid(false);
        showError('Token không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu gửi lại email khôi phục.');
      }
    } catch (error: any) {
      console.error('❌ Token verification error:', error);
      setTokenValid(false);
      
      // More detailed error messages
      if (error.message.includes('không hợp lệ') || error.message.includes('hết hạn')) {
        showError('🕒 Token đã hết hạn (15 phút). Vui lòng yêu cầu gửi lại email đặt lại mật khẩu.');
      } else if (error.status === 404) {
        showError('🔍 Token không tồn tại. Vui lòng kiểm tra link email hoặc yêu cầu gửi lại.');
      } else {
        showError('⚠️ Lỗi xác thực token: ' + (error.message || 'Unknown error'));
      }
    } finally {
      setVerifyingToken(false);
    }
  };

  // Password strength validation
  const checkPasswordStrength = (password: string) => {
    const strength = {
      hasMinLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      isValid: false,
    };
    
    strength.isValid = Object.values(strength).slice(0, -1).every(Boolean);
    setPasswordStrength(strength);
    return strength.isValid;
  };

  // Real-time validation
  const validateFields = () => {
    const newErrors: FormErrors = {};
    let isValid = true;

    // Validate token
    if (!token.trim()) {
      newErrors.token = 'Token không được để trống';
      isValid = false;
    }

    // Validate new password
    if (!newPassword.trim()) {
      newErrors.newPassword = 'Mật khẩu mới không được để trống';
      isValid = false;
    } else {
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        newErrors.newPassword = passwordValidation.errors[0];
        isValid = false;
      }
    }

    // Validate confirm password
    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
      isValid = false;
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid && tokenValid;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewPassword(value);
    checkPasswordStrength(value);
    
    // Clear error when user starts typing
    if (errors.newPassword) {
      setErrors(prev => ({ ...prev, newPassword: '' }));
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConfirmPassword(value);
    
    // Clear error when user starts typing
    if (errors.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: '' }));
    }
  };

  const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setToken(value);
    
    // Clear error when user starts typing
    if (errors.token) {
      setErrors(prev => ({ ...prev, token: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    if (!validateFields()) {
      showError('Vui lòng kiểm tra lại thông tin đã nhập');
      return;
    }

    try {
      setLoading(true);
      console.log('Attempting password reset with token:', token.substring(0, 10) + '...');
      
      const result = await authService.resetPassword(token, newPassword);
      console.log('Password reset result:', result);
      
      if (result.success) {
        setIsPasswordReset(true);
        showSuccess('Mật khẩu đã được đặt lại thành công! Bạn có thể đăng nhập với mật khẩu mới.');
      } else {
        showError('Không thể đặt lại mật khẩu. Vui lòng thử lại.');
      }
    } catch (error: any) {
      console.error('Password reset error:', error);
      
      if (error.message.includes('Token không hợp lệ') || error.message.includes('hết hạn')) {
        showError('Token không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu gửi lại email khôi phục.');
        setTokenValid(false);
      } else {
        showError('Có lỗi xảy ra khi đặt lại mật khẩu. Vui lòng thử lại.', error);
      }
    } finally {
      setLoading(false);
    }
  };

  // Loading state while verifying token
  if (verifyingToken) {
    return (
      <div className={styles.resetPasswordPage}>
        <div className={styles.backgroundOverlay}></div>
        
        <div className={styles.mainContainer}>
          <div className={styles.resetPasswordCard}>
            <div className={styles.loadingContainer}>
              <LoadingSpinner size="lg" />
              <h3 className={styles.loadingTitle}>Đang xác minh token...</h3>
              <p className={styles.loadingText}>Vui lòng chờ trong giây lát</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state after password reset
  if (isPasswordReset) {
    return (
      <div className={styles.resetPasswordPage}>
        <div className={styles.backgroundOverlay}></div>
        
        <div className={styles.mainContainer}>
          <div className={styles.resetPasswordCard}>
            {/* Success Header */}
            <div className={styles.resetPasswordHeader}>
              <div className={styles.successIcon}>
                <FaCheckCircle />
              </div>
              <h2 className={styles.resetPasswordTitle}>Đặt lại mật khẩu thành công!</h2>
              <p className={styles.resetPasswordSubtitle}>
                Mật khẩu của bạn đã được cập nhật. Bạn có thể đăng nhập với mật khẩu mới.
              </p>
            </div>

            {/* Actions */}
            <div className={styles.successActions}>
              <Button
                type="button"
                variant="primary"
                size="lg"
                className={styles.loginButton}
                onClick={() => handleNavigation('/login')}
              >
                Đăng nhập ngay
              </Button>

              <button 
                type="button"
                onClick={() => handleNavigation('/')}
                className={styles.homeButton}
              >
                Về trang chủ
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (!tokenValid) {
    return (
      <div className={styles.resetPasswordPage}>
        <div className={styles.backgroundOverlay}></div>
        
        <div className={styles.mainContainer}>
          <div className={styles.resetPasswordCard}>
            {/* Error Header */}
            <div className={styles.resetPasswordHeader}>
              <div className={styles.errorIcon}>
                <FaLock />
              </div>
              <h2 className={styles.resetPasswordTitle}>Token không hợp lệ</h2>
              <p className={styles.resetPasswordSubtitle}>
                Token khôi phục mật khẩu không hợp lệ hoặc đã hết hạn.
              </p>
            </div>

            {/* Error Actions */}
            <div className={styles.errorActions}>
              <Button
                type="button"
                variant="primary"
                size="lg"
                className={styles.forgotPasswordButton}
                onClick={() => handleNavigation('/forgot-password')}
              >
                Yêu cầu gửi lại email
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
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.resetPasswordPage}>
      {/* Background Overlay for Focus Effect */}
      <div className={styles.backgroundOverlay}></div>
      
      {/* Main Content - Centered */}
      <div className={styles.mainContainer}>
        <div className={styles.resetPasswordCard}>
          {/* Reset Password Header */}
          <div className={styles.resetPasswordHeader}>
            <h2 className={styles.resetPasswordTitle}>Đặt lại mật khẩu</h2>
            <p className={styles.resetPasswordSubtitle}>
              Nhập mật khẩu mới cho tài khoản của bạn
            </p>
          </div>

          {/* Reset Password Form */}
          <form className={styles.resetPasswordForm} onSubmit={handleSubmit}>
            {/* Token Field - Auto-filled but editable */}
            <div className={styles.formGroup}>
              <label htmlFor="token" className={styles.fieldLabel}>
                <FaKey className={styles.labelIcon} />
                Token khôi phục
              </label>
              <div className={styles.inputWrapper}>
                <input
                  id="token"
                  type="text"
                  name="token"
                  placeholder="Token sẽ được điền tự động từ email"
                  className={`${styles.input} ${errors.token ? styles.inputError : token ? styles.inputSuccess : ''}`}
                  value={token}
                  onChange={handleTokenChange}
                  required
                  autoComplete="off"
                />
              </div>
              <FormError error={errors.token} />
            </div>

            {/* New Password Field */}
            <div className={styles.formGroup}>
              <label htmlFor="newPassword" className={styles.fieldLabel}>
                <FaLock className={styles.labelIcon} />
                Mật khẩu mới
              </label>
              <div className={styles.inputWrapper}>
                <input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  name="newPassword"
                  placeholder="Nhập mật khẩu mới"
                  className={`${styles.input} ${errors.newPassword ? styles.inputError : passwordStrength.isValid ? styles.inputSuccess : ''}`}
                  value={newPassword}
                  onChange={handlePasswordChange}
                  required
                  autoComplete="new-password"
                  autoFocus
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
              <FormError error={errors.newPassword} />
              
              {/* Password Strength Indicator */}
              {newPassword && (
                <div className={styles.passwordStrength}>
                  <p className={styles.strengthTitle}>Yêu cầu mật khẩu:</p>
                  <ul className={styles.strengthList}>
                    <li className={passwordStrength.hasMinLength ? styles.valid : styles.invalid}>
                      Ít nhất 8 ký tự
                    </li>
                    <li className={passwordStrength.hasUpperCase ? styles.valid : styles.invalid}>
                      Có chữ hoa (A-Z)
                    </li>
                    <li className={passwordStrength.hasLowerCase ? styles.valid : styles.invalid}>
                      Có chữ thường (a-z)
                    </li>
                    <li className={passwordStrength.hasNumber ? styles.valid : styles.invalid}>
                      Có số (0-9)
                    </li>
                    <li className={passwordStrength.hasSpecialChar ? styles.valid : styles.invalid}>
                      Có ký tự đặc biệt (!@#$%^&*)
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword" className={styles.fieldLabel}>
                <FaLock className={styles.labelIcon} />
                Xác nhận mật khẩu mới
              </label>
              <div className={styles.inputWrapper}>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Nhập lại mật khẩu mới"
                  className={`${styles.input} ${errors.confirmPassword ? styles.inputError : (confirmPassword && newPassword === confirmPassword) ? styles.inputSuccess : ''}`}
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
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
              disabled={loading || !tokenValid || !passwordStrength.isValid || newPassword !== confirmPassword}
            >
              Đặt lại mật khẩu
            </Button>

            {/* Resend Email Button when token invalid */}
            {!tokenValid && (
              <div className={styles.resendSection}>
                <p className={styles.resendText}>
                  Token đã hết hạn hoặc không hợp lệ?
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  className={styles.resendButton}
                  onClick={() => handleNavigation('/forgot-password')}
                >
                  Yêu cầu gửi lại email
                </Button>
              </div>
            )}
          </form>

          {/* Footer */}
          <div className={styles.resetPasswordFooter}>
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
            
            <div className={styles.helpPrompt}>
              <p>
                Token không hợp lệ?{' '}
                <button 
                  type="button"
                  onClick={() => handleNavigation('/forgot-password')}
                  className={styles.helpLink}
                >
                  Yêu cầu gửi lại email
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPassword() {
  return (
    <Suspense fallback={
      <div className="container">
        <div className={styles.loadingContainer}>
          <LoadingSpinner size="lg" />
          <p>Đang tải trang đặt lại mật khẩu...</p>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
