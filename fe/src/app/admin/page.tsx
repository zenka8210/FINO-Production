"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import styles from "./admin.module.css";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const salesData = [
  { name: "01/06", sales: 2.1 },
  { name: "02/06", sales: 2.3 },
  { name: "03/06", sales: 2.0 },
  { name: "04/06", sales: 2.5 },
  { name: "05/06", sales: 2.7 },
  { name: "06/06", sales: 2.9 },
  { name: "07/06", sales: 3.2 },
  { name: "08/06", sales: 3.0 },
  { name: "09/06", sales: 3.4 },
  { name: "10/06", sales: 3.7 },
  { name: "11/06", sales: 3.9 },
  { name: "12/06", sales: 4.1 },
];

function StatCard({ title, value, update, color, iconBg, icon }: { title: string; value: string | number; update: string; color: string; iconBg: string; icon: React.ReactNode }) {
  return (
    <div style={{
      background: color,
      borderRadius: 12,
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      padding: 24,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      position: 'relative',
      minWidth: 180,
      flex: 1,
      color: '#fff',
      overflow: 'hidden',
      marginRight: 12
    }}>
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 26, fontWeight: 700, marginBottom: 8 }}>{value}</div>
      <div style={{ fontSize: 13, opacity: 0.85, display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 16, marginRight: 4 }}>🕒</span> cập nhật: {update}
      </div>
      <div style={{ position: 'absolute', top: 18, right: 18, background: iconBg, borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
        {icon}
      </div>
    </div>
  );
}

function ProjectRiskWidget() {
  return (
    <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px rgba(25,118,210,0.08)', padding: 24, minWidth: 240, maxWidth: 300, marginLeft: 24 }}>
      <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 12 }}>Project Risk</div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 10 }}>
        <svg width="90" height="90">
          <circle cx="45" cy="45" r="40" stroke="#e3eafc" strokeWidth="8" fill="none" />
          <circle cx="45" cy="45" r="40" stroke="#ff9800" strokeWidth="8" fill="none" strokeDasharray={251.2} strokeDashoffset={251.2 - 5/10*251.2} strokeLinecap="round" transform="rotate(-90 45 45)" />
          <text x="50%" y="54%" textAnchor="middle" fontSize="22" fontWeight="bold" fill="#ff9800">5</text>
        </svg>
        <div style={{ color: '#888', fontSize: 14, marginTop: 4 }}>Balanced</div>
      </div>
      <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>Change Risk: <span style={{ color: '#ff9800', fontWeight: 600 }}>Medium</span></div>
      <div style={{ fontSize: 13, color: '#888' }}>Created: 11th Sep</div>
      <button style={{ marginTop: 16, width: '100%', background: '#ff9800', color: '#fff', border: 'none', borderRadius: 7, padding: '10px 0', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>View Detail Report</button>
    </div>
  );
}

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    earnings: 0,
    users: 0,
    tasks: 0,
    orders: 0,
    news: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== "admin") {
      router.replace("/login");
      return;
    }
    async function fetchStats() {
      setLoading(true);
      // Fetch orders
      const res = await fetch("/api/orders");
      const data = await res.json();
      const orders = data.orders || [];
      // Earnings
      const earnings = orders.reduce((sum: number, o: any) => sum + (o.finalTotal || 0), 0);
      // Users
      const usersRes = await fetch("/api/profile?username=*");
      // fallback: count users from static file
      let usersCount = 0;
      try {
        const usersData = await fetch("/data/users.json");
        const usersJson = await usersData.json();
        usersCount = usersJson.length;
      } catch {}

      // News count
      let newsCount = 0;
      try {
        const newsRes = await fetch("/api/news");
        const newsData = await newsRes.json();
        if (newsData.success) {
          newsCount = newsData.pagination?.totalItems || newsData.data?.length || 0;
        }
      } catch {}

      setStats({
        earnings,
        users: usersCount,
        tasks: 145, // demo static
        orders: orders.length,
        news: newsCount,
      });
      setLoading(false);
    }
    fetchStats();
  }, [user, router]);

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', gap: 24, marginBottom: 8 }}>
        <StatCard
          title="Tổng Doanh Thu"
          value={stats.earnings.toLocaleString("vi-VN") + "₫"}
          update="2:15 am"
          color="#ff9800"
          iconBg="#fff3e0"
          icon={<span style={{ fontSize: 22, color: '#ff9800' }}>💰</span>}
        />
        <StatCard
          title="Người Dùng"
          value={stats.users + "+"}
          update="2:15 am"
          color="#43a047"
          iconBg="#e8f5e9"
          icon={<span style={{ fontSize: 22, color: '#43a047' }}>👤</span>}
        />
        <StatCard
          title="Tasks Completed"
          value={stats.tasks}
          update="2:15 am"
          color="#e53935"
          iconBg="#ffebee"
          icon={<span style={{ fontSize: 22, color: '#e53935' }}>✅</span>}
        />
        <StatCard
          title="Đơn Hàng"
          value={stats.orders}
          update="2:15 am"
          color="#00bcd4"
          iconBg="#e0f2f1"
          icon={<span style={{ fontSize: 22, color: '#00bcd4' }}>📦</span>}
        />
        <StatCard
          title="Tin Tức"
          value={stats.news || 0}
          update="2:15 am"
          color="#9c27b0"
          iconBg="#f3e5f5"
          icon={<span style={{ fontSize: 22, color: '#9c27b0' }}>📰</span>}
        />
      </div>
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        <div style={{ flex: 2, background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px rgba(25,118,210,0.08)', padding: 24, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 12 }}>Sales Analytics</div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={salesData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#e3eafc" strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={13} />
              <YAxis fontSize={13} />
              <Tooltip />
              <Line type="monotone" dataKey="sales" stroke="#ff9800" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <ProjectRiskWidget />
      </div>
      {loading && <div>Đang tải dữ liệu...</div>}
    </div>
  );
}
