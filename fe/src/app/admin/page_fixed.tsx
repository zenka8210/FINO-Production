"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import styles from "./admin.module.css";
import StatCard from "./components/StatCard";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// Type definitions
interface ActivityItem {
  type: 'order' | 'user' | 'product';
  description: string;
  timeAgo: string;
}

interface RevenueData {
  date: string;
  revenue: number;
}

interface OrderItem {
  _id: string;
  id?: string;
  orderNumber?: string;
  customerName?: string;
  total: number;
  finalTotal?: number;
  status: string;
  paymentStatus?: string;
  createdAt: string;
  updatedAt?: string;
}

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  
  const [stats, setStats] = useState({
    earnings: 0,
    users: 0,
    products: 0,
    orders: 0,
    lowStock: 0,
  });
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [recentOrders, setRecentOrders] = useState<OrderItem[]>([]);
  const [allOrders, setAllOrders] = useState<OrderItem[]>([]);
  const [showAllOrders, setShowAllOrders] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<string>("");
  
  // Daily revenue states
  const [dailyRevenue, setDailyRevenue] = useState({
    today: 0,
    yesterday: 0,
    changePercent: 0,
    todayOrders: 0
  });
  const [isLoadingDailyRevenue, setIsLoadingDailyRevenue] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [ordersPerPage] = useState(10);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  // Chart states
  const [chartPeriod, setChartPeriod] = useState<'7' | '30' | '90'>('7');
  const [isLoadingChart, setIsLoadingChart] = useState(false);

  // Set last update time on client side to avoid hydration mismatch
  useEffect(() => {
    setLastUpdateTime(new Date().toLocaleString('vi-VN'));
  }, []);

  // Function to get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return '#f59e0b';
      case 'processing': return '#8b5cf6';
      case 'shipped': return '#06b6d4';
      case 'delivered': return '#10b981';
      case 'cancelled': return '#ef4444';
      default: return '#64748b';
    }
  };

  // Function to get status label
  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'Chờ xử lý';
      case 'processing': return 'Đang xử lý';
      case 'shipped': return 'Đã gửi hàng';
      case 'delivered': return 'Đã giao hàng';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  // Function to get payment status color
  const getPaymentStatusColor = (paymentStatus: string) => {
    switch (paymentStatus.toLowerCase()) {
      case 'pending': return '#f59e0b';
      case 'paid': return '#10b981';
      case 'failed': return '#ef4444';
      case 'cancelled': return '#6b7280';
      default: return '#64748b';
    }
  };

  // Function to get payment status label
  const getPaymentStatusLabel = (paymentStatus: string) => {
    switch (paymentStatus.toLowerCase()) {
      case 'pending': return 'Chờ thanh toán';
      case 'paid': return 'Đã thanh toán';
      case 'failed': return 'Thất bại';
      case 'cancelled': return 'Đã hủy';
      default: return paymentStatus;
    }
  };

  // Function to handle chart period change
  const handleChartPeriodChange = (period: '7' | '30' | '90') => {
    setChartPeriod(period);
    loadRevenueData(period);
  };

  // Function to refresh revenue data specifically
  const refreshRevenueData = async () => {
    const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };

    try {
      console.log('🔄 Refreshing revenue data (FIXED)...');
      const ordersRes = await fetch(`${BASE_URL}/api/orders`, { headers });
      const ordersData = await ordersRes.json();
      
      if (ordersData.data || ordersData.orders || Array.isArray(ordersData)) {
        const orders = ordersData.data || ordersData.orders || ordersData;
        
        let totalRevenue = 0;
        orders.forEach((order: any) => {
          const orderTotal = order.finalTotal || order.total || 0;
          const paymentStatus = (order.paymentStatus || '').toLowerCase();
          const isPaid = paymentStatus === 'paid';
          
          if (isPaid) {
            totalRevenue += parseFloat(orderTotal) || 0;
          }
        });
        
        setStats(prev => ({
          ...prev,
          earnings: totalRevenue
        }));
        
        console.log('💰 Revenue refreshed (FIXED):', totalRevenue);
      }
    } catch (error) {
      console.error('❌ Failed to refresh revenue:', error);
    }
  };

  // Function to refresh all stats
  const refreshAllStats = async () => {
    const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };

    setLoading(true);
    
    try {
      console.log('🔄 Refreshing all stats...');
      
      // Load individual APIs
      const [ordersRes, usersRes, productsRes] = await Promise.all([
        fetch(`${BASE_URL}/api/orders`, { headers }).catch(() => null),
        fetch(`${BASE_URL}/api/users`, { headers }).catch(() => null),
        fetch(`${BASE_URL}/api/products`, { headers }).catch(() => null)
      ]);

      let newStats = { earnings: 0, users: 0, products: 0, orders: 0, lowStock: 0 };

      if (ordersRes) {
        const ordersData = await ordersRes.json();
        const orders = ordersData.data || ordersData.orders || ordersData;
        if (Array.isArray(orders)) {
          newStats.orders = orders.length;
          newStats.earnings = orders.reduce((sum: number, order: any) => {
            const orderTotal = order.finalTotal || order.total || 0;
            const paymentStatus = (order.paymentStatus || '').toLowerCase();
            return paymentStatus === 'paid' ? sum + (parseFloat(orderTotal) || 0) : sum;
          }, 0);
        }
      }

      if (usersRes) {
        const usersData = await usersRes.json();
        const users = usersData.data || usersData.users || usersData;
        if (Array.isArray(users)) newStats.users = users.length;
      }

      if (productsRes) {
        const productsData = await productsRes.json();
        const products = productsData.data || productsData.products || productsData;
        if (Array.isArray(products)) {
          newStats.products = products.length;
          // Calculate low stock items
          newStats.lowStock = products.filter((product: any) => (product.stock || 0) < 5).length;
        }
      }

      setStats(newStats);
      console.log('All stats refreshed:', newStats);
      
      // Also refresh daily revenue and orders
      await loadDailyRevenue();
      await loadOrdersPage(currentPage);
      
      alert('Dữ liệu đã được cập nhật!');
    } catch (error) {
      console.error('Failed to refresh stats:', error);
      alert('Lỗi khi cập nhật dữ liệu. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  // Function to update order status
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };

    try {
      console.log(`Updating order ${orderId} to status: ${newStatus}`);
      
      const response = await fetch(`${BASE_URL}/api/orders/admin/${orderId}/status`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: newStatus })
      });

      const result = await response.json();
      
      if (result.success || response.ok) {
        // Update local state
        setRecentOrders(prev => 
          prev.map(order => 
            order._id === orderId 
              ? { ...order, status: newStatus, updatedAt: new Date().toISOString() }
              : order
          )
        );
        
        setAllOrders(prev => 
          prev.map(order => 
            order._id === orderId 
              ? { ...order, status: newStatus, updatedAt: new Date().toISOString() }
              : order
          )
        );
        
        console.log('Order status updated successfully');
        alert('Cập nhật trạng thái đơn hàng thành công!');
      } else {
        throw new Error(result.message || 'Failed to update order status');
      }
    } catch (error) {
      console.error('Failed to update order status:', error);
      alert('Lỗi khi cập nhật trạng thái đơn hàng. Vui lòng thử lại!');
    }
  };

  // Function to update payment status
  const updatePaymentStatus = async (orderId: string, newPaymentStatus: string) => {
    const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

    try {
      const response = await fetch(`${BASE_URL}/api/orders/admin/${orderId}/payment-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ paymentStatus: newPaymentStatus })
      });

      const result = await response.json();
      
      if (result.success) {
        // Update local state
        setRecentOrders(prev => 
          prev.map(order => 
            order._id === orderId 
              ? { ...order, paymentStatus: newPaymentStatus, updatedAt: new Date().toISOString() }
              : order
          )
        );
        
        setAllOrders(prev => 
          prev.map(order => 
            order._id === orderId 
              ? { ...order, paymentStatus: newPaymentStatus, updatedAt: new Date().toISOString() }
              : order
          )
        );
        
        console.log('Payment status updated successfully');
        alert('Cập nhật trạng thái thanh toán thành công!');
      } else {
        throw new Error(result.message || 'Failed to update payment status');
      }
    } catch (error) {
      console.error('Failed to update payment status:', error);
      alert('Lỗi khi cập nhật trạng thái thanh toán. Vui lòng thử lại!');
    }
  };

  // Function to load orders with pagination
  const loadOrdersPage = async (page: number = 1) => {
    setIsLoadingOrders(true);
    const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };

    try {
      console.log(`Loading orders page ${page}...`);
      
      // API call with pagination and populate
      const response = await fetch(
        `${BASE_URL}/api/orders/admin/all?page=${page}&limit=${ordersPerPage}&sort=-createdAt&populate=user address paymentMethod`,
        { headers }
      );
      const data = await response.json();
      
      console.log('Paginated orders response:', data);
      
      if (data.data || data.orders || Array.isArray(data)) {
        const orders = data.data || data.orders || data;
        const pagination = data.pagination || {};
        
        // Ensure orders is an array before mapping
        const ordersArray = Array.isArray(orders) ? orders : [];
        
        // Map orders data
        const ordersList = ordersArray.map((order: any) => ({
          _id: order._id || order.id,
          orderNumber: order.orderNumber || order.orderCode || `#${order._id?.slice(-6) || Math.random().toString(36).substr(2, 6)}`,
          customerName: order.customerName || order.customer?.name || order.user?.name || order.customerInfo?.name || 'Khách hàng',
          total: order.total || 0,
          finalTotal: order.finalTotal || order.total || order.totalAmount || order.totalPrice || order.grandTotal || order.amount || 0,
          status: order.status || order.orderStatus || 'pending',
          paymentStatus: order.paymentStatus || 'pending',
          createdAt: order.createdAt || new Date().toISOString(),
          updatedAt: order.updatedAt
        }));
        
        setAllOrders(ordersList);
        setCurrentPage(pagination.currentPage || page);
        setTotalPages(pagination.totalPages || Math.ceil((pagination.total || orders.length) / ordersPerPage));
        setTotalOrders(pagination.total || orders.length);
        
        console.log('Orders loaded:', {
          ordersCount: ordersList.length,
          currentPage: pagination.currentPage || page,
          totalPages: pagination.totalPages,
          totalOrders: pagination.total
        });
      }
    } catch (error) {
      console.error('Failed to load orders page:', error);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  // Function to load daily revenue data
  const loadDailyRevenue = async () => {
    setIsLoadingDailyRevenue(true);
    const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    
    try {
      const response = await fetch(`${BASE_URL}/api/statistics/daily-revenue`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setDailyRevenue(data.data);
        }
      } else {
        // Fallback calculation from recent orders
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const yesterdayStart = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
        const yesterdayEnd = new Date(todayStart.getTime() - 1);
        
        const todayOrders = recentOrders.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate >= todayStart && order.paymentStatus === 'paid';
        });
        
        const yesterdayOrders = recentOrders.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate >= yesterdayStart && orderDate <= yesterdayEnd && order.paymentStatus === 'paid';
        });
        
        const todayRevenue = todayOrders.reduce((sum, order) => sum + (order.finalTotal || order.total || 0), 0);
        const yesterdayRevenue = yesterdayOrders.reduce((sum, order) => sum + (order.finalTotal || order.total || 0), 0);
        
        const changePercent = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : 0;
        
        setDailyRevenue({
          today: todayRevenue,
          yesterday: yesterdayRevenue,
          changePercent,
          todayOrders: todayOrders.length
        });
      }
    } catch (error) {
      console.error('Failed to load daily revenue:', error);
    } finally {
      setIsLoadingDailyRevenue(false);
    }
  };

  // Function to load revenue data by period
  const loadRevenueData = async (period: '7' | '30' | '90' = '7') => {
    setIsLoadingChart(true);
    const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };

    try {
      const periodMap = {
        '7': 'week',
        '30': 'month', 
        '90': 'quarter'
      };
      
      console.log(`🔄 Loading revenue data for period: ${period} (${periodMap[period]})`);
      
      const revenueRes = await fetch(`${BASE_URL}/api/statistics/revenue-chart?period=${periodMap[period]}`, { headers });
      const revenueResponse = await revenueRes.json();
      
      console.log('📊 Revenue API Response:', revenueResponse);
      
      if (revenueResponse.success && revenueResponse.data) {
        const apiData = revenueResponse.data;
        
        // Convert backend format {labels: [], data: []} to frontend format [{date: '', revenue: 0}]
        if (apiData.labels && apiData.data && Array.isArray(apiData.labels) && Array.isArray(apiData.data)) {
          const chartData = apiData.labels.map((label: string, index: number) => ({
            date: label,
            revenue: apiData.data[index] || 0
          }));
          
          console.log('✅ Converted chart data from real database:', chartData);
          setRevenueData(chartData);
        } else {
          console.warn('⚠️ Invalid API data format, showing empty chart with real data structure');
          // Create empty real data structure instead of demo data
          const emptyData = generateEmptyRevenueData(period);
          setRevenueData(emptyData);
        }
      } else {
        console.warn('⚠️ API response not successful, showing empty chart with real data structure');
        // Create empty real data structure instead of demo data
        const emptyData = generateEmptyRevenueData(period);
        setRevenueData(emptyData);
      }
    } catch (error) {
      console.error('❌ Failed to load revenue data:', error);
      // Show empty real data structure instead of demo data
      const emptyData = generateEmptyRevenueData(period);
      setRevenueData(emptyData);
    } finally {
      setIsLoadingChart(false);
    }
  };

  // Generate empty revenue data structure based on real date periods (no fake data)
  const generateEmptyRevenueData = (period: '7' | '30' | '90') => {
    const data = [];
    const today = new Date();
    const days = parseInt(period);
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = `${date.getDate()}/${date.getMonth() + 1}`;
      data.push({
        date: dateStr,
        revenue: 0 // Always 0 for real empty data, no fake numbers
      });
    }
    
    return data;
  };

  useEffect(() => {
    // Fallback function to get stats from individual APIs
    async function fetchFallbackStats(baseUrl: string, headers: any) {
      try {
        console.log('Trying fallback APIs...');
        
        // Try to get orders data
        const ordersRes = await fetch(`${baseUrl}/api/orders`, { headers });
        const ordersData = await ordersRes.json();
        console.log('Orders API Response:', ordersData);
        
        // Try to get users data  
        const usersRes = await fetch(`${baseUrl}/api/users`, { headers });
        const usersData = await usersRes.json();
        console.log('Users API Response:', usersData);
        
        // Try to get products data
        const productsRes = await fetch(`${baseUrl}/api/products`, { headers });
        const productsData = await productsRes.json();
        console.log('Products API Response:', productsData);
        
        // Try to get low stock data instead of news
        const lowStockRes = await fetch(`${baseUrl}/api/statistics/low-stock`, { headers }).catch(() => null);
        const lowStockData = lowStockRes ? await lowStockRes.json() : null;
        console.log('Low Stock API Response:', lowStockData);
        
        // Calculate stats from individual responses
        const totalOrders = ordersData.data?.length || ordersData.orders?.length || ordersData.length || 0;
        const totalUsers = usersData.data?.length || usersData.users?.length || usersData.length || 0;
        const totalProducts = productsData.data?.length || productsData.products?.length || productsData.length || 0;
        const totalLowStock = lowStockData?.data?.total || 0;
        
        // Calculate revenue from orders
        let totalRevenue = 0;
        if (ordersData.data || ordersData.orders || Array.isArray(ordersData)) {
          const orders = ordersData.data || ordersData.orders || ordersData;
          console.log('Processing orders for revenue calculation:', orders.length, 'orders');
          
          totalRevenue = orders.reduce((sum: number, order: any, index: number) => {
            const orderTotal = order.finalTotal || 
                              order.total || 
                              order.totalAmount || 
                              order.totalPrice ||
                              order.grandTotal ||
                              order.amount ||
                              0;
            
            const paymentStatus = (order.paymentStatus || '').toLowerCase();
            const isPaid = paymentStatus === 'paid';
            
            console.log(`Order ${index + 1}:`, {
              id: order._id || order.id,
              total: orderTotal,
              paymentStatus: paymentStatus,
              isPaid: isPaid
            });
            
            if (isPaid) {
              const parsedTotal = parseFloat(orderTotal) || 0;
              console.log(`Adding ${parsedTotal} to revenue (payment confirmed)`);
              return sum + parsedTotal;
            }
            
            return sum;
          }, 0);
          
          console.log('Final calculated revenue:', totalRevenue);
        }
        
        // Get recent orders for status updates
        if (ordersData.data || ordersData.orders || Array.isArray(ordersData)) {
          const orders = ordersData.data || ordersData.orders || ordersData;
          const ordersArray = Array.isArray(orders) ? orders : [];
          const recentOrdersList = ordersArray.slice(0, 5).map((order: any) => ({
            _id: order._id || order.id,
            orderNumber: order.orderNumber || order.orderCode || `#${order._id?.slice(-6) || Math.random().toString(36).substr(2, 6)}`,
            customerName: order.customerName || order.customer?.name || order.user?.name || 'Khách hàng',
            total: order.total || 0,
            finalTotal: order.finalTotal || order.total || order.totalAmount || 0,
            status: order.status || 'pending',
            paymentStatus: order.paymentStatus || 'pending',
            createdAt: order.createdAt || new Date().toISOString(),
            updatedAt: order.updatedAt
          }));
          setRecentOrders(recentOrdersList);
        }
        
        setStats({
          earnings: totalRevenue,
          users: totalUsers,
          products: totalProducts,
          orders: totalOrders,
          lowStock: totalLowStock,
        });
        
        console.log('Fallback stats set:', {
          earnings: totalRevenue,
          users: totalUsers,
          products: totalProducts,
          orders: totalOrders,
          lowStock: totalLowStock,
        });
        
      } catch (error) {
        console.error('Fallback APIs also failed:', error);
        // Set default stats if all fails
        setStats({
          earnings: 0,
          users: 0,
          products: 0,
          orders: 0,
          lowStock: 0,
        });
      }
    }

    async function fetchStats() {
      setLoading(true);
      setError(null);
      try {
        const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        
        const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
        const headers = {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        };
        
        console.log('🚀 Fetching complete dashboard data...');
        
        try {
          const completeRes = await fetch(
            `${BASE_URL}/api/statistics/complete-dashboard?ordersPage=${currentPage}&ordersLimit=${ordersPerPage}&revenueChartPeriod=week`, 
            { headers }
          );
          
          console.log('📊 API Response Status:', completeRes.status);
          const completeData = await completeRes.json();
          
          console.log('✅ Complete Dashboard API Response:', completeData);
          
          if (completeData.success && completeData.data) {
            const data = completeData.data;
            
            setStats({
              earnings: data.totalRevenue || 0,
              users: data.totalUsers || 0,
              products: data.totalProducts || 0,
              orders: data.totalOrders || 0,
              lowStock: data.totalLowStock || 0,
            });
            
            if (data.recentOrders && Array.isArray(data.recentOrders)) {
              setRecentOrders(data.recentOrders);
            }
            
            if (data.paginatedOrders) {
              setAllOrders(data.paginatedOrders.data || []);
              if (data.paginatedOrders.pagination) {
                setCurrentPage(data.paginatedOrders.pagination.currentPage);
                setTotalPages(data.paginatedOrders.pagination.totalPages);
                setTotalOrders(data.paginatedOrders.pagination.total);
              }
            }
            
            if (data.revenueChart) {
              const chartData = [];
              if (data.revenueChart.labels && data.revenueChart.data) {
                for (let i = 0; i < data.revenueChart.labels.length; i++) {
                  chartData.push({
                    date: data.revenueChart.labels[i],
                    revenue: data.revenueChart.data[i] || 0
                  });
                }
              }
              setRevenueData(chartData.length > 0 ? chartData : [
                { date: '20/07', revenue: 1200000 },
                { date: '21/07', revenue: 1500000 },
                { date: '22/07', revenue: 1800000 },
                { date: '23/07', revenue: 1400000 },
                { date: '24/07', revenue: 2100000 },
                { date: '25/07', revenue: 1900000 },
                { date: '26/07', revenue: 2300000 },
              ]);
            }
            
            if (data.recentActivity && Array.isArray(data.recentActivity)) {
              setRecentActivity(data.recentActivity);
            } else {
              setRecentActivity([
                { type: 'order', description: 'Đơn hàng mới #12345', timeAgo: '2 phút trước' },
                { type: 'user', description: 'Người dùng mới đăng ký', timeAgo: '5 phút trước' },
                { type: 'order', description: 'Đơn hàng #12344 hoàn thành', timeAgo: '10 phút trước' },
              ]);
            }
            
            console.log('✅ All dashboard data updated successfully!');
            return;
          }
        } catch (completeError) {
          console.log('❌ Complete dashboard API failed, falling back to individual APIs...', completeError);
        }
        
        try {
          const dashboardRes = await fetch(`${BASE_URL}/api/statistics/dashboard`, { headers });
          const dashboardData = await dashboardRes.json();
          
          console.log('Dashboard API Response:', dashboardData);
          
          if (dashboardData.success && dashboardData.data) {
            console.log('Dashboard data:', dashboardData.data);
            setStats({
              earnings: dashboardData.data.totalRevenue || 0,
              users: dashboardData.data.totalUsers || 0,
              products: dashboardData.data.totalProducts || 0,
              orders: dashboardData.data.totalOrders || 0,
              lowStock: dashboardData.data.totalLowStock || 0,
            });
            console.log('Stats updated from dashboard API');
          } else {
            throw new Error('Dashboard API not available');
          }
        } catch (dashboardError) {
          console.log('Dashboard API failed, using fallback method...');
          await fetchFallbackStats(BASE_URL, headers);
        }

        console.log('📦 Fetching additional data from individual APIs...');

        if (recentOrders.length === 0) {
          try {
            const ordersRes = await fetch(`${BASE_URL}/api/orders?limit=5&sort=-createdAt`, { headers });
            const ordersData = await ordersRes.json();
            
            if (ordersData.data || ordersData.orders || Array.isArray(ordersData)) {
              const orders = ordersData.data || ordersData.orders || ordersData;
              const ordersArray = Array.isArray(orders) ? orders : [];
              const recentOrdersList = ordersArray.slice(0, 5).map((order: any) => ({
                _id: order._id || order.id,
                orderNumber: order.orderNumber || order.orderCode || `#${order._id?.slice(-6) || Math.random().toString(36).substr(2, 6)}`,
                customerName: order.customerName || order.customer?.name || order.user?.name || 'Khách hàng',
                total: order.finalTotal || order.total || order.totalAmount || 0,
                status: order.status || 'pending',
                createdAt: order.createdAt || new Date().toISOString(),
                updatedAt: order.updatedAt
              }));
              setRecentOrders(recentOrdersList);
            }
          } catch (error) {
            console.log('Failed to fetch recent orders, using empty list');
            setRecentOrders([]);
          }
        }

        if (allOrders.length === 0) {
          try {
            await loadOrdersPage(1);
          } catch (error) {
            console.log('Failed to fetch orders, using empty list');
            setAllOrders([]);
          }
        }

        if (revenueData.length === 0) {
          try {
            const revenueRes = await fetch(`${BASE_URL}/api/statistics/revenue-chart?period=week`, { headers });
            const revenueChartData = await revenueRes.json();
            
            if (revenueChartData.success && revenueChartData.data) {
              setRevenueData(revenueChartData.data);
            } else {
              setRevenueData([
                { date: '20/07', revenue: 1200000 },
                { date: '21/07', revenue: 1500000 },
                { date: '22/07', revenue: 1800000 },
                { date: '23/07', revenue: 1400000 },
                { date: '24/07', revenue: 2100000 },
                { date: '25/07', revenue: 1900000 },
                { date: '26/07', revenue: 2300000 },
              ]);
            }
          } catch (error) {
            console.log('Revenue chart API failed, using demo data');
            setRevenueData([
              { date: '20/07', revenue: 1200000 },
              { date: '21/07', revenue: 1500000 },
              { date: '22/07', revenue: 1800000 },
              { date: '23/07', revenue: 1400000 },
              { date: '24/07', revenue: 2100000 },
              { date: '25/07', revenue: 1900000 },
              { date: '26/07', revenue: 2300000 },
            ]);
          }
        }

        if (recentActivity.length === 0) {
          try {
            const activityRes = await fetch(`${BASE_URL}/api/statistics/recent-activity`, { headers });
            const activityData = await activityRes.json();
            
            if (activityData.success && activityData.data) {
              setRecentActivity(activityData.data);
            } else {
              setRecentActivity([
                { type: 'order', description: 'Đơn hàng mới #12345', timeAgo: '2 phút trước' },
                { type: 'user', description: 'Người dùng mới đăng ký', timeAgo: '5 phút trước' },
                { type: 'order', description: 'Đơn hàng #12344 hoàn thành', timeAgo: '10 phút trước' },
              ]);
            }
          } catch (error) {
            console.log('Recent activity API failed, using demo data');
            setRecentActivity([
              { type: 'order', description: 'Đơn hàng mới #12345', timeAgo: '2 phút trước' },
              { type: 'user', description: 'Người dùng mới đăng ký', timeAgo: '5 phút trước' },
              { type: 'order', description: 'Đơn hàng #12344 hoàn thành', timeAgo: '10 phút trước' },
            ]);
          }
        }

      } catch (error) {
        console.error('Lỗi khi tải dữ liệu dashboard:', error);
        setError('Không thể tải dữ liệu dashboard. Vui lòng thử lại sau.');
        setStats({
          earnings: 0,
          users: 0,
          products: 0,
          orders: 0,
          lowStock: 0,
        });
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  // Load initial revenue data
  useEffect(() => {
    loadRevenueData(chartPeriod);
    loadDailyRevenue();
  }, []);

  // Log để debug
  console.log('Current dashboard state:', {
    loading,
    stats,
    recentOrders: recentOrders.length,
    allOrders: allOrders.length,
    currentPage,
    totalPages,
    totalOrders,
    error
  });

  return (
    <>
      {/* Add CSS for animations */}
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      
      {/* Stats Grid Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        animation: 'fadeIn 0.6s ease-out'
      }}>
        <div>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: 0,
            marginBottom: '0.5rem'
          }}>🚀 Dashboard Admin</h2>
          <p style={{
            fontSize: '1rem',
            color: '#64748b',
            margin: 0,
            fontWeight: '500'
          }}>Chào mừng bạn đến với bảng điều khiển quản trị viên</p>
        </div>
        <button 
          onClick={refreshAllStats}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.875rem 1.75rem',
            borderRadius: '1rem',
            border: 'none',
            background: loading 
              ? 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)' 
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: loading ? '#94a3b8' : 'white',
            fontSize: '0.875rem',
            fontWeight: '700',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s',
            boxShadow: loading ? 'none' : '0 8px 25px rgba(102, 126, 234, 0.4)',
            transform: loading ? 'scale(0.98)' : 'scale(1)',
            animation: loading ? 'pulse 2s infinite' : 'none'
          }}
        >
          {loading ? (
            <>
              <div style={{
                width: '1rem',
                height: '1rem',
                border: '2px solid #94a3b8',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              Đang cập nhật...
            </>
          ) : (
            <>
              🔄 Làm mới dữ liệu
            </>
          )}
        </button>
      </div>
      
      {/* Stats Grid - Clean Component-Based Structure */}
      <section className={styles.statsGrid}>
        <StatCard
          title="Tổng Doanh Thu"
          value={stats.earnings}
          icon="💰"
          variant="revenue"
          change={{
            type: 'positive',
            value: '+12% so với tháng trước',
            icon: '↗'
          }}
          note="*Tính từ tổng các đơn hàng đã thanh toán"
        />

        <StatCard
          title="Doanh thu hôm nay"
          value={dailyRevenue.today}
          icon="📈"
          variant="daily-revenue"
          change={{
            type: dailyRevenue.changePercent >= 0 ? 'positive' : 'negative',
            value: `${dailyRevenue.changePercent >= 0 ? '+' : ''}${dailyRevenue.changePercent.toFixed(1)}% so với hôm qua`,
            icon: dailyRevenue.changePercent >= 0 ? '↗' : '↘'
          }}
          note={`*${dailyRevenue.todayOrders} đơn hàng hôm nay`}
        />

        <StatCard
          title="Đơn Hàng"
          value={stats.orders}
          icon="📦"
          variant="orders"
          change={{
            type: 'positive',
            value: '+8% so với tháng trước',
            icon: '↗'
          }}
        />

        <StatCard
          title="Người Dùng"
          value={stats.users}
          icon="👤"
          variant="users"
          change={{
            type: 'positive',
            value: '+15% so với tháng trước',
            icon: '↗'
          }}
        />

        <StatCard
          title="Sản phẩm sắp hết hàng"
          value={stats.lowStock || 0}
          icon="⚠️"
          variant="lowStock"
          change={{
            type: stats.lowStock > 5 ? 'negative' : 'neutral',
            value: stats.lowStock > 5 ? 'Cần nhập thêm hàng' : 'Tình trạng ổn định',
            icon: stats.lowStock > 5 ? '↗' : '→'
          }}
          note="*Sản phẩm có stock dưới 5"
        />
      </section>

      {loading && (
        <div className={styles.loading} style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '3rem',
          fontSize: '1.1rem',
          color: '#64748b'
        }}>
          <div style={{
            width: '2rem',
            height: '2rem',
            border: '3px solid #e2e8f0',
            borderTop: '3px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginRight: '1rem'
          }}></div>
          Đang tải dữ liệu dashboard...
        </div>
      )}

      {error && (
        <div className={styles.error} style={{
          background: 'linear-gradient(145deg, #fee2e2 0%, #fecaca 100%)',
          border: '1px solid #f87171',
          borderRadius: '1rem',
          padding: '1rem',
          margin: '1rem 0',
          color: '#dc2626',
          fontWeight: '600'
        }}>
          {error}
        </div>
      )}
    </>
  );
}
