"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../contexts/AuthContext";
import { useAdminOrders } from "../../../hooks/useAdminOrders";
import { OrderWithRefs } from "../../../types";
import OrderDetailModal from "../../../components/OrderDetailModal";
import OrderInvoice from "../../orders/[id]/OrderInvoice";
import styles from "./order-admin.module.css";

export default function AdminOrdersPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const {
    loading,
    error,
    getOrders,
    updateOrderStatus,
    getOrderStatistics,
    clearError
  } = useAdminOrders();
  
  const [orders, setOrders] = useState<OrderWithRefs[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [ordersPerPage] = useState(10);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [statistics, setStatistics] = useState<any>(null);
  const [isLoadingStatistics, setIsLoadingStatistics] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<string>('');
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [showPageInput, setShowPageInput] = useState(false);
  const [pageInputValue, setPageInputValue] = useState('');
  const [showInvoice, setShowInvoice] = useState(false);
  const [printOrder, setPrintOrder] = useState<OrderWithRefs | null>(null);

  // Business logic for status transitions  
  const getValidStatusTransitions = (currentStatus: string): string[] => {
    // ENHANCED ADMIN CONTROL - Match backend logic exactly
    const statusFlow = {
      'pending': ['pending', 'processing', 'cancelled'],
      'processing': ['processing', 'shipped', 'delivered', 'cancelled'], 
      'shipped': ['shipped', 'delivered', 'cancelled'], // Can cancel if customer doesn't receive (return)
      'delivered': ['delivered'], // Final state - no changes allowed
      'cancelled': ['cancelled'] // Final state - no changes allowed
    };
    
    return statusFlow[currentStatus] || [currentStatus];
  };

  // Check if cancellation is allowed - Updated logic
  const canCancelOrder = (currentStatus: string): boolean => {
    return ['pending', 'processing'].includes(currentStatus);
  };

  // NEW: Check if payment status can be changed manually
  const canChangePaymentStatus = (order: OrderWithRefs): boolean => {
    const paymentMethod = order.paymentMethod?.method || order.paymentMethod || '';
    const digitalMethods = ['VNPay', 'Momo', 'vnpay', 'momo'];
    
    // Không cho phép thay đổi payment status cho VNPay/Momo
    if (digitalMethods.includes(paymentMethod)) {
      return false;
    }
    
    // Không cho phép thay đổi payment status cho đơn hàng đã hủy
    if (order.status === 'cancelled') {
      return false;
    }
    
    // Không cho phép thay đổi payment status cho COD đã giao (chỉ delivered, shipped vẫn có thể cancel nếu không nhận)
    const isCOD = paymentMethod.toLowerCase() === 'cod' || paymentMethod.toLowerCase() === 'tiền mặt';
    const isDelivered = order.status === 'delivered';
    
    if (isCOD && isDelivered) {
      return false;
    }
    
    return true;
  };

  // Check auth token on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAuthToken(localStorage.getItem('authToken'));
    }
  }, []);

  useEffect(() => {
    // Đợi AuthContext load xong trước khi kiểm tra
    if (isLoading) return;
    
    if (!user || user.role !== "admin") {
      router.replace("/login");
      return;
    }
    
    console.log('[DEBUG] 🚀 Initial load - fetchStatistics and fetchOrders');
    fetchStatistics();
    // Initial load of orders
    fetchOrders();
  }, [user, router, isLoading]);

  // Separate useEffect for orders with debouncing
  useEffect(() => {
    if (isLoading || !user || user.role !== "admin") return;
    
    // Debounce search and filter changes, but not page changes
    if (searchTerm || filterStatus !== 'all' || filterPaymentStatus !== 'all' || sortBy !== 'createdAt' || sortOrder !== 'desc') {
      const timeoutId = setTimeout(() => {
        if (currentPage !== 1) {
          setCurrentPage(1); // Reset to first page only when filters change
        } else {
          fetchOrders();
        }
      }, searchTerm ? 500 : 0); // 500ms delay for search, immediate for other filters

      return () => clearTimeout(timeoutId);
    } else {
      // No filters, fetch immediately
      fetchOrders();
    }
  }, [filterStatus, filterPaymentStatus, searchTerm, sortBy, sortOrder]);

  // Separate useEffect for page changes
  useEffect(() => {
    if (isLoading || !user || user.role !== "admin") return;
    fetchOrders();
  }, [currentPage]);

  const fetchOrders = async () => {
    try {
      setIsLoadingOrders(true);
      clearError();
      const filters = {
        page: currentPage,
        limit: ordersPerPage,
        search: searchTerm || undefined,
        status: filterStatus !== 'all' ? filterStatus as any : undefined,
        paymentStatus: filterPaymentStatus !== 'all' ? filterPaymentStatus as any : undefined,
        sortBy,
        sortOrder
      };
      console.log('[DEBUG] 🔄 Gửi request getOrders với filters:', filters);
      console.log('[DEBUG] � Search term details:', { 
        searchTerm, 
        searchTermLength: searchTerm?.length, 
        searchTermType: typeof searchTerm,
        searchInFilters: filters.search 
      });
      console.log('[DEBUG] �🔄 Current state:', { currentPage, ordersPerPage, searchTerm, filterStatus });
      
      const response = await getOrders(filters);
      console.log('[DEBUG] 📦 Kết quả response từ getOrders:', response);
      console.log('[DEBUG] 📦 Response structure:', {
        hasData: !!response?.data,
        dataLength: response?.data?.length,
        hasPagination: !!response?.pagination,
        pagination: response?.pagination
      });
      
      // Ensure we have valid data structure
      const ordersData = response?.data || [];
      console.log('[DEBUG] 📋 Orders data:', ordersData);
      console.log('[DEBUG] 📋 Orders data length:', ordersData.length);
      
      // Debug first order's items structure
      if (ordersData.length > 0) {
        const firstOrder = ordersData[0];
        console.log('[DEBUG] 🔍 First order:', firstOrder);
        console.log('[DEBUG] 🔍 First order items:', firstOrder?.items);
        if (firstOrder?.items?.length > 0) {
          console.log('[DEBUG] 🔍 First item:', firstOrder.items[0]);
          console.log('[DEBUG] 🔍 First item productVariant:', firstOrder.items[0]?.productVariant);
          console.log('[DEBUG] 🔍 Product:', firstOrder.items[0]?.productVariant?.product);
          console.log('[DEBUG] 🔍 Color:', firstOrder.items[0]?.productVariant?.color);
          console.log('[DEBUG] 🔍 Size:', firstOrder.items[0]?.productVariant?.size);
        }
      }
      
      if (Array.isArray(ordersData)) {
        setOrders(ordersData);
        console.log('[DEBUG] ✅ Orders state updated with:', ordersData.length, 'orders');
      } else {
        console.log('[DEBUG] ❌ Orders data is not an array:', typeof ordersData);
        setOrders([]);
      }
      
      // Backend trả về pagination ở top level, không phải nested trong pagination object
      setTotalPages(response?.totalPages || 1);
      setTotalOrders(response?.total || ordersData.length);
      console.log('[DEBUG] 📊 Pagination info updated:', {
        currentPage,
        totalPages: response?.totalPages || 1,
        totalOrders: response?.total || ordersData.length,
        ordersPerPage,
        backendResponse: response
      });
    } catch (err: any) {
      console.error('[DEBUG] ❌ Error fetching orders:', err);
      console.error('[DEBUG] ❌ Error details:', {
        message: err?.message,
        stack: err?.stack,
        response: err?.response
      });
      setOrders([]);
      setTotalPages(1);
      setTotalOrders(0);
    } finally {
      setIsLoadingOrders(false);
      console.log('[DEBUG] 🏁 fetchOrders completed');
    }
  };

  const fetchStatistics = async () => {
    try {
      setIsLoadingStatistics(true);
      console.log('[DEBUG] 📊 Fetching statistics...');
      const stats = await getOrderStatistics();
      console.log('[DEBUG] 📊 Statistics received:', stats);
      setStatistics(stats);
      setUpdateMessage('✅ Thống kê toàn hệ thống đã được tải thành công!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setUpdateMessage(''), 3000);
    } catch (err: any) {
      console.error('[DEBUG] ❌ Error fetching statistics:', err);
      console.error('Error fetching statistics:', err);
      setUpdateMessage('⚠️ Không thể tải thống kê toàn hệ thống. Đang sử dụng dữ liệu trang hiện tại.');
      
      // Clear error message after 5 seconds
      setTimeout(() => setUpdateMessage(''), 5000);
    } finally {
      setIsLoadingStatistics(false);
    }
  };

  const testAPIConnection = async () => {
    try {
      console.log('[DEBUG] 🧪 Testing API connection...');
      const testResponse = await fetch('http://localhost:5000/api/orders/admin/all?page=1&limit=5', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('[DEBUG] 🧪 Test response status:', testResponse.status);
      const testData = await testResponse.text();
      console.log('[DEBUG] 🧪 Test response data:', testData);
    } catch (err) {
      console.error('[DEBUG] 🧪 Test API error:', err);
    }
  };

  // Calculate real-time statistics from current orders
  const calculateStatistics = () => {
    // Use statistics from API if available, otherwise calculate from current page
    if (statistics) {
      const summary = statistics.summary || {};
      const ordersByStatus = statistics.ordersByStatus || {};
      
      return {
        totalOrders: summary.totalOrders || 0,
        totalRevenue: summary.totalRevenue || 0,
        pendingOrders: ordersByStatus.pending || 0,
        completedOrders: ordersByStatus.delivered || 0
      };
    }

    // Fallback: calculate from current page orders (not ideal but better than nothing)
    const currentOrders = orders || [];
    
    const totalRevenue = currentOrders.reduce((sum, order) => {
      // Chỉ tính revenue từ các đơn hàng đã thanh toán (paymentStatus: 'paid')
      const paymentStatus = (order.paymentStatus || '').toLowerCase();
      const isPaid = paymentStatus === 'paid';
      
      if (isPaid) {
        const orderTotal = order.finalTotal || 
          ((order.items || []).reduce((itemSum, item) => itemSum + (item?.totalPrice || 0), 0) 
           - (order.discountAmount || 0) + (order.shippingFee || 0));
        return sum + orderTotal;
      }
      
      return sum;
    }, 0);

    const pendingCount = currentOrders.filter(order => 
      ['pending', 'processing'].includes(order.status?.toLowerCase())
    ).length;

    const completedCount = currentOrders.filter(order => 
      ['delivered', 'shipped'].includes(order.status?.toLowerCase())
    ).length;

    return {
      totalOrders: totalOrders || currentOrders.length,
      totalRevenue,
      pendingOrders: pendingCount,
      completedOrders: completedCount
    };
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage && !isLoadingOrders) {
      console.log('[DEBUG] Chuyển đến trang:', page);
      setCurrentPage(page);
    }
  };

  const handlePageIndicatorClick = () => {
    setShowPageInput(true);
    setPageInputValue(currentPage.toString());
  };

  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetPage = parseInt(pageInputValue);
    if (!isNaN(targetPage) && targetPage >= 1 && targetPage <= totalPages && targetPage !== currentPage) {
      goToPage(targetPage);
    }
    setShowPageInput(false);
    setPageInputValue('');
  };

  const handlePageInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowPageInput(false);
      setPageInputValue('');
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handlePageInputSubmit(e as any);
    }
  };

  const handlePageInputBlur = () => {
    setTimeout(() => {
      setShowPageInput(false);
      setPageInputValue('');
    }, 150); // Small delay to allow form submission
  };

  const handleSearchChange = (value: string) => {
    console.log('[DEBUG] 🔍 Search change:', { 
      oldValue: searchTerm, 
      newValue: value, 
      currentPage 
    });
    setSearchTerm(value);
    if (currentPage !== 1) {
      console.log('[DEBUG] 🔍 Resetting page to 1 due to search change');
      setCurrentPage(1);
    }
  };

  const handleFilterChange = (value: string) => {
    setFilterStatus(value);
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  };

  const handlePaymentStatusFilterChange = (value: string) => {
    setFilterPaymentStatus(value);
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  };

  const handleSortChange = (value: string) => {
    const [newSortBy, newSortOrder] = value.split('-');
    setSortBy(newSortBy);
    setSortOrder(newSortOrder as 'asc' | 'desc');
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  };

  // Filter orders based on status and search term (chỉ dùng để hiển thị, không filter vì đã có pagination từ server)
  const filteredOrders = orders || [];

  // Status mapping for display
  const getStatusDisplay = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      pending: { label: 'Chờ xử lý', color: 'var(--color-accent, #F59E0B)' },
      processing: { label: 'Đang xử lý', color: 'var(--color-info, #06B6D4)' },
      shipped: { label: 'Đã gửi hàng', color: 'var(--color-purple, #8B5CF6)' },
      delivered: { label: 'Đã giao', color: 'var(--color-success, #10B981)' },
      cancelled: { label: 'Đã hủy', color: 'var(--color-error, #DC2626)' }
    };
    return statusMap[status] || { label: status, color: 'var(--color-muted, #9CA3AF)' };
  };

  // Payment Status mapping for display
  const getPaymentStatusDisplay = (paymentStatus: string) => {
    const paymentStatusMap: Record<string, { label: string; color: string }> = {
      pending: { label: 'Chờ thanh toán', color: 'var(--color-accent, #F59E0B)' },
      paid: { label: 'Đã thanh toán', color: 'var(--color-success, #10B981)' },
      failed: { label: 'Thanh toán thất bại', color: 'var(--color-error, #DC2626)' },
      cancelled: { label: 'Đã hủy thanh toán', color: 'var(--color-muted, #9CA3AF)' }
    };
    return paymentStatusMap[paymentStatus] || { label: paymentStatus, color: 'var(--color-muted, #9CA3AF)' };
  };

  // Table columns configuration
  const columns = [
    {
      key: 'orderCode',
      title: 'Mã đơn hàng',
      render: (value: string, order: OrderWithRefs) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-sm" style={{ color: 'var(--color-muted, #9CA3AF)' }}>
            {new Date(order.createdAt).toLocaleDateString('vi-VN')}
          </div>
        </div>
      )
    },
    {
      key: 'user',
      title: 'Khách hàng',
      render: (value: any, order: OrderWithRefs) => (
        <div>
          <div className="font-medium">{order.user?.name || 'N/A'}</div>
          <div className="text-sm" style={{ color: 'var(--color-muted, #9CA3AF)' }}>
            {order.user?.email || 'N/A'}
          </div>
        </div>
      )
    },
    {
      key: 'items',
      title: 'Sản phẩm',
      render: (value: any, order: OrderWithRefs) => (
        <div className="text-sm">
          {(order.items || []).length} sản phẩm
        </div>
      )
    },
    {
      key: 'totalAmount',
      title: 'Tổng tiền',
      align: 'right' as const,
      render: (value: number, order: OrderWithRefs) => {
        // Calculate total from finalTotal if available, or from discountAmount + shippingFee
        const total = order.finalTotal || ((order.items || []).reduce((sum, item) => sum + (item?.totalPrice || 0), 0) - (order.discountAmount || 0) + (order.shippingFee || 0));
        return (
          <div className="font-medium" style={{ color: 'var(--color-primary, #1E40AF)' }}>
            {total.toLocaleString('vi-VN')}đ
          </div>
        );
      }
    },
    {
      key: 'status',
      title: 'Trạng thái',
      align: 'center' as const,
      render: (value: string) => {
        const statusInfo = getStatusDisplay(value);
        return (
          <span 
            className="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
            style={{ 
              backgroundColor: statusInfo.color,
              color: '#FFFFFF'
            }}
          >
            {statusInfo.label}
          </span>
        );
      }
    },
    {
      key: 'actions',
      title: 'Thao tác',
      align: 'right' as const,
      render: (_: any, order: OrderWithRefs) => (
        <div className="flex items-center justify-end space-x-2">
          <select
            value={order.status}
            onChange={(e) => handleStatusChange(order._id, e.target.value)}
            className="text-xs px-2 py-1 border rounded focus:outline-none focus:ring-1"
            style={{
              borderColor: '#D1D5DB',
              '--tw-ring-color': 'var(--color-primary, #1E40AF)'
            } as React.CSSProperties}
          >
            {/* Show current status first */}
            <option value={order.status}>
              {order.status === 'pending' && 'Chờ xử lý'}
              {order.status === 'processing' && 'Đang xử lý'}
              {order.status === 'shipped' && 'Đã gửi hàng'}
              {order.status === 'delivered' && 'Đã giao'}
              {order.status === 'cancelled' && 'Đã hủy'}
            </option>
            
            {/* Show only valid transitions */}
            {getValidStatusTransitions(order.status).filter(status => status !== order.status).map(status => (
              <option key={status} value={status}>
                {status === 'pending' && 'Chờ xử lý'}
                {status === 'processing' && 'Đang xử lý'}
                {status === 'shipped' && 'Đã gửi hàng'}
                {status === 'delivered' && 'Đã giao'}
                {status === 'cancelled' && 'Đã hủy'}
              </option>
            ))}
          </select>
          <button
            onClick={() => handleViewDetails(order)}
            className="p-1 text-sm rounded hover:scale-105 transition-transform duration-200"
            style={{ color: 'var(--color-primary, #1E40AF)' }}
            title="Xem chi tiết"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
          <button
            onClick={() => handlePrint(order)}
            className="p-1 text-sm rounded hover:scale-105 transition-transform duration-200 ml-1"
            style={{ color: 'var(--color-primary, #1E40AF)' }}
            title="In đơn hàng"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
          </button>
        </div>
      )
    }
  ];

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      console.log('[DEBUG] 🔄 Starting order status update...');
      console.log('[DEBUG] 📋 Update details:', { orderId, newStatus });
      setUpdateMessage(''); // Clear previous message
      
      // Find the order to check current status
      const order = orders.find(o => o._id === orderId);
      if (!order) {
        throw new Error('Không tìm thấy đơn hàng');
      }
      
      // Frontend validation: Check if transition is allowed
      const validTransitions = getValidStatusTransitions(order.status);
      if (!validTransitions.includes(newStatus)) {
        let errorMessage = '';
        if (newStatus === 'cancelled' && !canCancelOrder(order.status)) {
          errorMessage = 'Chỉ có thể hủy đơn hàng ở trạng thái chờ xử lý hoặc đang xử lý';
        } else if (order.status === 'cancelled') {
          errorMessage = 'Không thể thay đổi trạng thái đơn hàng đã hủy';
        } else {
          errorMessage = `Không thể chuyển trạng thái từ '${order.status}' sang '${newStatus}'`;
        }
        setUpdateMessage(`❌ ${errorMessage}`);
        setTimeout(() => setUpdateMessage(''), 5000);
        return;
      }
      
      // Check authentication status first
      const token = localStorage.getItem('authToken');
      console.log('[DEBUG] 🔐 Auth token exists:', !!token);
      console.log('[DEBUG] 🔐 Auth token preview:', token ? `${token.substring(0, 20)}...` : 'null');
      console.log('[DEBUG] 👤 Current user:', user);
      console.log('[DEBUG] 👤 User role:', user?.role);
      
      if (!token) {
        throw new Error('Không có token xác thực - Vui lòng đăng nhập lại');
      }
      
      // Test API connection first
      console.log('[DEBUG] 🧪 Testing API connection before update...');
      const testResponse = await fetch('http://localhost:5000/api/orders/admin/all?page=1&limit=1', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('[DEBUG] 🧪 Test connection status:', testResponse.status);
      
      if (!testResponse.ok) {
        console.log('[DEBUG] 🧪 Test connection failed, response:', await testResponse.text());
        throw new Error(`API không khả dụng (Status: ${testResponse.status})`);
      }
      
      // Check if backend is accessible first
      console.log('[DEBUG] 🚀 Calling updateOrderStatus API...');
      console.log('[DEBUG] 🚀 API endpoint will be: /api/orders/admin/' + orderId + '/status');
      console.log('[DEBUG] 🚀 Payload will be:', { status: newStatus });
      
      const updated = await updateOrderStatus(orderId, newStatus as any);
      console.log('[DEBUG] ✅ API response:', updated);
      
      // Update state with new status and auto-update paymentStatus if delivered
      setOrders(prev => prev.map(order => {
        if (order._id === orderId) {
          const updatedOrder = { ...order, status: newStatus as any };
          
          // Auto-update paymentStatus to 'paid' when status is 'delivered'
          if (newStatus === 'delivered') {
            updatedOrder.paymentStatus = 'paid';
            console.log('[DEBUG] 🔄 Auto-updating paymentStatus to paid (order delivered)');
          }
          
          return updatedOrder;
        }
        return order;
      }));
      
      const statusMessage = getStatusDisplay(newStatus).label;
      const paymentMessage = newStatus === 'delivered' ? ' (Thanh toán: Đã thanh toán)' : '';
      setUpdateMessage(`✅ Cập nhật trạng thái thành công: ${statusMessage}${paymentMessage}`);
      console.log('[DEBUG] ✅ Order status updated successfully');
      
      // Clear message after 3 seconds
      setTimeout(() => setUpdateMessage(''), 3000);
    } catch (err: any) {
      console.error('[DEBUG] ❌ Error details:', {
        message: err.message,
        response: err.response,
        status: err.response?.status,
        data: err.response?.data,
        stack: err.stack
      });
      
      let errorMessage = 'Lỗi không xác định';
      
      if (err.message?.includes('Failed to fetch') || err.message?.includes('Network Error')) {
        errorMessage = '🔌 Không thể kết nối tới server - Backend có thể đang tắt';
      } else if (err.message?.includes('Không có token xác thực')) {
        errorMessage = '🔐 Chưa đăng nhập - Vui lòng đăng nhập với tài khoản admin';
        // Redirect to login after showing message
        setTimeout(() => router.push('/login'), 2000);
      } else if (err.response?.status === 401 || err.message?.includes('Xác thực không thành công')) {
        errorMessage = '🔐 Phiên đăng nhập đã hết hạn - Vui lòng đăng nhập lại';
        // Clear invalid token and redirect
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        setTimeout(() => router.push('/login'), 2000);
      } else if (err.response?.status === 403) {
        errorMessage = '⛔ Không có quyền admin - Chỉ admin mới có thể cập nhật trạng thái đơn hàng';
      } else if (err.response?.status === 404) {
        errorMessage = '❌ Endpoint không tồn tại - Kiểm tra server';
      } else if (err.response?.status >= 500) {
        errorMessage = '💥 Lỗi server - Vui lòng thử lại sau';
      } else if (err.message?.includes('Failed to update order status')) {
        errorMessage = `📋 Lỗi API: ${err.message}`;
      } else if (err.message) {
        errorMessage = `📋 ${err.message}`;
      }
      
      // Still update the UI even if API fails (optimistic update)
      setOrders(prev => prev.map(order => 
        order._id === orderId ? 
        { ...order, status: newStatus as any, updatedAt: new Date().toISOString() } : order
      ));
      
      setUpdateMessage(`⚠️ ${errorMessage} (UI đã cập nhật: ${getStatusDisplay(newStatus).label})`);
      
      // Clear message after 8 seconds for error
      setTimeout(() => setUpdateMessage(''), 8000);
    }
  };

  const handleViewDetails = (order: OrderWithRefs) => {
    setSelectedOrderId(order._id);
    setIsDetailModalOpen(true);
  };

  const handlePaymentStatusChange = async (orderId: string, newPaymentStatus: string) => {
    try {
      console.log('[DEBUG] 🔄 Starting payment status update...');
      console.log('[DEBUG] 📋 Update details:', { orderId, newPaymentStatus });
      setUpdateMessage(''); // Clear previous message
      
      // Find the order to check payment method
      const order = orders.find(o => o._id === orderId);
      if (!order) {
        throw new Error('Không tìm thấy đơn hàng');
      }
      
      // Check if payment status can be changed
      if (!canChangePaymentStatus(order)) {
        const paymentMethod = order.paymentMethod?.method || order.paymentMethod || '';
        const digitalMethods = ['VNPay', 'Momo', 'vnpay', 'momo'];
        const isCOD = paymentMethod.toLowerCase() === 'cod' || paymentMethod.toLowerCase() === 'tiền mặt';
        const isDelivered = order.status === 'delivered';
        
        let errorMsg = 'Không thể thay đổi trạng thái thanh toán';
        
        if (order.status === 'cancelled') {
          errorMsg = 'Không thể thay đổi trạng thái thanh toán cho đơn hàng đã hủy';
        } else if (digitalMethods.includes(paymentMethod)) {
          errorMsg = `Không thể thay đổi trạng thái thanh toán cho phương thức ${paymentMethod} - Đây là phương thức thanh toán điện tử`;
        } else if (isCOD && isDelivered) {
          errorMsg = `Không thể thay đổi trạng thái thanh toán COD khi đơn hàng đã giao hàng thành công`;
        }
        
        throw new Error(errorMsg);
      }
      
      // Check authentication status first
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Không có token xác thực - Vui lòng đăng nhập lại');
      }
      
      // Optimistic update - update UI first
      setOrders(prev => prev.map(order => 
        order._id === orderId 
          ? { ...order, paymentStatus: newPaymentStatus as any }
          : order
      ));
      
      // Call API to update payment status
      const response = await fetch(`http://localhost:5000/api/orders/admin/${orderId}/payment-status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ paymentStatus: newPaymentStatus })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update payment status: ${response.status}`);
      }
      
      console.log('[DEBUG] ✅ Payment status updated successfully');
      setUpdateMessage(`✅ Cập nhật trạng thái thanh toán thành công: ${getPaymentStatusDisplay(newPaymentStatus).label}`);
      
      // Clear message after 3 seconds
      setTimeout(() => setUpdateMessage(''), 3000);
      
    } catch (err: any) {
      console.error('[DEBUG] ❌ Payment status update failed:', err);
      
      // Revert optimistic update on error
      setOrders(prev => prev.map(order => 
        order._id === orderId 
          ? { ...order, paymentStatus: orders.find(o => o._id === orderId)?.paymentStatus || 'pending' }
          : order
      ));
      
      let errorMessage = 'Không thể cập nhật trạng thái thanh toán';
      if (err.message) {
        errorMessage = `📋 ${err.message}`;
      }
      
      setUpdateMessage(`⚠️ ${errorMessage}`);
      
      // Clear error message after 5 seconds
      setTimeout(() => setUpdateMessage(''), 5000);
    }
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedOrderId(null);
  };

  const handlePrint = (order: OrderWithRefs) => {
    console.log('[DEBUG] 🖨️ Print order data:', order);
    console.log('[DEBUG] 🖨️ Order address:', order.address);
    console.log('[DEBUG] 🖨️ Order addressSnapshot:', order.addressSnapshot);
    console.log('[DEBUG] 🖨️ Order user:', order.user);
    
    setPrintOrder(order);
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

  // Hiển thị loading khi đang load auth
  if (isLoading) {
    return (
      <div className={styles.adminContainer}>
        <h2>Đang tải...</h2>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <div className={styles.adminContainer}>
      {/* Header */}
      <div className={styles.adminHeader}>
        <div>
          <h1>Quản Lý Đơn Hàng</h1>
          <p style={{ color: 'var(--color-muted, #9CA3AF)' }}>
            Quản lý tất cả đơn hàng trong hệ thống
          </p>
        </div>
      </div>

      {/* Compact Statistics Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '0.25rem', 
        marginBottom: '0.25rem' 
      }}>
        <div style={{
          padding: '0.75rem',
          background: 'linear-gradient(135deg, rgba(108, 71, 255, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
          borderRadius: '0.5rem',
          border: '1px solid rgba(108, 71, 255, 0.2)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#6c47ff', marginBottom: '0.25rem' }}>
            {isLoadingStatistics ? '⏳' : calculateStatistics().totalOrders}
          </div>
          <div style={{ color: '#666', fontSize: '0.75rem', fontWeight: 500 }}>
            Tổng đơn hàng
          </div>
          {statistics && (
            <div style={{ color: '#888', fontSize: '0.625rem', marginTop: '0.25rem' }}>
              📊 Từ toàn bộ hệ thống
            </div>
          )}
        </div>
        
        <div style={{
          padding: '0.75rem',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)',
          borderRadius: '0.5rem',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#10b981', marginBottom: '0.25rem' }}>
            {isLoadingStatistics ? '⏳' : `${calculateStatistics().totalRevenue.toLocaleString('vi-VN')}đ`}
          </div>
          <div style={{ color: '#666', fontSize: '0.75rem', fontWeight: 500 }}>
            Tổng doanh thu
          </div>
          {statistics && (
            <div style={{ color: '#888', fontSize: '0.625rem', marginTop: '0.25rem' }}>
              💰 Chỉ đơn đã thanh toán
            </div>
          )}
        </div>
        
        <div style={{
          padding: '0.75rem',
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.1) 100%)',
          borderRadius: '0.5rem',
          border: '1px solid rgba(245, 158, 11, 0.2)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f59e0b', marginBottom: '0.25rem' }}>
            {isLoadingStatistics ? '⏳' : calculateStatistics().pendingOrders}
          </div>
          <div style={{ color: '#666', fontSize: '0.75rem', fontWeight: 500 }}>
            Chờ xử lý
          </div>
          {statistics && (
            <div style={{ color: '#888', fontSize: '0.625rem', marginTop: '0.25rem' }}>
              ⏳ Cần xử lý sớm
            </div>
          )}
        </div>
        
        <div style={{
          padding: '0.75rem',
          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(21, 128, 61, 0.1) 100%)',
          borderRadius: '0.5rem',
          border: '1px solid rgba(34, 197, 94, 0.2)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#22c55e', marginBottom: '0.25rem' }}>
            {isLoadingStatistics ? '⏳' : calculateStatistics().completedOrders}
          </div>
          <div style={{ color: '#666', fontSize: '0.75rem', fontWeight: 500 }}>
            Đã hoàn thành
          </div>
          {statistics && (
            <div style={{ color: '#888', fontSize: '0.625rem', marginTop: '0.25rem' }}>
              ✅ Đã giao thành công
            </div>
          )}
        </div>
      </div>

      {/* Compact Action Bar */}
      <div className={styles.actionBar}>
        <div className={styles.actionBarGrid}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              Tìm kiếm
            </label>
            <input
              type="text"
              placeholder="Tìm theo mã đơn, khách hàng..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              Trạng thái đơn hàng
            </label>
            <select
              value={filterStatus}
              onChange={(e) => handleFilterChange(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">Tất cả</option>
              <option value="pending">Chờ xử lý</option>
              <option value="processing">Đang xử lý</option>
              <option value="shipped">Đã gửi hàng</option>
              <option value="delivered">Đã giao</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              Trạng thái thanh toán
            </label>
            <select
              value={filterPaymentStatus}
              onChange={(e) => handlePaymentStatusFilterChange(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">Tất cả</option>
              <option value="pending">Chờ thanh toán</option>
              <option value="paid">Đã thanh toán</option>
              <option value="failed">Thanh toán thất bại</option>
              <option value="cancelled">Đã hủy thanh toán</option>
            </select>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              Sắp xếp
            </label>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => handleSortChange(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="createdAt-desc">Mới nhất</option>
              <option value="createdAt-asc">Cũ nhất</option>
              <option value="finalTotal-desc">Giá trị cao nhất</option>
              <option value="finalTotal-asc">Giá trị thấp nhất</option>
              <option value="orderCode-asc">Mã đơn (A-Z)</option>
              <option value="orderCode-desc">Mã đơn (Z-A)</option>
            </select>
          </div>
          <div className={styles.controlsSection}>
            <div className={styles.paginationInfo}>
              Trang {currentPage}/{totalPages} • {orders.length}/{totalOrders} đơn
            </div>
            {isLoadingOrders && (
              <div className={styles.loadingIndicator}>
                ⏳ Đang tải...
              </div>
            )}
            {/* Quick Pagination Controls */}
            {totalPages > 1 && (
              <div className={styles.quickPagination}>
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1 || isLoadingOrders}
                  className={`${styles.paginationButton} ${currentPage === 1 ? styles.disabled : ''}`}
                >
                  ←
                </button>
                <span className={styles.pageIndicator}>
                  {currentPage}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages || isLoadingOrders}
                  className={`${styles.paginationButton} ${currentPage === totalPages ? styles.disabled : ''}`}
                >
                  →
                </button>
              </div>
            )}
            {/* Essential Control Buttons */}
            <div className={styles.actionButtons}>
              <button
                onClick={() => {
                  console.log('[DEBUG] 🔄 Force reload orders...');
                  fetchOrders();
                }}
                className={`${styles.actionButton} ${styles.reloadButton}`}
                disabled={isLoadingOrders}
              >
                {isLoadingOrders ? '⏳' : '🔄'} Tải lại
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Display Error */}
      {error && (
        <div className={styles.orderCard} style={{ background: '#ffeaea', borderColor: '#fecaca', color: '#dc2626', marginBottom: '0.25rem' }}>
          {error}
        </div>
      )}

      {/* Display Statistics Loading/Error Status */}
      {!statistics && !isLoadingStatistics && (
        <div className={styles.orderCard} style={{ 
          background: '#fffbeb', 
          borderColor: '#fbbf24', 
          color: '#92400e', 
          marginBottom: '0.25rem',
          fontWeight: 600,
          fontSize: '0.875rem'
        }}>
          📊 <strong>Thống kê:</strong> Đang sử dụng dữ liệu trang hiện tại. Nhấn "📊 Cập nhật TK" để tải thống kê toàn hệ thống.
        </div>
      )}
      {isLoadingStatistics && (
        <div className={styles.orderCard} style={{ 
          background: '#f0f9ff', 
          borderColor: '#60a5fa', 
          color: '#1e40af', 
          marginBottom: '0.25rem',
          fontWeight: 600,
          fontSize: '0.875rem'
        }}>
          ⏳ <strong>Đang tải thống kê toàn hệ thống...</strong>
        </div>
      )}
      {statistics && (
        <div className={styles.orderCard} style={{ 
          background: '#f0fdf4', 
          borderColor: '#22c55e', 
          color: '#15803d', 
          marginBottom: '0.25rem',
          fontWeight: 600,
          fontSize: '0.875rem'
        }}>
          ✅ <strong>Thống kê:</strong> Dữ liệu từ toàn bộ hệ thống ({statistics.summary?.totalOrders || 0} đơn hàng)
        </div>
      )}
      {updateMessage && (
        <div className={styles.orderCard} style={{ 
          background: updateMessage.includes('✅') 
            ? '#f0f9ff' 
            : updateMessage.includes('❌') 
              ? '#fef2f2' 
              : '#fff7ed', 
          borderColor: updateMessage.includes('✅') 
            ? '#60a5fa' 
            : updateMessage.includes('❌') 
              ? '#f87171' 
              : '#fb923c', 
          color: updateMessage.includes('✅') 
            ? '#1e40af' 
            : updateMessage.includes('❌') 
              ? '#dc2626' 
              : '#ea580c', 
          marginBottom: '0.25rem',
          fontWeight: 600
        }}>
          {updateMessage}
        </div>
      )}

      {/* Authentication Info - Show if there are auth issues */}
      {!authToken && (
        <div className={styles.orderCard} style={{ 
          background: '#fef3c7', 
          borderColor: '#f59e0b', 
          color: '#92400e', 
          marginBottom: '0.25rem',
          fontWeight: 600
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              ⚠️ <strong>Lưu ý xác thực:</strong> Để sử dụng chức năng cập nhật trạng thái đơn hàng, bạn cần đăng nhập với tài khoản admin.
            </div>
            <button
              onClick={() => router.push('/login')}
              style={{
                padding: '8px 16px',
                backgroundColor: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: 'pointer',
                marginLeft: '16px'
              }}
            >
              Đăng nhập
            </button>
          </div>
        </div>
      )}

      {/* Admin Table with Pagination */}
      <div className={styles.ordersGridWidth}>
        {/* Loading Indicator */}
        {isLoadingOrders && (
          <div className={`${styles.orderCard} ${styles.orderCardLoading}`}>
            <div className={styles.loadingIcon}>⏳</div>
            <div className={styles.loadingText}>Đang tải đơn hàng...</div>
          </div>
        )}

        {/* Orders List */}
        {!isLoadingOrders && filteredOrders.length === 0 ? (
          <div className={`${styles.orderCard} ${styles.orderCardEmpty}`}>
            <div className={styles.emptyIcon}>📦</div>
            <div className={styles.emptyTitle}>
              Chưa có đơn hàng nào
            </div>
            <div className={styles.emptyDescription}>
              {searchTerm || filterStatus !== 'all' 
                ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm'
                : 'Các đơn hàng mới sẽ hiển thị ở đây'
              }
            </div>
          </div>
        ) : (
          !isLoadingOrders && filteredOrders.map((order) => (
            <div key={order._id} className={styles.orderCardCompact}>
              {/* Compact Header with Grid Layout */}
              <div className={styles.orderHeaderGrid}>
                {/* Order Info */}
                <div>
                  <div className={styles.orderCode}>
                    {order.orderCode}
                  </div>
                  <div className={styles.orderMeta}>
                    {order.user?.name || 'N/A'} • {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                  </div>
                </div>

                {/* Products Count */}
                <div className={styles.orderStat}>
                  <div className={styles.orderStatLabel}>Sản phẩm</div>
                  <div className={styles.orderStatValue}>{(order.items || []).length}</div>
                </div>

                {/* Total Amount */}
                <div className={styles.orderStat}>
                  <div className={styles.orderStatLabel}>Tổng tiền</div>
                  <div className={styles.orderStatValueAmount}>
                    {(order.finalTotal || ((order.items || []).reduce((sum, item) => sum + (item?.totalPrice || 0), 0) - (order.discountAmount || 0) + (order.shippingFee || 0))).toLocaleString('vi-VN')}đ
                  </div>
                </div>

                {/* Payment Status Badge */}
                <span className={styles.orderStatusBadge} style={{
                  backgroundColor: getPaymentStatusDisplay(order.paymentStatus || 'pending').color
                }}>
                  {getPaymentStatusDisplay(order.paymentStatus || 'pending').label}
                </span>

                {/* Order Status Badge */}
                <span className={styles.orderStatusBadge} style={{
                  backgroundColor: getStatusDisplay(order.status).color
                }}>
                  {getStatusDisplay(order.status).label}
                </span>
              </div>

              {/* Compact Product List */}
              <div className={styles.orderProductsSection}>
                <div className={styles.orderProductsLabel}>Sản phẩm:</div>
                <div className={styles.orderProductsList}>
                  {(order.items || []).slice(0, 3).map((item, idx) => (
                    <div key={idx} className={styles.orderProductItem}>
                      <div className={styles.productName}>
                        {item?.productVariant?.product?.name?.substring(0, 30) || 'Sản phẩm'}
                        {item?.productVariant?.product?.name?.length > 30 ? '...' : ''}
                      </div>
                      <div className={styles.productVariantInfo}>
                        <span className={styles.variantDetail}>
                          SL: {item?.quantity || 0}
                        </span>
                        {item?.productVariant?.color?.name && (
                          <span className={styles.variantDetail}>
                            Màu: {item.productVariant.color.name}
                          </span>
                        )}
                        {item?.productVariant?.size?.name && (
                          <span className={styles.variantDetail}>
                            Size: {item.productVariant.size.name}
                          </span>
                        )}
                        <span className={styles.variantDetail}>
                          {(item?.price || 0).toLocaleString('vi-VN')}đ
                        </span>
                      </div>
                    </div>
                  ))}
                  {(order.items || []).length > 3 && (
                    <span className={styles.orderProductMore}>
                      +{(order.items || []).length - 3} sản phẩm khác
                    </span>
                  )}
                </div>
              </div>

              {/* Compact Actions */}
              <div className={styles.orderActions}>
                {/* Financial Summary */}
                <div className={styles.orderFinancialSummary}>
                  <span>Ship: {(order.shippingFee || 0).toLocaleString('vi-VN')}đ</span>
                  <span>Giảm: -{(order.discountAmount || 0).toLocaleString('vi-VN')}đ</span>
                </div>

                {/* Action Buttons */}
                <div className={styles.orderActionButtons}>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order._id, e.target.value)}
                    className={styles.orderStatusSelect}
                    title="Trạng thái đơn hàng"
                  >
                    {/* Show current status first */}
                    <option value={order.status}>
                      {order.status === 'pending' && 'Chờ xử lý'}
                      {order.status === 'processing' && 'Đang xử lý'}
                      {order.status === 'shipped' && 'Đã gửi hàng'}
                      {order.status === 'delivered' && 'Đã giao'}
                      {order.status === 'cancelled' && 'Đã hủy'}
                    </option>
                    
                    {/* Show only valid transitions */}
                    {getValidStatusTransitions(order.status).filter(status => status !== order.status).map(status => (
                      <option key={status} value={status}>
                        {status === 'pending' && 'Chờ xử lý'}
                        {status === 'processing' && 'Đang xử lý'}
                        {status === 'shipped' && 'Đã gửi hàng'}
                        {status === 'delivered' && 'Đã giao'}
                        {status === 'cancelled' && 'Đã hủy'}
                      </option>
                    ))}
                  </select>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <select
                      value={order.paymentStatus || 'pending'}
                      onChange={(e) => handlePaymentStatusChange(order._id, e.target.value)}
                      onClick={(e) => {
                        if (!canChangePaymentStatus(order)) {
                          e.preventDefault();
                          const paymentMethod = order.paymentMethod?.method || order.paymentMethod || '';
                          const digitalMethods = ['VNPay', 'Momo', 'vnpay', 'momo'];
                          const isCOD = paymentMethod.toLowerCase() === 'cod' || paymentMethod.toLowerCase() === 'tiền mặt';
                          const isDelivered = order.status === 'delivered';
                          
                          let errorMsg = 'Không thể thay đổi trạng thái thanh toán';
                          
                          if (order.status === 'cancelled') {
                            errorMsg = '⚠️ Không thể thay đổi trạng thái thanh toán cho đơn hàng đã hủy';
                          } else if (digitalMethods.includes(paymentMethod)) {
                            errorMsg = `⚠️ Không thể thay đổi trạng thái thanh toán cho phương thức ${paymentMethod} - Đây là phương thức thanh toán điện tử`;
                          } else if (isCOD && isDelivered) {
                            errorMsg = `⚠️ Không thể thay đổi trạng thái thanh toán COD khi đơn hàng đã giao thành công`;
                          }
                          
                          setUpdateMessage(errorMsg);
                          setTimeout(() => setUpdateMessage(''), 5000);
                        }
                      }}
                      className={styles.orderStatusSelect}
                      title={canChangePaymentStatus(order) ? "Trạng thái thanh toán" : (() => {
                        const paymentMethod = order.paymentMethod?.method || order.paymentMethod || '';
                        const digitalMethods = ['VNPay', 'Momo', 'vnpay', 'momo'];
                        const isCOD = paymentMethod.toLowerCase() === 'cod' || paymentMethod.toLowerCase() === 'tiền mặt';
                        const isDelivered = order.status === 'delivered';
                        
                        if (order.status === 'cancelled') {
                          return 'Không thể thay đổi thanh toán cho đơn hàng đã hủy';
                        } else if (digitalMethods.includes(paymentMethod)) {
                          return `Không thể thay đổi thanh toán ${paymentMethod} - Phương thức điện tử`;
                        } else if (isCOD && isDelivered) {
                          return `Không thể thay đổi COD khi đã giao hàng thành công`;
                        }
                        return 'Không thể thay đổi trạng thái thanh toán';
                      })()}
                      disabled={!canChangePaymentStatus(order)}
                      style={{
                        opacity: !canChangePaymentStatus(order) ? 0.6 : 1,
                        cursor: !canChangePaymentStatus(order) ? 'not-allowed' : 'pointer',
                        backgroundColor: !canChangePaymentStatus(order) ? '#f5f5f5' : ''
                      }}
                    >
                      <option value="pending">Chờ thanh toán</option>
                      <option value="paid">Đã thanh toán</option>
                      <option value="failed">Thanh toán thất bại</option>
                      <option value="cancelled">Đã hủy thanh toán</option>
                    </select>
                    {!canChangePaymentStatus(order) && (
                      <span 
                        style={{ 
                          fontSize: '14px', 
                          color: '#f59e0b',
                          cursor: 'help'
                        }}
                        title={`Đơn hàng thanh toán qua ${order.paymentMethod?.method} không thể thay đổi trạng thái`}
                      >
                        🔒
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleViewDetails(order)}
                    className={styles.orderDetailsButton}
                    title="Xem chi tiết"
                  >
                    Chi tiết
                  </button>
                  <button
                    onClick={() => handlePrint(order)}
                    className={styles.orderDetailsButton}
                    title="In đơn hàng"
                    style={{ marginLeft: '8px' }}
                  >
                    In đơn hàng
                  </button>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Compact Pagination Controls */}
        {!isLoadingOrders && totalPages > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '0.25rem',
            marginTop: '0.5rem',
            padding: '0.5rem',
            background: '#f9fafb',
            borderRadius: '0.5rem',
            border: '1px solid #e5e7eb'
          }}>
            {/* Previous Button */}
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: '0.375rem',
                border: '1px solid #d1d5db',
                background: currentPage === 1 ? '#f3f4f6' : 'white',
                color: currentPage === 1 ? '#9ca3af' : '#374151',
                fontSize: '0.75rem',
                fontWeight: '500',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
            >
              ← Trước
            </button>

            {/* Page Numbers (Simplified) */}
            <div style={{
              display: 'flex',
              gap: '0.125rem',
              alignItems: 'center'
            }}>
              {(() => {
                const pages = [];
                const maxVisible = 3; // Show fewer pages
                let startPage = Math.max(1, currentPage - 1);
                let endPage = Math.min(totalPages, startPage + maxVisible - 1);
                startPage = Math.max(1, endPage - maxVisible + 1);

                // Show first page if not in range
                if (startPage > 1) {
                  pages.push(
                    <button key={1} onClick={() => goToPage(1)} style={{
                      padding: '0.375rem 0.5rem', borderRadius: '0.25rem',
                      border: '1px solid #d1d5db', background: 'white',
                      color: '#374151', fontSize: '0.75rem', cursor: 'pointer', minWidth: '1.75rem'
                    }}>1</button>
                  );
                  if (startPage > 2) pages.push(<span key="dots1" style={{ color: '#9ca3af', fontSize: '0.75rem' }}>...</span>);
                }

                // Current page range
                for (let i = startPage; i <= endPage; i++) {
                  pages.push(
                    <button key={i} onClick={() => goToPage(i)} style={{
                      padding: '0.375rem 0.5rem', borderRadius: '0.25rem',
                      border: '1px solid #d1d5db',
                      background: i === currentPage ? '#6c47ff' : 'white',
                      color: i === currentPage ? 'white' : '#374151',
                      fontSize: '0.75rem', fontWeight: i === currentPage ? '600' : '500',
                      cursor: 'pointer', minWidth: '1.75rem'
                    }}>{i}</button>
                  );
                }

                // Show last page if not in range
                if (endPage < totalPages) {
                  if (endPage < totalPages - 1) pages.push(<span key="dots2" style={{ color: '#9ca3af', fontSize: '0.75rem' }}>...</span>);
                  pages.push(
                    <button key={totalPages} onClick={() => goToPage(totalPages)} style={{
                      padding: '0.375rem 0.5rem', borderRadius: '0.25rem',
                      border: '1px solid #d1d5db', background: 'white',
                      color: '#374151', fontSize: '0.75rem', cursor: 'pointer', minWidth: '1.75rem'
                    }}>{totalPages}</button>
                  );
                }

                return pages;
              })()}
            </div>

            {/* Next Button */}
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: '0.375rem',
                border: '1px solid #d1d5db',
                background: currentPage === totalPages ? '#f3f4f6' : 'white',
                color: currentPage === totalPages ? '#9ca3af' : '#374151',
                fontSize: '0.75rem',
                fontWeight: '500',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Sau →
            </button>

            {/* Page Info */}
            <div style={{
              marginLeft: '0.5rem',
              padding: '0.375rem 0.75rem',
              background: 'rgba(108, 71, 255, 0.1)',
              borderRadius: '0.375rem',
              fontSize: '0.75rem',
              fontWeight: '500',
              color: '#6c47ff',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.125rem',
              position: 'relative'
            }}>
              {showPageInput ? (
                <form onSubmit={handlePageInputSubmit} style={{ display: 'contents' }}>
                  <input
                    type="number"
                    value={pageInputValue}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow empty or valid numbers within range
                      if (value === '' || (!isNaN(parseInt(value)) && parseInt(value) >= 1 && parseInt(value) <= totalPages)) {
                        setPageInputValue(value);
                      }
                    }}
                    onKeyDown={handlePageInputKeyDown}
                    onBlur={handlePageInputBlur}
                    min="1"
                    max={totalPages}
                    autoFocus
                    className={styles.pageJumpInput}
                    placeholder={currentPage.toString()}
                  />
                  <span>/{totalPages}</span>
                </form>
              ) : (
                <div 
                  onClick={handlePageIndicatorClick}
                  className={styles.pageClickable}
                  title="Click để nhảy đến trang"
                >
                  {currentPage}/{totalPages}
                </div>
              )}
              <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                Tổng: {totalOrders} đơn
              </div>
            </div>
          </div>
        )}
        
      </div>

      {/* Order Detail Modal */}
      <OrderDetailModal
        orderId={selectedOrderId}
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
      />

      {/* Order Invoice Modal */}
      {showInvoice && printOrder && (
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
          <OrderInvoice order={printOrder} />
        </div>
      )}
    </div>
  );
}