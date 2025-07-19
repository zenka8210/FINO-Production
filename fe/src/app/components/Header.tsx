'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { SearchBar } from '@/app/components/ui';
import { useAuth } from '@/contexts';
import { useCart, useWishlist } from '@/hooks';
import styles from './Header.module.css';

export default function Header() {
  const { user, logout } = useAuth();
  const { itemsCount } = useCart();
  const { wishlistItems } = useWishlist();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const router = useRouter();

  const handleSearch = (query: string) => {
    if (query.trim()) {
      router.push(`/products?search=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };

  // Navigation links
  const navLinks = [
    { href: '/', label: 'Trang chủ' },
    { href: '/products', label: 'Sản phẩm' },
    { href: '/news', label: 'Tin tức' },
    { href: '/about', label: 'Giới thiệu' },
  ];

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <Image
            src="/images/logo-fino-compact.svg"
            alt="FINO Fashion Store Logo"
            width={100}
            height={33}
            className={styles.logoImage}
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className={styles.nav}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={styles.navLink}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Search Bar - Desktop */}
        <div className={styles.searchContainer}>
          <SearchBar
            placeholder="Tìm kiếm sản phẩm..."
            onSearch={handleSearch}
            showSuggestions={true}
          />
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          {/* Wishlist */}
          <Link href="/wishlist" className={styles.actionButton}>
            <i className="fas fa-heart"></i>
            {wishlistItems.length > 0 && (
              <span className={styles.badge}>{wishlistItems.length}</span>
            )}
          </Link>

          {/* Cart */}
          <Link href="/cart" className={styles.actionButton}>
            <i className="fas fa-shopping-cart"></i>
            {itemsCount > 0 && (
              <span className={styles.badge}>{itemsCount}</span>
            )}
          </Link>

          {/* User Menu */}
          <div className={styles.userMenu}>
            <button
              className={styles.userButton}
              onClick={toggleUserMenu}
            >
              <i className="fas fa-user"></i>
              <span className={styles.userName}>
                {user ? user.name?.split(' ')[0] || 'User' : 'Tài khoản'}
              </span>
              <i className="fas fa-chevron-down"></i>
            </button>

            {/* User Dropdown */}
            {userMenuOpen && (
              <div className={styles.dropdown}>
                {user ? (
                  <>
                    <div className={styles.userInfo}>
                      <span className={styles.userEmail}>{user.email}</span>
                    </div>
                    <Link href="/profile" className={styles.dropdownItem}>
                      <i className="fas fa-user-circle"></i>
                      Thông tin cá nhân
                    </Link>
                    <Link href="/orders" className={styles.dropdownItem}>
                      <i className="fas fa-box"></i>
                      Đơn hàng của tôi
                    </Link>
                    <Link href="/security" className={styles.dropdownItem}>
                      <i className="fas fa-shield-alt"></i>
                      Bảo mật
                    </Link>
                    <hr className={styles.divider} />
                    <button
                      className={styles.logoutButton}
                      onClick={handleLogout}
                    >
                      <i className="fas fa-sign-out-alt"></i>
                      Đăng xuất
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" className={styles.dropdownItem}>
                      <i className="fas fa-sign-in-alt"></i>
                      Đăng nhập
                    </Link>
                    <Link href="/register" className={styles.dropdownItem}>
                      <i className="fas fa-user-plus"></i>
                      Đăng ký
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className={styles.mobileMenuToggle}
            onClick={toggleMobileMenu}
          >
            <i className={mobileMenuOpen ? "fas fa-times" : "fas fa-bars"}></i>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className={styles.mobileMenu}>
          {/* Mobile Search */}
          <div className={styles.mobileSearchContainer}>
            <SearchBar
              placeholder="Tìm kiếm sản phẩm..."
              onSearch={(query) => {
                handleSearch(query);
                setMobileMenuOpen(false);
              }}
              showSuggestions={true}
            />
          </div>

          {/* Mobile Navigation */}
          <nav className={styles.mobileNav}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={styles.mobileNavLink}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Mobile User Actions */}
          {user ? (
            <div className={styles.mobileUserSection}>
              <div className={styles.mobileUserInfo}>
                <span className={styles.mobileUserName}>{user.name || user.email}</span>
              </div>
              <Link
                href="/profile"
                className={styles.mobileNavLink}
                onClick={() => setMobileMenuOpen(false)}
              >
                <i className="fas fa-user-circle"></i>
                Thông tin cá nhân
              </Link>
              <Link
                href="/orders"
                className={styles.mobileNavLink}
                onClick={() => setMobileMenuOpen(false)}
              >
                <i className="fas fa-box"></i>
                Đơn hàng của tôi
              </Link>
              <button
                className={styles.mobileLogoutButton}
                onClick={handleLogout}
              >
                <i className="fas fa-sign-out-alt"></i>
                Đăng xuất
              </button>
            </div>
          ) : (
            <div className={styles.mobileAuthSection}>
              <Link
                href="/login"
                className={styles.mobileAuthButton}
                onClick={() => setMobileMenuOpen(false)}
              >
                Đăng nhập
              </Link>
              <Link
                href="/register"
                className={styles.mobileAuthButton}
                onClick={() => setMobileMenuOpen(false)}
              >
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Overlay for mobile menu */}
      {mobileMenuOpen && (
        <div
          className={styles.overlay}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Overlay for user menu */}
      {userMenuOpen && (
        <div
          className={styles.userMenuOverlay}
          onClick={() => setUserMenuOpen(false)}
        />
      )}
    </header>
  );
}
