# API ENDPOINTS DETAILED BREAKDOWN
# Chi tiết Phân tích Endpoints API

## 🔗 COMPLETE API ENDPOINTS LIST

### 1. 🔐 AUTHENTICATION ROUTES (`/api/auth`)
```javascript
// Public Routes
POST   /api/auth/register          → Đăng ký tài khoản mới
POST   /api/auth/login             → Đăng nhập người dùng

// Total: 2 endpoints
```

### 2. 👥 USER MANAGEMENT ROUTES (`/api/users`) 
```javascript
// Admin Routes - require authMiddleware + adminMiddleware
POST   /api/users                  → Tạo user mới (Admin)
GET    /api/users                  → Lấy danh sách users (Admin)
GET    /api/users/search           → Tìm kiếm users (Admin)
GET    /api/users/stats            → Thống kê users (Admin)
PUT    /api/users/:id/role         → Cập nhật role user (Admin)
PUT    /api/users/:id/status       → Cập nhật trạng thái user (Admin)
DELETE /api/users/:id              → Xóa user (Admin)

// Protected Routes - require authMiddleware only
GET    /api/users/me               → Lấy thông tin user hiện tại
PUT    /api/users/me               → Cập nhật thông tin cá nhân
PUT    /api/users/change-password  → Thay đổi mật khẩu
GET    /api/users/:id              → Lấy thông tin user by ID (Admin hoặc chính user đó)
PUT    /api/users/:id              → Cập nhật user by ID (Admin hoặc chính user đó)

// Total: 13 endpoints
```

### 3. 🛍️ PRODUCT ROUTES (`/api/products`)
```javascript
// Public Routes
GET    /api/products/public                    → Lấy tất cả sản phẩm (Public)
GET    /api/products/public/:id               → Lấy chi tiết sản phẩm (Public)
GET    /api/products/category/:categoryId/public → Sản phẩm theo danh mục (Public)

// Admin Routes - require authMiddleware + adminMiddleware  
GET    /api/products                          → Lấy tất cả sản phẩm (Admin)
GET    /api/products/:id                      → Lấy chi tiết sản phẩm (Admin)
POST   /api/products                          → Tạo sản phẩm mới (Admin)
PUT    /api/products/:id                      → Cập nhật sản phẩm (Admin)
DELETE /api/products/:id                      → Xóa sản phẩm (Admin)
GET    /api/products/category/:categoryId     → Sản phẩm theo danh mục (Admin)

// Total: 9 endpoints
```

### 4. 🎨 PRODUCT VARIANT ROUTES (`/api/product-variants`)
```javascript
// Public Routes
GET    /api/product-variants/product/:productId → Lấy variants của sản phẩm (Public)

// Admin Routes - require authMiddleware + adminMiddleware
GET    /api/product-variants                   → Lấy tất cả variants (Admin)
GET    /api/product-variants/:id              → Lấy variant by ID (Admin)
POST   /api/product-variants                  → Tạo variant mới (Admin)
PUT    /api/product-variants/:id              → Cập nhật variant (Admin)
DELETE /api/product-variants/:id              → Xóa variant (Admin)
PUT    /api/product-variants/:id/stock        → Cập nhật stock (Admin)

// Total: 7 endpoints
```

### 5. 📂 CATEGORY ROUTES (`/api/categories`)
```javascript
// Public Routes
GET    /api/categories/parents                → Lấy danh mục cha (Public)
GET    /api/categories/:parentId/children     → Lấy danh mục con (Public)
GET    /api/categories/public                 → Lấy tất cả danh mục (Public)

// Admin Routes - require authMiddleware + adminMiddleware
GET    /api/categories                        → Lấy tất cả danh mục (Admin)
GET    /api/categories/:id                    → Lấy danh mục by ID (Admin)
POST   /api/categories                        → Tạo danh mục mới (Admin)
PUT    /api/categories/:id                    → Cập nhật danh mục (Admin)
DELETE /api/categories/:id                    → Xóa danh mục (Admin)

// Total: 8 endpoints
```

### 6. 🛒 ORDER ROUTES (`/api/orders`)
```javascript
// Protected Routes - require authMiddleware
GET    /api/orders                            → Lấy orders của user hiện tại
POST   /api/orders                            → Tạo order mới
POST   /api/orders/calculate-total            → Tính tổng tiền order
GET    /api/orders/shipping-fee/:addressId    → Tính phí vận chuyển
GET    /api/orders/:id                        → Lấy order by ID (user hoặc admin)
PUT    /api/orders/:id/cancel                 → Hủy order

// Admin Routes - require authMiddleware + adminMiddleware
GET    /api/orders/admin/all                  → Lấy tất cả orders (Admin)
PUT    /api/orders/admin/:id/status           → Cập nhật trạng thái order (Admin)
DELETE /api/orders/admin/:id                 → Xóa order (Admin)
GET    /api/orders/admin/stats                → Thống kê orders (Admin)
GET    /api/orders/admin/search               → Tìm kiếm orders (Admin)
GET    /api/orders/admin/top-products         → Top sản phẩm bán chạy (Admin)
GET    /api/orders/admin/payment-method/:paymentMethod → Orders theo payment method (Admin)

// Total: 13 endpoints
```

### 7. 🏠 ADDRESS ROUTES (`/api/addresses`)
```javascript
// Protected Routes - require authMiddleware (user chỉ quản lý địa chỉ của mình)
POST   /api/addresses                         → Tạo địa chỉ mới
GET    /api/addresses                         → Lấy tất cả địa chỉ của user
GET    /api/addresses/:id                     → Lấy địa chỉ by ID
PUT    /api/addresses/:id                     → Cập nhật địa chỉ
DELETE /api/addresses/:id                     → Xóa địa chỉ
PUT    /api/addresses/:id/default             → Đặt làm địa chỉ mặc định

// Total: 6 endpoints
```

### 8. 🎟️ VOUCHER ROUTES (`/api/vouchers`)
```javascript
// Public Routes
GET    /api/vouchers                          → Lấy tất cả vouchers (Public)
GET    /api/vouchers/active                   → Lấy vouchers đang hoạt động (Public)
GET    /api/vouchers/:id                      → Lấy voucher by ID (Public)
GET    /api/vouchers/code/:code               → Lấy voucher by code (Public)

// Admin Routes - require authMiddleware + adminMiddleware
GET    /api/vouchers/admin                    → Lấy tất cả vouchers (Admin)
GET    /api/vouchers/admin/:id                → Lấy voucher by ID (Admin)
POST   /api/vouchers                          → Tạo voucher mới (Admin)
PUT    /api/vouchers/:id                      → Cập nhật voucher (Admin)
DELETE /api/vouchers/:id                      → Xóa voucher (Admin)
PUT    /api/vouchers/:id/toggle-status        → Bật/tắt trạng thái voucher (Admin)
GET    /api/vouchers/admin/stats              → Thống kê vouchers (Admin)

// Total: 11 endpoints
```

### 9. 💳 PAYMENT METHOD ROUTES (`/api/payment-methods`)
```javascript
// Public Routes
GET    /api/payment-methods/active            → Lấy payment methods đang hoạt động (Public)
GET    /api/payment-methods/type/:type        → Lấy payment methods theo loại (Public)

// Admin Routes - require authMiddleware + adminMiddleware
GET    /api/payment-methods                   → Lấy tất cả payment methods (Admin)
GET    /api/payment-methods/stats             → Thống kê payment methods (Admin)
POST   /api/payment-methods                   → Tạo payment method mới (Admin)
GET    /api/payment-methods/:id               → Lấy payment method by ID (Admin)
PUT    /api/payment-methods/:id               → Cập nhật payment method (Admin)
DELETE /api/payment-methods/:id               → Xóa payment method (Admin)
PUT    /api/payment-methods/:id/toggle-status → Bật/tắt trạng thái (Admin)
PUT    /api/payment-methods/:id/order         → Cập nhật thứ tự (Admin)
PUT    /api/payment-methods/:id/config        → Cập nhật cấu hình (Admin)
PUT    /api/payment-methods/bulk/toggle-status → Bulk toggle status (Admin)

// Total: 12 endpoints
```

### 10. ⭐ REVIEW ROUTES (`/api/reviews`)
```javascript
// Public Routes
GET    /api/reviews/product/:productId        → Lấy reviews của sản phẩm (Public)

// Protected Routes - require authMiddleware
GET    /api/reviews                           → Lấy reviews của user hiện tại
POST   /api/reviews                           → Tạo review mới
PUT    /api/reviews/:id                       → Cập nhật review (chỉ review của mình)
DELETE /api/reviews/:id                       → Xóa review (chỉ review của mình)

// Admin Routes - require authMiddleware + adminMiddleware
GET    /api/reviews/admin/all                 → Lấy tất cả reviews (Admin)
DELETE /api/reviews/admin/:id                 → Xóa bất kỳ review nào (Admin)

// Total: 6 endpoints
```

### 11. 💝 WISHLIST ROUTES (`/api/wishlist`)
```javascript
// Protected Routes - require authMiddleware
GET    /api/wishlist                          → Lấy wishlist của user
GET    /api/wishlist/count                    → Đếm số items trong wishlist
POST   /api/wishlist                          → Thêm sản phẩm vào wishlist
POST   /api/wishlist/multiple                 → Thêm nhiều sản phẩm vào wishlist
POST   /api/wishlist/toggle                   → Toggle sản phẩm trong wishlist
DELETE /api/wishlist/:id                      → Xóa item khỏi wishlist
DELETE /api/wishlist/clear                    → Xóa toàn bộ wishlist
GET    /api/wishlist/check/:productId         → Kiểm tra sản phẩm có trong wishlist không

// Admin Routes - require authMiddleware + adminMiddleware
GET    /api/wishlist/admin/stats              → Thống kê wishlist (Admin)
GET    /api/wishlist/admin/all                → Lấy tất cả wishlist items (Admin)

// Total: 10 endpoints
```

### 12. 📰 POST/BLOG ROUTES (`/api/posts`)
```javascript
// Public Routes
GET    /api/posts                             → Lấy tất cả posts (Public)
GET    /api/posts/:id                         → Lấy post by ID (Public)

// Protected Routes - require authMiddleware
POST   /api/posts                             → Tạo post mới (User)
PUT    /api/posts/:id                         → Cập nhật post (Author hoặc Admin)
DELETE /api/posts/:id                         → Xóa post (Author hoặc Admin)

// Total: 5 endpoints
```

### 13. 🎨 COLOR ROUTES (`/api/colors`)
```javascript
// Public Routes (estimated)
GET    /api/colors                            → Lấy tất cả colors (Public)

// Admin Routes - require authMiddleware + adminMiddleware
GET    /api/colors/admin                      → Lấy tất cả colors (Admin)
POST   /api/colors                            → Tạo color mới (Admin)
PUT    /api/colors/:id                        → Cập nhật color (Admin)
DELETE /api/colors/:id                        → Xóa color (Admin)

// Total: ~5 endpoints
```

### 14. 📏 SIZE ROUTES (`/api/sizes`)
```javascript
// Public Routes (estimated)
GET    /api/sizes                             → Lấy tất cả sizes (Public)

// Admin Routes - require authMiddleware + adminMiddleware  
GET    /api/sizes/admin                       → Lấy tất cả sizes (Admin)
POST   /api/sizes                             → Tạo size mới (Admin)
PUT    /api/sizes/:id                         → Cập nhật size (Admin)
DELETE /api/sizes/:id                         → Xóa size (Admin)

// Total: ~5 endpoints
```

### 15. 🎯 BANNER ROUTES (`/api/banners`)
```javascript
// Public Routes (estimated)
GET    /api/banners/active                    → Lấy banners đang hoạt động (Public)
GET    /api/banners/position/:position       → Lấy banners theo vị trí (Public)

// Admin Routes - require authMiddleware + adminMiddleware
GET    /api/banners                           → Lấy tất cả banners (Admin)
POST   /api/banners                           → Tạo banner mới (Admin)
PUT    /api/banners/:id                       → Cập nhật banner (Admin)
DELETE /api/banners/:id                       → Xóa banner (Admin)
PUT    /api/banners/:id/toggle-status         → Bật/tắt banner (Admin)

// Total: ~7 endpoints
```

### 16. 📊 STATISTICS ROUTES (`/api/statistics`)
```javascript
// Admin Routes - require authMiddleware + adminMiddleware
GET    /api/statistics/dashboard              → Dashboard overview stats (Admin)
GET    /api/statistics/revenue-chart          → Revenue chart data (Admin)
GET    /api/statistics/top-products           → Top products chart (Admin)
GET    /api/statistics/order-status           → Order status chart (Admin)
GET    /api/statistics/user-registration      → User registration chart (Admin)
GET    /api/statistics/category-distribution  → Category distribution chart (Admin)
GET    /api/statistics/recent-activity        → Recent activity data (Admin)

// Total: 7 endpoints
```

---

## 📊 ENDPOINT SUMMARY STATISTICS

### Total Endpoints by Category:
1. **Authentication**: 2 endpoints
2. **User Management**: 13 endpoints  
3. **Products**: 9 endpoints
4. **Product Variants**: 7 endpoints
5. **Categories**: 8 endpoints
6. **Orders**: 13 endpoints
7. **Addresses**: 6 endpoints
8. **Vouchers**: 11 endpoints
9. **Payment Methods**: 12 endpoints
10. **Reviews**: 6 endpoints
11. **Wishlist**: 10 endpoints
12. **Posts/Blog**: 5 endpoints
13. **Colors**: ~5 endpoints
14. **Sizes**: ~5 endpoints
15. **Banners**: ~7 endpoints
16. **Statistics**: 7 endpoints

### **TOTAL ESTIMATED ENDPOINTS: ~130-140 endpoints**

### Permission Distribution:
- **Public Endpoints**: ~25 endpoints (19%)
- **Protected Endpoints**: ~35 endpoints (27%)  
- **Admin Endpoints**: ~70 endpoints (54%)

### HTTP Methods Distribution:
- **GET**: ~75 endpoints (58%) - Data retrieval
- **POST**: ~25 endpoints (19%) - Data creation
- **PUT**: ~20 endpoints (15%) - Data updates
- **DELETE**: ~10 endpoints (8%) - Data deletion

---

## 🎯 API DESIGN PATTERNS

### RESTful Design ✅
- **Resource-based URLs** - `/api/products`, `/api/orders`
- **HTTP Methods** - GET, POST, PUT, DELETE
- **Consistent naming** - Plural nouns for collections
- **Hierarchical structure** - `/api/products/:id/variants`

### Security Patterns ✅
- **JWT Authentication** - Bearer token in Authorization header
- **Role-based Authorization** - Customer vs Admin permissions
- **Resource Ownership** - Users can only access their own data
- **Input Validation** - ObjectId validation, data validation

### Response Patterns ✅
- **Consistent JSON responses** - Standard format
- **HTTP Status Codes** - Proper status codes (200, 201, 400, 401, 403, 404, 500)
- **Error Handling** - Centralized error responses
- **Pagination** - Page/limit parameters

Đây là một hệ thống API RESTful hoàn chỉnh với **130-140 endpoints** covering tất cả major e-commerce functionalities!
