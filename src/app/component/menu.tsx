"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "../css/menu.module.css";
import logo from "../img/polo.png";

export default function Menu() {
  const [username, setUsername] = useState("");
  const [isDropdownVisible, setDropdownVisible] = useState(false);

  // Lấy username từ localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("username");
    if (storedUser) {
      setUsername(storedUser);
    }
  }, []);

  // Xử lý đăng xuất
  const handleLogout = () => {
    localStorage.removeItem("username");
    setUsername(""); // Cập nhật lại state
    window.location.reload(); // Reload trang để cập nhật UI
  };

  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logoLink}>
        <Image
          src={logo}
          alt="Logo áo"
          height={50}
          width={50}
          className={styles.logo}
        />
      </Link>
      <nav className={styles.nav}>
        <a href="#">Áo</a>
        <a href="#">Áo Quần</a>
        <a href="#">Set Quần Áo</a>
        <a href="#">Giày Dép</a>
        <a href="#">Phụ Kiện</a>
      </nav>
      <div className={styles.icons}>
        <i className="fas fa-search"></i>
        <i className="fas fa-heart"></i>
        <Link href="/cart">
          <i className="fas fa-shopping-cart"></i>
        </Link>
        {username ? (
          <div
            className={styles.userContainer}
            onMouseEnter={() => setDropdownVisible(true)}
            onMouseLeave={() => setDropdownVisible(false)}
          >
            <i className="fas fa-user"></i>
            <div className={styles.dropdown} style={{ display: isDropdownVisible ? "block" : "none" }}>
              <p className={styles.username}>Xin chào, {username}!</p>
              <Link href="/profile" className={styles.dropdownItem}>
                Thông tin tài khoản
              </Link>
              <button onClick={handleLogout} className={styles.dropdownItem}>
                Đăng xuất
              </button>
            </div>
          </div>
        ) : (
          <Link href="/login">
            <i className="fas fa-user"></i>
          </Link>
        )}
      </div>
    </header>
  );
}
