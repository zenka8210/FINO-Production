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
    lowStock: 0, // Replace news with lowStock
  });
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [recentOrders, setRecentOrders] = useState<OrderItem[]>([]);
  const [allOrders, setAllOrders] = useState<OrderItem[]>([]);
  const [showAllOrders, setShowAllOrders] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<string>("");
  
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

  useEffect(() => {
    // Đợi AuthContext load xong trước khi kiểm tra
    // if (isLoading) return;
    
    // if (!user || user.role !== "admin") {
    //   router.replace("/login");
    //   return;
    // }

    // Fallback function to get stats from individual APIs
    async function fetchFallbackStats(baseUrl: string, headers: any) {
      try {
        console.log('Trying fallback APIs...');
        
        // Try to get orders data - ưu tiên API orders để tính doanh thu
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
        
        // Calculate revenue from orders - FIXED: Use consistent logic with backend
        let totalRevenue = 0;
        if (ordersData.data || ordersData.orders || Array.isArray(ordersData)) {
          const orders = ordersData.data || ordersData.orders || ordersData;
          console.log('Processing orders for revenue calculation:', orders.length, 'orders');
          
          totalRevenue = orders.reduce((sum: number, order: any, index: number) => {
            // Ưu tiên các trường có thể chứa tổng tiền đơn hàng
            const orderTotal = order.finalTotal || 
                              order.total || 
                              order.totalAmount || 
                              order.totalPrice ||
                              order.grandTotal ||
                              order.amount ||
                              0;
            
            // FIXED: Sử dụng logic nhất quán với backend - chỉ tính đơn hàng đã thanh toán
            const paymentStatus = (order.paymentStatus || '').toLowerCase();
            const isPaid = paymentStatus === 'paid';
            
            console.log(`Order ${index + 1}:`, {
              id: order._id || order.id,
              total: orderTotal,
              paymentStatus: paymentStatus,
              isPaid: isPaid
            });
            
            // Chỉ tính revenue từ các đơn hàng đã thanh toán (paymentStatus: 'paid')
            if (isPaid) {
              const parsedTotal = parseFloat(orderTotal) || 0;
              console.log(`Adding ${parsedTotal} to revenue (payment confirmed)`);
              return sum + parsedTotal;
            }
            
            return sum;
          }, 0);
          
          console.log('Final calculated revenue (FIXED):', totalRevenue);
        }
        
        // Lấy đơn hàng gần đây cho việc cập nhật trạng thái
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
        // Fetch ALL dashboard data từ API tổng hợp mới
        const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        
        // Lấy token từ localStorage
        const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
        const headers = {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        };
        
        console.log('� Auth Token:', token ? 'Token found' : 'No token');
        console.log('📋 Request Headers:', headers);
        console.log('�🚀 Fetching complete dashboard data in single API call...');
        
        // Gọi API tổng hợp mới với tất cả dữ liệu cần thiết
        try {
          const completeRes = await fetch(
            `${BASE_URL}/api/statistics/complete-dashboard?ordersPage=${currentPage}&ordersLimit=${ordersPerPage}&revenueChartPeriod=week`, 
            { headers }
          );
          
          console.log('📊 API Response Status:', completeRes.status);
          console.log('📊 API Response OK:', completeRes.ok);
          
          const completeData = await completeRes.json();
          
          console.log('✅ Complete Dashboard API Response:', completeData);
          
          if (completeData.success && completeData.data) {
            const data = completeData.data;
            
            // Update stats
            setStats({
              earnings: data.totalRevenue || 0,
              users: data.totalUsers || 0,
              products: data.totalProducts || 0,
              orders: data.totalOrders || 0,
              lowStock: data.totalLowStock || 0,
            });
            
            // Update recent orders
            if (data.recentOrders && Array.isArray(data.recentOrders)) {
              setRecentOrders(data.recentOrders);
            }
            
            // Update paginated orders
            if (data.paginatedOrders) {
              setAllOrders(data.paginatedOrders.data || []);
              if (data.paginatedOrders.pagination) {
                setCurrentPage(data.paginatedOrders.pagination.currentPage);
                setTotalPages(data.paginatedOrders.pagination.totalPages);
                setTotalOrders(data.paginatedOrders.pagination.total);
              }
            }
            
            // Update revenue chart data
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
            
            // Update recent activity
            if (data.recentActivity && Array.isArray(data.recentActivity)) {
              setRecentActivity(data.recentActivity);
            } else {
              setRecentActivity([
                { type: 'order', description: 'Đơn hàng mới #12345', timeAgo: '2 phút trước' },
                { type: 'user', description: 'Người dùng mới đăng ký', timeAgo: '5 phút trước' },
                { type: 'order', description: 'Đơn hàng #12344 hoàn thành', timeAgo: '10 phút trước' },
              ]);
            }
            
            console.log('✅ All dashboard data updated successfully from single API call!');
            return; // Exit early, we got everything we need
          }
        } catch (completeError) {
          console.log('❌ Complete dashboard API failed, falling back to individual APIs...', completeError);
        }
        
        // Fallback: Thử lấy thống kê dashboard cơ bản trước
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
          // Fallback: lấy dữ liệu từ từng API riêng lẻ
          await fetchFallbackStats(BASE_URL, headers);
        }

        // Chỉ fetch dữ liệu bổ sung nếu API tổng hợp thất bại
        console.log('📦 Fetching additional data from individual APIs...');

        // Lấy danh sách đơn hàng gần đây (nếu chưa có từ API tổng hợp)
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

        // Lấy tất cả đơn hàng để hiển thị khi cần (nếu chưa có từ API tổng hợp)
        if (allOrders.length === 0) {
          try {
            // Load first page of orders with pagination
            await loadOrdersPage(1);
          } catch (error) {
            console.log('Failed to fetch orders, using empty list');
            setAllOrders([]);
          }
        }

        // Lấy dữ liệu biểu đồ doanh thu (nếu chưa có từ API tổng hợp)
        if (revenueData.length === 0) {
          try {
            const revenueRes = await fetch(`${BASE_URL}/api/statistics/revenue-chart?period=week`, { headers });
            const revenueChartData = await revenueRes.json();
            
            if (revenueChartData.success && revenueChartData.data) {
              setRevenueData(revenueChartData.data);
            } else {
              // Fallback: tạo dữ liệu demo cho biểu đồ
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

        // Lấy hoạt động gần đây (nếu chưa có từ API tổng hợp)
        if (recentActivity.length === 0) {
          try {
            const activityRes = await fetch(`${BASE_URL}/api/statistics/recent-activity`, { headers });
            const activityData = await activityRes.json();
            
            if (activityData.success && activityData.data) {
              setRecentActivity(activityData.data);
            } else {
              // Fallback: tạo dữ liệu demo cho hoạt động gần đây
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
        // Fallback to demo data nếu có lỗi
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
  }, []); // [user, router, isLoading]);

  // Load initial revenue data
  useEffect(() => {
    loadRevenueData(chartPeriod);
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

  // Handle chart period change
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
          const orderTotal = order.finalTotal || 
                            order.total || 
                            order.totalAmount || 
                            order.totalPrice ||
                            order.grandTotal ||
                            order.amount ||
                            0;
          
          // FIXED: Use consistent logic - only count orders with paymentStatus: 'paid'
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
      console.log('🔄 Refreshing all stats using optimized API...');
      
      // Try the optimized complete dashboard API first
      try {
        const completeRes = await fetch(
          `${BASE_URL}/api/statistics/complete-dashboard?ordersPage=${currentPage}&ordersLimit=${ordersPerPage}&revenueChartPeriod=week`,
          { headers }
        );
        const completeData = await completeRes.json();
        
        if (completeData.success && completeData.data) {
          const data = completeData.data;
          
          // Update all states from single API call
          setStats({
            earnings: data.totalRevenue || 0,
            users: data.totalUsers || 0,
            products: data.totalProducts || 0,
            orders: data.totalOrders || 0,
            lowStock: data.totalLowStock || 0,
          });
          
          if (data.recentOrders) setRecentOrders(data.recentOrders);
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
            if (chartData.length > 0) setRevenueData(chartData);
          }
          if (data.recentActivity) setRecentActivity(data.recentActivity);
          
          console.log('✅ All data refreshed successfully from optimized API!');
          alert('Dữ liệu đã được cập nhật thành công!');
          return;
        }
      } catch (error) {
        console.log('❌ Optimized API failed, falling back to individual APIs...', error);
      }
      
      // Fallback: Try dashboard API first
      try {
        const dashboardRes = await fetch(`${BASE_URL}/api/statistics/dashboard`, { headers });
        const dashboardData = await dashboardRes.json();
        
        if (dashboardData.success && dashboardData.data) {
          setStats({
            earnings: dashboardData.data.totalRevenue || 0,
            users: dashboardData.data.totalUsers || 0,
            products: dashboardData.data.totalProducts || 0,
            orders: dashboardData.data.totalOrders || 0,
            lowStock: dashboardData.data.totalLowStock || 0,
          });
          console.log('All stats refreshed from dashboard API');
        } else {
          throw new Error('Dashboard API not available');
        }
      } catch (error) {
        console.log('Dashboard API failed, using individual APIs...');
        
        // Fallback to individual APIs
        const [ordersRes, usersRes, productsRes, newsRes] = await Promise.all([
          fetch(`${BASE_URL}/api/orders`, { headers }).catch(() => null),
          fetch(`${BASE_URL}/api/users`, { headers }).catch(() => null),
          fetch(`${BASE_URL}/api/products`, { headers }).catch(() => null),
          fetch(`${BASE_URL}/api/posts`, { headers }).catch(() => null)
        ]);

        let newStats = { earnings: 0, users: 0, products: 0, orders: 0, lowStock: 0 };

        if (ordersRes) {
          const ordersData = await ordersRes.json();
          const orders = ordersData.data || ordersData.orders || ordersData;
          if (Array.isArray(orders)) {
            newStats.orders = orders.length;
            // FIXED: Use consistent revenue logic
            newStats.earnings = orders.reduce((sum: number, order: any) => {
              const orderTotal = order.finalTotal || order.total || order.totalAmount || 0;
              // Only count paid orders
              const paymentStatus = (order.paymentStatus || '').toLowerCase();
              const isPaid = paymentStatus === 'paid';
              return isPaid ? sum + parseFloat(orderTotal || 0) : sum;
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
          if (Array.isArray(products)) newStats.products = products.length;
        }

        if (newsRes) {
          const newsData = await newsRes.json();
          const news = newsData.data || newsData.posts || newsData;
          if (Array.isArray(news)) newStats.lowStock = news.length; // Temporary, should be changed to actual low stock API
        }

        setStats(newStats);
        console.log('All stats refreshed from individual APIs:', newStats);
      }
      
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
        // Update local state với data mới từ server response (bao gồm cả paymentStatus đã tự động cập nhật)
        const updatedOrder = result.data || result.order;
        
        setRecentOrders(prev => 
          prev.map(order => 
            order._id === orderId 
              ? { 
                  ...order, 
                  status: newStatus, 
                  paymentStatus: updatedOrder?.paymentStatus || order.paymentStatus,
                  updatedAt: new Date().toISOString() 
                }
              : order
          )
        );
        
        setAllOrders(prev => 
          prev.map(order => 
            order._id === orderId 
              ? { 
                  ...order, 
                  status: newStatus, 
                  paymentStatus: updatedOrder?.paymentStatus || order.paymentStatus,
                  updatedAt: new Date().toISOString() 
                }
              : order
          )
        );
        
        // Refresh revenue if status affects payment
        const statusesThatMightAffectPayment = ['delivered', 'cancelled'];
        if (statusesThatMightAffectPayment.includes(newStatus.toLowerCase())) {
          console.log('🔄 Status change might affect revenue, refreshing...');
          refreshRevenueData();
        }
        
        console.log('Order status updated successfully');
        
        // Refresh all dashboard data to sync with database
        console.log('🔄 Refreshing dashboard data to sync with database...');
        await loadOrdersPage(currentPage);
        await loadRevenueData();
        
        // Show success message with COD auto-payment info if applicable
        let successMessage = 'Cập nhật trạng thái đơn hàng thành công!';
        if (newStatus === 'delivered' && updatedOrder?.paymentStatus === 'paid') {
          successMessage += '\n� Trạng thái thanh toán COD đã tự động cập nhật thành "Đã thanh toán".';
        }
        
        alert(successMessage);
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
        // Update local state for recent orders
        setRecentOrders(prev => 
          prev.map(order => 
            order._id === orderId 
              ? { ...order, paymentStatus: newPaymentStatus, updatedAt: new Date().toISOString() }
              : order
          )
        );
        
        // Update local state for all orders
        setAllOrders(prev => 
          prev.map(order => 
            order._id === orderId 
              ? { ...order, paymentStatus: newPaymentStatus, updatedAt: new Date().toISOString() }
              : order
          )
        );
        
        // Refresh all data to sync with database
        console.log('🔄 Payment status changed, refreshing all data...');
        await loadOrdersPage(currentPage);
        await loadRevenueData();
        
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

  // Function to auto-fix order inconsistencies
  const autoFixOrderInconsistencies = async (orderId: string) => {
    const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

    try {
      const response = await fetch(`${BASE_URL}/api/orders/admin/${orderId}/auto-fix`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      
      if (result.success) {
        // Update local state for recent orders
        setRecentOrders(prev => 
          prev.map(order => 
            order._id === orderId 
              ? { 
                  ...order, 
                  paymentStatus: result.data.order.paymentStatus,
                  status: result.data.order.status,
                  updatedAt: new Date().toISOString() 
                }
              : order
          )
        );
        
        // Update local state for all orders
        setAllOrders(prev => 
          prev.map(order => 
            order._id === orderId 
              ? { 
                  ...order, 
                  paymentStatus: result.data.order.paymentStatus,
                  status: result.data.order.status,
                  updatedAt: new Date().toISOString() 
                }
              : order
          )
        );
        
        // Refresh revenue if fixes affect payment status
        refreshRevenueData();
        
        alert(`Đã sửa thành công!\n${result.message}`);
      } else {
        alert(`Không thể tự động sửa:\n${result.message}`);
      }
    } catch (error) {
      console.error('Failed to auto-fix order:', error);
      alert('Lỗi khi tự động sửa đơn hàng. Vui lòng thử lại!');
    }
  };

  // Hiển thị loading khi đang load auth hoặc chưa có user
  // if (isLoading) {
  //   return (
  //     <div className={styles.loading}>
  //       <div className={styles.spinner}></div>
  //       <span className={styles.loadingText}>Đang tải...</span>
  //     </div>
  //   );
  // }

  // if (!user || user.role !== "admin") {
  //   return null;
  // }

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
          <span style={{ 
            animation: loading ? 'spin 1s linear infinite' : 'none',
            display: 'inline-block',
            fontSize: '1.1rem'
          }}>🔄</span>
          {loading ? 'Đang cập nhật...' : 'Làm mới tất cả'}
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
          onRefresh={refreshRevenueData}
          refreshLabel="Làm mới dữ liệu doanh thu"
          loading={loading}
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

          {/* Charts Section */}
          <div className={styles.chartsSection} style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: '1.5rem',
            marginTop: '1rem'
          }}>
            <div className={styles.salesAnalysisCard} style={{
              background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
              border: '1px solid rgba(226, 232, 240, 0.8)',
              borderRadius: '1.5rem',
              padding: '1.5rem',
              boxShadow: '0 10px 20px rgba(0, 0, 0, 0.06), 0 4px 8px rgba(0, 0, 0, 0.03)'
            }}>
              <div className={styles.chartHeader} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem'
              }}>
                <h3 className={styles.chartTitle}>Phân tích bán hàng</h3>
                <div className={styles.chartFilters}>
                  <button 
                    className={`${styles.chartFilterButton} ${chartPeriod === '7' ? styles.active : ''}`}
                    onClick={() => handleChartPeriodChange('7')}
                    disabled={isLoadingChart}
                  >
                    7 ngày
                  </button>
                  <button 
                    className={`${styles.chartFilterButton} ${chartPeriod === '30' ? styles.active : ''}`}
                    onClick={() => handleChartPeriodChange('30')}
                    disabled={isLoadingChart}
                  >
                    30 ngày
                  </button>
                  <button 
                    className={`${styles.chartFilterButton} ${chartPeriod === '90' ? styles.active : ''}`}
                    onClick={() => handleChartPeriodChange('90')}
                    disabled={isLoadingChart}
                  >
                    90 ngày
                  </button>
                </div>
              </div>
              <div className={styles.chartContainer}>
                {isLoadingChart ? (
                  <div className={styles.chartLoading}>
                    <div className={styles.chartLoadingSpinner}></div>
                    Đang tải dữ liệu...
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid stroke="#e3eafc" strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        fontSize={13}
                        axisLine={{ stroke: '#e2e8f0' }}
                        tickLine={{ stroke: '#e2e8f0' }}
                      />
                      <YAxis 
                        fontSize={13}
                        axisLine={{ stroke: '#e2e8f0' }}
                        tickLine={{ stroke: '#e2e8f0' }}
                        tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                      />
                      <Tooltip 
                        formatter={(value, name) => [
                          `${Number(value).toLocaleString('vi-VN')}₫`, 
                          'Doanh thu'
                        ]}
                        labelFormatter={(label) => `Ngày: ${label}`}
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid #e2e8f0',
                          borderRadius: '0.75rem',
                          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Bar 
                        dataKey="revenue" 
                        fill="url(#barGradient)"
                        radius={[4, 4, 0, 0]}
                      />
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#667eea" />
                          <stop offset="100%" stopColor="#764ba2" />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className={styles.recentActivities} style={{
              background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
              border: '1px solid rgba(226, 232, 240, 0.8)',
              borderRadius: '1.5rem',
              padding: '1.5rem',
              boxShadow: '0 10px 20px rgba(0, 0, 0, 0.06), 0 4px 8px rgba(0, 0, 0, 0.03)'
            }}>
              <div className={styles.activitiesHeader} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem'
              }}>
                <h3 className={styles.activitiesTitle} style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: '#1e293b'
                }}>Hoạt động gần đây</h3>
              </div>
              <div className={styles.activitiesList} style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity, index) => (
                    <div key={index} className={styles.activityItem} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      borderRadius: '1rem',
                      background: 'rgba(248, 250, 252, 0.5)'
                    }}>
                      <div className={`${styles.activityIcon} ${styles[activity.type]}`} style={{
                        width: '2.5rem',
                        height: '2.5rem',
                        borderRadius: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1rem',
                        background: activity.type === 'order' 
                          ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                          : activity.type === 'user'
                          ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
                          : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                      }}>
                        {activity.type === 'order' ? '🛒' : activity.type === 'user' ? '👤' : '📦'}
                      </div>
                      <div className={styles.activityContent}>
                        <div className={styles.activityText} style={{
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          color: '#1e293b',
                          marginBottom: '0.25rem'
                        }}>
                          {activity.description}
                        </div>
                        <div className={styles.activityTime} style={{
                          fontSize: '0.8rem',
                          color: '#64748b'
                        }}>{activity.timeAgo}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={styles.activityItem} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem',
                    borderRadius: '1rem',
                    background: 'rgba(248, 250, 252, 0.5)'
                  }}>
                    <div className={`${styles.activityIcon} ${styles.order}`} style={{
                      width: '3rem',
                      height: '3rem',
                      borderRadius: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.25rem',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    }}>�</div>
                    <div className={styles.activityContent}>
                      <div className={styles.activityText} style={{
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        color: '#1e293b',
                        marginBottom: '0.25rem'
                      }}>
                        Đơn hàng mới <span className={styles.activityValue} style={{
                          color: '#667eea',
                          fontWeight: '700'
                        }}>#12345</span>
                      </div>
                      <div className={styles.activityTime} style={{
                        fontSize: '0.8rem',
                        color: '#64748b'
                      }}>2 phút trước</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Order Management Section - Redesigned */}
          <div className={styles.orderManagementSection}>
            {/* Header Section */}
            <div className={styles.orderManagementHeader}>
              <div className={styles.orderHeaderContent}>
                <div className={styles.orderHeaderInfo}>
                  <h3>📦 Đơn hàng gần đây</h3>
                  <p>
                    {showAllOrders 
                      ? `Trang ${currentPage}/${totalPages} - Hiển thị ${allOrders.length} trong tổng ${totalOrders} đơn hàng`
                      : `Hiển thị ${recentOrders.length} đơn hàng gần đây`
                    }
                  </p>
                </div>
                <div className={styles.orderHeaderActions}>
                  {isLoadingOrders && (
                    <div className={styles.orderLoadingIndicator}>
                      <span className={styles.orderLoadingSpinner}>⏳</span>
                      Đang tải...
                    </div>
                  )}
                  <button 
                    onClick={() => {
                      setShowAllOrders(!showAllOrders);
                      if (!showAllOrders) {
                        loadOrdersPage(1);
                      }
                    }}
                    disabled={isLoadingOrders}
                    className={`${styles.orderActionButton} ${showAllOrders ? styles.active : ''}`}
                  >
                    {showAllOrders ? 'Ẩn bớt' : 'Xem tất cả'}
                  </button>
                  <button 
                    onClick={() => window.location.href = '/admin/orders'}
                    className={`${styles.orderActionButton} ${styles.secondary}`}
                  >
                    Trang quản lý
                  </button>
                </div>
              </div>
            </div>
            
            {/* Content Section */}
            <div className={styles.orderManagementContent}>
              <div className={styles.ordersListContainer}>
                <div className={`${styles.ordersList} ${showAllOrders ? styles.expanded : ''} ${showAllOrders && allOrders.length > 10 ? styles.scrollable : ''}`}>
                {(showAllOrders ? allOrders : recentOrders).length > 0 ? (
                  (showAllOrders ? allOrders : recentOrders).map((order) => (
                    <div key={order._id} className={styles.orderItem}>
                      {/* Order Icon */}
                      <div className={styles.orderIcon}>
                        📦
                      </div>
                      
                      {/* Order Details */}
                      <div className={styles.orderInfo}>
                        <div className={styles.orderCode}>
                          {order.orderNumber}
                        </div>
                        <div className={styles.orderCustomer}>
                          👤 {order.customerName}
                        </div>
                        <div className={styles.orderDate}>
                          🕒 {new Date(order.createdAt).toLocaleDateString('vi-VN')} - {new Date(order.createdAt).toLocaleTimeString('vi-VN', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                      
                      {/* Order Total */}
                      <div className={styles.orderAmount}>
                        💰 {(order.finalTotal || order.total).toLocaleString('vi-VN')}₫
                      </div>
                      
                      {/* Current Status */}
                      <div className={`${styles.orderStatus} ${styles[order.status] || ''}`}>
                        {getStatusLabel(order.status)}
                      </div>
                      
                      {/* Payment Status */}
                      <div className={`${styles.paymentStatus} ${styles[(order.paymentStatus || 'pending')] || ''}`} 
                           style={{ backgroundColor: getPaymentStatusColor(order.paymentStatus || 'pending') }}>
                        {getPaymentStatusLabel(order.paymentStatus || 'pending')}
                      </div>
                      
                      {/* Status Selector */}
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className={styles.orderStatusSelect}
                      >
                        <option value="pending">🕐 Chờ xử lý</option>
                        <option value="processing">⚙️ Đang xử lý</option>
                        <option value="shipped">🚚 Đã gửi hàng</option>
                        <option value="delivered">📦 Đã giao hàng</option>
                        <option value="cancelled">❌ Đã hủy</option>
                      </select>
                      
                      {/* Payment Status Selector */}
                      <select
                        value={order.paymentStatus || 'pending'}
                        onChange={(e) => updatePaymentStatus(order._id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className={styles.paymentStatusSelect}
                      >
                        <option value="pending">💳 Chờ thanh toán</option>
                        <option value="paid">✅ Đã thanh toán</option>
                        <option value="failed">❌ Thất bại</option>
                        <option value="cancelled">🚫 Đã hủy</option>
                      </select>
                    </div>
                  ))
                ) : (
                  <div className={styles.noOrdersMessage}>
                    <div className={styles.noOrdersIcon}>📦</div>
                    <div className={styles.noOrdersTitle}>
                      Chưa có đơn hàng nào
                    </div>
                    <div className={styles.noOrdersSubtitle}>
                      Các đơn hàng mới sẽ hiển thị ở đây
                    </div>
                  </div>
                )}
              </div>

              {/* Pagination Controls - chỉ hiển thị khi xem tất cả và có nhiều trang */}
              {showAllOrders && totalPages > 1 && (
                <div className={styles.orderPagination}>
                  <button
                    onClick={() => loadOrdersPage(currentPage - 1)}
                    disabled={currentPage === 1 || isLoadingOrders}
                    className={styles.paginationButton}
                  >
                    ← Trước
                  </button>

                  <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    alignItems: 'center'
                  }}>
                    {/* Hiển thị số trang */}
                    {(() => {
                      const pages = [];
                      const showPages = 5; // Hiển thị tối đa 5 trang
                      let startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
                      let endPage = Math.min(totalPages, startPage + showPages - 1);
                      
                      // Điều chỉnh startPage nếu endPage đã ở cuối
                      startPage = Math.max(1, endPage - showPages + 1);

                      // Nút trang đầu nếu cần
                      if (startPage > 1) {
                        pages.push(
                          <button
                            key={1}
                            onClick={() => loadOrdersPage(1)}
                            disabled={isLoadingOrders}
                            style={{
                              padding: '0.5rem 0.75rem',
                              borderRadius: '0.5rem',
                              border: '1px solid #d1d5db',
                              background: 'white',
                              color: '#374151',
                              fontSize: '0.875rem',
                              fontWeight: '500',
                              cursor: isLoadingOrders ? 'not-allowed' : 'pointer',
                              minWidth: '2.5rem',
                              transition: 'all 0.2s',
                              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                            }}
                            onMouseEnter={(e) => {
                              if (!isLoadingOrders) {
                                e.currentTarget.style.background = '#667eea';
                                e.currentTarget.style.color = 'white';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isLoadingOrders) {
                                e.currentTarget.style.background = 'white';
                                e.currentTarget.style.color = '#374151';
                                e.currentTarget.style.transform = 'translateY(0)';
                              }
                            }}
                          >
                            1
                          </button>
                        );
                        if (startPage > 2) {
                          pages.push(<span key="dots1" style={{ color: '#9ca3af', fontWeight: '600' }}>...</span>);
                        }
                      }

                      // Các trang ở giữa
                      for (let i = startPage; i <= endPage; i++) {
                        pages.push(
                          <button
                            key={i}
                            onClick={() => loadOrdersPage(i)}
                            disabled={isLoadingOrders}
                            style={{
                              padding: '0.5rem 0.75rem',
                              borderRadius: '0.5rem',
                              border: '1px solid #d1d5db',
                              background: i === currentPage ? '#667eea' : 'white',
                              color: i === currentPage ? 'white' : '#374151',
                              fontSize: '0.875rem',
                              fontWeight: i === currentPage ? '700' : '500',
                              cursor: isLoadingOrders ? 'not-allowed' : 'pointer',
                              minWidth: '2.5rem',
                              transition: 'all 0.2s',
                              boxShadow: i === currentPage ? '0 4px 12px rgba(102, 126, 234, 0.4)' : '0 2px 4px rgba(0, 0, 0, 0.1)',
                              transform: i === currentPage ? 'scale(1.05)' : 'scale(1)'
                            }}
                            onMouseEnter={(e) => {
                              if (!isLoadingOrders && i !== currentPage) {
                                e.currentTarget.style.background = '#667eea';
                                e.currentTarget.style.color = 'white';
                                e.currentTarget.style.transform = 'translateY(-1px) scale(1.05)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isLoadingOrders && i !== currentPage) {
                                e.currentTarget.style.background = 'white';
                                e.currentTarget.style.color = '#374151';
                                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                              }
                            }}
                          >
                            {i}
                          </button>
                        );
                      }

                      // Nút trang cuối nếu cần
                      if (endPage < totalPages) {
                        if (endPage < totalPages - 1) {
                          pages.push(<span key="dots2" style={{ color: '#9ca3af', fontWeight: '600' }}>...</span>);
                        }
                        pages.push(
                          <button
                            key={totalPages}
                            onClick={() => loadOrdersPage(totalPages)}
                            disabled={isLoadingOrders}
                            style={{
                              padding: '0.5rem 0.75rem',
                              borderRadius: '0.5rem',
                              border: '1px solid #d1d5db',
                              background: 'white',
                              color: '#374151',
                              fontSize: '0.875rem',
                              fontWeight: '500',
                              cursor: isLoadingOrders ? 'not-allowed' : 'pointer',
                              minWidth: '2.5rem',
                              transition: 'all 0.2s',
                              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                            }}
                            onMouseEnter={(e) => {
                              if (!isLoadingOrders) {
                                e.currentTarget.style.background = '#667eea';
                                e.currentTarget.style.color = 'white';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isLoadingOrders) {
                                e.currentTarget.style.background = 'white';
                                e.currentTarget.style.color = '#374151';
                                e.currentTarget.style.transform = 'translateY(0)';
                              }
                            }}
                          >
                            {totalPages}
                          </button>
                        );
                      }

                      return pages;
                    })()}
                  </div>

                  <button
                    onClick={() => loadOrdersPage(currentPage + 1)}
                    disabled={currentPage === totalPages || isLoadingOrders}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: '0.75rem',
                      border: '1px solid #d1d5db',
                      background: currentPage === totalPages || isLoadingOrders ? '#f9fafb' : 'white',
                      color: currentPage === totalPages || isLoadingOrders ? '#9ca3af' : '#374151',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: currentPage === totalPages || isLoadingOrders ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      boxShadow: currentPage === totalPages || isLoadingOrders ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.1)'
                    }}
                    onMouseEnter={(e) => {
                      if (currentPage !== totalPages && !isLoadingOrders) {
                        e.currentTarget.style.background = '#667eea';
                        e.currentTarget.style.color = 'white';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (currentPage !== totalPages && !isLoadingOrders) {
                        e.currentTarget.style.background = 'white';
                        e.currentTarget.style.color = '#374151';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                      }
                    }}
                  >
                    Sau →
                  </button>

                  {/* Thông tin trang hiện tại */}
                  <div style={{
                    marginLeft: '1rem',
                    padding: '0.75rem 1rem',
                    background: 'rgba(102, 126, 234, 0.1)',
                    borderRadius: '0.75rem',
                    border: '1px solid rgba(102, 126, 234, 0.2)',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#4338ca',
                    minWidth: '120px',
                    textAlign: 'center'
                  }}>
                    Trang {currentPage}/{totalPages}
                  </div>
                </div>
              )}
              
              {/* Summary Stats - Inside ordersList for proper layout */}
              {(showAllOrders ? allOrders : recentOrders).length > 0 && (
                <div className={styles.orderStatsContainer}>
                  <div className={styles.orderStatsGrid}>
                    <div className={`${styles.orderStatItem} ${styles.total}`}>
                      <div className={`${styles.orderStatIcon} ${styles.total}`}>📊</div>
                      <div className={styles.orderStatInfo}>
                        <div className={styles.orderStatLabel}>Tổng đơn hàng</div>
                        <div className={styles.orderStatValue}>{(showAllOrders ? allOrders : recentOrders).length}</div>
                      </div>
                    </div>
                    
                    <div className={`${styles.orderStatItem} ${styles.revenue}`}>
                      <div className={`${styles.orderStatIcon} ${styles.revenue}`}>💰</div>
                      <div className={styles.orderStatInfo}>
                        <div className={styles.orderStatLabel}>Tổng giá trị</div>
                        <div className={styles.orderStatValue}>{(showAllOrders ? allOrders : recentOrders).reduce((sum, order) => sum + order.total, 0).toLocaleString('vi-VN')}₫</div>
                      </div>
                    </div>
                    
                    <div className={`${styles.orderStatItem} ${styles.completed}`}>
                      <div className={`${styles.orderStatIcon} ${styles.completed}`}>✅</div>
                      <div className={styles.orderStatInfo}>
                        <div className={styles.orderStatLabel}>Hoàn thành</div>
                        <div className={styles.orderStatValue}>{(showAllOrders ? allOrders : recentOrders).filter(order => 
                          ['delivered'].includes(order.status.toLowerCase())
                        ).length}</div>
                      </div>
                    </div>
                    
                    <div className={`${styles.orderStatItem} ${styles.pending}`}>
                      <div className={`${styles.orderStatIcon} ${styles.pending}`}>⏳</div>
                      <div className={styles.orderStatInfo}>
                        <div className={styles.orderStatLabel}>Đang xử lý</div>
                        <div className={styles.orderStatValue}>{(showAllOrders ? allOrders : recentOrders).filter(order => 
                          ['pending', 'processing', 'shipped'].includes(order.status.toLowerCase())
                        ).length}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              </div>
            </div>
          </div>

          {loading && (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <span className={styles.loadingText}>Đang tải dữ liệu...</span>
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
