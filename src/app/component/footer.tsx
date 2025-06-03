import styles from "../css/footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerGrid}>
        <div className={styles.footerSection}>
          <h3>Về Chúng Tôi</h3>
          <ul>
            <li><a href="#">Câu Chuyện Thương Hiệu</a></li>
            <li><a href="#">Tuyển Dụng</a></li>
            <li><a href="#">Hệ Thống Cửa Hàng</a></li>
            <li><a href="/about">Giới Thiệu</a></li>
          </ul>
        </div>
        <div className={styles.footerSection}>
          <h3>Chăm Sóc Khách Hàng</h3>
          <ul>
          <li><a href="/contact">Liên Hệ</a></li>
          <li><a href="#">Vận Chuyển & Đổi Trả</a></li>
          <li><a href="/maintenance">Hướng Dẫn Bảo Quản</a></li>
          </ul>
        </div>
        <div className={styles.footerSection}>
          <h3>Theo Dõi Chúng Tôi</h3>
          <div className={styles.socialIcons}>
            <i className="fab fa-facebook"></i>
            <i className="fab fa-instagram"></i>
            <i className="fab fa-twitter"></i>

          </div>
        </div>
      </div>
      <div className={styles.footerBottom}>
        <p>&copy; Thoải mái mặc cả ngày, phong cách mãi mãi.</p>
      </div>
    </footer>
  );
}