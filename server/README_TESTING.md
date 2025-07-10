# E-commerce Backend API Testing

## 🚀 Quick Start

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Khởi động MongoDB
```bash
net start MongoDB
```

### 3. Tạo dữ liệu mẫu
```bash
npm run seed
```

### 4. Khởi động server
```bash
npm start
```

### 5. Chạy test API
```bash
# Test toàn diện (Khuyên dùng)
npm run test-all

# Test cơ bản
npm test

# Test đầy đủ (seed + test)
npm run full-test
```

## 📊 Kết quả mong đợi

- ✅ **130+ API endpoints** được test
- 🔐 **Authentication & Authorization** 
- 📱 **CRUD operations** cho tất cả resources
- 🧹 **Auto cleanup** test data

## 🔗 Server URLs

- **API Base**: http://localhost:5000/api
- **Health Check**: http://localhost:5000

## 👤 Test Accounts

**Customer**: `customer1@shop.com` / `customer123`  
**Admin**: `admin1@shop.com` / `admin123456`

## 📖 Detailed Guide

Xem file `API_TESTING_GUIDE.md` để có hướng dẫn chi tiết.
