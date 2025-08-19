"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import styles from "./admin-new.module.css";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

// Type definitions
interface DashboardStats {
  revenue: number;
  orders: number;
  users: number;
  products: number;
  growth: {
    revenue: number;
    orders: number;
    users: number;
  };
}

interface ChartData {
  name: string;
  value: number;
  color?: string;
}

interface RecentActivity {
  id: string;
  type: 'order' | 'user' | 'product';
  message: string;
  time: string;
  icon: string;
}

export default function AdminPageNew() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  
  const [stats, setStats] = useState<DashboardStats>({
    revenue: 0,
    orders: 0,
    users: 0,
    products: 0,
    growth: {
      revenue: 0,
      orders: 0,
      users: 0,
    }
  });
  
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [pieData, setPieData] = useState<ChartData[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [darkMode, setDarkMode] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    // Set current time
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleString('vi-VN'));
    };
    updateTime();
    const timeInterval = setInterval(updateTime, 1000);

    // Load mock data
    const mockStats = {
      revenue: 15750000,
      orders: 248,
      users: 1847,
      products: 156,
      growth: {
        revenue: 23.5,
        orders: 12.8,
        users: 18.2,
      }
    };

    const mockChartData = [
      { name: 'T2', value: 2100000 },
      { name: 'T3', value: 1800000 },
      { name: 'T4', value: 2400000 },
      { name: 'T5', value: 2800000 },
      { name: 'T6', value: 3200000 },
      { name: 'T7', value: 2900000 },
      { name: 'CN', value: 3500000 },
    ];

    const mockPieData = [
      { name: 'Hoàn thành', value: 65, color: '#10B981' },
      { name: 'Đang xử lý', value: 25, color: '#F59E0B' },
      { name: 'Đã hủy', value: 10, color: '#EF4444' },
    ];

    const mockActivity = [
      {
        id: '1',
        type: 'order' as const,
        message: 'Đơn hàng #DH001 đã được tạo bởi Nguyễn Văn A',
        time: '2 phút trước',
        icon: '🛒'
      },
      {
        id: '2',
        type: 'user' as const,
        message: 'Người dùng mới Trần Thị B đã đăng ký',
        time: '5 phút trước',
        icon: '👤'
      },
      {
        id: '3',
        type: 'product' as const,
        message: 'Sản phẩm iPhone 15 Pro sắp hết hàng',
        time: '10 phút trước',
        icon: '📱'
      },
      {
        id: '4',
        type: 'order' as const,
        message: 'Đơn hàng #DH002 đã được giao thành công',
        time: '15 phút trước',
        icon: '✅'
      },
    ];

    // Load mock data with timeout
    setTimeout(() => {
      setStats(mockStats);
      setChartData(mockChartData);
      setPieData(mockPieData);
      setRecentActivity(mockActivity);
      setLoading(false);
    }, 1000);

    return () => clearInterval(timeInterval);
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  if (loading) {
    return (
      <div className={`${styles.loadingContainer} ${darkMode ? styles.dark : ''}`}>
        <div className={styles.loadingSpinner}>
          <div className={styles.spinner}></div>
          <h3>Đang tải dashboard...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.adminDashboard} ${darkMode ? styles.dark : ''}`}>
      {/* Header Section */}
      <div className={styles.dashboardHeader}>
        <div className={styles.headerLeft}>
          <h1 className={styles.pageTitle}>
            <span className={styles.titleIcon}>⚡</span>
            New Admin Dashboard
          </h1>
          <p className={styles.lastUpdate}>
            Cập nhật lần cuối: {currentTime}
          </p>
        </div>
        <div className={styles.headerRight}>
          <button 
            className={styles.darkModeToggle}
            onClick={toggleDarkMode}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
          <div className={styles.userProfile}>
            <img src="/api/placeholder/40/40" alt="Admin" className={styles.avatar} />
            <span>Admin User</span>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.revenue}`}>
          <div className={styles.statHeader}>
            <span className={styles.statIcon}>💰</span>
            <span className={`${styles.statGrowth} ${styles.positive}`}>
              +{stats.growth.revenue}%
            </span>
          </div>
          <div className={styles.statValue}>
            {stats.revenue.toLocaleString('vi-VN')}₫
          </div>
          <div className={styles.statLabel}>Tổng doanh thu</div>
          <div className={styles.statTrend}>
            <div className={`${styles.trendLine} ${styles.up}`}></div>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.orders}`}>
          <div className={styles.statHeader}>
            <span className={styles.statIcon}>📦</span>
            <span className={`${styles.statGrowth} ${styles.positive}`}>
              +{stats.growth.orders}%
            </span>
          </div>
          <div className={styles.statValue}>{stats.orders}</div>
          <div className={styles.statLabel}>Tổng đơn hàng</div>
          <div className={styles.statTrend}>
            <div className={`${styles.trendLine} ${styles.up}`}></div>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.users}`}>
          <div className={styles.statHeader}>
            <span className={styles.statIcon}>👥</span>
            <span className={`${styles.statGrowth} ${styles.positive}`}>
              +{stats.growth.users}%
            </span>
          </div>
          <div className={styles.statValue}>{stats.users}</div>
          <div className={styles.statLabel}>Người dùng</div>
          <div className={styles.statTrend}>
            <div className={`${styles.trendLine} ${styles.up}`}></div>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.products}`}>
          <div className={styles.statHeader}>
            <span className={styles.statIcon}>🏪</span>
            <span className={styles.statBadge}>Hoạt động</span>
          </div>
          <div className={styles.statValue}>{stats.products}</div>
          <div className={styles.statLabel}>Sản phẩm</div>
          <div className={styles.statTrend}>
            <div className={`${styles.trendLine} ${styles.stable}`}></div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className={styles.chartsSection}>
        {/* Revenue Chart */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3>📈 Doanh thu tuần này</h3>
            <div className={styles.chartControls}>
              <button className={styles.chartBtn}>7 ngày</button>
              <button className={styles.chartBtn}>30 ngày</button>
              <button className={styles.chartBtn}>90 ngày</button>
            </div>
          </div>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#374151" : "#E5E7EB"} />
                <XAxis dataKey="name" stroke={darkMode ? "#9CA3AF" : "#6B7280"} />
                <YAxis 
                  stroke={darkMode ? "#9CA3AF" : "#6B7280"}
                  tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                />
                <Tooltip 
                  formatter={(value: any) => [`${Number(value).toLocaleString('vi-VN')}₫`, 'Doanh thu']}
                  contentStyle={{
                    backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3B82F6" 
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Status Pie Chart */}
        <div className={styles.pieChartCard}>
          <div className={styles.chartHeader}>
            <h3>📊 Trạng thái đơn hàng</h3>
          </div>
          <div className={styles.pieContainer}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => [`${value}%`, 'Tỷ lệ']}
                  contentStyle={{
                    backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className={styles.pieLegend}>
              {pieData.map((entry, index) => (
                <div key={index} className={styles.legendItem}>
                  <div 
                    className={styles.legendColor} 
                    style={{ backgroundColor: entry.color }}
                  ></div>
                  <span>{entry.name}: {entry.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className={styles.bottomSection}>
        {/* Recent Activity */}
        <div className={styles.activityCard}>
          <div className={styles.activityHeader}>
            <h3>🔥 Hoạt động gần đây</h3>
            <button className={styles.viewAllBtn}>Xem tất cả</button>
          </div>
          <div className={styles.activityList}>
            {recentActivity.map((activity) => (
              <div key={activity.id} className={styles.activityItem}>
                <div className={styles.activityIcon}>
                  {activity.icon}
                </div>
                <div className={styles.activityContent}>
                  <p className={styles.activityMessage}>{activity.message}</p>
                  <span className={styles.activityTime}>{activity.time}</span>
                </div>
                <div className={`${styles.activityType} ${styles[activity.type]}`}>
                  {activity.type === 'order' ? 'Đơn hàng' : 
                   activity.type === 'user' ? 'Người dùng' : 'Sản phẩm'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className={styles.quickActions}>
          <h3>⚡ Hành động nhanh</h3>
          <div className={styles.actionGrid}>
            <button className={`${styles.actionBtn} ${styles.primary}`}>
              <span>📝</span>
              Tạo sản phẩm mới
            </button>
            <button className={`${styles.actionBtn} ${styles.secondary}`}>
              <span>👤</span>
              Thêm người dùng
            </button>
            <button className={`${styles.actionBtn} ${styles.warning}`}>
              <span>📊</span>
              Xem báo cáo
            </button>
            <button className={`${styles.actionBtn} ${styles.success}`}>
              <span>⚙️</span>
              Cài đặt hệ thống
            </button>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className={styles.performanceCard}>
        <h3>📈 Hiệu suất hệ thống</h3>
        <div className={styles.metricsGrid}>
          <div className={styles.metric}>
            <div className={styles.metricLabel}>Tốc độ tải trang</div>
            <div className={styles.metricValue}>1.2s</div>
            <div className={`${styles.metricBar} ${styles.good}`}></div>
          </div>
          <div className={styles.metric}>
            <div className={styles.metricLabel}>Uptime</div>
            <div className={styles.metricValue}>99.9%</div>
            <div className={`${styles.metricBar} ${styles.excellent}`}></div>
          </div>
          <div className={styles.metric}>
            <div className={styles.metricLabel}>API Response</div>
            <div className={styles.metricValue}>95ms</div>
            <div className={`${styles.metricBar} ${styles.good}`}></div>
          </div>
          <div className={styles.metric}>
            <div className={styles.metricLabel}>Error Rate</div>
            <div className={styles.metricValue}>0.1%</div>
            <div className={`${styles.metricBar} ${styles.excellent}`}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
