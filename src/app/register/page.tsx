import styles from './register.module.css';

export default function RegisterForm() {
  return (
    <div className={styles.container}>
      <form className={styles.form}>
        <h2>Đăng Ký Tài Khoản</h2>
        
        <div className={styles.formGroup}>
          <input
            type="text"
            name="fullName"
            placeholder="Họ và tên"
            required
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <input
            type="email"
            name="email"
            placeholder="Email"
            required
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <input
            type="password"
            name="password"
            placeholder="Mật khẩu"
            required
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <input
            type="password"
            name="confirmPassword"
            placeholder="Xác nhận mật khẩu"
            required
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <input
            type="tel"
            name="phoneNumber"
            placeholder="Số điện thoại"
            required
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <textarea
            name="address"
            placeholder="Địa chỉ"
            rows={3}
            className={styles.textarea}
          />
        </div>

        <button type="submit" className={styles.submitButton}>
          Đăng Ký
        </button>
      </form>
    </div>
  );
}