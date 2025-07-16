"use client";
import { useState } from "react";
import styles from "../admin/admin.module.css"; // Adjust the path as necessary

export default function AdminHeader() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className={styles.adminHeader}>
      <div className={styles.logo}>Trang quản trị</div>

      <div className={styles.searchBox}>
        <input type="text" placeholder="Tìm kiếm..." />
      </div>

      <div className={styles.userMenu} onClick={() => setIsOpen(!isOpen)}>
      <i className="fas fa-user"></i>
      {isOpen && (
          <div className={styles.dropdown}>
            <ul>
              <li>Hồ sơ</li>
              <li>Cài đặt</li>
              <li>Đăng xuất</li>
            </ul>
          </div>
        )}
      </div>
    </header>
  );
}
