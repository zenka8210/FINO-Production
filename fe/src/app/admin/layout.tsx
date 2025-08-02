"use client";
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import AdminHeader from '../components/AdminHeader';
import { AdminProvider, useAdmin } from '@/contexts';
import styles from './admin.module.css';

// Sidebar component
const AdminNavigation = () => {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useAdmin();
  
  const navItems = [
    { href: '/admin', icon: '📊', text: 'Dashboard' },
    { href: '/admin/products', icon: '📦', text: 'Sản phẩm' },
    { href: '/admin/orders', icon: '🛒', text: 'Đơn hàng' },
    { href: '/admin/users', icon: '👥', text: 'Người dùng' },
    { href: '/admin/categories', icon: '📂', text: 'Danh mục' },
    { href: '/admin/news', icon: '📰', text: 'Tin tức' },
    { href: '/admin/reviews', icon: '⭐', text: 'Đánh giá' },
    { href: '/admin/vouchers', icon: '🎫', text: 'Voucher' },
  
  ];

  return (
    <nav className={`${styles.adminNav} ${sidebarCollapsed ? styles.collapsed : ''}`}>
      <div className={styles.navHeader}>
        <h3>{sidebarCollapsed ? 'Q' : 'QUẢN LÝ'}</h3>
        <button onClick={toggleSidebar} className={styles.collapseBtn}>
          {sidebarCollapsed ? '→' : '←'}
        </button>
      </div>
      <ul className={styles.adminNavList}>
        {navItems.map((item) => (
          <li key={item.href} className={styles.adminNavListItem}>
            <Link
              href={item.href}
              className={`${styles.adminNavButton} ${pathname === item.href ? styles.active : ''}`}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              {!sidebarCollapsed && (
                <>
                  <span className={styles.navText}>{item.text}</span>
                </>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

// Layout tổng cho admin
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminProvider>
      <AdminHeader />
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AdminProvider>
  );
}

// Layout content component to use admin context
function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed } = useAdmin();
  
  return (
    <div style={{ 
      display: "flex", 
      minHeight: "calc(100vh - 70px)", 
      background: "#f8fafc",
      marginLeft: sidebarCollapsed ? '80px' : '250px',
      transition: 'margin-left 0.3s ease'
    }}>
      <AdminNavigation />
      <main style={{ flex: 1, padding: 32 }}>{children}</main>
    </div>
  );
}