# Admin Sort Implementation Guide

## Overview

This document describes the implementation of admin-friendly sorting functionality for all backend endpoints. The system ensures that admin users always see data sorted by creation date in descending order (newest first) by default, while still allowing custom sorting options.

## Features

### 1. Default Admin Sort
- All admin endpoints automatically sort by `createdAt: -1` (newest first)
- Secondary sort by `updatedAt: -1` for consistent ordering
- Applies to all models: User, Order, Product, Category, Review, etc.

### 2. Custom Sort Support
- Admins can still override default sorting with query parameters
- Supports multiple sort formats:
  - `?sortBy=name&sortOrder=asc`
  - `?sort={"name": 1, "createdAt": -1}`
  - `?sort=name:asc,createdAt:desc`

### 3. Field Validation
- Only allows sorting by predefined sortable fields for each model
- Prevents sorting by sensitive or non-indexed fields
- Automatic fallback to default sort if invalid fields are provided

## Implementation Components

### 1. AdminSortUtils (`utils/adminSortUtils.js`)
Core utility class for handling admin sorting:

```javascript
// Get default admin sort
const defaultSort = AdminSortUtils.getDefaultSort();
// Returns: { createdAt: -1, updatedAt: -1 }

// Parse admin sort from query parameters
const sort = AdminSortUtils.parseAdminSort(req.query, 'User');

// Apply admin sort to query options
const options = AdminSortUtils.applyDefaultAdminSort(queryOptions, 'User');
```

### 2. AdminSortMiddleware (`middlewares/adminSortMiddleware.js`)
Middleware that automatically applies admin sorting to routes:

```javascript
// Apply to specific model
router.get('/admin/users', adminSortForModel('User'), controller.getUsers);

// Apply to all admin routes
router.use('/admin/*', adminSortMiddleware());
```

### 3. Controller Integration
All controllers updated to use AdminSortUtils:

```javascript
// In controller methods
const sortConfig = AdminSortUtils.ensureAdminSort(req, 'User');
const result = await this.service.getAll({ ...options, sort: sortConfig });
```

### 4. Service Integration
BaseService updated to use default admin sort:

```javascript
// Default sort in getAll method
const sort = options.sort || AdminSortUtils.getDefaultSort();
```

## Usage Examples

### 1. Default Behavior
```javascript
// GET /api/users (admin)
// Automatically sorted by createdAt DESC, updatedAt DESC

// GET /api/orders/admin/all
// Automatically sorted by createdAt DESC, updatedAt DESC
```

### 2. Custom Sorting
```javascript
// GET /api/users?sortBy=name&sortOrder=asc
// Sorted by name ASC, then createdAt DESC

// GET /api/orders/admin/all?sort={"total": -1}
// Sorted by total DESC, then createdAt DESC
```

### 3. Multiple Field Sorting
```javascript
// GET /api/products?sort=name:asc,price:desc
// Sorted by name ASC, then price DESC, then createdAt DESC
```

## Configuration

### Sortable Fields Configuration
Each model has predefined sortable fields in `AdminSortUtils`:

```javascript
const SORTABLE_FIELDS = {
    User: ['name', 'email', 'createdAt', 'updatedAt', 'lastLogin'],
    Order: ['orderCode', 'total', 'finalTotal', 'createdAt', 'updatedAt', 'status'],
    Product: ['name', 'price', 'createdAt', 'updatedAt', 'rating'],
    // ... more models
};
```

### Adding New Sortable Fields
```javascript
// Add new sortable fields to a model
AdminSortUtils.addSortableFields('User', ['phoneNumber', 'city']);

// Get sortable fields for a model
const fields = AdminSortUtils.getSortableFields('User');
```

## API Endpoints Updated

### User Management
- `GET /api/users` - List all users (admin)
- `GET /api/users/search` - Search users (admin)

### Order Management
- `GET /api/orders/admin/all` - List all orders
- `GET /api/orders/admin/all-with-query` - List orders with advanced filters
- `GET /api/orders/admin/search` - Search orders
- `GET /api/orders/admin/user/:userId` - Get orders by user

### Product Management
- `GET /api/products` - List all products (admin)
- `GET /api/products/search` - Search products (admin)

### Category Management
- `GET /api/categories` - List all categories (admin)

### Review Management
- `GET /api/reviews` - List all reviews (admin)

### Other Endpoints
- Cart, Voucher, WishList, Banner, etc. all follow the same pattern

## Testing

### Manual Testing
```bash
# Test default sort
curl -H "Authorization: Bearer <admin-token>" \
  "http://localhost:5000/api/users?limit=5"

# Test custom sort
curl -H "Authorization: Bearer <admin-token>" \
  "http://localhost:5000/api/users?sortBy=name&sortOrder=asc&limit=5"
```

### Automated Testing
```bash
# Run admin sort tests
node testAdminSort.js

# Test specific model
node testAdminSort.js User
```

## Benefits

### 1. Consistent User Experience
- Admins always see newest data first
- Predictable ordering across all admin interfaces
- No need to manually sort by creation date

### 2. Performance
- Sorts by indexed fields (createdAt, updatedAt)
- Efficient database queries
- Proper use of MongoDB compound indexes

### 3. Flexibility
- Admins can still customize sorting when needed
- Multiple sort format support
- Field validation prevents errors

### 4. Maintainability
- Centralized sorting logic in AdminSortUtils
- Easy to add new models or fields
- Consistent implementation across all controllers

## Database Indexes

Ensure proper indexes exist for sorting:

```javascript
// In each model schema
Schema.index({ createdAt: -1 });
Schema.index({ updatedAt: -1 });
Schema.index({ createdAt: -1, updatedAt: -1 });

// Model-specific indexes
UserSchema.index({ name: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
ProductSchema.index({ price: -1, createdAt: -1 });
```

## Error Handling

### Invalid Sort Fields
```javascript
// Logs warning and falls back to default sort
AdminSortUtils.parseAdminSort({sortBy: 'invalidField'}, 'User');
// Output: Default sort { createdAt: -1, updatedAt: -1 }
```

### Malformed Sort Parameters
```javascript
// Handles malformed JSON gracefully
AdminSortUtils.parseAdminSort({sort: '{invalid json}'}, 'User');
// Output: Default sort { createdAt: -1, updatedAt: -1 }
```

## Migration Guide

### For Existing Endpoints
1. Add AdminSortUtils import to controller
2. Update route to include adminSortForModel middleware
3. Update controller method to use AdminSortUtils.ensureAdminSort
4. Test the endpoint

### For New Endpoints
1. Use adminSortForModel middleware in route
2. Use AdminSortUtils.ensureAdminSort in controller
3. Add sortable fields to SORTABLE_FIELDS configuration
4. Add appropriate database indexes

## Best Practices

### 1. Always Use Middleware
```javascript
// Good
router.get('/admin/data', adminSortForModel('Model'), controller.getData);

// Avoid
router.get('/admin/data', controller.getData); // No automatic sorting
```

### 2. Include createdAt in Custom Sorts
```javascript
// Good - includes createdAt as fallback
const sort = AdminSortUtils.parseAdminSort(req.query, 'User');

// Avoid - manual sorting without fallback
const sort = { [req.query.sortBy]: req.query.sortOrder === 'asc' ? 1 : -1 };
```

### 3. Validate Sort Fields
```javascript
// Good - uses predefined sortable fields
const sortableFields = AdminSortUtils.getSortableFields('User');

// Avoid - allows any field
const sortBy = req.query.sortBy; // Could be any field
```

This implementation ensures that all admin endpoints provide a consistent, efficient, and user-friendly sorting experience.
