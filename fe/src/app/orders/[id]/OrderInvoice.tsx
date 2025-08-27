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

  // Helper function to get display address (priority: address -> addressSnapshot -> defaults)
  const getDisplayAddress = () => {
    // First try current address (if still exists)
    if (order.address && typeof order.address === 'object') {
      return {
        fullName: order.address.fullName,
        phone: order.address.phone,
        addressLine: order.address.addressLine,
        ward: order.address.ward,
        district: order.address.district,
        city: order.address.city,
        source: 'current'
      };
    }
    
    // Fallback to addressSnapshot (preserved historical data)
    if (order.addressSnapshot) {
      return {
        fullName: order.addressSnapshot.fullName,
        phone: order.addressSnapshot.phone,
        addressLine: order.addressSnapshot.addressLine,
        ward: order.addressSnapshot.ward,
        district: order.addressSnapshot.district,
        city: order.addressSnapshot.city,
        source: 'snapshot'
      };
    }
    
    // Final fallback
    return {
      fullName: 'N/A',
      phone: 'N/A',
      addressLine: 'N/A',
      ward: 'N/A',
      district: 'N/A',
      city: 'N/A',
      source: 'none'
    };
  };

  const displayAddress = getDisplayAddress();

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
          <p><strong>Họ tên:</strong> {displayAddress.fullName}</p>
          <p><strong>Điện thoại:</strong> {displayAddress.phone}</p>
          <p><strong>Email:</strong> {order.user?.email || 'N/A'}</p>
          {displayAddress.source === 'snapshot' && (
            <p style={{ fontSize: '10px', fontStyle: 'italic', color: '#666' }}>(từ lịch sử)</p>
          )}
        </div>
        <div className="shippingInfo">
          <h3>Địa chỉ giao hàng</h3>
          <p>{displayAddress.addressLine}</p>
          <p>{displayAddress.ward}, {displayAddress.district}</p>
          <p>{displayAddress.city}</p>
          {displayAddress.source === 'snapshot' && (
            <p style={{ fontSize: '10px', fontStyle: 'italic', color: '#666' }}>(từ lịch sử)</p>
          )}
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
            // Priority: 1. Snapshot, 2. ProductVariant reference, 3. Fallback
            const productName = item.productSnapshot?.productName || 
                               item.productVariant?.product?.name || 
                               item.productName || 
                               'Sản phẩm không xác định';
            
            const colorName = item.productSnapshot?.colorName || 
                             item.productVariant?.color?.name || 
                             '';
            
            const sizeName = item.productSnapshot?.sizeName || 
                            item.productVariant?.size?.name || 
                            '';
            
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
