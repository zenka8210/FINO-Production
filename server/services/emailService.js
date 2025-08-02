const nodemailer = require('nodemailer');
const { AppError } = require('../middlewares/errorHandler');
const { ERROR_CODES } = require('../config/constants');

class EmailService {
  constructor() {
    // Gmail SMTP configuration với credentials từ user
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'galangboy82@gmail.com',
        pass: 'mjrvlcmjhwhrhhjm' // App password không có khoảng trắng
      }
    });

    // Verify connection on startup
    this.verifyConnection();
  }

  /**
   * Verify email connection
   */
  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ Email service connected successfully');
    } catch (error) {
      console.error('❌ Email service connection failed:', error.message);
    }
  }

  /**
   * Send forgot password email
   * @param {string} to - Recipient email
   * @param {string} name - User name
   * @param {string} resetToken - Password reset token
   * @param {string} resetUrl - Complete reset URL
   */
  async sendForgotPasswordEmail(to, name, resetToken, resetUrl) {
    try {
      const mailOptions = {
        from: {
          name: 'FINO STORE - Thời trang hiện đại',
          address: 'galangboy82@gmail.com'
        },
        to: to,
        subject: `🔐 Đặt lại mật khẩu tài khoản FINO STORE - ${name}`,
        html: this.getForgotPasswordTemplate(name, resetUrl, resetToken)
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      console.log('✅ Forgot password email sent:', {
        to: to,
        messageId: result.messageId
      });

      return {
        success: true,
        messageId: result.messageId
      };
    } catch (error) {
      console.error('❌ Send forgot password email error:', error);
      throw new AppError('Không thể gửi email đặt lại mật khẩu', ERROR_CODES.INTERNAL_ERROR);
    }
  }

  /**
   * Send order confirmation email
   * @param {string} to - Customer email
   * @param {string} customerName - Customer name
   * @param {Object} orderData - Order information
   */
  async sendOrderConfirmationEmail(to, customerName, orderData) {
    const PDFService = require('./pdfService');
    const pdfService = new PDFService();
    
    try {
      console.log('📧 Starting to send order confirmation email to:', to);
      console.log('📦 Order data preview:', {
        orderCode: orderData.orderCode,
        total: orderData.finalTotal,
        itemCount: orderData.items?.length
      });

      // Generate PDF invoice
      console.log('📄 Generating PDF invoice...');
      const pdfBuffer = await pdfService.generateOrderInvoicePDF(orderData);
      console.log('✅ PDF invoice generated successfully');

      const mailOptions = {
        from: {
          name: 'FINO STORE - Thời trang hiện đại',
          address: 'galangboy82@gmail.com'
        },
        to: to,
        subject: `🛍️ Xác nhận đơn hàng #${orderData.orderCode} - FINO STORE`,
        html: this.getOrderConfirmationTemplate(customerName, orderData),
        attachments: [
          {
            filename: `HoaDon_${orderData.orderCode}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        ]
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      console.log('✅ Order confirmation email sent:', {
        to: to,
        orderCode: orderData.orderCode,
        messageId: result.messageId
      });

      // Close PDF service
      await pdfService.close();

      return {
        success: true,
        messageId: result.messageId
      };
    } catch (error) {
      console.error('❌ Send order confirmation email error:', error);
      // Make sure to close PDF service even on error
      await pdfService.close();
      throw new AppError('Không thể gửi email xác nhận đơn hàng', ERROR_CODES.INTERNAL_ERROR);
    }
  }

  /**
   * Forgot password email template - Fino Store
   */
  getForgotPasswordTemplate(name, resetUrl, resetToken) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Đặt lại mật khẩu - Fino Store</title>
        <style>
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                line-height: 1.6; 
                color: #333; 
                margin: 0; 
                padding: 0;
                background-color: #f8fafc;
            }
            .container { 
                max-width: 600px; 
                margin: 20px auto; 
                background: white;
                border-radius: 12px;
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
                overflow: hidden;
            }
            .header { 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white; 
                padding: 40px 30px; 
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: 700;
                text-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .brand {
                font-size: 18px;
                margin-top: 8px;
                opacity: 0.9;
                font-weight: 500;
            }
            .content { 
                padding: 40px 30px; 
                background: white;
            }
            .greeting {
                font-size: 20px;
                color: #2d3748;
                margin-bottom: 20px;
                font-weight: 600;
            }
            .btn { 
                display: inline-block; 
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white !important;
                padding: 16px 32px; 
                text-decoration: none; 
                border-radius: 8px; 
                margin: 25px 0; 
                font-weight: 600;
                font-size: 16px;
                text-align: center;
                box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
                transition: all 0.3s ease;
            }
            .btn:hover { 
                background: linear-gradient(135deg, #5a67d8, #6b46c1);
                box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
                transform: translateY(-2px);
            }
            .btn-container {
                text-align: center;
                margin: 30px 0;
            }
            .footer { 
                text-align: center; 
                padding: 30px; 
                background: #f8fafc;
                color: #718096; 
                font-size: 14px;
                border-top: 1px solid #e2e8f0;
            }
            .warning { 
                background: linear-gradient(135deg, #fed7d7, #feb2b2);
                border-left: 4px solid #f56565; 
                padding: 20px; 
                margin: 25px 0; 
                border-radius: 8px;
                color: #742a2a;
            }
            .warning h3 {
                margin: 0 0 10px 0;
                color: #c53030;
                font-size: 16px;
            }
            .code-box { 
                background: #f7fafc; 
                padding: 20px; 
                border-radius: 8px; 
                font-family: 'Courier New', monospace; 
                word-break: break-all;
                border: 2px dashed #cbd5e0;
                color: #4a5568;
                font-size: 14px;
            }
            .token-display {
                background: linear-gradient(135deg, #e6fffa, #b2f5ea);
                padding: 15px;
                border-radius: 8px;
                text-align: center;
                margin: 20px 0;
                border: 2px solid #38b2ac;
            }
            .token-display code {
                background: #2d3748;
                color: #e2e8f0;
                padding: 8px 12px;
                border-radius: 6px;
                font-weight: 600;
                letter-spacing: 1px;
            }
            .divider {
                margin: 35px 0;
                border: none;
                border-top: 2px solid #e2e8f0;
            }
            .support-info {
                background: #f0fff4;
                padding: 20px;
                border-radius: 8px;
                border-left: 4px solid #48bb78;
                margin: 25px 0;
            }
            .logo {
                font-size: 32px;
                font-weight: 800;
                background: linear-gradient(135deg, #667eea, #764ba2);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                margin-bottom: 10px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">FINO STORE</div>
                <h1>Đặt lại mật khẩu</h1>
                <div class="brand">Thời trang hiện đại & Phong cách</div>
            </div>
            <div class="content">
                <div class="greeting">Xin chào ${name}!</div>
                <p style="font-size: 16px; color: #4a5568; margin-bottom: 20px;">
                    Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn tại <strong style="color: #667eea;">Fino Store</strong>.
                </p>
                <p style="font-size: 16px; color: #4a5568;">
                    Để đặt lại mật khẩu và tiếp tục mua sắm, vui lòng nhấp vào nút bên dưới:
                </p>
                
                <div class="btn-container">
                    <a href="${resetUrl}" class="btn">🔑 Đặt lại mật khẩu ngay</a>
                </div>
                
                <div class="warning">
                    <h3>⚠️ Thông tin quan trọng</h3>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                        <li><strong>Link sẽ hết hạn sau 15 phút</strong> để đảm bảo bảo mật</li>
                        <li>Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này</li>
                        <li>Không chia sẻ link với bất kỳ ai để bảo vệ tài khoản</li>
                        <li>Liên hệ hỗ trợ nếu bạn nghi ngờ có hoạt động bất thường</li>
                    </ul>
                </div>
                
                <p style="font-size: 15px; color: #4a5568; margin-top: 25px;">
                    <strong>Nếu nút không hoạt động,</strong> bạn có thể copy và paste link sau vào trình duyệt:
                </p>
                <div class="code-box">${resetUrl}</div>
                
                <div class="token-display">
                    <p style="margin: 0 0 10px 0; font-weight: 600; color: #2d3748;">Mã xác thực của bạn:</p>
                    <code>${resetToken}</code>
                </div>
                
                <hr class="divider">
                
                <div class="support-info">
                    <h3 style="margin: 0 0 10px 0; color: #2f855a;">🎧 Cần hỗ trợ?</h3>
                    <p style="margin: 0; color: #2f855a;">
                        Đội ngũ Fino Store luôn sẵn sàng hỗ trợ bạn 24/7<br>
                        📧 Email: <strong>support@finostore.com</strong><br>
                        📞 Hotline: <strong>1900-FINO (3466)</strong>
                    </p>
                </div>
            </div>
            <div class="footer">
                <div style="margin-bottom: 15px;">
                    <strong style="color: #667eea; font-size: 18px;">FINO STORE</strong>
                </div>
                <p style="margin: 5px 0;">© 2025 Fino Store. Tất cả quyền được bảo lưu.</p>
                <p style="margin: 5px 0;">Thời trang hiện đại - Phong cách riêng biệt</p>
                <p style="margin: 15px 0 5px 0; font-size: 12px; opacity: 0.8;">
                    Email này được gửi tự động, vui lòng không reply trực tiếp.
                </p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Order confirmation email template
   */
  getOrderConfirmationTemplate(customerName, orderData) {
    const { orderCode, items, total, finalTotal, address, createdAt, paymentMethod, voucher, discountAmount, shippingFee, _id } = orderData;
    
    // Use order ObjectId for the link, not orderCode
    const orderId = _id || orderData.id;
    
    // Generate items HTML - fixed to use correct data structure
    const itemsHtml = items.map(item => {
      // Extract product info from populated data
      const productName = item.productVariant?.product?.name || 'Sản phẩm';
      const colorName = item.productVariant?.color?.name || '';
      const sizeName = item.productVariant?.size?.name || '';
      
      return `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          <div style="font-weight: bold; color: #1f2937;">${productName}</div>
          <small style="color: #6b7280;">
            ${colorName ? `Màu: ${colorName}` : ''} 
            ${sizeName ? `${colorName ? ' | ' : ''}Size: ${sizeName}` : ''}
          </small>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
          <strong>${item.quantity}</strong>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
          <strong>${((item.price || 0) * (item.quantity || 1)).toLocaleString('vi-VN')} ₫</strong>
        </td>
      </tr>
      `;
    }).join('');

    // Fixed payment method display
    const paymentMethodText = typeof paymentMethod === 'object' ? paymentMethod.method : paymentMethod || 'COD';

    // Voucher discount - use discountAmount from order
    const discountHtml = voucher && discountAmount > 0 ? `
      <tr>
        <td colspan="2" style="text-align: right; padding: 10px; color: #10b981;">
          Giảm giá (${voucher.code || voucher}):
        </td>
        <td style="text-align: right; padding: 10px; color: #10b981;">
          -${(discountAmount || 0).toLocaleString('vi-VN')} ₫
        </td>
      </tr>
    ` : '';

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Xác nhận đơn hàng</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 650px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { padding: 0; background: #f9fafb; }
            .section { background: white; margin: 0; padding: 25px; border-bottom: 1px solid #e5e7eb; }
            .section:last-child { border-bottom: none; border-radius: 0 0 8px 8px; }
            .table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            .table th { background: #f9fafb; padding: 15px 12px; text-align: left; font-weight: bold; color: #374151; }
            .table td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
            .total-row { background: #f0fdf4; border-top: 2px solid #10b981; }
            .footer { text-align: center; padding: 25px; color: #6b7280; font-size: 13px; background: #f9fafb; }
            .success-badge { background: #d1fae5; color: #065f46; padding: 8px 16px; border-radius: 20px; font-size: 14px; display: inline-block; margin: 10px 0; }
            .order-code { background: #3b82f6; color: white; padding: 8px 16px; border-radius: 6px; font-weight: bold; }
            .btn { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 15px 0; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>✅ Đơn hàng đã được xác nhận!</h1>
                <div class="success-badge">Thanh toán thành công</div>
            </div>
            
            <div class="content">
                <div class="section">
                    <h2 style="color: #1f2937; margin-top: 0;">Cảm ơn bạn ${customerName}!</h2>
                    <p style="color: #4b5563; font-size: 16px;">Đơn hàng của bạn đã được đặt và thanh toán thành công. Chúng tôi sẽ xử lý và giao hàng trong thời gian sớm nhất.</p>
                    
                    <div style="background: #eff6ff; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6;">
                        <p style="margin: 0;"><strong style="color: #1e40af;">Mã đơn hàng:</strong> <span class="order-code">${orderCode}</span></p>
                        <p style="margin: 10px 0 0 0;"><strong style="color: #1e40af;">Ngày đặt:</strong> ${new Date(createdAt).toLocaleString('vi-VN')}</p>
                        <p style="margin: 10px 0 0 0;"><strong style="color: #1e40af;">Phương thức thanh toán:</strong> ${paymentMethodText}</p>
                    </div>
                </div>

                <div class="section">
                    <h3 style="color: #1f2937; margin-top: 0;">📍 Địa chỉ giao hàng</h3>
                    <div style="background: #f9fafb; padding: 15px; border-radius: 6px; border: 1px solid #e5e7eb;">
                        <p style="margin: 0; font-weight: bold; color: #1f2937;">${address.fullName}</p>
                        <p style="margin: 5px 0; color: #4b5563;">📞 ${address.phone}</p>
                        <p style="margin: 5px 0 0 0; color: #4b5563;">
                            📍 ${address.addressLine}<br>
                            &nbsp;&nbsp;&nbsp;&nbsp;${address.ward}, ${address.district}, ${address.city}
                        </p>
                    </div>
                </div>

                <div class="section">
                    <h3 style="color: #1f2937; margin-top: 0;">🛍️ Chi tiết đơn hàng</h3>
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Sản phẩm</th>
                                <th style="text-align: center; width: 100px;">Số lượng</th>
                                <th style="text-align: right; width: 120px;">Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                            <tr>
                                <td colspan="2" style="text-align: right; padding: 10px;">
                                    Tạm tính:
                                </td>
                                <td style="text-align: right; padding: 10px;">
                                    ${total.toLocaleString('vi-VN')} ₫
                                </td>
                            </tr>
                            ${discountHtml}
                            <tr>
                                <td colspan="2" style="text-align: right; padding: 10px;">
                                    Phí vận chuyển:
                                </td>
                                <td style="text-align: right; padding: 10px;">
                                    ${(shippingFee || 0).toLocaleString('vi-VN')} ₫
                                </td>
                            </tr>
                            <tr class="total-row">
                                <td colspan="2" style="text-align: right; padding: 20px; font-size: 18px;">
                                    <strong>Tổng thanh toán:</strong>
                                </td>
                                <td style="text-align: right; padding: 20px; font-size: 18px; color: #10b981;">
                                    <strong>${finalTotal.toLocaleString('vi-VN')} ₫</strong>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="section">
                    <h3 style="color: #1f2937; margin-top: 0;">📱 Theo dõi đơn hàng</h3>
                    <p>Bạn có thể theo dõi trạng thái đơn hàng và lịch sử mua hàng tại:</p>
                    <div style="text-align: center;">
                        <a href="http://localhost:3002/orders/${orderId}" style="display: inline-block; background: #3b82f6; color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 15px 0; font-weight: bold;">Xem đơn hàng của tôi</a>
                    </div>
                    <p style="color: #6b7280; font-size: 14px; text-align: center;">
                        Chúng tôi sẽ gửi email thông báo khi đơn hàng được giao thành công.
                    </p>
                </div>
            </div>
            
            <div class="footer">
                <p><strong>FINO STORE</strong> - Cảm ơn bạn đã tin tương và mua sắm!</p>
                <p>© 2025 FINO STORE. All rights reserved.</p>
                <p>Liên hệ hỗ trợ: <a href="mailto:galangboy82@gmail.com">galangboy82@gmail.com</a> | Hotline: 0901196480</p>
                <p style="font-size: 11px; margin-top: 15px;">
                    Email này được gửi tự động. Vui lòng không reply trực tiếp vào email này.
                </p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Send test email để kiểm tra connection
   */
  async sendTestEmail(to) {
    try {
      const mailOptions = {
        from: {
          name: 'DATN E-Commerce Test',
          address: 'galangboy82@gmail.com'
        },
        to: to,
        subject: '✅ Test Email - DATN E-Commerce Service',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 500px; margin: 0 auto;">
            <h2 style="color: #10b981;">🎉 Email Service hoạt động thành công!</h2>
            <p>Đây là email test để xác nhận rằng DATN E-Commerce email service đã được cấu hình đúng.</p>
            <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981;">
              <p><strong>✅ Kết nối Gmail thành công</strong></p>
              <p><strong>✅ Cấu hình SMTP hoạt động</strong></p>
              <p><strong>✅ Sẵn sàng gửi email thực tế</strong></p>
            </div>
            <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
              Gửi lúc: ${new Date().toLocaleString('vi-VN')}
            </p>
          </div>
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Test email sent successfully:', result.messageId);
      
      return { 
        success: true, 
        messageId: result.messageId,
        message: 'Test email sent successfully'
      };
    } catch (error) {
      console.error('❌ Test email error:', error);
      throw error;
    }
  }
}

module.exports = EmailService;
