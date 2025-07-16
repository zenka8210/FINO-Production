import Link from "next/link";
import styles from "../css/footer.module.css";

function AppFooter() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className="row">          {/* Logo và thông tin liên hệ - Cột 1 */}
          <div className="col-lg-3 col-md-6 col-sm-12">
            <div className={styles.footerSection}>              <div className={styles.logo}>
                <Link href="/">
                  <h2>FINO SHOP</h2>
                </Link>
              </div>

              
              <div className={styles.newsletter}>
                <h4>ĐĂNG KÝ NHẬN TIN</h4>
                <p>Hãy là người đầu tiên nhận khuyến mãi lớn!</p>
                <div className={styles.newsletterForm}>
                  <input type="email" placeholder="Nhập địa chỉ email" />
                  <button type="submit">ĐĂNG KÝ</button>
                </div>
              </div>
            </div>
          </div>

          {/* Hỗ trợ khách hàng - Cột 2 */}
          <div className="col-lg-3 col-md-6 col-sm-12">
            <div className={styles.footerSection}>
              <h3>HỖ TRỢ KHÁCH HÀNG</h3>
              <ul>
                <li><a href="#">Chính sách đổi hàng và bảo hành</a></li>
                <li><a href="#">Chính sách Membership</a></li>
                <li><a href="#">Chính sách ưu đãi sinh nhật</a></li>
                <li><a href="#">Chính sách bảo mật</a></li>
                <li><a href="#">Chính sách giao hàng</a></li>
              </ul>
            </div>
          </div>          {/* Fanpage và thanh toán - Cột 3 */}
          <div className="col-lg-3 col-md-6 col-sm-12">
            <div className={styles.footerSection}>
              <h3>FANPAGE CHÚNG TÔI</h3>
              <div className={styles.socialSection}>
                <div className={styles.socialIcons}>
                  <a href="#" className={styles.facebook}><i className="fab fa-facebook"></i></a>
                  <a href="#" className={styles.instagram}><i className="fab fa-instagram"></i></a>
                  <a href="#" className={styles.youtube}><i className="fab fa-youtube"></i></a>
                  <a href="#" className={styles.tiktok}><i className="fab fa-tiktok"></i></a>
                </div>
              </div>
              
              <h3>PHƯƠNG THỨC THANH TOÁN</h3>
              <div className={styles.paymentMethods}>
                <div className={styles.paymentIcons}>
                  <span className={styles.vnpay}>VNPAY</span>
                  <span className={styles.cod}>COD</span>
                </div>
              </div>
              
              <div className={styles.certifications}>
                <img src="/images/certification1.svg" alt="Đã thông báo" />
                <img src="/images/dmca-protection.svg" alt="DMCA Protected" />
              </div>
            </div>
          </div>

          {/* Kết nối với chúng tôi - Cột 4 */}
          <div className="col-lg-3 col-md-6 col-sm-12">
            <div className={styles.footerSection}>
              <h3>KẾT NỐI VỚI CHÚNG TÔI</h3>
              <div className={styles.contactInfo}>
                <p><i className="fas fa-phone"></i> Tổng đài CSKH: 0287306060</p>
                <p><i className="fas fa-envelope"></i> Email: cskh@finoshop.com</p>
              </div>
            </div>
          </div>
        </div>        
        {/* Footer Bottom */}
        <div className={styles.footerBottom}>
          <p>&copy; Bản quyền thuộc về <a href="/">FINOSHOP</a></p>
        </div>
      </div>
    </footer>
  );
}
export default AppFooter;