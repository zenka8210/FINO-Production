const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      // Cấu hình email service (Gmail, SendGrid, etc.)
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
      }
    });
  }

  // Gửi email xác nhận đơn hàng
  async sendOrderConfirmationEmail(user, order) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER || 'noreply@yourstore.com',
        to: user.email,
        subject: `Xác nhận đơn hàng ${order.orderCode}`,
        html: this.generateOrderConfirmationHTML(user, order)
      };

      // For development, log email instead of sending
      if (process.env.NODE_ENV === 'development' || !process.env.EMAIL_USER) {
        console.log('📧 EMAIL WOULD BE SENT:');
        console.log('To:', mailOptions.to);
        console.log('Subject:', mailOptions.subject);
        console.log('Content:', mailOptions.html);
        return { success: true, message: 'Email logged (development mode)' };
      }

      const result = await this.transporter.sendMail(mailOptions);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Email sending failed:', error);
      // Don't throw error - email failure shouldn't fail order creation
      return { success: false, error: error.message };
    }
  }

  // Generate HTML content for order confirmation
  generateOrderConfirmationHTML(user, order) {
    const itemsHTML = order.items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          ${item.productVariant?.product?.name || 'Sản phẩm'}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
          ${item.quantity}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
          ${this.formatCurrency(item.price)}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
          ${this.formatCurrency(item.totalPrice)}
        </td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Xác nhận đơn hàng</title>
      </head>
      <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Xác nhận đơn hàng</h1>
          </div>
          
          <!-- Content -->
          <div style="padding: 20px;">
            <p>Xin chào <strong>${user.name}</strong>,</p>
            <p>Cảm ơn bạn đã đặt hàng tại cửa hàng của chúng tôi. Đơn hàng của bạn đã được tiếp nhận và đang được xử lý.</p>
            
            <!-- Order Info -->
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #333;">Thông tin đơn hàng</h3>
              <p><strong>Mã đơn hàng:</strong> ${order.orderCode}</p>
              <p><strong>Ngày đặt:</strong> ${new Date(order.createdAt).toLocaleDateString('vi-VN')}</p>
              <p><strong>Trạng thái:</strong> Đang xử lý</p>
            </div>

            <!-- Order Items -->
            <h3>Chi tiết đơn hàng</h3>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <thead>
                <tr style="background-color: #f8f9fa;">
                  <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">Sản phẩm</th>
                  <th style="padding: 10px; text-align: center; border-bottom: 1px solid #ddd;">Số lượng</th>
                  <th style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">Đơn giá</th>
                  <th style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHTML}
              </tbody>
            </table>

            <!-- Order Summary -->
            <div style="border-top: 2px solid #ddd; padding-top: 15px;">
              <div style="display: flex; justify-content: space-between; margin: 5px 0;">
                <span>Tạm tính:</span>
                <span>${this.formatCurrency(order.total)}</span>
              </div>
              ${order.discountAmount > 0 ? `
                <div style="display: flex; justify-content: space-between; margin: 5px 0; color: #d9534f;">
                  <span>Giảm giá:</span>
                  <span>-${this.formatCurrency(order.discountAmount)}</span>
                </div>
              ` : ''}
              <div style="display: flex; justify-content: space-between; margin: 5px 0;">
                <span>Phí vận chuyển:</span>
                <span>${this.formatCurrency(order.shippingFee)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin: 15px 0; padding-top: 10px; border-top: 1px solid #ddd; font-size: 18px; font-weight: bold;">
                <span>Tổng cộng:</span>
                <span style="color: #4CAF50;">${this.formatCurrency(order.finalTotal)}</span>
              </div>
            </div>

            <!-- Footer -->
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px;">
              <p>Nếu bạn có bất kỳ câu hỏi nào về đơn hàng, vui lòng liên hệ với chúng tôi.</p>
              <p>Cảm ơn bạn đã tin tưởng và lựa chọn!</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Format currency helper
  formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }

  // Send order status update email
  async sendOrderStatusUpdateEmail(user, order, oldStatus, newStatus) {
    try {
      const statusMessages = {
        'processing': 'đang được xử lý',
        'shipped': 'đã được giao cho đơn vị vận chuyển',
        'delivered': 'đã được giao thành công',
        'cancelled': 'đã được hủy'
      };

      const mailOptions = {
        from: process.env.EMAIL_USER || 'noreply@yourstore.com',
        to: user.email,
        subject: `Cập nhật trạng thái đơn hàng ${order.orderCode}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Cập nhật trạng thái đơn hàng</h2>
            <p>Xin chào <strong>${user.name}</strong>,</p>
            <p>Đơn hàng <strong>${order.orderCode}</strong> của bạn ${statusMessages[newStatus] || newStatus}.</p>
            ${newStatus === 'delivered' ? '<p><strong>Bạn có thể đánh giá sản phẩm ngay bây giờ!</strong></p>' : ''}
            <p>Cảm ơn bạn đã tin tưởng và lựa chọn!</p>
          </div>
        `
      };

      if (process.env.NODE_ENV === 'development' || !process.env.EMAIL_USER) {
        console.log('📧 STATUS UPDATE EMAIL WOULD BE SENT:');
        console.log('To:', mailOptions.to);
        console.log('Subject:', mailOptions.subject);
        return { success: true, message: 'Email logged (development mode)' };
      }

      const result = await this.transporter.sendMail(mailOptions);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Status update email sending failed:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = EmailService;
