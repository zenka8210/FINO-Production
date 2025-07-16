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

// GET - Lấy danh sách tin tức
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const status = searchParams.get('status');

    let filteredNews = [...newsData];

    // Filter by category
    if (category && category !== 'all') {
      filteredNews = filteredNews.filter(item => item.category === category);
    }

    // Filter by status
    if (status && status !== 'all') {
      filteredNews = filteredNews.filter(item => item.status === status);
    }

    // Search by title or excerpt
    if (search) {
      filteredNews = filteredNews.filter(item => 
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.excerpt.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Sort by date (newest first)
    filteredNews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Pagination
    const total = filteredNews.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedNews = filteredNews.slice(startIndex, endIndex);

    return NextResponse.json({
      success: true,
      data: paginatedNews,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        totalItems: total
      }
    });

  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Tạo tin tức mới
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, excerpt, content, image, category, status = 'draft' } = body;

    // Validation
    if (!title || !excerpt || !content || !category) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate slug
    const slug = title
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

    const newNews = {
      id: Math.max(...newsData.map(item => item.id)) + 1,
      title,
      excerpt,
      content,
      image: image || '',
      category,
      slug: `${slug}-${Date.now()}`,
      status,
      author: 'Admin',
      views: 0,
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    newsData.push(newNews);

    return NextResponse.json({
      success: true,
      data: newNews,
      message: 'News created successfully'
    });

  } catch (error) {
    console.error('Error creating news:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
