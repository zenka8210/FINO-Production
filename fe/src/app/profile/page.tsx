"use client"

import { useAuth } from "@/app/context/AuthContext"
import { useEffect, useState } from "react"

interface OrderItem {
  name: string
  price: number
  quantity: number
}

interface Order {
  id: number
  customerInfo: {
    firstName: string
    lastName: string
    email: string
    phone: string
    address: string
    city: string
    district: string
  }
  items: OrderItem[]
  finalTotal: number
  paymentMethod: string
  status: string
  createdAt: string
}

export default function ProfilePage() {
  const { user } = useAuth()
  const [userInfo, setUserInfo] = useState<any>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [allOrders, setAllOrders] = useState<Order[]>([]) // Lưu tất cả orders
  const [activeTab, setActiveTab] = useState("Tất cả")
  const [loading, setLoading] = useState(true)
  const [filterLoading, setFilterLoading] = useState(false)

  const statusTabs = ["Tất cả", "Chờ xác nhận", "Đã xác nhận", "Đang giao hàng", "Thành công", "Đã hủy"]

  // Map Vietnamese status to English for API
  const getStatusForAPI = (vietnameseStatus: string) => {
    switch (vietnameseStatus) {
      case "Chờ xác nhận":
        return "pending"
      case "Đã xác nhận":
        return "confirmed"
      case "Đang giao hàng":
        return "shipping"
      case "Thành công":
        return "delivered"
      case "Đã hủy":
        return "cancelled"
      default:
        return ""
    }
  }

  useEffect(() => {
    if (typeof window !== "undefined" && user?.username) {
      // Lấy thông tin user
      fetch("/api/profile?username=" + encodeURIComponent(user.username))
        .then((res) => res.json())
        .then((data) => {
          setUserInfo(data.user || null)

          // Lấy lịch sử đơn hàng nếu có userId hoặc username
          const searchId = data.user?.id || data.user?.username || user?.id || user?.username
          if (searchId) {
            return fetch(`/api/orders?userId=${searchId}`)
          }
        })
        .then((res) => (res ? res.json() : null))
        .then((orderData) => {
          if (orderData?.success) {
            const fetchedOrders = orderData.orders || []
            setOrders(fetchedOrders)
            setAllOrders(fetchedOrders) // Lưu tất cả orders
          }
          setLoading(false)
        })
        .catch((error) => {
          console.error("Error fetching data:", error)
          setLoading(false)
        })
    }
  }, [user])

  // Hàm xử lý filter khi click tab
  const handleFilterClick = async (tabName: string) => {
    setActiveTab(tabName)
    setFilterLoading(true)

    try {
      if (tabName === "Tất cả") {
        // Hiển thị tất cả orders
        setOrders(allOrders)
      } else {
        // Gọi API để lọc theo status
        const statusForAPI = getStatusForAPI(tabName)
        const searchId = userInfo?.id || userInfo?.username || user?.id || user?.username

        if (searchId && statusForAPI) {
          const response = await fetch(`/api/orders?userId=${searchId}&status=${statusForAPI}`)
          const data = await response.json()

          if (data.success) {
            setOrders(data.orders || [])
          } else {
            console.error("Error filtering orders:", data.message)
            // Fallback: filter locally if API fails
            const filteredOrders = allOrders.filter((order) => order.status === statusForAPI)
            setOrders(filteredOrders)
          }
        }
      }
    } catch (error) {
      console.error("Error filtering orders:", error)
      // Fallback: filter locally if API fails
      if (tabName !== "Tất cả") {
        const statusForAPI = getStatusForAPI(tabName)
        const filteredOrders = allOrders.filter((order) => order.status === statusForAPI)
        setOrders(filteredOrders)
      }
    } finally {
      setFilterLoading(false)
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Chờ Xác Nhận"
      case "confirmed":
        return "Đã Xác Nhận"
      case "shipping":
        return "Đang Giao Hàng"
      case "delivered":
        return "Thành Công"
      case "cancelled":
        return "Đã Hủy"
      default:
        return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "#6b7280"
      case "confirmed":
        return "#3b82f6"
      case "shipping":
        return "#f59e0b"
      case "delivered":
        return "#10b981"
      case "cancelled":
        return "#ef4444"
      default:
        return "#6b7280"
    }
  }

  const canCancelOrder = (status: string) => {
    return status === "pending" || status === "confirmed"
  }

  // Đếm số lượng orders theo từng status
  const getOrderCountByStatus = (tabName: string) => {
    if (tabName === "Tất cả") return allOrders.length
    const statusForAPI = getStatusForAPI(tabName)
    return allOrders.filter((order) => order.status === statusForAPI).length
  }

  if (loading) {
    return (
      <div className="container" style={{ textAlign: "center", padding: "50px" }}>
        <h2>Đang tải thông tin...</h2>
      </div>
    )
  }

  if (!userInfo) {
    return (
      <div className="container" style={{ textAlign: "center", padding: "50px" }}>
        <h2>Không tìm thấy thông tin người dùng.</h2>
      </div>
    )
  }

  return (
    <div className="container" style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px" }}>
      {/* Top Section - Personal Info and Address */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
          gap: "24px",
          marginBottom: "24px",
        }}
      >
        {/* Personal Information Card */}
        <div
          style={{
            backgroundColor: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "20px 24px",
              borderBottom: "1px solid #e5e7eb",
            }}
          >
            <h3
              style={{
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "18px",
                fontWeight: "600",
              }}
            >
              <span>👤</span> Thông tin cá nhân
            </h3>
            <button
              style={{
                padding: "6px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                backgroundColor: "#fff",
                cursor: "pointer",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              ✏️ Chỉnh sửa
            </button>
          </div>
          <div style={{ padding: "24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "8px",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#6b7280",
                  }}
                >
                  <span>👤</span> Họ và tên:
                </div>
                <div style={{ fontSize: "14px", fontWeight: "500" }}>{userInfo.fullname || userInfo.name || "-"}</div>
              </div>
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "8px",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#6b7280",
                  }}
                >
                  <span>✉️</span> Email:
                </div>
                <div style={{ fontSize: "14px" }}>{userInfo.email || "-"}</div>
              </div>
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "8px",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#6b7280",
                  }}
                >
                  <span>📞</span> Số điện thoại:
                </div>
                <div style={{ fontSize: "14px" }}>{userInfo.phone || "-"}</div>
              </div>
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "8px",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#6b7280",
                  }}
                >
                  <span>🔒</span> Mật khẩu:
                </div>
                <input
                  type="password"
                  placeholder="Đổi mật khẩu"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "14px",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Address Card */}
        <div
          style={{
            backgroundColor: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "20px 24px",
              borderBottom: "1px solid #e5e7eb",
            }}
          >
            <h3
              style={{
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "18px",
                fontWeight: "600",
              }}
            >
              <span>📍</span> Địa chỉ
            </h3>
            <button
              style={{
                padding: "6px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                backgroundColor: "#fff",
                cursor: "pointer",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              ➕ Thêm địa chỉ
            </button>
          </div>
          <div style={{ padding: "24px" }}>
            <div
              style={{
                padding: "16px",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
            >
              <div style={{ fontSize: "14px", marginBottom: "12px" }}>
                {userInfo.address || "123 Đường Láng / Phường Láng Thượng / Quận Đống Đa / Hà Nội"}
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  style={{
                    padding: "6px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    backgroundColor: "#fff",
                    cursor: "pointer",
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  ✏️ Sửa
                </button>
                <button
                  style={{
                    padding: "6px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    backgroundColor: "#fff",
                    cursor: "pointer",
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    color: "#ef4444",
                  }}
                >
                  ❌ Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div
        style={{
          backgroundColor: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <h3
            style={{
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "18px",
              fontWeight: "600",
            }}
          >
            <span>🔒</span> Đơn hàng gần đây
          </h3>
        </div>
        <div style={{ padding: "24px" }}>
          {/* Status Tabs */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "24px" }}>
            {statusTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => handleFilterClick(tab)}
                disabled={filterLoading}
                style={{
                  padding: "8px 16px",
                  border: activeTab === tab ? "none" : "1px solid #d1d5db",
                  borderRadius: "6px",
                  backgroundColor: activeTab === tab ? "#374151" : "#fff",
                  color: activeTab === tab ? "#fff" : "#374151",
                  cursor: filterLoading ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: activeTab === tab ? "500" : "normal",
                  opacity: filterLoading ? 0.6 : 1,
                  position: "relative",
                }}
              >
                {tab} ({getOrderCountByStatus(tab)})
                {filterLoading && activeTab === tab && <span style={{ marginLeft: "8px" }}>⏳</span>}
              </button>
            ))}
          </div>

          {/* Loading state for filtering */}
          {filterLoading && (
            <div style={{ textAlign: "center", padding: "20px", color: "#6b7280" }}>
              <p>Đang lọc đơn hàng...</p>
            </div>
          )}

          {/* Orders List */}
          {!filterLoading && orders.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px", color: "#6b7280" }}>
              <h3 style={{ fontSize: "18px", marginBottom: "8px" }}>
                {activeTab === "Tất cả" ? "Chưa có đơn hàng nào" : `Không có đơn hàng ${activeTab.toLowerCase()}`}
              </h3>
              <p>
                {activeTab === "Tất cả"
                  ? "Bạn chưa có đơn hàng nào. Hãy mua sắm ngay!"
                  : `Không tìm thấy đơn hàng nào có trạng thái ${activeTab.toLowerCase()}.`}
              </p>
            </div>
          ) : !filterLoading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {orders.map((order) => (
                <div
                  key={order.id}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    padding: "16px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "16px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                        <span style={{ fontWeight: "500" }}>#{order.id}MAG</span>
                        <span style={{ fontSize: "14px", color: "#6b7280" }}>
                          {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                        </span>
                        <div
                          style={{
                            padding: "4px 8px",
                            borderRadius: "20px",
                            backgroundColor: getStatusColor(order.status),
                            color: "#fff",
                            fontSize: "12px",
                            fontWeight: "600",
                          }}
                        >
                          {getStatusText(order.status)}
                        </div>
                      </div>
                      <div style={{ fontSize: "14px", color: "#6b7280", marginBottom: "8px" }}>
                        {order.items.map((item) => item.name).join(", ")}
                      </div>
                      <div style={{ fontSize: "18px", fontWeight: "bold" }}>
                        {order.finalTotal.toLocaleString("vi-VN")} đ
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        style={{
                          padding: "8px 16px",
                          border: "1px solid #d1d5db",
                          borderRadius: "6px",
                          backgroundColor: "#fff",
                          cursor: "pointer",
                          fontSize: "14px",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        👁️ Xem chi tiết
                      </button>
                      {canCancelOrder(order.status) && (
                        <button
                          style={{
                            padding: "8px 16px",
                            border: "none",
                            borderRadius: "6px",
                            backgroundColor: "#ef4444",
                            color: "#fff",
                            cursor: "pointer",
                            fontSize: "14px",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          ❌ Hủy đơn hàng
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
