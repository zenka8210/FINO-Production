# Query Middleware - Hướng Dẫn Sử Dụng

## Tổng Quan
Query Middleware là một hệ thống tái sử dụng cho việc xử lý phân trang, lọc, sắp xếp và tìm kiếm dữ liệu trong ứng dụng Node.js/MongoDB.

## Cấu Trúc Files

```
middlewares/
├── queryMiddleware.js          # Core QueryBuilder class và middleware
utils/
├── queryUtils.js              # Utility functions và pre-configured setups
services/
├── enhancedProductService.js  # Demo service sử dụng middleware
controllers/
├── enhancedProductController.js # Demo controller
routes/
├── enhancedProductRoutes.js   # Demo routes với documentation
```

## Tính Năng Chính

### 1. Phân Trang (Pagination)
- Tự động parse `page` và `limit`
- Giới hạn tối đa `limit` theo config
- Trả về metadata: `total`, `totalPages`, `hasNextPage`, `hasPrevPage`

### 2. Sắp Xếp (Sorting)
- Hỗ trợ multiple fields: `sort=name:asc,price:desc`
- Hỗ trợ format MongoDB: `sort=name,-price`
- Default sort configurable

### 3. Lọc (Filtering)
- **Range filtering**: `minPrice`, `maxPrice` → `{price: {$gte: min, $lte: max}}`
- **Array filtering**: `colors=red,blue` → `{colors: {$in: ['red', 'blue']}}`
- **Boolean filtering**: `isActive=true` → `{isActive: true}`
- **Regex filtering**: `name=laptop` → `{name: {$regex: 'laptop', $options: 'i'}}`
- **ObjectId filtering**: Tự động validate ObjectId
- **Date filtering**: `createdFrom`, `createdTo` → date range

### 4. Tìm Kiếm (Search)
- Full-text search across multiple fields
- Regex-based search với case-insensitive

### 5. Select & Populate
- `select=name,price` → chỉ lấy fields cần thiết
- `populate=category,colors` → populate references

## Cách Sử Dụng

### 1. Sử Dụng QueryBuilder Trực Tiếp

```javascript
const { createQueryBuilder } = require('../middlewares/queryMiddleware');

// Trong service
async getAllProducts(queryParams) {
    const result = await createQueryBuilder(Product, queryParams)
        .paginate()
        .sortBy()
        .search(['name', 'description'])
        .filter({
            category: { type: 'objectId' },
            minPrice: { type: 'range', field: 'price' },
            maxPrice: { type: 'range', field: 'price' },
            isActive: { type: 'boolean' }
        })
        .execute();
    
    return result;
}
```

### 2. Sử Dụng QueryUtils (Recommended)

```javascript
const { QueryUtils } = require('../utils/queryUtils');

// Trong service - Sử dụng pre-configured
async getAllProducts(queryParams) {
    return await QueryUtils.getProducts(Product, queryParams);
}

// Hoặc custom configuration
async getAllUsers(queryParams) {
    return await QueryUtils.paginatedQuery(User, queryParams, {
        searchFields: ['name', 'email'],
        filterConfig: {
            role: { type: 'regex' },
            isActive: { type: 'boolean' },
            createdFrom: { type: 'date', field: 'createdAt' }
        },
        defaultPopulate: 'profile'
    });
}
```

### 3. Sử Dụng Trong BaseService

```javascript
// Trong service extends BaseService
async getAllItems(queryParams) {
    return await this.getPaginated(queryParams, {
        searchFields: ['name', 'description'],
        filterConfig: {
            category: { type: 'objectId' },
            isActive: { type: 'boolean' }
        }
    });
}
```

### 4. Sử Dụng Middleware Trong Routes

```javascript
const { queryParserMiddleware } = require('../middlewares/queryMiddleware');

// Apply middleware
router.use(queryParserMiddleware());

// Trong controller, req.queryOptions sẽ có parsed data
router.get('/products', (req, res, next) => {
    console.log(req.queryOptions); // {page, limit, sort, filters, etc.}
});
```

## Cấu Hình Filter Types

### Range Filter
```javascript
{
    minPrice: { type: 'range', field: 'price' },
    maxPrice: { type: 'range', field: 'price' }
}
// Input: ?minPrice=100&maxPrice=500
// Output: {price: {$gte: 100, $lte: 500}}
```

### Array Filter
```javascript
{
    colors: { type: 'array' }
}
// Input: ?colors=red,blue,green
// Output: {colors: {$in: ['red', 'blue', 'green']}}
```

### Boolean Filter
```javascript
{
    isActive: { type: 'boolean' }
}
// Input: ?isActive=true
// Output: {isActive: true}
```

### Regex Filter
```javascript
{
    name: { type: 'regex', options: 'i' }
}
// Input: ?name=laptop
// Output: {name: {$regex: 'laptop', $options: 'i'}}
```

### Date Filter
```javascript
{
    createdFrom: { type: 'date', field: 'createdAt' },
    createdTo: { type: 'date', field: 'createdAt' }
}
// Input: ?createdFrom=2024-01-01&createdTo=2024-12-31
// Output: {createdAt: {$gte: Date('2024-01-01'), $lte: Date('2024-12-31')}}
```

## API Examples

### Basic Pagination
```
GET /api/products?page=1&limit=10
```

### Search & Filter
```
GET /api/products?search=laptop&category=electronics&minPrice=500&maxPrice=2000
```

### Sorting
```
GET /api/products?sort=price:asc,createdAt:desc
```

### Field Selection
```
GET /api/products?select=name,price,category&populate=category
```

### Complex Query
```
GET /api/products/advanced?search=gaming&tags=laptop,business&rating=4&createdFrom=2024-01-01&sort=rating:desc,price:asc&page=1&limit=20
```

## Migration Guide

### Từ Service Cũ Sang Mới

**Cũ:**
```javascript
async getAllProducts(queryOptions) {
    const { page = 1, limit = 10, search, sortBy = 'createdAt' } = queryOptions;
    const skip = (page - 1) * limit;
    const filter = {};
    
    if (search) {
        filter.name = { $regex: search, $options: 'i' };
    }
    
    const products = await Product.find(filter)
        .sort({ [sortBy]: -1 })
        .skip(skip)
        .limit(limit);
        
    const total = await Product.countDocuments(filter);
    
    return { data: products, total, page, limit };
}
```

**Mới:**
```javascript
async getAllProducts(queryParams) {
    return await QueryUtils.getProducts(Product, queryParams);
}
```

### Từ Controller Cũ Sang Mới

**Cũ:**
```javascript
getAllProducts = async (req, res, next) => {
    try {
        const { page, limit, search, sortBy } = req.query;
        const result = await this.service.getAllProducts({ page, limit, search, sortBy });
        ResponseHandler.success(res, 'Success', result);
    } catch (error) {
        next(error);
    }
};
```

**Mới:**
```javascript
getAllProducts = async (req, res, next) => {
    try {
        const result = await this.service.getAllProducts(req.query);
        ResponseHandler.success(res, 'Success', result.data, result.pagination);
    } catch (error) {
        next(error);
    }
};
```

## Best Practices

1. **Sử dụng QueryUtils cho các trường hợp phổ biến**
2. **Sử dụng QueryBuilder cho logic custom**
3. **Apply queryParserMiddleware ở route level**
4. **Configure filter types phù hợp với model**
5. **Sử dụng pre-configured SEARCH_CONFIGS và POPULATE_CONFIGS**
6. **Validate ObjectId trước khi filter**
7. **Set giới hạn limit để tránh performance issues**

## Performance Tips

1. **Index fields được filter thường xuyên**
2. **Sử dụng `select` để giảm data transfer**
3. **Chỉ populate khi cần thiết**
4. **Set `limit` phù hợp (không quá lớn)**
5. **Sử dụng aggregation cho complex queries**

## Troubleshooting

### Common Issues

1. **Filter không hoạt động**: Check filter config type
2. **ObjectId invalid**: Middleware sẽ tự validate
3. **Performance chậm**: Check indexes và limit
4. **Sort không đúng**: Check sort format và field names

### Debug Mode

```javascript
// Enable debug trong QueryBuilder
const result = await createQueryBuilder(Model, queryParams)
    .paginate()
    .filter(filterConfig)
    .execute();

console.log('Applied filters:', result.filter);
console.log('Applied sort:', result.sort);
```

## Mở Rộng

### Thêm Filter Type Mới

```javascript
// Trong QueryBuilder.handleCustomFilter()
case 'custom':
    this.handleCustomFilter(key, value, config);
    break;

handleCustomFilter(key, value, config) {
    // Custom logic here
}
```

### Thêm Pre-configured Setup

```javascript
// Trong queryUtils.js
const FILTER_CONFIGS = {
    newModel: {
        customField: { type: 'custom', options: {...} }
    }
};

// Thêm helper method
static async getNewModelData(model, queryParams) {
    return await this.paginatedQuery(model, queryParams, {
        searchFields: ['field1', 'field2'],
        filterConfig: FILTER_CONFIGS.newModel
    });
}
```
