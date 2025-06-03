import styles from './maintenance.module.css';
import Image from 'next/image';
import phan1 from "../img/baoquan.jpg";
import phan2 from "../img/a.jpg";
export default function MaintenanceGuide() {
  return (
    <div className={styles.maintenancePage}>
      <div className={styles.header}>
        <h1>Hướng Dẫn Bảo Quản Áo Polo</h1>
        <p>Những điều cần biết để giữ áo polo luôn bền đẹp</p>
      </div>

      <div className={styles.guideContainer}>
        <section className={styles.guideSection}>
          <div className={styles.guideContent}>
            <h2>1. Giặt áo đúng cách</h2>
            <div className={styles.guideDetails}>
              <div className={styles.guideText}>
                <ul>
                  <li>Giặt áo bằng nước lạnh để tránh co rút</li>
                  <li>Không dùng chất tẩy mạnh để giữ màu vải</li>
                  <li>Giặt bằng tay hoặc máy giặt ở chế độ nhẹ</li>
                </ul>
              </div>
              <Image 
                src={phan1}
                alt="Giặt áo polo"
                width={400}
                height={300}
              />
            </div>
          </div>
        </section>
        <section className={styles.guideSection}>
          <div className={styles.guideContent}>
            <h2>2. Phơi và bảo quản</h2>
            <div className={styles.guideDetails}>
              <Image 
                src={phan2}
                alt="Phơi áo polo"
                width={400}
                height={300}
              />
              <div className={styles.guideText}>
                <ul>
                  <li>Phơi áo ở nơi thoáng mát, tránh ánh nắng trực tiếp</li>
                  <li>Lộn trái áo trước khi phơi để bảo vệ màu sắc</li>
                  <li>Cất áo ở nơi khô ráo, tránh ẩm mốc</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.guideSection}>
          <div className={styles.guideContent}>
            <h2>3. Ủi và sử dụng</h2>
            <div className={styles.tipsList}>
              <div className={styles.tipItem}>
                <i className="fas fa-temperature-high"></i>
                <h3>Ủi nhiệt độ thấp</h3>
                <p>Dùng bàn ủi hơi nước hoặc nhiệt độ thấp để tránh hỏng vải</p>
              </div>
              <div className={styles.tipItem}>
                <i className="fas fa-hand-holding-water"></i>
                <h3>Tránh ẩm ướt</h3>
                <p>Không để áo polo ở nơi có độ ẩm cao để tránh nấm mốc</p>
              </div>
              <div className={styles.tipItem}>
                <i className="fas fa-tshirt"></i>
                <h3>Mặc đúng size</h3>
                <p>Chọn size phù hợp để giữ form áo lâu dài</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
