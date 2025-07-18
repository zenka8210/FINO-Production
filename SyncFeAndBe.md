Ngữ cảnh: 
Ở `src/` chứa các thành phần sau:
- `services/`: chứa logic gọi API cho 17 route backend
- `types/`: định nghĩa cấu trúc dữ liệu các interfaces dựa trên schemas đã build ở models/ của server/ -> BE
- `contexts/`: chỉ giữ state và method cần thiết có tính global 
- `hooks/`: đóng gói logic dùng lại, gọi service, xử lý loading/error...
- `app/`: Nơi chứa code base UI/UX cho frondend
Ở `server/` chứa các thành phần sau:
- `models/`: chứa các schemas dữ liệu.
- `middlewares/`: chứa các middewares, validators cần thiết.
- `services/`: chứa logic, chức năng nghiệp vụ 
- `routes/`: chứa APIs endpoint của các chức năng.
Yêu cầu 1:
Bây giờ tôi muốn bạn scan và update lần lượt theo từng cặp file sau để sync tốt be và fe theo 1 cách tuần tự có hệ thống, bảo đảm đúng và đủ 100% các chức năng đã implemented ở backend cho fe services/
- Scan addressRoutes của Routes/ backend -> update addressService của Service/ frontend
- Scan authRoutes của Routes/ backend -> update authService của Service/ frontend
- Scan bannerRoutes của Routes/ backend -> update bannerService của Service/ frontend
- Scan cartRoutes của Routes/ backend -> update cartService của Service/ frontend
- Scan categoryRoutes của Routes/ backend -> update categoryService của Service/ frontend
- Scan colorRoutes của Routes/ backend -> update colorService của Service/ frontend
- Scan orderRoutes của Routes/ backend -> update orderService của Service/ frontend
- Scan paymentMethodRoutes của Routes/ backend -> update paymentMethodService của Service/ frontend
- Scan postRoutes của Routes/ backend -> update postService của Service/ frontend
- Scan productRoutes của Routes/ backend -> update productService của Service/ frontend
- Scan productVariantRoutes của Routes/ backend -> update productVariantService của Service/ frontend
- Scan reviewRoutes của Routes/ backend -> update reviewService của Service/ frontend
- Scan sizeRoutes của Routes/ backend -> update sizeService của Service/ frontend
- Scan statisticsRoutes của Routes/ backend -> update statisticsService của Service/ frontend
- Scan userRoutes của Routes/ backend -> update userService của Service/ frontend
- Scan voucherRoutes của Routes/ backend -> update voucherService của Service/ frontend
- Scan wishListRoutes của Routes/ backend -> update wishlistService của Service/ frontend


