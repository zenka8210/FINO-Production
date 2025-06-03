"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "../admin/admin.module.css";

const Sidebar = () => {
  const pathname = usePathname();

  return (
    <div className={styles.sidebar}>
      <h2>Admin Panel</h2>
      <ul>
        <li className={pathname === "/admin" ? styles.active : ""}>
          <Link href="/admin">Dashboard</Link>
        </li>
        <li className={pathname === "/admin/products" ? styles.active : ""}>
          <Link href="/admin/products">Quản lý Sản phẩm</Link>
        </li>
        <li className={pathname === "/admin/orders" ? styles.active : ""}>
          <Link href="/admin/orders">Quản lý Đơn hàng</Link>
        </li>
        <li className={pathname === "/admin/users" ? styles.active : ""}>
          <Link href="/admin/users">Quản lý Người dùng</Link>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
