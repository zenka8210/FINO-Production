# API Endpoints cho Statistics

Tất cả endpoints statistics yêu cầu authentication và admin role.

## Base URL: `/api/statistics`

### 1. Dashboard Overview
```
GET /api/statistics/dashboard
```
Trả về tổng quan số liệu: users, products, orders, revenue

### 2. Revenue Chart
```
GET /api/statistics/revenue-chart?period=month
```
Query params:
- `period`: 'week' | 'month' | 'year' (default: 'month')

### 3. Top Products Chart
```
GET /api/statistics/top-products?limit=10
```
Query params:
- `limit`: số lượng sản phẩm top (default: 10)

### 4. Order Status Chart
```
GET /api/statistics/order-status
```
Phân bố trạng thái đơn hàng (pie chart)

### 5. User Registration Chart
```
GET /api/statistics/user-registration?months=12
```
Query params:
- `months`: số tháng gần đây (default: 12)

### 6. Category Distribution Chart
```
GET /api/statistics/category-distribution
```
Phân bố sản phẩm theo danh mục

### 7. Recent Activity
```
GET /api/statistics/recent-activity
```
Hoạt động gần đây: đơn hàng mới, user mới

## Response Format
Tất cả response đều có format:
```json
{
  "success": true,
  "message": "Success message",
  "data": {
    // Chart data here
  }
}
```

## Chart Data Formats

### Line/Area Chart (Revenue, User Registration)
```json
{
  "labels": ["1/2024", "2/2024", "3/2024"],
  "data": [1000000, 1500000, 2000000]
}
```

### Bar Chart (Top Products)
```json
{
  "labels": ["Product A", "Product B"],
  "soldData": [100, 80],
  "revenueData": [5000000, 4000000]
}
```

### Pie Chart (Order Status, Categories)
```json
{
  "labels": ["completed", "pending", "cancelled"],
  "data": [150, 50, 20]
}
```
