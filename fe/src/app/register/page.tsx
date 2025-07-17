'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts';
import { useNotifications } from '@/hooks';
import { validateRegisterForm, hasFormErrors, FormErrors } from '@/utils/validation';
import FormError from '../components/FormError';
import styles from './register.module.css';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const { success, error } = useNotifications();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateField = (fieldName: string) => {
    const formErrors = validateRegisterForm(
      formData.name,
      formData.email,
      formData.password,
      formData.confirmPassword,
      formData.phone
    );
    
    setErrors(prev => ({
      ...prev,
      [fieldName]: formErrors[fieldName]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Register form submitted');
    
    // Validate entire form
    const formErrors = validateRegisterForm(
      formData.name,
      formData.email,
      formData.password,
      formData.confirmPassword,
      formData.phone
    );
    
    setErrors(formErrors);

    if (hasFormErrors(formErrors)) {
      error('Lỗi', 'Vui lòng sửa các lỗi trong form');
      return;
    }

    setLoading(true);
    try {
      console.log('Attempting registration with:', { 
        name: formData.name, 
        email: formData.email, 
        phone: formData.phone 
      });
      
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone
      });
      
      success('Thành công', 'Đăng ký thành công! Chào mừng bạn đến với FINO SHOP!');
      router.push('/');
    } catch (err: any) {
      console.error('Registration error:', err);
      
      // Handle specific API errors
      if (err.message.includes('đã tồn tại')) {
        setErrors({ email: 'Email đã được sử dụng' });
      } else if (err.message.includes('số điện thoại')) {
        setErrors({ phone: 'Số điện thoại đã được sử dụng' });
      } else {
        error('Lỗi đăng ký', err.message || 'Có lỗi xảy ra khi đăng ký');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.registerContainer}>
      <div className={styles.registerBox}>
        <h1 className={styles.title}>Đăng Ký Tài Khoản</h1>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="name">Họ và tên</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              onBlur={() => validateField('name')}
              className={errors.name ? styles.inputError : ''}
              required
              placeholder="Nhập họ và tên"
            />
            <FormError error={errors.name} />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={() => validateField('email')}
              className={errors.email ? styles.inputError : ''}
              required
              placeholder="Nhập email"
            />
            <FormError error={errors.email} />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="phone">Số điện thoại</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              onBlur={() => validateField('phone')}
              className={errors.phone ? styles.inputError : ''}
              placeholder="Nhập số điện thoại"
            />
            <FormError error={errors.phone} />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password">Mật khẩu</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              onBlur={() => validateField('password')}
              className={errors.password ? styles.inputError : ''}
              required
              placeholder="Nhập mật khẩu"
            />
            <FormError error={errors.password} />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              onBlur={() => validateField('confirmPassword')}
              className={errors.confirmPassword ? styles.inputError : ''}
              required
              placeholder="Nhập lại mật khẩu"
            />
            <FormError error={errors.confirmPassword} />
          </div>

          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? 'Đang xử lý...' : 'Đăng Ký'}
          </button>
        </form>

        <div className={styles.links}>
          <p>
            Đã có tài khoản?{' '}
            <Link href="/login" className={styles.link}>
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
