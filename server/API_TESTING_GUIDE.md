# HƯỚNG DẪN TEST TOÀN BỘ API - E-COMMERCE BACKEND

## 📋 Tổng quan dự án

Dự án backend E-commerce được xây dựng với:
- **Node.js** + **Express.js**
- **MongoDB** với **Mongoose ODM**
- **JWT Authentication**
- **Role-based Authorization** (Customer/Admin)
- **RESTful API Architecture**

## 🗂️ Cấu trúc dự án

```
server/
├── app.js                 # Entry point của ứng dụng
├── .env                   # Biến môi trường
├── package.json           # Dependencies và scripts
├── testAllAPIs.js         # File test toàn diện tất cả API
├── testAPIs.js           # File test cơ bản
├── seedUsers.js          # Tạo dữ liệu mẫu
├── config/
│   ├── db.js             # Cấu hình database
│   └── constants.js      # Hằng số hệ thống
├── controllers/          # Xử lý logic nghiệp vụ
├── models/              # Schema MongoDB
├── routes/              # Định nghĩa endpoints
├── middlewares/         # Middleware xác thực & phân quyền
├── services/            # Business logic layer
└── docs/                # Tài liệu API
```

## 🔗 Danh sách API Endpoints

### **Tổng cộng: ~130-140 endpoints**

1. **🔐 Authentication** (2 endpoints)
   - POST `/api/auth/register` - Đăng ký
   - POST `/api/auth/login` - Đăng nhập

2. **👥 User Management** (13 endpoints)
   - GET/PUT `/api/users/me` - Profile cá nhân
   - GET/POST/PUT/DELETE `/api/users/*` - Quản lý users (Admin)

3. **📂 Categories** (8 endpoints)
   - GET `/api/categories/public` - Lấy danh mục (Public)
   - CRUD `/api/categories/*` - Quản lý danh mục (Admin)

4. **🛍️ Products** (9 endpoints)
   - GET `/api/products/public/*` - Sản phẩm (Public)
   - CRUD `/api/products/*` - Quản lý sản phẩm (Admin)

5. **🎨 Product Variants** (7 endpoints)
   - GET `/api/product-variants/product/:id` - Variants theo sản phẩm
   - CRUD `/api/product-variants/*` - Quản lý variants (Admin)

6. **🛒 Orders** (13 endpoints)
   - GET/POST `/api/orders` - Đơn hàng của user
   - GET/PUT/DELETE `/api/orders/admin/*` - Quản lý đơn hàng (Admin)

7. **🏠 Addresses** (6 endpoints)
   - CRUD `/api/addresses/*` - Quản lý địa chỉ (User)

8. **🎟️ Vouchers** (11 endpoints)
   - GET `/api/vouchers/active` - Vouchers hoạt động
   - CRUD `/api/vouchers/*` - Quản lý vouchers (Admin)

9. **💳 Payment Methods** (12 endpoints)
   - GET `/api/payment-methods/active` - Phương thức thanh toán
   - CRUD `/api/payment-methods/*` - Quản lý (Admin)

10. **⭐ Reviews** (6 endpoints)
    - GET/POST/PUT/DELETE `/api/reviews/*` - Đánh giá

11. **💝 Wishlist** (10 endpoints)
    - GET/POST/DELETE `/api/wishlist/*` - Danh sách yêu thích

12. **📰 Posts/Blog** (5 endpoints)
    - GET/POST/PUT/DELETE `/api/posts/*` - Quản lý bài viết

13. **🎨 Colors** (~5 endpoints)
    - CRUD `/api/colors/*` - Quản lý màu sắc

14. **📏 Sizes** (~5 endpoints)
    - CRUD `/api/sizes/*` - Quản lý kích thước

15. **🎯 Banners** (~7 endpoints)
    - GET/POST/PUT/DELETE `/api/banners/*` - Quản lý banner

16. **📊 Statistics** (7 endpoints)
    - GET `/api/statistics/*` - Thống kê hệ thống (Admin)

## 🚀 Hướng dẫn chạy test

### Bước 1: Chuẩn bị môi trường

1. **Cài đặt dependencies:**
```bash
cd d:\ReactJs\Datn\asm\server
npm install
```

2. **Kiểm tra file .env:**
```env
DB_URI=mongodb://localhost:27017/asm
PORT=5000
JWT_SECRET=Nd83jsDJKJd8sklsjk89JDF893JdjsjlsdkfjsKLDJFL89sdjH
JWT_EXPIRES_IN=7d
```

3. **Khởi động MongoDB:**
```bash
# Windows
net start MongoDB
# Hoặc chạy MongoDB Compass
```

### Bước 2: Tạo dữ liệu mẫu

```bash
npm run seed
```

Lệnh này sẽ tạo:
- 3 tài khoản Customer
- 2 tài khoản Admin
- Dữ liệu mẫu cơ bản

### Bước 3: Khởi động server

```bash
# Chạy production
npm start

# Hoặc chạy development mode
npm run dev
```

Server sẽ chạy tại: `http://localhost:5000`

### Bước 4: Chạy test API

#### Option 1: Test toàn diện (Khuyên dùng)
```bash
node testAllAPIs.js
```

File này sẽ test:
- ✅ Tất cả 130+ endpoints
- ✅ Tạo dữ liệu test tự động
- ✅ Test cả Public và Admin APIs
- ✅ Cleanup dữ liệu test sau khi hoàn thành
- ✅ Báo cáo chi tiết với màu sắc

#### Option 2: Test cơ bản
```bash
npm test
# hoặc
node testAPIs.js
```

#### Option 3: Chạy combined
```bash
npm run seed-and-test
```

### Bước 5: Xem kết quả

Test sẽ hiển thị:
- ✅ **Xanh**: Test thành công
- ❌ **Đỏ**: Test thất bại với chi tiết lỗi
- 📊 **Thống kê**: Số lượng test pass/fail

## 🔐 Tài khoản test

### Customer Account:
```json
{
  "email": "customer1@shop.com",
  "password": "customer123"
}
```

### Admin Account:
```json
{
  "email": "admin1@shop.com", 
  "password": "admin123456"
}
```

## 📡 Test API thủ công với Postman/Insomnia

### 1. Import Collection

Tạo collection mới với base URL: `http://localhost:5000/api`

### 2. Thiết lập biến môi trường

```json
{
  "baseUrl": "http://localhost:5000/api",
  "customerToken": "",
  "adminToken": ""
}
```

### 3. Quy trình test

1. **Login để lấy token:**
   ```
   POST {{baseUrl}}/auth/login
   Body: { "email": "admin1@shop.com", "password": "admin123456" }
   ```

2. **Lưu token vào biến:**
   ```javascript
   // Trong Tests tab của Postman
   const response = pm.response.json();
   pm.environment.set("adminToken", response.data.token);
   ```

3. **Sử dụng token cho các request:**
   ```
   Authorization: Bearer {{adminToken}}
   ```

### 4. Test cases quan trọng

#### Authentication Tests:
- ✅ Register new user
- ✅ Login với credentials đúng
- ❌ Login với credentials sai
- ✅ Access protected route với token hợp lệ
- ❌ Access protected route với token không hợp lệ

#### Authorization Tests:
- ✅ Customer access customer endpoints
- ❌ Customer access admin endpoints
- ✅ Admin access admin endpoints
- ✅ Admin access customer endpoints

#### CRUD Tests cho mỗi resource:
- ✅ CREATE: Tạo mới với dữ liệu hợp lệ
- ❌ CREATE: Tạo mới với dữ liệu không hợp lệ
- ✅ READ: Lấy danh sách và chi tiết
- ✅ UPDATE: Cập nhật với dữ liệu hợp lệ
- ❌ UPDATE: Cập nhật với dữ liệu không hợp lệ
- ✅ DELETE: Xóa resource tồn tại
- ❌ DELETE: Xóa resource không tồn tại

## 🛠️ Troubleshooting

### Lỗi kết nối MongoDB
```bash
# Kiểm tra MongoDB service
net start MongoDB

# Hoặc khởi động manual
mongod --dbpath "C:\data\db"
```

### Lỗi Port đã được sử dụng
```bash
# Kiểm tra port 5000
netstat -ano | findstr :5000

# Kill process nếu cần
taskkill /PID <process_id> /F
```

### Lỗi JWT Token
- Kiểm tra JWT_SECRET trong .env
- Xác nhận token được gửi đúng format: `Bearer <token>`

### Lỗi Permission Denied
- Xác nhận user có role phù hợp
- Kiểm tra middleware authMiddleware và adminMiddleware

## 📊 Monitoring & Logging

Server sẽ log:
- ✅ Kết nối MongoDB thành công
- ❌ Lỗi kết nối database
- 📊 Thông tin request/response
- 🔐 Authentication attempts
- ⚠️ Validation errors

## 🎯 Best Practices

### 1. Thứ tự test:
1. Authentication
2. Basic CRUD (Categories, Colors, Sizes)
3. Complex resources (Products, Product Variants)
4. User workflows (Orders, Reviews, Wishlist)
5. Admin features (Statistics, Management)

### 2. Data consistency:
- Luôn cleanup test data
- Sử dụng unique identifiers cho test
- Test với dữ liệu edge cases

### 3. Error handling:
- Test cả success và error cases
- Verify error messages và status codes
- Test validation rules

## 📈 Performance Testing

Để test performance, sử dụng tools như:
- **Artillery.js** cho load testing
- **Apache Benchmark (ab)** cho stress testing
- **Postman Collection Runner** cho automation

Example Artillery config:
```yaml
config:
  target: 'http://localhost:5000'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "API Load Test"
    requests:
      - get:
          url: "/api/products/public"
```

## 🔄 CI/CD Integration

Integrate vào pipeline:
```yaml
# GitHub Actions example
- name: Run API Tests
  run: |
    npm install
    npm run seed
    npm test
```

---

**Happy Testing! 🚀**

Nếu có vấn đề gì, hãy kiểm tra logs server và đảm bảo MongoDB đang chạy.
