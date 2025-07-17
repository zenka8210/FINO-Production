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
GET    /api/users                  → Lấy danh sách users với query middleware (Admin)
GET    /api/users/stats            → Thống kê users (Admin)
GET    /api/users/:id              → Lấy thông tin user by ID (Admin)
PUT    /api/users/:id              → Cập nhật user by ID (Admin)
DELETE /api/users/:id              → Xóa user (Admin)
PATCH  /api/users/:id/role         → Cập nhật role user (Admin)
PATCH  /api/users/:id/status       → Kích hoạt/vô hiệu hóa user (Admin)

// Protected Routes - require authMiddleware only
GET    /api/users/me/profile       → Lấy profile của user hiện tại
PUT    /api/users/me/profile       → Cập nhật profile của user hiện tại
PUT    /api/users/me/password      → Thay đổi mật khẩu của user hiện tại

// User Address Management Routes
POST   /api/users/me/addresses     → Thêm địa chỉ mới cho user
POST   /api/users/me/addresses-debug → Debug endpoint cho address
GET    /api/users/me/addresses     → Lấy tất cả địa chỉ của user
GET    /api/users/me/addresses/:addressId → Lấy địa chỉ by ID
PUT    /api/users/me/addresses/:addressId → Cập nhật địa chỉ
DELETE /api/users/me/addresses/:addressId → Xóa địa chỉ
PATCH  /api/users/me/addresses/:addressId/set-default → Đặt địa chỉ mặc định

// Total: 18 endpoints
```

### 3. 🛍️ PRODUCT ROUTES (`/api/products`)
```javascript
// Public Routes
GET    /api/products/available                   → Lấy sản phẩm có sẵn (còn hàng)
GET    /api/products/check-availability/:id      → Kiểm tra tồn kho sản phẩm
GET    /api/products/check-variant-stock/:variantId → Kiểm tra tồn kho variant
POST   /api/products/validate-cart              → Kiểm tra giỏ hàng trước checkout
GET    /api/products/:id/validate-display       → Kiểm tra sản phẩm có thể hiển thị
POST   /api/products/check-add-to-cart          → Kiểm tra có thể thêm vào giỏ hàng
GET    /api/products/public                     → Lấy tất cả sản phẩm (Public)
GET    /api/products/public-display             → Lấy sản phẩm cho hiển thị công khai
GET    /api/products/category/:categoryId/public → Sản phẩm theo danh mục (Public)

// Admin Routes - require authMiddleware + adminMiddleware  
GET    /api/products                            → Lấy tất cả sản phẩm (Admin)
GET    /api/products/:id                        → Lấy chi tiết sản phẩm (Admin)
POST   /api/products                            → Tạo sản phẩm mới (Admin)
PUT    /api/products/:id                        → Cập nhật sản phẩm (Admin)
DELETE /api/products/:id                        → Xóa sản phẩm (Admin)
GET    /api/products/admin/out-of-stock         → Lấy sản phẩm hết hàng (Admin)
GET    /api/products/admin/out-of-stock-notification → Thông báo hết hàng (Admin)
GET    /api/products/admin/statistics           → Thống kê sản phẩm (Admin)
GET    /api/products/:id/validate-display-admin → Kiểm tra validation cho admin

// Total: 18 endpoints
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
GET    /api/categories/tree                   → Lấy cây danh mục (Public)
GET    /api/categories/roots                  → Lấy danh mục gốc (Public)
GET    /api/categories/:id/children           → Lấy danh mục con (Public)
GET    /api/categories/:id/path               → Lấy đường dẫn danh mục (Public)
GET    /api/categories/:id/ancestors          → Lấy danh mục tổ tiên (Public)
GET    /api/categories/public                 → Lấy tất cả danh mục (Public)
GET    /api/categories/:id/public             → Lấy danh mục by ID (Public)

// Admin Routes - require authMiddleware + adminMiddleware
GET    /api/categories                        → Lấy tất cả danh mục (Admin)
GET    /api/categories/:id                    → Lấy danh mục by ID (Admin)
POST   /api/categories                        → Tạo danh mục mới (Admin)
PUT    /api/categories/:id                    → Cập nhật danh mục (Admin)
DELETE /api/categories/:id                    → Xóa danh mục (Admin)
GET    /api/categories/:id/stats              → Thống kê danh mục (Admin)
GET    /api/categories/:id/can-delete         → Kiểm tra có thể xóa (Admin)
POST   /api/categories/validate-parent        → Validate danh mục cha (Admin)

// Total: 15 endpoints
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
GET    /api/orders/:productId/can-review      → Kiểm tra có thể review sản phẩm

// Admin Routes - require authMiddleware + adminMiddleware
GET    /api/orders/admin/all                  → Lấy tất cả orders (Admin)
GET    /api/orders/admin/stats                → Thống kê orders (Admin)
GET    /api/orders/admin/statistics           → Thống kê chi tiết (Admin)
GET    /api/orders/admin/trends               → Xu hướng orders (Admin)
GET    /api/orders/admin/all-with-query       → Orders với query middleware (Admin)
GET    /api/orders/admin/search               → Tìm kiếm orders (Admin)
GET    /api/orders/admin/top-products         → Top sản phẩm bán chạy (Admin)
GET    /api/orders/admin/payment-method/:paymentMethod → Orders theo payment method (Admin)
GET    /api/orders/admin/user/:userId         → Orders theo user ID (Admin)
PUT    /api/orders/admin/:id/status           → Cập nhật trạng thái order (Admin)
PUT    /api/orders/admin/:id/cancel           → Hủy order (Admin)
DELETE /api/orders/admin/:id                 → Xóa order (Admin)
PUT    /api/orders/admin/update-shipping-fees → Cập nhật phí vận chuyển (Admin)

// Total: 19 endpoints
```

### 7. 🛒 CART ROUTES (`/api/cart`)
```javascript
// Protected Routes - require authMiddleware
GET    /api/cart                              → Lấy giỏ hàng của user
GET    /api/cart/count                        → Đếm số items trong giỏ hàng
POST   /api/cart/items                        → Thêm item vào giỏ hàng
PUT    /api/cart/items/:productVariantId      → Cập nhật quantity item
DELETE /api/cart/items/:productVariantId      → Xóa item khỏi giỏ hàng
DELETE /api/cart                              → Xóa toàn bộ giỏ hàng
POST   /api/cart/sync                         → Đồng bộ giỏ hàng client-server
POST   /api/cart/validate                     → Validate giỏ hàng
POST   /api/cart/calculate-total              → Tính tổng tiền giỏ hàng
POST   /api/cart/checkout                     → Checkout giỏ hàng thành order

// Admin Routes - require authMiddleware + adminMiddleware
GET    /api/cart/admin/all                    → Lấy tất cả carts/orders (Admin)
GET    /api/cart/admin/orders                 → Lấy tất cả orders (Admin)
GET    /api/cart/admin/active-carts           → Lấy tất cả active carts (Admin)
GET    /api/cart/admin/statistics             → Thống kê cart (Admin)
GET    /api/cart/admin/trends                 → Xu hướng cart activity (Admin)

// Total: 15 endpoints
```

### 8. 🏠 ADDRESS ROUTES (`/api/addresses`)
```javascript
// Public Routes
GET    /api/addresses/cities                  → Lấy danh sách tỉnh/thành phố hợp lệ
GET    /api/addresses/guidance                → Hướng dẫn nhập địa chỉ
POST   /api/addresses/validate                → Validate và preview địa chỉ

// Protected Routes - require authMiddleware (user chỉ quản lý địa chỉ của mình)
POST   /api/addresses                         → Tạo địa chỉ mới
GET    /api/addresses                         → Lấy tất cả địa chỉ của user
GET    /api/addresses/:id                     → Lấy địa chỉ by ID
PUT    /api/addresses/:id                     → Cập nhật địa chỉ
DELETE /api/addresses/:id                     → Xóa địa chỉ
PATCH  /api/addresses/:id/set-default         → Đặt làm địa chỉ mặc định
DELETE /api/addresses/:id/with-replacement    → Xóa địa chỉ với thay thế

// Total: 10 endpoints
```

### 9. 🎟️ VOUCHER ROUTES (`/api/vouchers`)
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

### 10. 💳 PAYMENT METHOD ROUTES (`/api/payment-methods`)
```javascript
// Public Routes
GET    /api/payment-methods/active            → Lấy payment methods đang hoạt động (Public)
GET    /api/payment-methods/type/:type        → Lấy payment methods theo loại (Public)

// Admin Routes - require authMiddleware + adminMiddleware
GET    /api/payment-methods                   → Lấy tất cả payment methods với filters (Admin)
GET    /api/payment-methods/stats             → Thống kê payment methods (Admin)
POST   /api/payment-methods                   → Tạo payment method mới (Admin)
GET    /api/payment-methods/:id               → Lấy payment method by ID (Admin)
PUT    /api/payment-methods/:id               → Cập nhật payment method (Admin)
DELETE /api/payment-methods/:id               → Xóa payment method (Admin)
PUT    /api/payment-methods/:id/toggle-status → Bật/tắt trạng thái (Admin)
PUT    /api/payment-methods/:id/order         → Cập nhật thứ tự (Admin)
PUT    /api/payment-methods/:id/config        → Cập nhật cấu hình (Admin)
PUT    /api/payment-methods/bulk/toggle-status → Bulk toggle status (Admin)
DELETE /api/payment-methods/bulk/delete       → Bulk delete (Admin)

// Total: 13 endpoints
```

### 11. ⭐ REVIEW ROUTES (`/api/reviews`)
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

// Total: 7 endpoints
```

### 12. 💝 WISHLIST ROUTES (`/api/wishlist`)
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

### 13. 📰 POST/BLOG ROUTES (`/api/posts`)
```javascript
// Public Routes
GET    /api/posts/published                   → Lấy posts đã published (Public)
GET    /api/posts/:id                         → Lấy post by ID (Public)

// Admin Routes - require authMiddleware + adminMiddleware
GET    /api/posts                             → Lấy tất cả posts với query middleware (Admin)
POST   /api/posts                             → Tạo post mới (Admin)

// Protected Routes - require authMiddleware
PUT    /api/posts/:id                         → Cập nhật post (Author hoặc Admin)
DELETE /api/posts/:id                         → Xóa post (Author hoặc Admin)
PATCH  /api/posts/:id/toggle-visibility       → Toggle visibility (Admin)

// Total: 7 endpoints
```

### 14. 🎨 COLOR ROUTES (`/api/colors`)
```javascript
// Public Routes
GET    /api/colors/suggestions                → Lấy gợi ý màu (Public)
GET    /api/colors/search                     → Tìm kiếm màu theo tên (Public)
GET    /api/colors/public                     → Lấy tất cả colors (Public)
GET    /api/colors/public/:id                 → Lấy color by ID (Public)
POST   /api/colors/validate-name              → Validate tên màu (Public)

// Admin Routes - require authMiddleware + adminMiddleware
GET    /api/colors                            → Lấy tất cả colors với query middleware (Admin)
GET    /api/colors/:id                        → Lấy color by ID (Admin)
POST   /api/colors                            → Tạo color mới (Admin)
PUT    /api/colors/:id                        → Cập nhật color (Admin)
DELETE /api/colors/:id                        → Xóa color (Admin)
GET    /api/colors/admin/stats                → Thống kê colors (Admin)
GET    /api/colors/admin/products-using       → Sản phẩm sử dụng color (Admin)
GET    /api/colors/admin/popular              → Colors phổ biến (Admin)

// Total: 13 endpoints
```

### 15. 📏 SIZE ROUTES (`/api/sizes`)
```javascript
// Public Routes
GET    /api/sizes/suggestions                 → Lấy gợi ý sizes (Public)
GET    /api/sizes/search                      → Tìm kiếm size theo tên (Public)
GET    /api/sizes/public                      → Lấy tất cả sizes (Public)
GET    /api/sizes/public/:id                  → Lấy size by ID (Public)
POST   /api/sizes/validate-name               → Validate tên size (Public)

// Admin Routes - require authMiddleware + adminMiddleware  
GET    /api/sizes                             → Lấy tất cả sizes với query middleware (Admin)
GET    /api/sizes/:id                         → Lấy size by ID (Admin)
POST   /api/sizes                             → Tạo size mới (Admin)
PUT    /api/sizes/:id                         → Cập nhật size (Admin)
DELETE /api/sizes/:id                         → Xóa size (Admin)
GET    /api/sizes/admin/stats                 → Thống kê sizes (Admin)
GET    /api/sizes/admin/products-using        → Sản phẩm sử dụng size (Admin)
GET    /api/sizes/admin/popular               → Sizes phổ biến (Admin)

// Total: 13 endpoints
```

### 16. 🎯 BANNER ROUTES (`/api/banners`)
```javascript
// Public Routes
GET    /api/banners/active                    → Lấy banners đang hoạt động (Public)
GET    /api/banners/status/:status            → Lấy banners theo trạng thái (Public)
GET    /api/banners/:id/check-status          → Kiểm tra trạng thái banner (Public)

// Admin Routes - require authMiddleware + adminMiddleware
GET    /api/banners/statistics                → Thống kê banners (Admin)
GET    /api/banners/admin/status              → Lấy banners với trạng thái (Admin)
POST   /api/banners/validate-link             → Validate link banner (Admin)
GET    /api/banners                           → Lấy tất cả banners với query middleware (Admin)
GET    /api/banners/:id                       → Lấy banner by ID (Admin)
POST   /api/banners                           → Tạo banner mới (Admin)
PUT    /api/banners/:id                       → Cập nhật banner (Admin)
DELETE /api/banners/:id                       → Xóa banner (Admin)

// Total: 11 endpoints
```

### 17. 📊 STATISTICS ROUTES (`/api/statistics`)
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
2. **User Management**: 18 endpoints  
3. **Products**: 18 endpoints
4. **Product Variants**: 7 endpoints
5. **Categories**: 15 endpoints
6. **Orders**: 19 endpoints
7. **Cart**: 15 endpoints
8. **Addresses**: 10 endpoints
9. **Vouchers**: 11 endpoints
10. **Payment Methods**: 13 endpoints
11. **Reviews**: 7 endpoints
12. **Wishlist**: 10 endpoints
13. **Posts/Blog**: 7 endpoints
14. **Colors**: 13 endpoints
15. **Sizes**: 13 endpoints
16. **Banners**: 11 endpoints
17. **Statistics**: 7 endpoints

### **TOTAL ENDPOINTS: 196 endpoints**

### Permission Distribution:
- **Public Endpoints**: ~50 endpoints (26%)
- **Protected Endpoints**: ~55 endpoints (28%)  
- **Admin Endpoints**: ~91 endpoints (46%)

### HTTP Methods Distribution:
- **GET**: ~130 endpoints (66%) - Data retrieval
- **POST**: ~30 endpoints (15%) - Data creation
- **PUT**: ~25 endpoints (13%) - Data updates
- **DELETE**: ~8 endpoints (4%) - Data deletion
- **PATCH**: ~3 endpoints (2%) - Partial updates

---

## 🎯 API DESIGN PATTERNS

### RESTful Design ✅
- **Resource-based URLs** - `/api/products`, `/api/orders`, `/api/cart`
- **HTTP Methods** - GET, POST, PUT, DELETE, PATCH
- **Consistent naming** - Plural nouns for collections
- **Hierarchical structure** - `/api/products/:id/variants`, `/api/users/me/addresses`

### Security Patterns ✅
- **JWT Authentication** - Bearer token in Authorization header
- **Role-based Authorization** - Customer vs Admin permissions
- **Resource Ownership** - Users can only access their own data
- **Input Validation** - ObjectId validation, data validation

### Response Patterns ✅
- **Consistent JSON responses** - Standard format
- **HTTP Status Codes** - Proper status codes (200, 201, 400, 401, 403, 404, 500)
- **Error Handling** - Centralized error responses
- **Pagination** - Query middleware support for page/limit parameters
- **Filtering & Sorting** - Advanced query capabilities

### New Features Added ✅
- **Cart Management** - Complete shopping cart functionality
- **Advanced Address Management** - Enhanced address operations
- **Comprehensive Statistics** - Detailed analytics for admin
- **Enhanced Product Operations** - Stock management, availability checks
- **Bulk Operations** - Payment methods bulk actions

