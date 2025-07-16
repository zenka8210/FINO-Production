import Link from "next/link";
import styles from "./admin.module.css";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.adminContainer}>
      <div className={styles.dashboardHeader}>Admin Dashboard</div>
      <div className={styles.adminMainWrapper}>
        <nav className={styles.adminNav}>
          <h3>Menu Quản Trị</h3>
          <ul className={styles.adminNavList}>
            <li className={styles.adminNavListItem}>
              <Link href="/admin" legacyBehavior>
                <a className={styles.adminNavButton}>Tổng quan</a>
              </Link>
            </li>
            <li className={styles.adminNavListItem}>
              <Link href="/admin/products" legacyBehavior>
                <a className={styles.adminNavButton}>Quản lý sản phẩm</a>
              </Link>
            </li>            <li className={styles.adminNavListItem}>
              <Link href="/admin/orders" legacyBehavior>
                <a className={styles.adminNavButton}>Quản lý đơn hàng</a>
              </Link>
            </li>
            <li className={styles.adminNavListItem}>
              <Link href="/admin/categories" legacyBehavior>
                <a className={styles.adminNavButton}>Quản lý danh mục</a>
              </Link>
            </li>
            <li className={styles.adminNavListItem}>
              <Link href="/admin/news" legacyBehavior>
                <a className={styles.adminNavButton}>
                  <i className="fas fa-newspaper" style={{marginRight: '8px'}}></i>
                  Quản lý tin tức
                </a>
              </Link>
            </li>
            <li className={styles.adminNavListItem}>
              <Link href="/admin/reviews" legacyBehavior>
                <a className={styles.adminNavButton}>Quản lý đánh giá</a>
              </Link>
            </li>
            <li className={styles.adminNavListItem}>
              <Link href="/admin/users" legacyBehavior>
                <a className={styles.adminNavButton}>Quản lý người dùng</a>
              </Link>
            </li>
          </ul>
        </nav>
        <div style={{ flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}
