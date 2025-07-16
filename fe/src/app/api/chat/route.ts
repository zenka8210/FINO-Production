import { NextResponse } from "next/server";

interface ChatRequest {
  message: string;
  context?: string[];
}

const productInfo = {
  categories: [
    { name: "Áo thun nam", priceRange: "100,000 - 300,000 VNĐ" },
    { name: "Áo thun nữ", priceRange: "120,000 - 350,000 VNĐ" },
    { name: "Phụ kiện", priceRange: "50,000 - 200,000 VNĐ" },
    { name: "Set quần áo", priceRange: "250,000 - 500,000 VNĐ" }
  ],
  policies: {
    shipping: "Giao hàng tiết kiệm: 20,000 VNĐ (2-3 ngày), Giao hàng nhanh: 50,000 VNĐ (1-2 ngày)",
    payment: "COD, Chuyển khoản, Momo, Thẻ tín dụng",
    return: "Đổi trả trong 7 ngày, sản phẩm chưa sử dụng, còn nguyên tag",
    warranty: "Bảo hành chất lượng trong 30 ngày"
  },
  discounts: [
    { code: "SAVE10", description: "Giảm 10% đơn hàng", minOrder: 200000 },
    { code: "SAVE50", description: "Giảm 50,000đ", minOrder: 300000 },
    { code: "FREESHIP", description: "Miễn phí ship", minOrder: 150000 }
  ]
};

const generateSmartResponse = (message: string, context: string[] = []): string => {
  const msg = message.toLowerCase();
  
  // Xử lý câu hỏi về giá cả
  if (msg.includes("giá") || msg.includes("bao nhiêu") || msg.includes("cost")) {
    if (msg.includes("áo thun nam")) {
      return `Áo thun nam có giá từ 100,000 - 300,000 VNĐ tùy theo chất liệu và thiết kế. Các sản phẩm hot nhất hiện tại:\n• Áo thun nam basic: 100,000 VNĐ\n• Áo thun nam premium: 200,000 - 300,000 VNĐ\n\nBạn có muốn xem catalog sản phẩm không?`;
    }
    if (msg.includes("áo thun nữ") || msg.includes("nữ")) {
      return `Áo thun nữ có giá từ 120,000 - 350,000 VNĐ:\n• Áo thun nữ basic: 120,000 VNĐ\n• Áo thun nữ trendy: 200,000 - 350,000 VNĐ\n\nTất cả đều có size từ S đến XL nhé!`;
    }
    return `Giá sản phẩm của chúng tôi rất hợp lý:\n${productInfo.categories.map(cat => `• ${cat.name}: ${cat.priceRange}`).join('\n')}\n\nBạn quan tâm đến loại sản phẩm nào?`;
  }

  // Xử lý câu hỏi về size
  if (msg.includes("size") || msg.includes("kích thước") || msg.includes("measure")) {
    return `Chúng tôi có đầy đủ size từ S đến XXL:\n• Size S: 45-50kg, ngực 84-88cm\n• Size M: 50-55kg, ngực 88-92cm\n• Size L: 55-65kg, ngực 92-96cm\n• Size XL: 65-75kg, ngực 96-102cm\n• Size XXL: 75-85kg, ngực 102-108cm\n\nBạn cần tư vấn size cụ thể không?`;
  }

  // Xử lý câu hỏi về chất liệu
  if (msg.includes("chất liệu") || msg.includes("vải") || msg.includes("material")) {
    return `Sản phẩm của chúng tôi sử dụng chất liệu cao cấp:\n• Cotton 100% mềm mại, thấm hút mồ hôi tốt\n• Cotton pha Polyester bền đẹp, không nhăn\n• Bamboo fiber thân thiện môi trường\n• Modal mềm mại như lụa\n\nTất cả đều được kiểm tra chất lượng nghiêm ngặt!`;
  }

  // Xử lý câu hỏi về màu sắc
  if (msg.includes("màu") || msg.includes("color")) {
    return `Chúng tôi có đa dạng màu sắc:\n• Màu basic: Trắng, Đen, Xám\n• Màu trendy: Navy, Hồng, Xanh dương\n• Màu seasonal: Cam, Vàng, Tím\n• Màu limited: Theo collection mới\n\nBạn thích màu nào nhất?`;
  }

  // Xử lý đặt hàng
  if (msg.includes("đặt hàng") || msg.includes("mua") || msg.includes("order")) {
    return `Để đặt hàng, bạn có thể:\n1. Thêm sản phẩm vào giỏ hàng trên website\n2. Điền thông tin giao hàng\n3. Chọn phương thức thanh toán\n4. Xác nhận đơn hàng\n\nHoặc liên hệ hotline 1900-1234 để được hỗ trợ đặt hàng trực tiếp!`;
  }

  // Xử lý tracking đơn hàng
  if (msg.includes("đơn hàng") || msg.includes("theo dõi") || msg.includes("track")) {
    return `Bạn có thể theo dõi đơn hàng bằng cách:\n1. Đăng nhập vào tài khoản\n2. Vào mục "Lịch sử đơn hàng"\n3. Xem chi tiết và trạng thái đơn hàng\n\nHoặc cung cấp mã đơn hàng để tôi hỗ trợ tra cứu!`;
  }

  // Xử lý khuyến mãi
  if (msg.includes("khuyến mãi") || msg.includes("giảm giá") || msg.includes("sale")) {
    return `🎉 Khuyến mãi HOT hiện tại:\n${productInfo.discounts.map(d => `• ${d.code}: ${d.description} (đơn từ ${d.minOrder.toLocaleString('vi-VN')}đ)`).join('\n')}\n\nÁp dụng mã tại trang giỏ hàng nhé!`;
  }

  // Phản hồi mặc định thông minh hơn
  const responses = [
    `Cảm ơn bạn đã quan tâm! Tôi có thể hỗ trợ bạn về:\n• Thông tin sản phẩm và giá cả\n• Tư vấn size và chất liệu\n• Chính sách giao hàng, thanh toán\n• Khuyến mãi và mã giảm giá\n\nBạn cần hỗ trợ gì?`,
    `Để được tư vấn chi tiết nhất, bạn có thể:\n📞 Gọi hotline: 1900-1234\n📧 Email: support@shop.com\n💬 Chat trực tiếp tại đây\n\nTôi luôn sẵn sàng hỗ trợ bạn!`,
    `Tôi sẽ kết nối bạn với team tư vấn chuyên nghiệp để được hỗ trợ tốt nhất. Trong lúc chờ, bạn có thể xem thêm sản phẩm trên website nhé!`
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
};

export async function POST(req: Request) {
  try {
    const { message, context = [] }: ChatRequest = await req.json();

    if (!message || message.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: "Message is required"
      }, { status: 400 });
    }

    const response = generateSmartResponse(message, context);

    // Log chat for analytics (optional)
    console.log(`[CHAT] User: ${message}`);
    console.log(`[CHAT] Bot: ${response}`);

    return NextResponse.json({
      success: true,
      response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json({
      success: false,
      error: "Internal server error"
    }, { status: 500 });
  }
}

export async function GET(req: Request) {
  // Trả về thông tin về bot
  return NextResponse.json({
    success: true,
    botInfo: {
      name: "AI Hỗ trợ Shop",
      version: "1.0.0",
      capabilities: [
        "Tư vấn sản phẩm",
        "Hỗ trợ đặt hàng",
        "Thông tin chính sách",
        "Khuyến mãi và ưu đãi"
      ],
      supportedLanguages: ["vi", "en"]
    }
  });
}
