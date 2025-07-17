"use client";
import { useState, useEffect } from "react";
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '@/hooks';
import { authService } from '@/services';
import styles from "./security.module.css";
import { useRouter } from "next/navigation";

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function SecurityPage() {
  const { user, logout } = useAuth();
  const { success: showSuccess, error: showError } = useNotifications();
  const router = useRouter();
  
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);

  // Redirect nếu chưa đăng nhập
  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/security');
    }
  }, [user, router]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Password change form submitted');
    console.log('Form data:', passwordForm);
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showError('Lỗi', 'Mật khẩu xác nhận không khớp');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      showError('Lỗi', 'Mật khẩu mới phải có ít nhất 8 ký tự');
      return;
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      showError('Lỗi', 'Mật khẩu mới phải khác với mật khẩu hiện tại');
      return;
    }

    setLoading(true);
    console.log('Starting password change request...');
    
    try {
      console.log('Calling authService.changePassword...');
      await authService.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      console.log('Password change successful');
      showSuccess('Thành công!', 'Đổi mật khẩu thành công! Bạn sẽ được đăng xuất để đảm bảo bảo mật.');
      
      // Reset form
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
      
      // Auto logout sau 3 giây để user có thể thấy thông báo
      setTimeout(() => {
        console.log('Auto logout after password change');
        logout();
        router.push('/login');
      }, 3000);
      
    } catch (error: any) {
      console.error('Password change error:', error);
      showError('Lỗi đổi mật khẩu', error.message || 'Có lỗi xảy ra khi đổi mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof PasswordForm, value: string) => {
    setPasswordForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!user) {
    return (
      <div className={styles.loading}>
        <p>Đang tải thông tin...</p>
      </div>
    );
  }

  return (
    <div className={styles.securityContainer}>
      <div className={styles.header}>
        <h1>Bảo mật tài khoản</h1>
        <p>Quản lý thông tin bảo mật và mật khẩu của bạn</p>
      </div>

      <div className={styles.content}>
        <div className={styles.section}>
          <h2>Thông tin tài khoản</h2>
          <div className={styles.accountInfo}>
            <div className={styles.infoItem}>
              <label>Email:</label>
              <span>{user.email}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Họ tên:</label>
              <span>{user.name || 'Chưa cập nhật'}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Trạng thái:</label>
              <span className={user.isActive ? styles.active : styles.inactive}>
                {user.isActive ? 'Hoạt động' : 'Không hoạt động'}
              </span>
            </div>
            <div className={styles.infoItem}>
              <label>Vai trò:</label>
              <span>{user.role === 'admin' ? 'Quản trị viên' : 'Khách hàng'}</span>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h2>Đổi mật khẩu</h2>
          <form onSubmit={handlePasswordChange} className={styles.passwordForm}>
            <div className={styles.formGroup}>
              <label>Mật khẩu hiện tại:</label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                required
                className={styles.input}
                placeholder="Nhập mật khẩu hiện tại"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Mật khẩu mới:</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => handleInputChange('newPassword', e.target.value)}
                required
                minLength={8}
                className={styles.input}
                placeholder="Nhập mật khẩu mới (ít nhất 8 ký tự)"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Xác nhận mật khẩu mới:</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                required
                className={styles.input}
                placeholder="Nhập lại mật khẩu mới"
              />
            </div>

            <div className={styles.passwordRequirements}>
              <h4>Yêu cầu mật khẩu:</h4>
              <ul>
                <li className={passwordForm.newPassword.length >= 8 ? styles.valid : ''}>
                  Ít nhất 8 ký tự
                </li>
                <li className={/[A-Z]/.test(passwordForm.newPassword) ? styles.valid : ''}>
                  Ít nhất 1 chữ hoa
                </li>
                <li className={/[a-z]/.test(passwordForm.newPassword) ? styles.valid : ''}>
                  Ít nhất 1 chữ thường  
                </li>
                <li className={/[0-9]/.test(passwordForm.newPassword) ? styles.valid : ''}>
                  Ít nhất 1 chữ số
                </li>
              </ul>
            </div>

            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={loading || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
            >
              {loading ? 'Đang cập nhật...' : 'Đổi mật khẩu'}
            </button>
          </form>
        </div>

        <div className={styles.section}>
          <h2>Hoạt động bảo mật</h2>
          <div className={styles.securityTips}>
            <h4>Một số lời khuyên bảo mật:</h4>
            <ul>
              <li>Sử dụng mật khẩu mạnh và duy nhất</li>
              <li>Không chia sẻ thông tin đăng nhập với người khác</li>
              <li>Đăng xuất khi sử dụng máy tính chung</li>
              <li>Thường xuyên kiểm tra hoạt động tài khoản</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
