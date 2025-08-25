'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts';
import { PageHeader, Button } from '@/app/components/ui';
import { orderService } from '@/services';
import { OrderWithRefs } from '@/types';
import { formatCurrency } from '@/lib/utils';
import OrderInvoice from './OrderInvoice';
import styles from './OrderDetail.module.css';

const ORDER_STATUS_CONFIG = {
  pending: {
    label: 'Chờ xử lý',
    icon: '⏳',
    className: styles.statusPending
  },
  processing: {
    label: 'Đang xử lý',
    icon: '🔄',
    className: styles.statusProcessing
  },
  shipped: {
    label: 'Đang giao hàng',
    icon: '🚚',
    className: styles.statusShipped
  },
  delivered: {
    label: 'Đã giao hàng',
    icon: '✅',
    className: styles.statusDelivered
  },
  cancelled: {
    label: 'Đã hủy',
    icon: '❌',
    className: styles.statusCancelled
  }
};

// Styles for PDF printing
const getInvoiceStyles = () => `
  .invoice {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    font-family: Arial, sans-serif;
    line-height: 1.4;
  }
  
  .invoice-header {
    text-align: center;
    border-bottom: 2px solid #333;
    padding-bottom: 20px;
    margin-bottom: 30px;
  }
  
  .company-name {
    font-size: 28px;
    font-weight: bold;
    color: #333;
    margin-bottom: 5px;
  }
  
  .company-tagline {
    font-size: 14px;
    color: #666;
    margin-bottom: 10px;
  }
  
  .company-contact {
    font-size: 12px;
    color: #666;
  }
  
  .invoice-title {
    font-size: 24px;
    font-weight: bold;
    margin: 20px 0;
    text-align: center;
    color: #333;
  }
  
  .invoice-info {
    display: flex;
    justify-content: space-between;
    margin-bottom: 30px;
  }
  
  .customer-info, .order-info {
    flex: 1;
  }
  
  .customer-info {
    margin-right: 40px;
  }
  
  .info-title {
    font-weight: bold;
    font-size: 16px;
    margin-bottom: 10px;
    color: #333;
  }
  
  .info-row {
    margin-bottom: 5px;
    font-size: 14px;
  }
  
  .label {
    font-weight: bold;
    color: #555;
  }
  
  .items-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 30px;
  }
  
  .items-table thead th {
    background-color: #f5f5f5;
    padding: 12px 8px;
    text-align: left;
    font-weight: bold;
    border-bottom: 2px solid #ddd;
  }
  
  .items-table tbody td {
    padding: 10px 8px;
    border-bottom: 1px solid #eee;
  }
  
  .item-image {
    width: 50px;
    height: 50px;
    object-fit: cover;
    border-radius: 4px;
  }
  
  .item-details {
    font-size: 14px;
  }
  
  .item-name {
    font-weight: bold;
    margin-bottom: 2px;
  }
  
  .item-variant {
    color: #666;
    font-size: 12px;
  }
  
  .text-right {
    text-align: right;
  }
  
  .totals-section {
    margin-left: auto;
    width: 300px;
    margin-bottom: 30px;
  }
  
  .total-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid #eee;
  }
  
  .total-row.final {
    border-top: 2px solid #333;
    border-bottom: 2px solid #333;
    font-weight: bold;
    font-size: 18px;
    margin-top: 10px;
  }
  
  .invoice-footer {
    text-align: center;
    margin-top: 40px;
    padding-top: 20px;
    border-top: 1px solid #ddd;
    font-size: 12px;
    color: #666;
  }
  
  @media print {
    body { print-color-adjust: exact; }
    .invoice { margin: 0; padding: 15px; }
  }
`;

function OrderDetailContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<OrderWithRefs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [hasRefreshedFromPayment, setHasRefreshedFromPayment] = useState(false);

  const fetchOrderDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching order detail for ID:', orderId);
      const orderData = await orderService.getOrderById(orderId);
      console.log('✅ Order data received:', orderData);
      setOrder(orderData);
    } catch (err: any) {
      console.error('❌ Error fetching order detail:', err);
      setError(err.message || 'Có lỗi xảy ra khi tải đơn hàng');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    console.log('🔍 Auth state:', { user: !!user, authLoading, isAuthenticated, orderId });
    
    if (authLoading) {
      console.log('⏳ Auth still loading...');
      return; // Wait for auth to load
    }
    
    if (orderId) {
      console.log('✅ Proceeding to fetch order');
      fetchOrderDetail();
    }
  }, [orderId, authLoading, fetchOrderDetail]);

  // Force refresh order data when coming from payment success - only once
  useEffect(() => {
    const fromPayment = searchParams.get('fromPayment');
    const refresh = searchParams.get('refresh');
    
    if ((fromPayment === 'true' || refresh === 'true') && orderId && !hasRefreshedFromPayment) {
      console.log('🔄 Force refreshing order data after payment');
      setHasRefreshedFromPayment(true);
      
      // Clear the query parameters to prevent further refreshes
      const url = new URL(window.location.href);
      url.searchParams.delete('fromPayment');
      url.searchParams.delete('refresh');
      router.replace(url.pathname + url.search, { scroll: false });
      
      // Small delay to ensure VNPay callback has completed
      setTimeout(() => {
        fetchOrderDetail();
      }, 1000);
    }
  }, [searchParams, orderId, hasRefreshedFromPayment, fetchOrderDetail, router]);

  const handleCancelOrder = async () => {
    if (!order || !window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) {
      return;
    }

    try {
      await orderService.cancelOrder(order._id);
      // Refresh order data
      fetchOrderDetail();
    } catch (err: any) {
      console.error('Error cancelling order:', err);
      alert('Không thể hủy đơn hàng: ' + (err.message || 'Có lỗi xảy ra'));
    }
  };

  const handlePrint = () => {
    setShowInvoice(true);
    // Wait for invoice to render, then print
    setTimeout(() => {
      const invoiceElement = document.getElementById('order-invoice');
      if (invoiceElement) {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>Hóa đơn #${order?.orderCode}</title>
                <style>
                  * { margin: 0; padding: 0; box-sizing: border-box; }
                  body { font-family: Arial, sans-serif; }
                  ${getInvoiceStyles()}
                </style>
              </head>
              <body>
                ${invoiceElement.outerHTML}
              </body>
            </html>
          `);
          printWindow.document.close();
          printWindow.print();
          printWindow.close();
        }
      }
      setShowInvoice(false);
    }, 100);
  };

  const getInvoiceStyles = () => {
    // Professional black & white invoice styles for paper printing
    return `
      @page { 
        size: A4; 
        margin: 15mm; 
      }
      
      * { 
        margin: 0; 
        padding: 0; 
        box-sizing: border-box; 
      }
      
      body { 
        font-family: 'Times New Roman', Times, serif; 
        font-size: 11pt; 
        line-height: 1.4; 
        color: #000; 
        background: white;
      }
      
      .invoice { 
        max-width: 210mm; 
        margin: 0 auto; 
        padding: 0; 
        background: white;
      }
      
      /* Header Section */
      .header { 
        display: flex; 
        justify-content: space-between; 
        align-items: flex-start;
        margin-bottom: 20pt; 
        padding-bottom: 15pt; 
        border-bottom: 2pt solid #000; 
      }
      
      .logo h1 { 
        font-size: 24pt; 
        font-weight: bold; 
        letter-spacing: 2pt; 
        margin-bottom: 5pt;
        text-transform: uppercase;
      }
      
      .logo p { 
        font-size: 10pt; 
        font-style: italic; 
        margin-bottom: 2pt;
      }
      
      .companyInfo p {
        font-size: 9pt;
        margin: 1pt 0;
      }
      
      .invoiceInfo { 
        text-align: right; 
        border: 1pt solid #000;
        padding: 10pt;
        background: #f9f9f9;
      }
      
      .invoiceInfo h2 { 
        font-size: 18pt; 
        font-weight: bold; 
        margin-bottom: 8pt;
        text-transform: uppercase;
        letter-spacing: 1pt;
      }
      
      .invoiceInfo p {
        font-size: 10pt;
        margin: 2pt 0;
      }
      
      /* Customer Section */
      .customerSection { 
        display: grid; 
        grid-template-columns: 1fr 1fr; 
        gap: 30pt; 
        margin-bottom: 20pt; 
      }
      
      .customerInfo, .shippingInfo { 
        border: 1pt solid #000;
        padding: 10pt;
      }
      
      .customerInfo h3, .shippingInfo h3 { 
        font-size: 12pt; 
        font-weight: bold;
        margin-bottom: 8pt; 
        text-transform: uppercase;
        border-bottom: 1pt solid #000;
        padding-bottom: 3pt;
      }
      
      .customerInfo p, .shippingInfo p {
        font-size: 10pt;
        margin: 2pt 0;
      }
      
      /* Items Table */
      .itemsTable { 
        width: 100%; 
        border-collapse: collapse; 
        margin-bottom: 20pt; 
        border: 1pt solid #000;
      }
      
      .itemsTable th { 
        background: #000; 
        color: white; 
        padding: 8pt; 
        font-weight: bold; 
        text-align: left;
        font-size: 10pt;
        text-transform: uppercase;
      }
      
      .itemsTable th:last-child,
      .itemsTable td:last-child { 
        text-align: right; 
      }
      
      .itemsTable td { 
        padding: 6pt 8pt; 
        border-bottom: 1pt solid #ccc; 
        font-size: 10pt;
      }
      
      .itemsTable tbody tr:nth-child(even) {
        background: #f9f9f9;
      }
      
      .item-name {
        font-weight: bold;
        margin-bottom: 2pt;
      }
      
      .item-variant {
        font-size: 9pt;
        color: #666;
        font-style: italic;
      }
      
      /* Summary Section */
      .summarySection { 
        display: flex; 
        justify-content: flex-end; 
        margin-bottom: 20pt; 
      }
      
      .summaryTable { 
        min-width: 200pt; 
        border: 1pt solid #000;
      }
      
      .summaryRow { 
        display: flex; 
        justify-content: space-between; 
        padding: 5pt 10pt; 
        border-bottom: 1pt solid #ccc; 
        font-size: 10pt;
      }
      
      .summaryRow:last-child {
        border-bottom: none;
      }
      
      .summaryRow.subtotal {
        background: #f9f9f9;
      }
      
      .summaryRow.discount {
        background: #f9f9f9;
        font-style: italic;
      }
      
      .summaryRow.shipping {
        background: #f9f9f9;
      }
      
      .summaryRow.total { 
        background: #000;
        color: white;
        font-weight: bold; 
        font-size: 12pt;
        border-top: 2pt solid #000;
      }
      
      /* Payment & Status Info */
      .paymentSection {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20pt;
        margin-bottom: 20pt;
      }
      
      .paymentInfo, .statusInfo {
        border: 1pt solid #000;
        padding: 10pt;
      }
      
      .paymentInfo h4, .statusInfo h4 {
        font-size: 11pt;
        font-weight: bold;
        margin-bottom: 5pt;
        text-transform: uppercase;
        border-bottom: 1pt solid #000;
        padding-bottom: 2pt;
      }
      
      .paymentInfo p, .statusInfo p {
        font-size: 10pt;
        margin: 2pt 0;
      }
      
      /* Footer */
      .footer { 
        border-top: 2pt solid #000;
        padding-top: 15pt;
        margin-top: 20pt;
      }
      
      .footerContent {
        display: grid; 
        grid-template-columns: repeat(2, 1fr); 
        gap: 20pt; 
      }
      
      .footerSection h4 { 
        font-size: 10pt; 
        font-weight: bold;
        margin-bottom: 5pt;
        text-transform: uppercase;
      }
      
      .footerSection p { 
        font-size: 9pt; 
        margin: 1pt 0;
      }
      
      .thankYou { 
        text-align: center; 
        margin-top: 15pt;
        padding: 10pt;
        border: 1pt solid #000;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 1pt;
      }
      
      /* Signature Section */
      .signatureSection {
        display: flex;
        justify-content: space-between;
        margin-top: 30pt;
        padding-top: 20pt;
        border-top: 1pt solid #000;
      }
      
      .signature {
        text-align: center;
        width: 150pt;
      }
      
      .signature p {
        font-size: 10pt;
        margin-bottom: 30pt;
        font-weight: bold;
      }
      
      .signature .signLine {
        border-bottom: 1pt solid #000;
        margin-bottom: 5pt;
      }
      
      .signature .signLabel {
        font-size: 9pt;
        font-style: italic;
      }
      
      /* Print Specific */
      @media print {
        body { 
          print-color-adjust: exact; 
          -webkit-print-color-adjust: exact;
        }
        
        .invoice { 
          margin: 0; 
          padding: 0; 
          box-shadow: none;
        }
        
        .header, .footer {
          break-inside: avoid;
        }
        
        .itemsTable {
          break-inside: auto;
        }
        
        .summarySection {
          break-inside: avoid;
        }
      }
    `;
  };

  const getStatusConfig = (status: string) => {
    return ORDER_STATUS_CONFIG[status as keyof typeof ORDER_STATUS_CONFIG] || {
      label: status,
      icon: '❓',
      className: styles.statusPending
    };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canCancelOrder = (status: string) => {
    return ['pending', 'processing'].includes(status);
  };

  if (authLoading || loading) {
    return (
      <div className="container">
        <div className={styles.pageContainer}>
          <PageHeader
            title="Chi tiết đơn hàng"
            breadcrumbs={[
              { label: 'Trang chủ', href: '/' },
              { label: 'Đơn hàng', href: '/orders' },
              { label: 'Chi tiết', href: '' }
            ]}
          />
          
          <div className={styles.mainContent}>
            <div className={styles.loadingSection}>
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Đang tải...</span>
              </div>
              <p>{authLoading ? 'Đang xác thực...' : 'Đang tải thông tin đơn hàng...'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || (!loading && !order)) {
    console.log('🚨 Showing error state:', { error, loading, order: !!order });
    return (
      <div className="container">
        <div className={styles.pageContainer}>
          <PageHeader
            title="Chi tiết đơn hàng"
            breadcrumbs={[
              { label: 'Trang chủ', href: '/' },
              { label: 'Đơn hàng', href: '/orders' },
              { label: 'Chi tiết', href: '' }
            ]}
          />
          
          <div className={styles.mainContent}>
            <div className={styles.errorState}>
              <div className={styles.errorIcon}>📋</div>
              <h2>Không tìm thấy đơn hàng</h2>
              <p>{error || 'Đơn hàng không tồn tại hoặc bạn không có quyền truy cập'}</p>
              <Button
                variant="primary"
                size="lg"
                onClick={() => router.push('/orders')}
              >
                Quay lại danh sách đơn hàng
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(order?.status || 'pending');

  console.log('🎯 About to render order detail:', { order: !!order, orderCode: order?.orderCode });

  return (
    <div className="container">
      <div className={styles.pageContainer}>
        <PageHeader
          title="Chi tiết đơn hàng"
          breadcrumbs={[
            { label: 'Trang chủ', href: '/' },
            { label: 'Đơn hàng', href: '/orders' },
            { label: order?.orderCode || 'Chi tiết', href: '' }
          ]}
        />

        <div className={styles.mainContent}>
          {!order ? (
            <div className={styles.errorState}>
              <div className={styles.errorIcon}>📋</div>
              <h2>Đang tải dữ liệu...</h2>
              <p>Vui lòng chờ trong giây lát</p>
            </div>
          ) : (
            <>
          {/* Order Header */}
          <div className={styles.orderHeader}>
            <div className={styles.orderHeaderTop}>
              <div className={styles.orderInfo}>
                <h1 className={styles.orderCode}>#{order.orderCode}</h1>
                <div className={styles.orderDate}>
                  <span>📅</span>
                  <span>Đặt hàng lúc: {formatDate(order.createdAt)}</span>
                </div>
              </div>
              
              <div className={styles.orderActions}>
                <div className={`${styles.orderStatus} ${statusConfig.className}`}>
                  <span className={styles.statusIcon}>{statusConfig.icon}</span>
                  <span>{statusConfig.label}</span>
                </div>
                
                {/* Refresh button - especially useful after VNPay payment */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchOrderDetail}
                  disabled={loading}
                  className={styles.refreshButton}
                >
                  🔄 Cập nhật
                </Button>
                
                {canCancelOrder(order.status) && (
                  <Button
                    variant="outline"
                    size="md"
                    onClick={handleCancelOrder}
                    className={styles.cancelButton}
                  >
                    Hủy đơn hàng
                  </Button>
                )}
                
                {/* Print Invoice button - creates PDF in new window */}
                <Button
                  variant="outline"
                  size="md"
                  onClick={handlePrint}
                  className={styles.printButton}
                >
                  🖨️ In đơn hàng
                </Button>
              </div>
            </div>

            <div className={styles.orderMeta}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Tổng tiền</span>
                <span className={`${styles.metaValue} ${styles.orderTotal}`}>
                  {formatCurrency(order.finalTotal || 0)}
                </span>
              </div>
              
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Phương thức thanh toán</span>
                <span className={styles.metaValue}>
                  {order.paymentMethod?.method || 'Chưa xác định'}
                </span>
              </div>
              
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Số lượng sản phẩm</span>
                <span className={styles.metaValue}>
                  {order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0} sản phẩm
                </span>
              </div>
            </div>
          </div>

          <div className={styles.contentGrid}>
            {/* Order Items */}
            <div className={styles.orderItemsSection}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>
                  <span className={styles.sectionIcon}>📦</span>
                  Sản phẩm đã đặt
                </h3>
              </div>
              
              <div className={styles.orderItemsList}>
                {order.items?.map((item, index) => (
                  <div key={index} className={styles.orderItem}>
                    <div className={styles.itemImage}>
                      {item.productVariant?.product?.images?.[0] ? (
                        <img
                          src={item.productVariant.product.images[0]}
                          alt={item.productVariant.product.name}
                        />
                      ) : (
                        <span>📷</span>
                      )}
                    </div>
                    
                    <div className={styles.itemDetails}>
                      <h4 className={styles.itemName}>
                        {item.productVariant?.product?.name || 'Sản phẩm không xác định'}
                      </h4>
                      <div className={styles.itemVariant}>
                        Màu: {item.productVariant?.color?.name || 'N/A'} • 
                        Size: {item.productVariant?.size?.name || 'N/A'}
                      </div>
                      <div className={styles.itemPrice}>
                        {formatCurrency(item.price)} / sản phẩm
                      </div>
                    </div>
                    
                    <div className={styles.itemQuantity}>
                      x{item.quantity}
                    </div>
                    
                    <div className={styles.itemTotal}>
                      {formatCurrency(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div className={styles.sidebar}>
              {/* Shipping Address */}
              <div className={styles.sidebarCard}>
                <div className={styles.sectionHeader}>
                  <h3 className={styles.sectionTitle}>
                    <span className={styles.sectionIcon}>🏠</span>
                    Địa chỉ giao hàng
                  </h3>
                </div>
                
                <div className={styles.cardContent}>
                  <div className={styles.addressInfo}>
                    <div className={styles.addressLine}>
                      <span className={styles.addressLabel}>Người nhận:</span>
                      <span className={styles.addressValue}>
                        {order.address?.fullName || 'N/A'}
                      </span>
                    </div>
                    
                    <div className={styles.addressLine}>
                      <span className={styles.addressLabel}>Số điện thoại:</span>
                      <span className={styles.addressValue}>
                        {order.address?.phone || 'N/A'}
                      </span>
                    </div>
                    
                    <div className={styles.fullAddress}>
                      <p>
                        {order.address?.addressLine && (
                          <>
                            {order.address.addressLine}
                            <br />
                          </>
                        )}
                        {order.address?.ward && `${order.address.ward}, `}
                        {order.address?.district && `${order.address.district}, `}
                        {order.address?.city}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className={styles.sidebarCard}>
                <div className={styles.sectionHeader}>
                  <h3 className={styles.sectionTitle}>
                    <span className={styles.sectionIcon}>💳</span>
                    Thanh toán
                  </h3>
                </div>
                
                <div className={styles.cardContent}>
                  <div className={styles.paymentMethod}>
                    <div className={styles.paymentIcon}>💰</div>
                    <div className={styles.paymentDetails}>
                      <h4>{order.paymentMethod?.method || 'Thanh toán khi nhận hàng'}</h4>
                      <p className={
                        order.paymentStatus === 'paid' ? styles.paymentPaid : 
                        order.paymentStatus === 'failed' ? styles.paymentFailed :
                        styles.paymentPending
                      }>
                        Trạng thái: {
                          order.paymentStatus === 'paid' ? 'Đã thanh toán' : 
                          order.paymentStatus === 'pending' ? 'Chờ thanh toán' : 
                          order.paymentStatus === 'failed' ? 'Thanh toán thất bại' :
                          'Chưa thanh toán'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className={styles.sidebarCard}>
                <div className={styles.sectionHeader}>
                  <h3 className={styles.sectionTitle}>
                    <span className={styles.sectionIcon}>💰</span>
                    Tổng kết đơn hàng
                  </h3>
                </div>
                
                <div className={styles.cardContent}>
                  <div className={styles.orderSummary}>
                    <div className={styles.summaryLine}>
                      <span className={styles.summaryLabel}>Tạm tính:</span>
                      <span className={styles.summaryValue}>
                        {formatCurrency(order.total || 0)}
                      </span>
                    </div>
                    
                    {order.discountAmount > 0 && (
                      <div className={styles.summaryLine}>
                        <span className={styles.summaryLabel}>
                          Giảm giá {order.voucher?.code ? `(${order.voucher.code})` : ''}:
                        </span>
                        <span className={`${styles.summaryValue} ${styles.discount}`}>
                          -{formatCurrency(order.discountAmount)}
                        </span>
                      </div>
                    )}
                    
                    <div className={styles.summaryLine}>
                      <span className={styles.summaryLabel}>Phí vận chuyển:</span>
                      <span className={styles.summaryValue}>
                        {formatCurrency(order.shippingFee || 0)}
                      </span>
                    </div>
                    
                    <div className={`${styles.summaryLine} ${styles.summaryTotal}`}>
                      <span className={styles.summaryLabel}>Tổng cộng:</span>
                      <span className={styles.summaryValue}>
                        {formatCurrency(order.finalTotal || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
            </>
          )}
        </div>
        
        {/* Hidden Invoice for Printing */}
        {showInvoice && order && (
          <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
            <OrderInvoice order={order} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrderDetailPage() {
  return (
    <Suspense fallback={
      <div className="container">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '400px',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{ fontSize: '1.2rem', color: '#666' }}>Đang tải chi tiết đơn hàng...</div>
        </div>
      </div>
    }>
      <OrderDetailContent />
    </Suspense>
  );
}