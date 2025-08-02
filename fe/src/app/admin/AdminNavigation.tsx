"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import styles from "./admin.module.css";

const AdminNavigation = () => {
  const pathname = usePathname();

  const navItems = [
    { href: "/admin", icon: "📊", text: "Dashboard", badge: null },
    { href: "/admin/products", icon: "📦", text: "Sản phẩm", badge: null },
    { href: "/admin/orders", icon: "🛒", text: "Đơn hàng", badge: null },
    { href: "/admin/users", icon: "👥", text: "Người dùng", badge: null },
    { href: "/admin/categories", icon: "📂", text: "Danh mục", badge: null },
    { href: "/admin/news", icon: "📰", text: "Tin tức", badge: null },
    { href: "/admin/reviews", icon: "⭐", text: "Đánh giá", badge: null },
    { href: "/admin/vouchers", icon: "🎫", text: "Voucher", badge: null },
    
  ];

  return (
    <nav className={styles.adminNav}>
      <h3>QUẢN LÝ</h3>
      <ul className={styles.adminNavList}>
        {navItems.map((item) => (
          <li key={item.href} className={styles.adminNavListItem}>
            <Link 
              href={item.href} 
              className={`${styles.adminNavButton} ${pathname === item.href ? styles.active : ''}`}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navText}>{item.text}</span>
              {item.badge && <span className={styles.navBadge}>{item.badge}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default AdminNavigation;
