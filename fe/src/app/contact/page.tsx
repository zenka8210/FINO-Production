import styles from './contact.module.css';

export default function Contact() {
  return (
    <div className={styles.contactPage}>
      <div className="container">
        <div className="row">
          <div className="col-12">
            <div className={styles.contactHeader}>
              <h1>Liên Hệ Với Chúng Tôi</h1>
              <p>Chúng tôi luôn sẵn sàng hỗ trợ bạn</p>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-6 col-md-12 col-sm-12">
            <div className={styles.contactInfo}>
              <div className={styles.infoItem}>
                <i className="fas fa-map-marker-alt"></i>
                <div>
                  <h3>Địa Chỉ</h3>
                  <p>123 Đường ABC, Quận 1, TP.HCM</p>
                </div>
              </div>

              <div className={styles.infoItem}>
                <i className="fas fa-phone"></i>
                <div>
                  <h3>Điện Thoại</h3>
                  <p>0123 456 789</p>
                </div>
              </div>

              <div className={styles.infoItem}>
                <i className="fas fa-envelope"></i>
                <div>
                  <h3>Email</h3>
                  <p>support@watchstore.com</p>
                </div>
              </div>
            </div>
          </div>

          <div className="col-6 col-md-12 col-sm-12">
            <form className={styles.contactForm}>
              <div className={styles.formGroup}>
                <input
                  type="text"
                  name="name"
                  placeholder="Họ và tên"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <input
                  type="tel"
                  name="phone"
                  placeholder="Số điện thoại"
                />
              </div>

              <div className={styles.formGroup}>
                <input
                  type="text"
                  name="subject"
                  placeholder="Tiêu đề"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <textarea
                  name="message"
                  placeholder="Nội dung tin nhắn"
                  required
                  rows={5}
                ></textarea>
              </div>

              <button type="submit" className={styles.submitButton}>
                Gửi Tin Nhắn
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}