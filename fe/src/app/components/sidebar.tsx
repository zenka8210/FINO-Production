import Link from "next/link";
import styles from "../admin/admin.module.css";

const Sidebar = () => {
  return (
    <div className={styles.sidebar}>
      <h2>Admin Panel</h2>
      <ul>
        <li><Link href="/admin">Dashboard</Link></li>
        <li><Link href="/admin/products">Quản lý Sản phẩm</Link></li>
        <li><Link href="/admin/orders">Quản lý Đơn hàng</Link></li>
        <li><Link href="/admin/users">Quản lý Người dùng</Link></li>
      </ul>
    </div>
  );
};

export default Sidebar;
