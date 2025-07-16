import { NextRequest, NextResponse } from 'next/server';

// Mock database - thay thế bằng database thực tế
let newsData = [
  {
    id: 1,
    title: "Fan 'anh Long' khiếp kinh khi thấy SVĐ Mỹ Đình thành fashion week thật rồi!",
    excerpt: "Sự kiện thời trang đặc biệt diễn ra tại SVĐ Mỹ Đình đã thu hút sự chú ý của hàng nghìn người hâm mộ.",
    content: `<p>Sự kiện thời trang đặc biệt diễn ra tại SVĐ Mỹ Đình đã thu hút sự chú ý của hàng nghìn người hâm mộ. Không gian thể thao được biến thành sàn diễn thời trang hoành tráng với những màn trình diễn ấn tượng.</p>

    <p>Các nhà thiết kế hàng đầu Việt Nam đã mang đến những bộ sưu tập độc đáo, kết hợp giữa yếu tố truyền thống và hiện đại. Sự kiện không chỉ là một show diễn thời trang mà còn là một lễ hội văn hóa, thu hút sự tham gia của nhiều nghệ sĩ nổi tiếng.</p>

    <p>Đặc biệt, không gian SVĐ Mỹ Đình được trang trí bằng công nghệ ánh sáng LED hiện đại, tạo nên những hiệu ứng thị giác tuyệt đẹp. Khán giả đã có những trải nghiệm đáng nhớ với các màn trình diễn spectacular.</p>`,
    image: "/images/anh1.jpg",
    date: "2025-01-20T10:00:00Z",
    category: "Xu hướng",
    slug: "fan-anh-long-svd-my-dinh-fashion-week",
    status: 'published',
    author: 'Admin',
    views: 1250,
    createdAt: "2025-01-20T10:00:00Z",
    updatedAt: "2025-01-20T10:00:00Z"
  },
  {
    id: 2,
    title: "DEPA Fashion Show: Người Việt làm show thời trang thế này hay chưa!",
    excerpt: "Sự kiện thời trang DEPA đã mang đến những màn trình diễn ấn tượng với công nghệ ánh sáng hiện đại.",
    content: `<p>Sự kiện thời trang DEPA đã mang đến những màn trình diễn ấn tượng với công nghệ ánh sáng hiện đại. Các nhà thiết kế Việt Nam đã chứng minh tài năng trên sân khấu quốc tế.</p>

    <p>Show diễn với chủ đề "Fusion of Tradition and Innovation" đã thành công kết hợp giữa các yếu tố văn hóa truyền thống Việt Nam với xu hướng thời trang thế giới. Hơn 50 bộ trang phục được trình diễn trong 3 giờ liên tục.</p>

    <p>Điểm nhấn của chương trình là việc sử dụng chất liệu thổ cẩm, lụa tơ tằm kết hợp với các công nghệ dệt may hiện đại. Các người mẫu từ khắp châu Á đã tham gia trình diễn, tạo nên sự đa dạng văn hóa đặc biệt.</p>`,
    image: "/images/anh2.jpg",
    date: "2025-01-19T14:30:00Z",
    category: "Sự kiện",
    slug: "depa-fashion-show-nguoi-viet-lam-show",
    status: 'published',
    author: 'Admin',
    views: 890,
    createdAt: "2025-01-19T14:30:00Z",
    updatedAt: "2025-01-19T14:30:00Z"
  },
  {
    id: 3,
    title: "Lấy làm mới thấy thầm thì trang 'chất' thế này: Đẹp tự tin thả dáng, ít có phải chê",
    excerpt: "Xu hướng thời trang 'chất lừ' đang được giới trẻ yêu thích. Phong cách tự tin, cá tính giúp bạn thể hiện bản thân.",
    content: `<p>Xu hướng thời trang 'chất lừ' đang được giới trẻ yêu thích. Phong cách tự tin, cá tính giúp bạn thể hiện bản thân một cách hoàn hảo nhất.</p>

    <p>Xu hướng này không chỉ đơn thuần là việc ăn mặc đẹp mà còn thể hiện attitude, thái độ sống tích cực và đầy năng lượng. Các bạn trẻ hiện nay không ngại thử nghiệm, mix & match những item khác nhau để tạo nên phong cách riêng biệt.</p>

    <p>Từ street style đến office look, từ casual đến formal, tất cả đều có thể được biến tấu theo cách "chất lừ" với một chút sáng tạo và cá tính. Điểm quan trọng nhất là sự tự tin khi thể hiện bản thân.</p>`,
    image: "/images/anh3.jpg",
    date: "2025-01-18T09:15:00Z",
    category: "Phong cách",
    slug: "lay-lam-moi-thay-tham-thi-trang-chat",
    status: 'published',
    author: 'Admin',
    views: 650,
    createdAt: "2025-01-18T09:15:00Z",
    updatedAt: "2025-01-18T09:15:00Z"
  }
];

// GET - Lấy tin tức theo ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const newsItem = newsData.find(item => item.id === id);

    if (!newsItem) {
      return NextResponse.json(
        { success: false, message: 'News not found' },
        { status: 404 }
      );
    }

    // Tăng view count nếu không phải draft
    if (newsItem.status === 'published') {
      newsItem.views += 1;
    }

    return NextResponse.json({
      success: true,
      data: newsItem
    });

  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Cập nhật tin tức
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    const { title, excerpt, content, image, category, status } = body;

    const newsIndex = newsData.findIndex(item => item.id === id);
    
    if (newsIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'News not found' },
        { status: 404 }
      );
    }

    // Validation
    if (!title || !excerpt || !content || !category) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Update slug if title changed
    let slug = newsData[newsIndex].slug;
    if (title !== newsData[newsIndex].title) {
      slug = title
        .toLowerCase()
        .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
        .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
        .replace(/[ìíịỉĩ]/g, 'i')
        .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
        .replace(/[ùúụủũưừứựửữ]/g, 'u')
        .replace(/[ỳýỵỷỹ]/g, 'y')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
    }

    // Update news item
    newsData[newsIndex] = {
      ...newsData[newsIndex],
      title,
      excerpt,
      content,
      image: image || newsData[newsIndex].image,
      category,
      status: status || newsData[newsIndex].status,
      slug,
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: newsData[newsIndex],
      message: 'News updated successfully'
    });

  } catch (error) {
    console.error('Error updating news:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Xóa tin tức
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const newsIndex = newsData.findIndex(item => item.id === id);

    if (newsIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'News not found' },
        { status: 404 }
      );
    }

    // Remove news item
    const deletedNews = newsData.splice(newsIndex, 1)[0];

    return NextResponse.json({
      success: true,
      message: 'News deleted successfully',
      data: deletedNews
    });

  } catch (error) {
    console.error('Error deleting news:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
