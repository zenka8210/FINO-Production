'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface OrderData {
  id: number;
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    district: string;
  };
  items: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  finalTotal: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
}

export default function CheckoutSuccess() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (orderId) {
      // Fetch order details by orderId
      fetch(`/api/orders?orderId=${orderId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.orders && data.orders.length > 0) {
            setOrderData(data.orders[0]);
          }
          setLoading(false);
        })
        .catch(err => {
          console.error('Error fetching order:', err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [orderId]);

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '50px' }}>
        <h2>Đang tải thông tin đơn hàng...</h2>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="row">
        <div className="col-8 col-md-12 col-sm-12" style={{ margin: '0 auto' }}>
          <div style={{
            textAlign: 'center',
            marginTop: '40px',
            padding: '40px',
            border: '2px solid #28a745',
            borderRadius: '10px',
            backgroundColor: '#e6ffed',
            color: '#155724'
          }}>
            <h1>🎉 Đặt hàng thành công!</h1>
            <p style={{ fontSize: '18px', marginBottom: '30px' }}>
              Cảm ơn bạn đã mua hàng tại shop của chúng tôi.
            </p>
            
            {orderData && (
              <div style={{ 
                textAlign: 'left', 
                backgroundColor: '#fff', 
                padding: '24px', 
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                margin: '20px 0'
              }}>
                <h3 style={{ color: '#333', marginBottom: '20px' }}>Thông tin đơn hàng #{orderData.id}</h3>
                
                <div style={{ marginBottom: '16px' }}>
                  <strong>Khách hàng:</strong> {orderData.customerInfo.firstName} {orderData.customerInfo.lastName}
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <strong>Email:</strong> {orderData.customerInfo.email}
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <strong>Điện thoại:</strong> {orderData.customerInfo.phone}
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <strong>Địa chỉ giao hàng:</strong> {orderData.customerInfo.address}, {orderData.customerInfo.district}, {orderData.customerInfo.city}
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <strong>Sản phẩm:</strong>
                  <ul style={{ marginTop: '8px' }}>
                    {orderData.items.map((item, index) => (
                      <li key={index} style={{ marginBottom: '4px' }}>
                        {item.name} - Số lượng: {item.quantity} - Giá: {item.price.toLocaleString('vi-VN')} VND
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <strong>Tổng tiền:</strong> <span style={{ color: '#e11d48', fontSize: '18px' }}>{orderData.finalTotal.toLocaleString('vi-VN')} VND</span>
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <strong>Phương thức thanh toán:</strong> {
                    orderData.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng' :
                    orderData.paymentMethod === 'bank' ? 'Chuyển khoản ngân hàng' :
                    orderData.paymentMethod === 'momo' ? 'Ví điện tử Momo' :
                    orderData.paymentMethod === 'card' ? 'Thẻ tín dụng' : orderData.paymentMethod
                  }
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <strong>Trạng thái:</strong> <span style={{ 
                    color: orderData.status === 'pending' ? '#f59e0b' : '#10b981',
                    fontWeight: 'bold'
                  }}>
                    {orderData.status === 'pending' ? 'Đang xử lý' : 
                     orderData.status === 'confirmed' ? 'Đã xác nhận' :
                     orderData.status === 'shipping' ? 'Đang giao hàng' :
                     orderData.status === 'delivered' ? 'Đã giao hàng' : orderData.status}
                  </span>
                </div>
              </div>
            )}
            
            <div style={{ marginTop: '30px' }}>
              <Link href="/profile">
                <button className="btn-brand" style={{
                  padding: '12px 24px',
                  marginRight: '16px',
                  fontSize: '16px'
                }}>
                  Xem lịch sử đơn hàng
                </button>
              </Link>
              
              <Link href="/">
                <button style={{
                  padding: '12px 24px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}>
                  Về trang chủ
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
