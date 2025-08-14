# 🚀 DATN Team Git Workflow Guide

## 📊 Cấu trúc nhánh và phân quyền

### 🔒 Nhánh được bảo vệ (Leader only)
- `main` - Production ready code
- `production` - Stable release version 
- `development` - Integration branch cho tất cả features

### 🛠️ Nhánh làm việc (Teammates)
- `feature/[tên-tính-năng]` - Phát triển tính năng mới
- `hotfix/[tên-bug]` - Sửa bug khẩn cấp
- `bugfix/[tên-bug]` - Sửa bug thường

---

## 👨‍💼 HƯỚNG DẪN CHO LEADER

### 1️⃣ **Thiết lập ban đầu**

```bash
# Tạo và bảo vệ nhánh development
git checkout -b development
git push -u origin development

# Thiết lập branch protection trên GitHub:
# Settings -> Branches -> Add rule cho main, production, development
```

### 2️⃣ **Phân công nhiệm vụ**

```bash
# Tạo nhánh cho từng teammate
git checkout development
git checkout -b feature/user-management
git push -u origin feature/user-management

git checkout development  
git checkout -b feature/product-management
git push -u origin feature/product-management

git checkout development
git checkout -b feature/order-management  
git push -u origin feature/order-management
```

### 3️⃣ **Review và merge code**

```bash
# Khi teammate tạo Pull Request:
# 1. Review code trên GitHub
# 2. Test local trước khi merge:

git checkout development
git pull origin development
git checkout feature/[tên-feature]
git pull origin feature/[tên-feature]

# Test tính năng
cd asm/server && npm test
cd ../fe && npm run build

# Merge nếu OK
git checkout development
git merge feature/[tên-feature]
git push origin development
```

### 4️⃣ **Release management**

```bash
# Tạo release từ development
git checkout production
git merge development
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin production --tags

# Deploy lên production
git checkout main
git merge production
git push origin main
```

---

## 👥 HƯỚNG DẪN CHO TEAMMATES

### 1️⃣ **Clone và setup**

```bash
# Clone repository
git clone https://github.com/zenka8210/DATN.git
cd DATN/asm

# Xem tất cả nhánh
git branch -a

# Checkout nhánh được phân công
git checkout feature/user-management
```

### 2️⃣ **Quy trình làm việc hàng ngày**

```bash
# Bắt đầu ngày làm việc
git checkout development
git pull origin development  # Cập nhật code mới nhất

git checkout feature/[tên-của-bạn]
git merge development        # Sync với development
git push origin feature/[tên-của-bạn]

# Làm việc và commit
git add .
git commit -m "feat: thêm tính năng đăng nhập user"
git push origin feature/[tên-của-bạn]
```

### 3️⃣ **Tạo Pull Request**

```bash
# Sau khi hoàn thành tính năng
git checkout development
git pull origin development

git checkout feature/[tên-của-bạn]  
git merge development        # Đảm bảo không có conflict
git push origin feature/[tên-của-bạn]

# Tạo PR trên GitHub:
# feature/[tên-của-bạn] -> development
```

---

## 📝 QUY TẮC COMMIT MESSAGE

```bash
# Format: type(scope): description
feat(auth): thêm tính năng đăng nhập với JWT
fix(order): sửa lỗi tính toán tổng tiền
docs(readme): cập nhật hướng dẫn cài đặt
style(ui): cải thiện giao diện trang chủ
refactor(api): tối ưu hóa API endpoints
test(unit): thêm test cho user service
```

---

## 🚨 QUY TẮC QUAN TRỌNG

### ❌ **KHÔNG BAO GIỜ**
- Push trực tiếp lên `main`, `production`, `development`
- Force push (`git push --force`) lên nhánh chung
- Commit file `.env` có chứa secrets
- Merge mà không test

### ✅ **LUÔN LUÔN**
- Tạo Pull Request cho mọi thay đổi
- Test code trước khi commit
- Viết commit message rõ ràng
- Sync với development thường xuyên

---

## 🔧 SETUP ENVIRONMENT

### Backend (.env.example)
```env
DB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
JWT_SECRET=your-jwt-secret
PORT=5000
```

### Frontend (Next.js)
```bash
cd asm/fe
npm install
npm run dev  # Port 3002
```

### Backend (Node.js)
```bash
cd asm/server  
npm install
npm run dev  # Port 5000
```
