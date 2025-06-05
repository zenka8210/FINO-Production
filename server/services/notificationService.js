const nodemailer = require('nodemailer');
const logger = require('./loggerService');

class NotificationService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      // Cấu hình email service của bạn
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async sendOrderConfirmation(order, user) {
    try {
      await this.transporter.sendMail({
        to: user.email,
        subject: `Xác nhận đơn hàng #${order._id}`,
        html: `
          <h2>Cảm ơn bạn đã đặt hàng!</h2>
          <p>Đơn hàng của bạn đã được xác nhận.</p>
          <p>Mã đơn hàng: ${order._id}</p>
          <p>Tổng tiền: ${order.finalTotal.toLocaleString('vi-VN')}đ</p>
        `
      });
      logger.info(`Order confirmation email sent for order ${order._id}`);
    } catch (error) {
      logger.error('Failed to send order confirmation email:', error);
      throw error;
    }
  }

  async sendOrderStatusUpdate(order, user) {
    try {
      await this.transporter.sendMail({
        to: user.email,
        subject: `Cập nhật trạng thái đơn hàng #${order._id}`,
        html: `
          <h2>Đơn hàng của bạn đã được cập nhật</h2>
          <p>Trạng thái mới: ${order.status}</p>
          <p>Mã đơn hàng: ${order._id}</p>
        `
      });
      logger.info(`Order status update email sent for order ${order._id}`);
    } catch (error) {
      logger.error('Failed to send order status update email:', error);
      throw error;
    }
  }
}

module.exports = new NotificationService();
