const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class PDFService {
  constructor() {
    this.browser = null;
  }

  /**
   * Initialize browser
   */
  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
    return this.browser;
  }

  /**
   * Generate PDF from order data
   * @param {Object} orderData - Order information
   * @returns {Buffer} PDF buffer
   */
  async generateOrderInvoicePDF(orderData) {
    try {
      console.log('📄 Generating PDF invoice for order:', orderData.orderCode);
      
      const browser = await this.initBrowser();
      const page = await browser.newPage();

      // Generate HTML for invoice
      const invoiceHTML = this.generateInvoiceHTML(orderData);

      await page.setContent(invoiceHTML, { waitUntil: 'networkidle0' });

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px'
        }
      });

      await page.close();
      
      console.log('✅ PDF invoice generated successfully');
      return pdfBuffer;
    } catch (error) {
      console.error('❌ PDF generation error:', error);
      throw new Error('Không thể tạo PDF hóa đơn');
    }
  }

  /**
   * Generate HTML template for invoice (similar to OrderInvoice.tsx)
   */
  generateInvoiceHTML(order) {
    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(amount);
    };

    const itemsHTML = order.items.map(item => {
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
          ${item.quantity}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
          ${formatCurrency(item.price || 0)}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
          <strong>${formatCurrency(item.totalPrice || (item.price || 0) * (item.quantity || 1))}</strong>
        </td>
      </tr>
      `;
    }).join('');

    // Use correct discountAmount from order
    const discountHTML = order.voucher && order.discountAmount > 0 ? `
      <tr style="color: #10b981;">
        <td colspan="3" style="text-align: right; padding: 10px;">
          <strong>Giảm giá (${order.voucher.code || order.voucher}):</strong>
        </td>
        <td style="text-align: right; padding: 10px;">
          <strong>-${formatCurrency(order.discountAmount)}</strong>
        </td>
      </tr>
    ` : '';

    // Fixed payment method display
    const paymentMethodText = typeof order.paymentMethod === 'object' ? order.paymentMethod.method : order.paymentMethod || 'COD';

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Hóa đơn ${order.orderCode}</title>
        <style>
            body {
                font-family: 'Arial', sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                background: #fff;
            }
            .invoice-header {
                text-align: center;
                margin-bottom: 50px;
                padding-bottom: 30px;
                border-bottom: 3px solid #667eea;
            }
            .company-info {
                margin-bottom: 20px;
            }
            .company-info h1 {
                color: #667eea;
                margin: 0;
                font-size: 32px;
                font-weight: bold;
                letter-spacing: 2px;
            }
            .company-tagline {
                color: #6b7280;
                margin: 10px 0 0 0;
                font-style: italic;
                font-size: 16px;
            }
            .invoice-info {
                margin-top: 25px;
            }
            .invoice-title {
                color: #1f2937;
                margin: 0 0 15px 0;
                font-size: 26px;
                font-weight: bold;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            .invoice-details {
                display: inline-block;
                text-align: left;
                background: #f8fafc;
                padding: 15px 25px;
                border-radius: 8px;
                border: 2px solid #e2e8f0;
            }
            .info-section {
                display: flex;
                justify-content: space-between;
                margin-bottom: 40px;
                gap: 30px;
            }
            .customer-info, .order-info {
                flex: 1;
                background: #f8fafc;
                padding: 20px;
                border-radius: 8px;
                border: 1px solid #e2e8f0;
            }
            .customer-info h3, .order-info h3 {
                color: #374151;
                border-bottom: 2px solid #667eea;
                padding-bottom: 8px;
                margin: 0 0 20px 0;
                font-size: 18px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .info-item {
                margin-bottom: 12px;
                padding: 5px 0;
            }
            .info-item strong {
                color: #1f2937;
                display: inline-block;
                min-width: 100px;
            }
            .items-table {
                width: 100%;
                border-collapse: collapse;
                margin: 40px 0;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                border-radius: 8px;
                overflow: hidden;
            }
            .items-table th {
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                padding: 15px 12px;
                text-align: left;
                font-weight: bold;
            }
            .items-table th:last-child,
            .items-table td:last-child {
                text-align: right;
            }
            .total-section {
                background: linear-gradient(135deg, #f8fafc, #e2e8f0);
                padding: 30px;
                border-radius: 12px;
                border: 2px solid #667eea;
                margin: 40px 0;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }
            .total-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 12px;
                padding: 5px 0;
                font-size: 16px;
            }
            .final-total {
                font-size: 20px;
                font-weight: bold;
                color: #1f2937;
                border-top: 3px solid #667eea;
                padding-top: 15px;
                margin-top: 15px;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            .footer {
                margin-top: 50px;
                text-align: center;
                color: #6b7280;
                font-size: 12px;
                border-top: 2px solid #e5e7eb;
                padding-top: 25px;
                line-height: 1.8;
            }
            .thank-you {
                margin-top: 40px;
                text-align: center;
                background: #f0f7ff;
                padding: 20px;
                border-radius: 8px;
                border-left: 5px solid #667eea;
            }
            .thank-you h3 {
                color: #667eea;
                margin: 0 0 10px 0;
                font-size: 20px;
            }
        </style>
    </head>
    <body>
        <div class="invoice-header">
            <div class="company-info">
                <h1>FINO STORE</h1>
                <p class="company-tagline">Thời trang gen Z - Hiện đại & nổi bật</p>
            </div>
            <div class="invoice-info">
                <h2 class="invoice-title">HÓA ĐƠN BÁN HÀNG</h2>
                <div class="invoice-details">
                    <p><strong>Số:</strong> ${order.orderCode}</p>
                    <p><strong>Ngày:</strong> ${formatDate(order.createdAt)}</p>
                </div>
            </div>
        </div>

        <div class="info-section">
            <div class="customer-info">
                <h3>📋 Thông tin khách hàng</h3>
                <div class="info-item"><strong>Họ tên:</strong> ${order.address?.fullName || 'N/A'}</div>
                <div class="info-item"><strong>Điện thoại:</strong> ${order.address?.phone || 'N/A'}</div>
                <div class="info-item"><strong>Địa chỉ:</strong> ${[
                  order.address?.addressLine,
                  order.address?.ward,
                  order.address?.district,
                  order.address?.city
                ].filter(Boolean).join(', ')}</div>
            </div>
            <div class="order-info">
                <h3>📦 Thông tin đơn hàng</h3>
                <div class="info-item"><strong>Mã đơn hàng:</strong> ${order.orderCode}</div>
                <div class="info-item"><strong>Ngày đặt:</strong> ${formatDate(order.createdAt)}</div>
                <div class="info-item"><strong>Thanh toán:</strong> ${paymentMethodText}</div>
                <div class="info-item"><strong>Trạng thái:</strong> <span style="color: #10b981; font-weight: bold;">✅ Đã xác nhận</span></div>
            </div>
        </div>

        <table class="items-table">
            <thead>
                <tr>
                    <th>Sản phẩm</th>
                    <th style="text-align: center;">Số lượng</th>
                    <th style="text-align: right;">Đơn giá</th>
                    <th style="text-align: right;">Thành tiền</th>
                </tr>
            </thead>
            <tbody>
                ${itemsHTML}
            </tbody>
        </table>

        <div class="total-section">
            <div class="total-row">
                <span>Tổng tiền hàng:</span>
                <span><strong>${formatCurrency(order.total)}</strong></span>
            </div>
            ${discountHTML}
            <div class="total-row">
                <span>Phí vận chuyển:</span>
                <span><strong>${formatCurrency(order.shippingFee || 0)}</strong></span>
            </div>
            <div class="total-row final-total">
                <span>TỔNG THANH TOÁN:</span>
                <span>${formatCurrency(order.finalTotal)}</span>
            </div>
        </div>

        <div class="thank-you">
            <h3>🎉 Cảm ơn bạn đã mua sắm tại FINO STORE!</h3>
            <p>Chúng tôi rất trân trọng sự tin tưởng của bạn và hy vọng bạn sẽ hài lòng với đơn hàng này.</p>
            <p><strong>Mọi thắc mắc xin liên hệ:</strong> 📞 090111 (3466) | 📧 huynguyen8297@gmail.com</p>
        </div>

        <div class="footer">
            <p><strong>FINO STORE</strong> - Thời trang gen Z & Hiện đại và nổi bật</p>
            <p>📧 Email: huynguyen8297@gmail.com | 📞 Hotline: 090111 (3466)</p>
            <p>© 2025 FINO STORE. Tất cả quyền được bảo lưu.</p>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Close browser when done
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

module.exports = PDFService;
