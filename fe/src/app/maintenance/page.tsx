import Image from "next/image";
import styles from "./maintenance.module.css";

export default function MaintenancePage() {
  return (
    <div className="container">
      <div className="row">
        <div className="col-10 col-md-12 col-sm-12" style={{margin: '0 auto'}}>
          <div className={styles.maintenanceContainer}>
            <h1 className={styles.title}>Vận Chuyển & Đổi Trả</h1>
            <div className={styles.imageWrap}>
              <Image src="/images/anh4.jpg" alt="Xe tải chở hàng" width={600} height={300} className={styles.image} />
            </div>
            <div className={styles.content}>
              <div className="row">
                <div className="col-4 col-md-12 col-sm-12">
                  <h2>Chính sách vận chuyển</h2>
                  <ul>
                    <li>Miễn phí vận chuyển toàn quốc cho đơn hàng từ 500.000đ.</li>
                    <li>Thời gian giao hàng từ 2-5 ngày làm việc.</li>
                    <li>Hỗ trợ kiểm tra hàng trước khi thanh toán.</li>
                  </ul>
                </div>
                <div className="col-4 col-md-12 col-sm-12">
                  <h2>Chính sách đổi trả</h2>
                  <ul>
                    <li>Đổi trả trong vòng 7 ngày kể từ khi nhận hàng.</li>
                    <li>Sản phẩm còn nguyên tem mác, chưa qua sử dụng.</li>
                    <li>Hỗ trợ đổi size, đổi mẫu miễn phí 1 lần.</li>
                  </ul>
                </div>
                <div className="col-4 col-md-12 col-sm-12">
                  <h2>Hướng dẫn bảo quản</h2>
                  <ul>
                    <li>Giặt tay với nước lạnh để giữ form áo tốt nhất.</li>
                    <li>Không dùng chất tẩy mạnh, không ngâm áo quá lâu.</li>
                    <li>Phơi nơi thoáng mát, tránh ánh nắng trực tiếp.</li>
                    <li>Ủi/là ở nhiệt độ thấp, tránh ủi trực tiếp lên hình in.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}