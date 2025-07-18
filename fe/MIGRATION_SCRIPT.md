Tôi đã hoàn thành toàn bộ các phần:

Ở `src/` chứa các thành phần sau:
- `services/`: chứa logic gọi API cho 17 route backend
- `types/`: định nghĩa cấu trúc dữ liệu các interfaces dựa trên schemas đã build ở models/ của server/ -> BE
- `contexts/`: chỉ giữ state và method cần thiết có tính global 
- `hooks/`: đóng gói logic dùng lại, gọi service, xử lý loading/error...
- `app/`: Nơi chứa code base UI/UX cho frondend, vài thành phần hiện đang làm việc với mockup và json
Bây giờ tôi cần build UI/UX component trong app/ update lại các thành phần chính từ services/ types/ contexts/ hooks/ đã tạo ở src/
Yêu cầu:

1. Tùy từng component, phải sử dụng `hooks`, `contexts`, hoặc `services` sao cho hợp lý nhất:
   - Nếu component cần state toàn app  → dùng context
   - Nếu cần fetch data, xử lý loading/error → dùng custom hook
   - Nếu chỉ là hành động độc lập, không cần state → gọi trực tiếp service

2. Nếu logic trong component trùng nhiều lần → đề xuất tách thành custom hook riêng

3. Tránh trùng lặp logic gọi API giữa hook và context

4. Ưu tiên clean code, dễ bảo trì, dễ đọc

5. Component phải tối ưu theo UX:
   - Có loading state
   - Có thông báo lỗi/thành công (toast)
   - Không render UI sai quyền (nếu chưa đăng nhập)

