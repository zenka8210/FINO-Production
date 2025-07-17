Tôi đang làm việc trong một dự án e-commerce MERN Stack có kiến trúc tách riêng frontend và backend như sau:

✅ Backend:
- Nằm trong thư mục `server/`
- Sử dụng Node.js, Express, MongoDB
- Đã hoàn thành toàn bộ `routes/` và `controllers/` cho các API thật (real API)
- Có khoảng 15 schema trong `server/models/` như Product, User, Order, Cart, Review,...
- API chạy ở `http://localhost:5000`, có CORS mở cho FE
- Dữ liệu trả về đúng định dạng REST, đã test api thành công

✅ Frontend:
- Nằm trong thư mục `fe/`
- Dùng React hoặc Next.js với TypeScript
- Port FE là `http://localhost:3000`
- Team FE trước đó đã dùng API fake (mock) để phát triển UI
  - Đã viết các file `services/*.ts`,`api/`, `*route.ts` giả lập trả dữ liệu cứng
  - Đã tạo `types/`, ``models/`, `context/`,... dựa trên dữ liệu mock đó

❗ Bây giờ tôi muốn:
1. Viết lại toàn bộ `services/` để **gọi API thật từ backend**
2. Viết lại các `interface` trong `types/` để **phản ánh đúng schema từ BE**
3. Điều chỉnh lại `context/` và các component để không phụ thuộc vào mock
4. Dùng `axios` với `baseURL` là `process.env.NEXT_PUBLIC_API_URL`
5. Tổ chức lại thư mục FE theo chuẩn production nếu cần
6. Gợi ý cách tìm kiếm và refactor toàn bộ chỗ còn đang gọi mock API trong FE

