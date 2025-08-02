import React from 'react';
import { OrderWithRefs } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface OrderInvoiceProps {
  order: OrderWithRefs;
}

const OrderInvoice: React.FC<OrderInvoiceProps> = ({ order }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format payment method text properly
  const getPaymentMethodText = (): string => {
    if (typeof order.paymentMethod === 'object' && order.paymentMethod?.method) {
      return order.paymentMethod.method;
    }
    return String(order.paymentMethod || 'COD');
  };

  const getStatusText = (status: string): string => {
    const statusMap: { [key: string]: string } = {
      'pending': 'Chờ xử lý',
      'processing': 'Đang xử lý', 
      'shipped': 'Đang giao hàng',
      'delivered': 'Đã giao hàng',
      'cancelled': 'Đã hủy'
    };
    return statusMap[status] || status;
  };

  return (
    <div id="order-invoice" className="invoice">
      {/* Header */}
      <div className="header">
        <div className="logo">
          <h1>FINO STORE</h1>
          <p>Thời trang hiện đại & phong cách</p>
          <div className="companyInfo">
            <p>Địa chỉ: Công viên phần mềm Quang Trung, Quận 12, TP.HCM</p>
            <p>Điện thoại: 0901196480</p>
            <p>Email: support@finostore.com</p>
          </div>
        </div>
        <div className="invoiceInfo">
          <h2>HÓA ĐƠN BÁN HÀNG</h2>
          <p><strong>Số:</strong> {order.orderCode}</p>
          <p><strong>Ngày:</strong> {formatDate(order.createdAt)}</p>
        </div>
      </div>

      {/* Customer & Shipping Info */}
      <div className="customerSection">
        <div className="customerInfo">
          <h3>Thông tin khách hàng</h3>
          <p><strong>Họ tên:</strong> {order.address?.fullName || 'N/A'}</p>
          <p><strong>Điện thoại:</strong> {order.address?.phone || 'N/A'}</p>
          <p><strong>Email:</strong> {order.user?.email || 'N/A'}</p>
        </div>
        <div className="shippingInfo">
          <h3>Địa chỉ giao hàng</h3>
          <p>{order.address?.addressLine}</p>
          <p>{order.address?.ward}, {order.address?.district}</p>
          <p>{order.address?.city}</p>
        </div>
      </div>

      {/* Payment & Status Info */}
      <div className="paymentSection">
        <div className="paymentInfo">
          <h4>Thông tin thanh toán</h4>
          <p><strong>Phương thức:</strong> {getPaymentMethodText()}</p>
          <p><strong>Trạng thái thanh toán:</strong> {order.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}</p>
        </div>
        <div className="statusInfo">
          <h4>Trạng thái đơn hàng</h4>
          <p><strong>Trạng thái:</strong> {getStatusText(order.status)}</p>
          <p><strong>Ngày cập nhật:</strong> {formatDate(order.updatedAt)}</p>
        </div>
      </div>

      {/* Items Table */}
      <table className="itemsTable">
        <thead>
          <tr>
            <th>Sản phẩm</th>
            <th>Số lượng</th>
            <th>Đơn giá</th>
            <th>Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          {order.items?.map((item, index) => {
            const productName = item.productVariant?.product?.name || 'N/A';
            const colorName = item.productVariant?.color?.name || '';
            const sizeName = item.productVariant?.size?.name || '';
            const unitPrice = item.price || 0;
            const totalPrice = unitPrice * item.quantity;
            
            return (
              <tr key={index}>
                <td>
                  <div className="item-name">{productName}</div>
                  <div className="item-variant">
                    {colorName ? `Màu: ${colorName}` : ''}
                    {sizeName ? `${colorName ? ' | ' : ''}Size: ${sizeName}` : ''}
                  </div>
                </td>
                <td>{item.quantity}</td>
                <td>{formatCurrency(unitPrice)}</td>
                <td>{formatCurrency(totalPrice)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Order Summary */}
      <div className="summarySection">
        <div className="summaryTable">
          <div className="summaryRow subtotal">
            <span>Tạm tính:</span>
            <span>{formatCurrency(order.total || 0)}</span>
          </div>
          
          {order.discountAmount && order.discountAmount > 0 && (
            <div className="summaryRow discount">
              <span>Giảm giá ({order.voucher?.code || 'Voucher'}):</span>
              <span>-{formatCurrency(order.discountAmount)}</span>
            </div>
          )}
          
          <div className="summaryRow shipping">
            <span>Phí vận chuyển:</span>
            <span>{formatCurrency(order.shippingFee || 0)}</span>
          </div>
          
          <div className="summaryRow total">
            <span>TỔNG CỘNG:</span>
            <span>{formatCurrency(order.finalTotal || 0)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="footer">
        <div className="footerContent">
          <div className="footerSection">
            <h4>Điều khoản & Ghi chú</h4>
            <p>- Hóa đơn này là bằng chứng thanh toán hợp lệ</p>
            <p>- Vui lòng kiểm tra hàng hóa khi nhận</p>
            <p>- Đổi trả trong vòng 7 ngày với điều kiện áp dụng</p>
          </div>
          <div className="footerSection">
            <h4>Liên hệ hỗ trợ</h4>
            <p>Hotline: 0901196480</p>
            <p>Email: support@finostore.com</p>
            <p>Website: www.finostore.com</p>
          </div>
        </div>
        
        <div className="thankYou">
          Cảm ơn quý khách đã mua hàng tại FINO STORE!
        </div>
      </div>

      {/* Signature Section */}
      <div className="signatureSection">
        <div className="signature">
          <p>Người bán hàng</p>
          <div className="signLine"></div>
          <div className="signLabel">(Ký và ghi rõ họ tên)</div>
        </div>
        <div className="signature">
          <p>Người mua hàng</p>
          <div className="signLine"></div>
          <div className="signLabel">(Ký và ghi rõ họ tên)</div>
        </div>
      </div>
    </div>
  );
};

export default OrderInvoice;
