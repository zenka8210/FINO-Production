'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth, useAdmin } from '@/contexts';
import styles from './AdminHeader.module.css';

export default function AdminHeader() {
  const { user, logout } = useAuth();
  const { 
    userMenuOpen, 
    mobileMenuOpen, 
    setMobileMenuOpen,
    toggleUserMenu, 
    toggleMobileMenu, 
    setUserMenuOpen 
  } = useAdmin();
  const router = useRouter();
  const pathname = usePathname();
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    router.push('/auth/login');
  };

  // Admin navigation links
  const adminNavLinks = [
    { href: '/admin', label: 'Dashboard', icon: 'fas fa-tachometer-alt' },
    { href: '/admin/products', label: 'Sản phẩm', icon: 'fas fa-box' },
    { href: '/admin/orders', label: 'Đơn hàng', icon: 'fas fa-shopping-cart' },
    { href: '/admin/users', label: 'Người dùng', icon: 'fas fa-users' },
    { href: '/admin/categories', label: 'Danh mục', icon: 'fas fa-tags' },
    { href: '/admin/news', label: 'Tin tức', icon: 'fas fa-newspaper' },
    { href: '/admin/reviews', label: 'Đánh giá', icon: 'fas fa-star' },
    { href: '/admin/vouchers', label: 'Vouchers', icon: 'fas fa-ticket-alt' },
  ];

  return (
    <header className={styles.adminHeader}>
      <div className={styles.container}>
        {/* Logo & Brand */}
        <div className={styles.brand}>
          <Link href="/admin" className={styles.logo}>
            <Image
              src="/images/logo-fino-compact.svg"
              alt="FINO Fashion Store Admin"
              width={130}
              height={43}
              className={styles.logoImage}
            />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className={styles.nav}>
          {adminNavLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.navLink} ${pathname === link.href ? styles.active : ''}`}
            >
              <i className={link.icon}></i>
              <span>{link.label}</span>
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className={styles.actions}>
          {/* User Menu */}
          <div className={styles.userMenu} ref={userMenuRef}>
            {user ? (
              <>
                <button
                  onClick={toggleUserMenu}
                  className={styles.userButton}
                  aria-label="Admin menu"
                >
                  <div className={styles.userAvatar}>
                    <i className="fas fa-user-shield"></i>
                  </div>
                  <div className={styles.userInfo}>
                    <span className={styles.userName}>{user.name}</span>
                    <span className={styles.userRole}>Administrator</span>
                  </div>
                  <i className={`fas fa-chevron-down ${styles.dropdownIcon} ${userMenuOpen ? styles.open : ''}`}></i>
                </button>

                {userMenuOpen && (
                  <div className={styles.userDropdown}>
                    <div className={styles.dropdownHeader}>
                      <div className={styles.userAvatarLarge}>
                        <i className="fas fa-user-shield"></i>
                      </div>
                      <div>
                        <div className={styles.dropdownUserName}>{user.name}</div>
                        <div className={styles.dropdownUserEmail}>{user.email}</div>
                      </div>
                    </div>
                    <hr className={styles.dropdownDivider} />
                    <button onClick={handleLogout} className={styles.dropdownItem}>
                      <i className="fas fa-sign-out-alt"></i>
                      Đăng xuất
                    </button>
                  </div>
                )}
              </>
            ) : (
              <Link href="/auth/login" className={styles.loginButton}>
                <i className="fas fa-sign-in-alt"></i>
                Đăng nhập
              </Link>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={toggleMobileMenu}
            className={styles.mobileMenuButton}
            aria-label="Toggle mobile menu"
          >
            <i className={mobileMenuOpen ? "fas fa-times" : "fas fa-bars"}></i>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className={styles.mobileMenu}>
          {/* Mobile Navigation */}
          <nav className={styles.mobileNav}>
            {adminNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`${styles.mobileNavLink} ${pathname === link.href ? styles.active : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <i className={link.icon}></i>
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Mobile Quick Actions - Removed "Xem trang chủ" */}
          <div className={styles.mobileActions}>
            {/* Actions removed as requested */}
          </div>

          {/* Mobile User Menu */}
          <div className={styles.mobileUserMenu}>
            {user && (
              <>
                <div className={styles.mobileUserInfo}>
                  <div className={styles.userAvatarMobile}>
                    <i className="fas fa-user-shield"></i>
                  </div>
                  <div>
                    <div className={styles.mobileUserName}>{user.name}</div>
                    <div className={styles.mobileUserRole}>Administrator</div>
                  </div>
                </div>
                {/* Removed Profile and Settings links as requested */}
                <button onClick={handleLogout} className={styles.mobileUserLink}>
                  <i className="fas fa-sign-out-alt"></i>
                  Đăng xuất
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
