'use client';
import Image from "next/image";
import Link from "next/link"; 
import styles from "../css/menu.module.css";
import logo from "../img/logo.png";
import { useAuth } from "@/app/context/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function AppMenu() {
  const { user, logout } = useAuth();
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const favs = JSON.parse(localStorage.getItem("favorites") || "[]");
      setFavoriteCount(favs.length);
      const onStorage = () => {
        const favs = JSON.parse(localStorage.getItem("favorites") || "[]");
        setFavoriteCount(favs.length);
      };
      window.addEventListener("storage", onStorage);
      return () => window.removeEventListener("storage", onStorage);
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/products?search=${encodeURIComponent(search.trim())}`);    }
  };
  
  const handleLogout = () => {
    if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
      logout();
    }
  };

  return (
    <header className={styles.header}>
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%'}}>        <Link href="/" className={styles.logoLink}>
          <Image
            src={logo}
            alt="Logo áo"
            height={120}
            width={120}
            className={styles.logo}
          />
        </Link>
        
        {/* Desktop Navigation */}
        <div className={styles.centerNav}>
          <nav className={styles.nav}>
            <Link href="/">Trang chủ</Link>
            <Link href="/products/quanao">Quần Áo</Link>
            <Link href="/products/munon">Mũ Nón</Link>
            <Link href="/products/giaydep">Giày Dép</Link>
            <Link href="/products/phukien">Phụ Kiện</Link>
            <Link href="/products/balo">BaLo</Link>
            <Link href="/news">Tin Tức</Link>
          </nav>
        </div>
        
        <button
          className={styles.hamburger}
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Mở menu"
        >
          <i className="fas fa-bars"></i>
        </button>
        <div className={styles.rightIcons}>
          <form onSubmit={handleSearch} style={{display:'inline-block',marginRight:8}}>
            <input
              type="text"
              placeholder="Tìm sản phẩm..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{height:28,borderRadius:6,border:'1px solid #ddd',padding:'0 8px',fontSize:13,minWidth:120,marginRight:4}}
            />            <button type="submit" className="search-btn" style={{background:'none',border:'none',padding:'6px',cursor:'pointer',color:'#000',fontSize:'16px'}} aria-label="Tìm kiếm">
              <i className="fas fa-search" style={{color:'#000'}}></i>
            </button>
          </form>
          <Link href="/favorite" legacyBehavior>
            <a style={{display:'inline-block', position:'relative'}} aria-label="Yêu thích">
              <i className="fas fa-heart"></i>
              {favoriteCount > 0 && (
                <span style={{position:'absolute',top:-6,right:-8,background:'var(--brand-primary)',color:'#fff',borderRadius:'50%',fontSize:11,minWidth:16,height:16,display:'flex',alignItems:'center',justifyContent:'center',padding:'0 4px',fontWeight:600,border:'2px solid #fff',boxShadow:'0 1px 4px #0001'}}> {favoriteCount} </span>
              )}
            </a>
          </Link>
          <Link href="/cart" legacyBehavior>
            <a style={{display:'inline-block'}} aria-label="Giỏ hàng">
              <i className="fas fa-shopping-cart"></i>
            </a>
          </Link>
          <div className={styles.userDropdown}>
            <i className="fas fa-user"></i>
            <div className={styles.dropdownMenu}>
              {user ? (
                <>
                  <div className={styles.dropdownItem} style={{fontWeight:'bold', color:'#0070f3', cursor:'default'}}>
                    {user.username}
                  </div>
                  <Link href="/profile" className={styles.dropdownItem}>Thông tin cá nhân</Link>
                  <Link href="/security" className={styles.dropdownItem}>Bảo mật</Link>
                  <Link href="/orders" className={styles.dropdownItem}>Lịch sử mua hàng</Link>
                  <div className={styles.dropdownItem} onClick={handleLogout} style={{color:'#e11d48', cursor:'pointer'}}>Đăng xuất</div>
                </>
              ) : (
                <>
                  <Link href="/register" className={styles.dropdownItem}>Đăng ký</Link>
                  <Link href="/login" className={styles.dropdownItem}>Đăng nhập</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
        {/* Mobile Navigation */}
      <div className={`${styles.mobileNav} ${menuOpen ? styles.showMobileMenu : ''}`}>
        <nav className={styles.nav}>
          <Link href="/" onClick={() => setMenuOpen(false)}>Trang chủ</Link>
          <Link href="/products/quanao" onClick={() => setMenuOpen(false)}>Quần Áo</Link>
          <Link href="/products/munon" onClick={() => setMenuOpen(false)}>Mũ Nón</Link>
          <Link href="/products/giaydep" onClick={() => setMenuOpen(false)}>Giày Dép</Link>
          <Link href="/products/phukien" onClick={() => setMenuOpen(false)}>Phụ Kiện</Link>
          <Link href="/products/balo" onClick={() => setMenuOpen(false)}>BaLo</Link>
          <Link href="/news" onClick={() => setMenuOpen(false)}>Tin Tức</Link>
        </nav>
      </div>
    </header>
  );
}

export default AppMenu;