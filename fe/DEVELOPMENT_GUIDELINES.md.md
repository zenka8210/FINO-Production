# 🚀 DEVELOPMENT GUIDELINES - Frontend Architecture

## 📁 Cấu trúc System

Ở `src/` chứa các thành phần sau:
- `services/`: chứa logic gọi API cho 17 route backend
- `types/`: định nghĩa cấu trúc dữ liệu các interfaces dựa trên schemas đã build ở models/ của server/ -> BE
- `contexts/`: chỉ giữ state và method cần thiết có tính global 
- `hooks/`: đóng gói logic dùng lại, gọi service, xử lý loading/error...
- `app/`: Nơi chứa code base UI/UX cho frondend, vài thành phần hiện đang làm việc với mockup và json
- `\app\components\ui`: chứa các ui/ux cơ bản tái sử dụng

---

## 🎯 UI COMPONENTS TÁI SỬ DỤNG - REQUIRED

### 📍 Components Location
```
src/app/components/ui/
├── Button/              # ✅ REQUIRED cho tất cả buttons
├── Pagination/          # ✅ REQUIRED cho tất cả lists có phân trang  
├── SearchBar/           # ✅ REQUIRED cho tất cả search functionality
├── Modal/               # ✅ REQUIRED cho dialogs/popups
├── Toast/               # ✅ REQUIRED cho notifications
├── LoadingSpinner/      # ✅ REQUIRED cho loading states
└── index.ts             # Export tất cả components
```

### 🔴 MANDATORY Rules - Không được vi phạm

#### 1. Button Component
```tsx
// ✅ ALWAYS DO THIS
import { Button } from '@/app/components/ui';
<Button variant="primary" size="md" onClick={handleClick}>
  Action
</Button>

// ❌ NEVER DO THIS  
<button className="bg-blue-500">Action</button>
<button style={{background: 'blue'}}>Action</button>
```

#### 2. Pagination Component
```tsx
// ✅ ALWAYS DO THIS
import { Pagination } from '@/app/components/ui';
<Pagination 
  pagination={paginationInfo} 
  onPageChange={handlePageChange} 
/>

// ❌ NEVER DO THIS
<div>
  <button onClick={prevPage}>Trước</button>
  {/* Custom pagination */}
</div>
```

#### 3. SearchBar Component
```tsx
// ✅ ALWAYS DO THIS
import { SearchBar } from '@/app/components/ui';
<SearchBar 
  value={searchTerm}
  onChange={handleSearchChange}
  onSearch={handleSearch}
/>

// ❌ NEVER DO THIS
<input type="text" placeholder="Search..." onChange={...} />
```

#### 4. Text Colors - CSS Variables Only
```css
/* ✅ ALWAYS DO THIS */
.title { color: var(--color-text); }
.description { color: var(--color-text-secondary); }
.price { color: var(--color-primary); }
.muted { color: var(--color-muted); }

/* ❌ NEVER DO THIS */
.title { color: #111827; }
.price { color: red; }
.text { color: #666; }
```

---

## ⚙️ Architecture Requirements

### 1. Component Logic Distribution
   - Nếu component cần state toàn app  → dùng context
   - Nếu cần fetch data, xử lý loading/error → dùng custom hook
   - Nếu chỉ là hành động độc lập, không cần state → gọi trực tiếp service

### 2. Code Reuse Rules
   - Nếu logic trong component trùng nhiều lần → đề xuất tách thành custom hook riêng

### 3. Anti-patterns to Avoid
   - Tránh trùng lặp logic gọi API giữa hook và context

### 4. Code Quality Standards
   - Ưu tiên clean code, dễ bảo trì, dễ đọc

### 5. UX Requirements - Component phải tối ưu theo UX:
   - Có loading state (sử dụng `LoadingSpinner` component)
   - Có thông báo lỗi/thành công (sử dụng `Toast` component)
   - Không render UI sai quyền (nếu chưa đăng nhập)
   - Buttons phải sử dụng proper `variant` và `size`

### 6. Development Commands
   - Nếu phải mở new terminal và run dev, hãy dùng: `cd "d:\ReactJs\Datn\asm\fe"; npm run dev`

---

## 🚨 Code Review Checklist

Trước khi submit code, kiểm tra:
- [ ] ✅ Tất cả buttons sử dụng `Button` component
- [ ] ✅ Tất cả text colors sử dụng CSS variables  
- [ ] ✅ Pagination sử dụng `Pagination` component
- [ ] ✅ Search sử dụng `SearchBar` component
- [ ] ✅ Loading states sử dụng `LoadingSpinner` component
- [ ] ✅ Notifications sử dụng `Toast` component
- [ ] ✅ Không có hard-coded colors trong CSS
- [ ] ✅ Import từ `@/app/components/ui` index file

---

## 📝 Migration Guide

### Old → New Pattern
```tsx
// OLD: Custom implementations
<button className="custom-btn">Click</button>
<div className="custom-pagination">...</div>
<input className="search-input" />

// NEW: UI Components
import { Button, Pagination, SearchBar } from '@/app/components/ui';
<Button variant="primary">Click</Button>
<Pagination pagination={data} onPageChange={handler} />
<SearchBar value={term} onChange={handler} />
```
