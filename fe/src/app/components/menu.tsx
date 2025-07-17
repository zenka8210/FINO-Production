'use client';
import Image from "next/image";
import Link from "next/link"; 
import styles from "../css/menu.module.css";
import logo from "../img/logo.png";
import { useAuth } from "@/contexts";
import { useWishlist, useCart } from "@/hooks";
import { useState } from "react";
import { useRouter } from "next/navigation";

function AppMenu() {
  const { user, logout } = useAuth();
  const { wishlistItems } = useWishlist();
  const { itemsCount } = useCart();
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/products?search=${encodeURIComponent(search.trim())}`);
    }
  };
  
  const handleLogout = () => {
    logout();
  };

  return (
    <header className={styles.header}>
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%'}}>
        <Link href="/" className={styles.logoLink}>
          <Image
            src={logo}
            alt="Logo áo"
            height={120}
            width={120}
            className={styles.logo}
          />
        </Link>

        <form 
          onSubmit={handleSearch}
          style={{
            flexGrow: 1,
            display: 'flex',
            justifyContent: 'center',
            maxWidth: '400px',
            margin: '0 20px'
          }}
        >
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 15px',
              borderRadius: '25px',
              border: '2px solid #ddd',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.3s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#0070f3'}
            onBlur={(e) => e.target.style.borderColor = '#ddd'}
          />
          <button 
            type="submit"
            style={{
              marginLeft: '10px',
              padding: '10px 20px',
              backgroundColor: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '25px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'background-color 0.3s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0051cc'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#0070f3'}
          >
            Tìm kiếm
          </button>
        </form>

        <div style={{display:'flex', alignItems:'center', gap:'20px'}}>
          <Link href="/favorite" legacyBehavior>
            <a style={{display:'inline-block', position:'relative'}} aria-label="Yêu thích">
              <i className="fas fa-heart"></i>
              {wishlistItems.length > 0 && (
                <span style={{position:'absolute',top:-6,right:-8,background:'var(--brand-primary)',color:'#fff',borderRadius:'50%',fontSize:11,minWidth:16,height:16,display:'flex',alignItems:'center',justifyContent:'center',padding:'0 4px',fontWeight:600,border:'2px solid #fff',boxShadow:'0 1px 4px #0001'}}> 
                  {wishlistItems.length} 
                </span>
              )}
            </a>
          </Link>
          
          <Link href="/cart" legacyBehavior>
            <a style={{display:'inline-block', position:'relative'}} aria-label="Giỏ hàng">
              <i className="fas fa-shopping-cart"></i>
              {itemsCount > 0 && (
                <span style={{position:'absolute',top:-6,right:-8,background:'var(--brand-primary)',color:'#fff',borderRadius:'50%',fontSize:11,minWidth:16,height:16,display:'flex',alignItems:'center',justifyContent:'center',padding:'0 4px',fontWeight:600,border:'2px solid #fff',boxShadow:'0 1px 4px #0001'}}> 
                  {itemsCount} 
                </span>
              )}
            </a>
          </Link>
          
          <div className={styles.userDropdown}>
            <i className="fas fa-user"></i>
            <div className={styles.dropdownMenu}>
              {user ? (
                <>
                  <div className={styles.dropdownItem} style={{fontWeight:'bold', color:'#0070f3', cursor:'default'}}>
                    {user.name || user.email}
                  </div>
                  <Link href="/profile" className={styles.dropdownItem}>Thông tin cá nhân</Link>
                  <Link href="/security" className={styles.dropdownItem}>Bảo mật</Link>
                  <Link href="/orders" className={styles.dropdownItem}>Lịch sử mua hàng</Link>
                  <div className={styles.dropdownItem} onClick={handleLogout} style={{color:'#e11d48', cursor:'pointer'}}>
                    Đăng xuất
                  </div>
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
    </header>
  );
}

export default AppMenu;
