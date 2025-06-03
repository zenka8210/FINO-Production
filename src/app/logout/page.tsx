'use client'
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './logout.module.css';

export default function Logout() {
  const router = useRouter();

  useEffect(() => {
    // Thực hiện logic logout ở đây
    // Ví dụ: xóa token, clear localStorage, etc.
    localStorage.removeItem('token');
    
    // Tự động chuyển về trang login sau 3 giây
    const timeout = setTimeout(() => {
      router.push('/login');
    }, 3000);

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <div className={styles.logoutContainer}>
      <div className={styles.logoutCard}>
        <div className={styles.icon}>👋</div>
        <h1 className={styles.title}>Goodbye!</h1>
        <p className={styles.message}>
          You have been successfully logged out. 
          You will be redirected to the login page in a few seconds...
        </p>
        <a href="/login" className={styles.button}>
          Return to Login
        </a>
      </div>
    </div>
  );
}