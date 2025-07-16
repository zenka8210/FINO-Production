'use client'
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import styles from './logout.module.css';

export default function Logout() {
  const router = useRouter();
  const { logout } = useAuth();

  useEffect(() => {
    // Thực hiện đăng xuất
    logout();
    
    // Chuyển về trang chủ sau 2 giây
    const timeout = setTimeout(() => {
      router.push('/');
    }, 2000);

    return () => clearTimeout(timeout);
  }, [router, logout]);

  return (
    <div className={styles.logoutContainer}>
      <div className={styles.logoutCard}>
        <div className={styles.icon}>👋</div>        <h1 className={styles.title}>Đã đăng xuất!</h1>
        <p className={styles.message}>
          Bạn đã đăng xuất thành công. 
          Đang chuyển về trang chủ...
        </p>
        <a href="/" className={styles.button}>
          Về trang chủ
        </a>
      </div>
    </div>
  );
}