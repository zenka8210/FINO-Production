# Route-by-Route Permission Analysis

## Complete Route Permission Mapping

### 1. Authentication Routes (`authRoutes.js`)
```javascript
// Public Routes - No middleware required
POST /api/auth/register     → Public ✅
POST /api/auth/login        → Public ✅

// Protected Routes - authMiddleware required  
POST /api/auth/logout       → Protected 🔐
GET  /api/auth/me          → Protected 🔐
```

### 2. Product Routes (`productRoutes.js`)
```javascript
// Public Routes
GET  /api/products         → Public ✅
GET  /api/products/public  → Public ✅
GET  /api/products/:id     → Public ✅

// Admin Only Routes - authMiddleware + adminMiddleware
POST   /api/products       → Admin 👑
PUT    /api/products/:id   → Admin 👑
DELETE /api/products/:id   → Admin 👑
```

### 3. Category Routes (`categoryRoutes.js`)
```javascript
// Public Routes
GET  /api/categories       → Public ✅
GET  /api/categories/:id   → Public ✅

// Admin Only Routes
POST   /api/categories     → Admin 👑
PUT    /api/categories/:id → Admin 👑
DELETE /api/categories/:id → Admin 👑
```

### 4. Order Routes (`orderRoutes.js`)
```javascript
// Protected Routes - Own orders only
GET  /api/orders          → Protected + Ownership 🔐👤
POST /api/orders          → Protected 🔐

// Admin + Owner Access
GET    /api/orders/:id    → Admin 👑 OR Owner 👤
PUT    /api/orders/:id    → Admin 👑 OR Owner 👤

// Admin Only
DELETE /api/orders/:id    → Admin 👑
```

### 5. User Routes (`userRoutes.js`)
```javascript
// Admin Access for user management
GET    /api/users         → Admin 👑
POST   /api/users         → Admin 👑
DELETE /api/users/:id     → Admin 👑

// Admin + Owner Access
GET /api/users/:id        → Admin 👑 OR Owner 👤
PUT /api/users/:id        → Admin 👑 OR Owner 👤
```

### 6. Statistics Routes (`statisticsRoutes.js`)
```javascript
// All Admin Only
GET /api/statistics/dashboard → Admin 👑
GET /api/statistics/revenue   → Admin 👑
GET /api/statistics/orders    → Admin 👑
GET /api/statistics/products  → Admin 👑
GET /api/statistics/users     → Admin 👑
```

### 7. Review Routes (`reviewRoutes.js`)
```javascript
// Public Read Access
GET /api/reviews              → Public ✅
GET /api/reviews/product/:id  → Public ✅

// Protected Operations
POST   /api/reviews           → Protected 🔐
PUT    /api/reviews/:id       → Protected + Owner 🔐👤
DELETE /api/reviews/:id       → Admin 👑 OR Owner 👤
```

### 8. Cart Routes (`cartRoutes.js`)
```javascript
// All Protected - Own cart only
GET    /api/cart              → Protected + Owner 🔐👤
POST   /api/cart/add          → Protected 🔐
PUT    /api/cart/update/:id   → Protected + Owner 🔐👤
DELETE /api/cart/remove/:id   → Protected + Owner 🔐👤
DELETE /api/cart/clear        → Protected + Owner 🔐👤
```

### 9. Wishlist Routes (`wishlistRoutes.js`)
```javascript
// All Protected - Own wishlist only
GET    /api/wishlist          → Protected + Owner 🔐👤
POST   /api/wishlist/add      → Protected 🔐
DELETE /api/wishlist/remove/:id → Protected + Owner 🔐👤
```

### 10. Address Routes (`addressRoutes.js`)
```javascript
// All Protected - Own addresses only
GET    /api/addresses         → Protected + Owner 🔐👤
POST   /api/addresses         → Protected 🔐
PUT    /api/addresses/:id     → Protected + Owner 🔐👤
DELETE /api/addresses/:id     → Protected + Owner 🔐👤
```

## Middleware Chain Patterns

### Pattern 1: Public Access
```javascript
router.get('/public-endpoint', controller.method);
// No middleware → Direct access
```

### Pattern 2: Authentication Required  
```javascript
router.post('/protected-endpoint', authMiddleware, controller.method);
// JWT verification → Controller
```

### Pattern 3: Admin Only Access
```javascript
router.post('/admin-endpoint', authMiddleware, adminMiddleware, controller.method);
// JWT verification → Role check → Controller
```

### Pattern 4: Ownership Validation
```javascript
router.get('/user/:id', authMiddleware, ownershipMiddleware, controller.method);
// JWT verification → Ownership check → Controller
```

### Pattern 5: Admin OR Owner Access
```javascript
// Implemented in controller logic
if (req.user.role === 'admin' || req.user.id === resourceOwnerId) {
  // Allow access
} else {
  // Deny access
}
```

## Permission Summary by User Type

### Anonymous Users
- ✅ Browse products and categories
- ✅ View product reviews  
- ✅ Register and login
- ❌ Cannot access any protected features

### Customer Users (role: 'customer')
- ✅ All anonymous permissions
- ✅ Manage own profile
- ✅ Create and manage orders
- ✅ Manage cart and wishlist
- ✅ Write product reviews
- ✅ Manage delivery addresses
- ❌ Cannot access admin features
- ❌ Cannot manage other users' data

### Admin Users (role: 'admin')
- ✅ All customer permissions
- ✅ Full product management (CRUD)
- ✅ Full category management (CRUD)
- ✅ View and manage all orders
- ✅ User management (view, edit, delete)
- ✅ Access statistics and analytics
- ✅ Delete any reviews
- ✅ Access all system features

## Security Validation Points

### JWT Token Validation
1. **Token presence** in Authorization header
2. **Token format** (Bearer <token>)
3. **Token signature** verification
4. **Token expiration** check
5. **User existence** validation

### Role-Based Access
1. **User role** extraction from token
2. **Required role** matching
3. **Permission inheritance** (admin inherits customer)

### Resource Ownership
1. **User ID** extraction from token
2. **Resource owner** identification  
3. **Ownership validation** against user ID
4. **Admin override** capability

## Error Response Patterns

### 401 Unauthorized
- Missing JWT token
- Invalid JWT token
- Expired JWT token
- User not found

### 403 Forbidden  
- Insufficient role permissions
- Resource ownership violation
- Admin access required

### 404 Not Found
- Resource doesn't exist
- User doesn't exist

This comprehensive mapping shows the complete security model implementation across all routes in the e-commerce server.
