import Link from "next/link";
import Image from "next/image";
import styles from "../css/footer_modern.module.css";

function AppFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        {/* Main Footer Content - Horizontal Layout */}
        <div className={styles.footerContent}>
          {/* Brand Section */}
          <div className={styles.brandSection}>
            <Link href="/" className={styles.logo}>
              <Image
                src="/images/logo-fino-compact.svg"
                alt="FINO Fashion Store"
                width={140}
                height={45}
                className={styles.logoImage}
              />
            </Link>
            <p className={styles.brandTagline}>
              Thời trang Gen Z - Năng động & Hiện đại
            </p>
          </div>

          {/* Contact Info */}
          <div className={styles.contactSection}>
            <div className={styles.contactItem}>
              <i className="fas fa-map-marker-alt"></i>
              <span>Q.12, TP.HCM</span>
            </div>
            <div className={styles.contactItem}>
              <i className="fas fa-phone"></i>
              <span>0901.196.480</span>
            </div>
            <div className={styles.contactItem}>
              <i className="fas fa-envelope"></i>
              <span>fino@fashion.store</span>
            </div>
            <div className={styles.contactItem}>
              <i className="fas fa-clock"></i>
              <span>8:00 - 22:00</span>
            </div>
          </div>

          {/* Social Media */}
          <div className={styles.socialSection}>
            <h4>Follow Us</h4>
            <div className={styles.socialIcons}>
              <a href="#" className={styles.socialIcon} aria-label="Facebook">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="#" className={styles.socialIcon} aria-label="Instagram">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="#" className={styles.socialIcon} aria-label="TikTok">
                <i className="fab fa-tiktok"></i>
              </a>
              <a href="#" className={styles.socialIcon} aria-label="YouTube">
                <i className="fab fa-youtube"></i>
              </a>
            </div>
          </div>

          {/* Payment Methods */}
          <div className={styles.paymentSection}>
            <h4>Thanh toán</h4>
            <div className={styles.paymentMethods}>
              <div className={styles.paymentIcon}>
                <Image
                  src="/images/vnpay-logo.svg"
                  alt="VNPay"
                  width={60}
                  height={24}
                  className={styles.paymentLogo}
                />
              </div>
              <div className={styles.paymentIcon}>
                <i className="fas fa-money-bill-wave"></i>
                <span>COD</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Bottom - Outside container to span full width */}
      <div className={styles.footerBottom}>
        <div className={styles.footerBottomContent}>
          <p>&copy; 2025 FINO Fashion Store. All rights reserved.</p>
          <div className={styles.footerLinks}>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default AppFooter;