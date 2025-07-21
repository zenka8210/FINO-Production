
# 🧢 UI/UX DESIGN SYSTEM - FASHION BRAND FOR GEN Z

## 🧭 Mục tiêu
Xây dựng hệ thống thiết kế giao diện người dùng nhất quán, hiện đại, hướng đến giới trẻ (16–30 tuổi), năng động, thích công nghệ và thời trang.

---

## 🎨 1. BRAND COLORS

### 🎯 Định nghĩa
Sử dụng màu sắc phản ánh tính cách thương hiệu: hiện đại, trẻ trung, nổi bật.

| Name           | Variable        | HEX       | Dùng cho                          |
|----------------|-----------------|-----------|-----------------------------------|
| Primary        | --color-primary | #1E40AF   | Nút chính, tiêu đề, liên kết, **prices** |
| Accent         | --color-accent  | #F59E0B   | Highlight, icon, hover nổi bật    |
| Background     | --color-bg      | #FFFFFF   | Nền giao diện chính (updated)     |
| Text           | --color-text    | #111827   | Văn bản chính                     |
| Text Secondary | --color-text-secondary | #6B7280 | Văn bản phụ, descriptions     |
| Muted          | --color-muted   | #9CA3AF   | Văn bản phụ, trạng thái disabled  |
| Error          | --color-error   | #DC2626   | Cảnh báo, lỗi, **sale badges only** |
| Success        | --color-success | #10B981   | Thông báo thành công, **savings**  |

> ✅ **Text Color Guidelines**: 
> - **Primary text**: `var(--color-text)` cho tiêu đề chính, labels
> - **Secondary text**: `var(--color-text-secondary)` cho descriptions, captions
> - **Muted text**: `var(--color-muted)` cho disabled states, placeholders
> - **Price color**: Luôn sử dụng `var(--color-primary)` cho giá sản phẩm
> - **Red color**: Chỉ dành cho sale badges, discounts và error states
> - **Green color**: Dành cho success states và savings display

---

## 🎯 2. UI COMPONENTS TÁI SỬ DỤNG

### 📍 Vị trí Components
```
src/app/components/ui/
├── Button/              # Primary button component
├── Pagination/          # Pagination với jump-to-page
├── SearchBar/           # Controlled search với suggestions  
├── Modal/               # Modal overlay
├── Toast/               # Notification toasts
├── LoadingSpinner/      # Loading states
└── index.ts             # Export tất cả components
```

### 🔘 Button Component
**REQUIRED**: Sử dụng `Button` component thay vì `<button>` tags

```tsx
import { Button } from '@/app/components/ui';

// Variants
<Button variant="primary">Chính</Button>      // Blue background
<Button variant="secondary">Phụ</Button>     // White bg, blue border  
<Button variant="outline">Viền</Button>      // Transparent bg, gray border
<Button variant="ghost">Ẩn</Button>          // Transparent bg, no border

// Sizes
<Button size="sm">Nhỏ</Button>               // 0.375rem padding
<Button size="md">Vừa</Button>               // 0.75rem padding (default)
<Button size="lg">To</Button>                // 1rem padding

// States
<Button isLoading={true}>Đang tải...</Button>
<Button disabled>Vô hiệu hóa</Button>
```

### 📄 Pagination Component
**REQUIRED**: Sử dụng cho tất cả danh sách có phân trang

```tsx
import { Pagination, PaginationInfo } from '@/app/components/ui';

const pagination: PaginationInfo = {
  page: 1,
  limit: 12,
  totalPages: 5,
  totalProducts: 60,
  hasNextPage: true,
  hasPrevPage: false
};

<Pagination
  pagination={pagination}
  onPageChange={handlePageChange}
  showJumpToPage={true}      // Show input for jump to page
  showInfo={true}            // Show "Trang 1/5 (60 sản phẩm)"
/>
```

### 🔍 SearchBar Component
**REQUIRED**: Sử dụng cho tất cả search functionality

```tsx
import { SearchBar } from '@/app/components/ui';

// Controlled component
<SearchBar
  value={searchTerm}                    // Controlled value
  onChange={handleSearchChange}        // Real-time onChange
  onSearch={handleSearch}              // Form submit
  placeholder="Tìm sản phẩm..."
  showSuggestions={true}               // Enable/disable suggestions
/>
```

---

## 🔤 3. TYPOGRAPHY

### Font Family
```css
--font-heading: 'Poppins', sans-serif;
--font-body: 'Inter', sans-serif;
```

### Font Size & Weight

| Use Case     | Size | Weight | Color | Example       |
|--------------|------|--------|-------|---------------|
| H1           | 36px | 700    | --color-text | Trang chủ     |
| H2           | 28px | 600    | --color-text | Danh mục      |
| H3           | 20px | 600    | --color-text | Tên sản phẩm  |
| Paragraph    | 16px | 400    | --color-text | Mô tả sản phẩm|
| Caption      | 14px | 400    | --color-text-secondary | Text phụ      |
| Muted        | 12px | 400    | --color-muted | Disabled text |
| **Price**    | 18px | 600    | **--color-primary** | Giá sản phẩm |

---

## 🔘 3. BUTTON COMPONENT

### 🔹 PrimaryButton
```tsx
<Button variant="primary">Mua ngay</Button>
```
- Background: `#1E40AF`
- Text: `#FFFFFF`
- Border-radius: `8px`
- Padding: `12px 24px`
- Hover: sáng hơn 10% hoặc thêm shadow
- Focus: outline rõ ràng

### 🔹 SecondaryButton
```tsx
<Button variant="secondary">Xem thêm</Button>
```
- Border: 1px solid `#1E40AF`
- Text: `#1E40AF`
- Background: `#FFFFFF`
- Hover: nền `#1E40AF`, chữ trắng

### 🔹 Disabled
```tsx
<Button disabled>Mua ngay</Button>
```
- Background: `#E5E7EB`
- Text: `#9CA3AF`
- Cursor: `not-allowed`

---

## 📋 4. COMPONENT USAGE GUIDELINES

### ✅ DO - Sử dụng đúng cách

#### Buttons
```tsx
// ✅ CORRECT - Sử dụng Button component
import { Button } from '@/app/components/ui';
<Button variant="primary" onClick={handleSubmit}>Gửi</Button>

// ❌ WRONG - Không sử dụng raw button
<button className="bg-blue-500">Gửi</button>
```

#### Text Colors
```css
/* ✅ CORRECT - Sử dụng CSS variables */
.title { color: var(--color-text); }
.description { color: var(--color-text-secondary); }
.price { color: var(--color-primary); }

/* ❌ WRONG - Hard-coded colors */
.title { color: #111827; }
.price { color: red; }
```

#### Pagination
```tsx
// ✅ CORRECT - Sử dụng Pagination component
import { Pagination } from '@/app/components/ui';
<Pagination pagination={paginationData} onPageChange={handlePageChange} />

// ❌ WRONG - Custom pagination
<div>
  <button>Trước</button>
  <button>1</button>
  <button>2</button>
  <button>Sau</button>
</div>
```

### 🚫 DON'T - Tránh những điều này

1. **Không tự tạo button mới** - luôn dùng `Button` component
2. **Không hard-code màu sắc** - dùng CSS variables
3. **Không tạo pagination riêng** - dùng `Pagination` component  
4. **Không dùng màu đỏ cho giá** - dùng `--color-primary`
5. **Không tạo searchbar riêng** - dùng `SearchBar` component

### 🔄 Migration từ Old Code

#### Chuyển đổi Button
```tsx
// Before
<button className="bg-blue-500 text-white px-4 py-2 rounded">
  Click me
</button>

// After  
import { Button } from '@/app/components/ui';
<Button variant="primary" size="md">Click me</Button>
```

#### Chuyển đổi Text Colors
```css
/* Before */
.text { color: #111827; }
.muted { color: #9CA3AF; }

/* After */
.text { color: var(--color-text); }
.muted { color: var(--color-muted); }
```

---

## 🧱 5. GRID & LAYOUT SYSTEM

| Breakpoint | Min Width | Columns | Gutter |
|------------|-----------|---------|--------|
| Mobile     | 0px       | 4       | 16px   |
| Tablet     | 640px     | 8       | 20px   |
| Desktop    | 1024px+   | 12      | 24px   |

- Luôn tuân thử Quy tắc 1 view = 1 hành động chính (One View, One Purpose)
- Quy tắc nội dung theo thứ tự ưu tiên
- Quy tắc hiển thị trên mobile
- quy tắc CTA rõ ràng, duy nhất
- Container max-width: `1440px`
- Padding container: `0 1rem` trên mobile, `0 2rem` trên desktop

---

## 🧩 5. COMPONENT DESIGN STRUCTURE

### 🛍️ ProductCard.tsx
```tsx
<ProductCard
  name="Áo thun Local Brand"
  price="390.000đ"
  rating={4.5}
  image="/products/shirt.jpg"
  onAddToCart={() => {}}
/>
```
- Hover: scale image 1.05
- Show icon “Add to cart” nổi bên góc phải
- Rating: 5 sao (hoặc số)

### 📦 Modal.tsx
```tsx
<Modal title="Đăng nhập" onClose={closeModal}>
  <LoginForm />
</Modal>
```
- Overlay: nền tối mờ `rgba(0,0,0,0.5)`
- Centered content
- Close bằng ESC và nút X

### 🔍 SearchBar.tsx
```tsx
<SearchBar placeholder="Tìm kiếm sản phẩm..." onSearch={handleSearch} />
```
- Rounded full
- Icon search nằm bên trái input
- Gợi ý sản phẩm khi nhập

---

## 📱 6. RESPONSIVE RULES

- **Mobile First**: Ưu tiên trải nghiệm trên thiết bị nhỏ
- Ẩn menu → hamburger + toggle sidebar
- Button lớn hơn, font dễ đọc trên mobile

---

## 🌙 7. DARK MODE

- Kích hoạt class `dark` để chuyển giao diện
- Background: `#111827`, Text: `#F9FAFB`
- Button giữ nguyên màu chính
```tsx
<body className="dark">...</body>
```

---

## ⚙️ 8. INTERACTION & ANIMATION

- **Motion Lib:** Framer Motion hoặc CSS
- Button: hover scale nhẹ (1.02), transition `ease-in-out`
- Tooltip: delay 300ms
- Toast: hiển thị trên top-right, tự tắt sau 3s

---

## 🧑‍🦯 9. ACCESSIBILITY (A11Y)

- Alt đầy đủ cho hình ảnh
- Label rõ ràng với input
- Color contrast đạt chuẩn WCAG
- Keyboard navigation: Tab + Enter

## 🧑‍🦯 10. PHÂN TRANG (PAGINATION)
- Đúng data structure trả về từ backend
- Tối ưu UI/UX cho user theo cách phổ biến hiện đại

---

## 🔗 11. RELATED PRODUCTS COMPONENT

### 🎯 Design Principles
- **Background**: White (`#FFFFFF`) - Match với app theme
- **Border**: Top border `1px solid #e2e8f0` để tách biệt sections
- **Container**: Max-width `1200px`, centered với padding `0 1rem`
- **Card Shadow**: `0 4px 6px -1px rgba(0, 0, 0, 0.1)` - Consistent với ProductDetailPage

### 📦 Layout Structure
```tsx
<RelatedProducts 
  currentId="product-id" 
  category="category-name" 
  limit={8} 
/>
```
- tái sử dụng ui đã build ở `ui/` nếu có thể

### 🖼️ Visual Specifications

| Element           | Desktop        | Tablet         | Mobile         |
|-------------------|----------------|----------------|----------------|
| Grid Columns      | 4 columns      | 3 columns      | 2 columns      |
| Gap               | 1.5rem         | 1.25rem        | 1rem           |
| Card Height       | Auto           | Auto           | Auto           |
| Image Height      | 200px          | 200px          | 200px          |

### 🎨 Color Scheme
- **Price Color**: `var(--color-primary, #1E40AF)` - NOT red để match brand
- **Sale Badge**: `var(--color-error, #DC2626)` - Red chỉ cho discount
- **Category Text**: `var(--color-muted, #9CA3AF)` - Uppercase, letter-spacing
- **Card Border**: `1px solid #f1f5f9` - Subtle border

### 🔄 Interactive States
- **Hover Effect**: `translateY(-2px)` - Subtle lift
- **Quick Actions**: Fade in với `opacity: 0 → 1` on card hover
- **CTA Button**: Primary color, hover lift `translateY(-1px)`

### 📱 Responsive Behavior
```css
/* Mobile First */
.productsGrid {
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

/* Tablet */
@media (min-width: 640px) {
  .productsGrid {
    grid-template-columns: repeat(3, 1fr);
    gap: 1.25rem;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .productsGrid {
    grid-template-columns: repeat(4, 1fr);
    gap: 1.5rem;
  }
}
```

### 🎯 Logic & Data Flow
- **Priority**: 70% same category, 30% other categories
- **Limit**: Default 8 products, configurable
- **Error Handling**: Retry button với consistent styling
- **Loading State**: LoadingSpinner component với text
- **Empty State**: Centered message với muted color

### ✅ Implementation Checklist
- [ ] Uses `useRelatedProducts` hook for data management
- [ ] Integrates with `useCart` và `useWishlist` hooks
- [ ] Quick actions (heart + cart) visible on hover
- [ ] Price formatting với `formatCurrency` utility
- [ ] Responsive grid layout
- [ ] Accessibility support (alt text, ARIA labels)
- [ ] Error states với retry functionality

---

## 🛍️ 12. PRODUCT ITEM COMPONENT

### 🎯 Design Principles
- **Flexible Layout**: Grid hoặc List layout
- **Consistent Styling**: Match với design system colors
- **Interactive**: Quick actions on hover
- **Responsive**: Mobile-first approach

### 📦 Component Structure
```tsx
<ProductItem
  product={productData}
  layout="grid|list"
  showQuickActions={true}
  showDescription={false}
/>
```

### 🖼️ Layout Specifications

#### Grid Layout
| Element           | Desktop        | Mobile         |
|-------------------|----------------|----------------|
| Card Size         | Auto height    | Auto height    |
| Image Height      | 200px          | 160px          |
| Content Padding   | 1rem           | 1rem           |

#### List Layout  
| Element           | Desktop        | Mobile         |
|-------------------|----------------|----------------|
| Direction         | Row            | Column (stack) |
| Image Size        | 200x150px      | 100% x 200px   |
| Content Padding   | 1.5rem         | 1rem           |

### 🎨 Visual Elements
- **Sale Badge**: Top-left, red background với discount %
- **Quick Actions**: Top-right, fade in on hover
- **Price**: Primary blue color, với original price crossed out
- **Category**: Uppercase, muted color, letter-spacing

---

## 📋 13. PRODUCT LIST COMPONENT

### 🎯 Design Principles
- **Flexible Display**: Grid và List views với toggle
- **Sorting**: Multiple sort options (newest, price, name)
- **Pagination**: Page-based navigation
- **Responsive**: Mobile-first grid system

### 📦 Component Structure
```tsx
<ProductList
  products={productsArray}
  layout="grid|list"
  itemsPerPage={12}
  showLayoutToggle={true}
  showPagination={true}
/>
```

### 🖼️ Grid System

| Breakpoint | Grid Columns | List Layout |
|------------|--------------|-------------|
| Mobile     | 1 column     | Stacked     |
| Small      | 2 columns    | Stacked     |
| Tablet     | 3 columns    | Side-by-side|
| Desktop    | 4 columns    | Side-by-side|
| Large      | 5 columns    | Side-by-side|

### 🎛️ Controls & Features
- **Layout Toggle**: Grid/List icons với active state
- **Sort Dropdown**: Newest, Price (asc/desc), Name A-Z
- **Pagination**: Previous/Next với numbered pages
- **Product Count**: "Hiển thị X trong tổng số Y sản phẩm"

### 🎨 Control Styling
- **Header**: White background, subtle shadow, rounded corners
- **Toggle Buttons**: Gray background, active state with primary color
- **Sort Select**: Custom dropdown arrow, focus states
- **Pagination**: Rounded buttons, hover effects, disabled states

### ✅ Implementation Features
- [ ] Responsive grid system
- [ ] Layout switching (Grid ↔ List)
- [ ] Multiple sorting options
- [ ] Page-based pagination
- [ ] Loading và error states
- [ ] Empty state với friendly message
- [ ] Accessibility support (ARIA labels, keyboard nav)
- [ ] Smooth scroll to top on page change

---

## 🧑‍🦯 14. CONSISTENCY RULES

### 🎨 Color Usage Priority
1. **Primary Blue** (`#1E40AF`): Buttons, links, **all prices** (regular + sale)
2. **Error Red** (`#DC2626`): Sale badges, discount labels, error states only
3. **Success Green** (`#10B981`): Success states, savings display
4. **Muted Gray** (`#9CA3AF`): Secondary text, categories, original prices (strike-through)

### ⚠️ CRITICAL: Price Color Consistency
- ✅ **Correct**: `color: var(--color-primary)` cho tất cả prices
- ❌ **Incorrect**: `color: var(--color-error)` cho prices
- 🎯 **Rule**: Red chỉ dành cho discount badges, không phải price values

### 📐 Spacing System
- **Section Padding**: `2rem 0` (vertical)
- **Card Padding**: `1rem` (internal)
- **Grid Gap**: `1rem` (mobile) → `1.5rem` (desktop)
- **Title Margin**: `2rem` bottom

### 🔤 Typography Hierarchy
- **Section Title**: `1.75rem`, weight `600`
- **Product Name**: `1rem`, weight `600`, line-clamp `2`
- **Price**: `1.125rem`, weight `600`
- **Category**: `0.75rem`, uppercase, letter-spacing

> ✨ **Chú thích:** Tất cả developer, designer, QA và Copilot sử dụng tài liệu này như nguồn chính để phát triển UI/UX.
