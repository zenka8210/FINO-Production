import { NextResponse } from "next/server";
import { readFile, writeFile } from "fs/promises";
import path from "path";

// GET - Lấy danh sách đánh giá (theo productId hoặc tất cả cho admin)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get('productId');
  const admin = searchParams.get('admin'); // Để lấy tất cả đánh giá cho admin
  
  const filePath = path.join(process.cwd(), "src", "app", "data", "reviews.json");

  try {
    const fileData = await readFile(filePath, "utf-8");
    const reviews = JSON.parse(fileData);

    // Nếu là admin, trả về tất cả đánh giá
    if (admin === 'true') {
      const allReviews = reviews.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      return NextResponse.json({ success: true, reviews: allReviews });
    }

    // Nếu không có productId và không phải admin thì báo lỗi
    if (!productId) {
      return NextResponse.json({ success: false, error: "Product ID is required" }, { status: 400 });
    }

    // Lọc đánh giá theo productId và sắp xếp theo thời gian mới nhất
    const productReviews = reviews
      .filter((review: any) => review.productId === productId)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ success: true, reviews: productReviews });
  } catch (err) {
    console.error("Error reading reviews file:", err);
    return NextResponse.json({ success: true, reviews: [] });
  }
}

// POST - Tạo đánh giá mới
export async function POST(req: Request) {  try {
    const reviewData = await req.json();
    const { productId, userId, username, rating, comment } = reviewData;

    console.log('Received review data:', reviewData); // Debug log

    // Validate required fields
    if (!productId || !userId || !username || !rating || !comment) {
      console.log('Missing fields:', { productId, userId, username, rating, comment });
      return NextResponse.json({ 
        success: false, 
        error: "Missing required fields" 
      }, { status: 400 });
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ 
        success: false, 
        error: "Rating must be between 1 and 5" 
      }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), "src", "app", "data", "reviews.json");

    let reviews = [];
    try {
      const fileData = await readFile(filePath, "utf-8");
      reviews = JSON.parse(fileData);
    } catch (err) {
      // Nếu file không tồn tại, tạo mảng mới
      reviews = [];
    }    // Kiểm tra xem user đã đánh giá sản phẩm này chưa
    const existingReview = reviews.find((review: any) => 
      review.productId === productId && review.userId === userId
    );

    if (existingReview) {
      return NextResponse.json({ 
        success: false, 
        error: "Bạn đã đánh giá sản phẩm này rồi!" 
      }, { status: 400 });
    }

    // Tạo ID mới
    const newId = reviews.length > 0 ? Math.max(...reviews.map((r: any) => parseInt(r.id) || 0)) + 1 : 1;
    
    const newReview = {
      id: newId.toString(),
      productId: productId.toString(),
      userId: userId.toString(),
      username,
      rating: parseInt(rating),
      comment: comment.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log('Creating new review:', newReview); // Debug log

    reviews.push(newReview);
    await writeFile(filePath, JSON.stringify(reviews, null, 2));

    console.log('Review saved successfully'); // Debug log
    return NextResponse.json({ success: true, review: newReview });
  } catch (err) {
    console.error("Error saving review:", err);
    return NextResponse.json({ 
      success: false, 
      error: "Cannot save review" 
    }, { status: 500 });
  }
}

// PUT - Cập nhật đánh giá (cho admin hoặc user chỉnh sửa)
export async function PUT(req: Request) {
  try {
    const { id, rating, comment, userId, isAdmin } = await req.json();
    
    if (!id || !rating || !comment) {
      return NextResponse.json({ 
        success: false, 
        error: "Missing required fields" 
      }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), "src", "app", "data", "reviews.json");
    const fileData = await readFile(filePath, "utf-8");
    const reviews = JSON.parse(fileData);

    const reviewIndex = reviews.findIndex((review: any) => review.id === id);
    if (reviewIndex === -1) {
      return NextResponse.json({ 
        success: false, 
        error: "Review not found" 
      }, { status: 404 });
    }

    // Kiểm tra quyền (user tạo review hoặc admin mới được sửa)
    if (!isAdmin && reviews[reviewIndex].userId !== userId) {
      return NextResponse.json({ 
        success: false, 
        error: "Unauthorized" 
      }, { status: 403 });
    }

    reviews[reviewIndex].rating = parseInt(rating);
    reviews[reviewIndex].comment = comment.trim();
    reviews[reviewIndex].updatedAt = new Date().toISOString();

    await writeFile(filePath, JSON.stringify(reviews, null, 2));

    return NextResponse.json({ success: true, review: reviews[reviewIndex] });
  } catch (err) {
    console.error("Error updating review:", err);
    return NextResponse.json({ 
      success: false, 
      error: "Cannot update review" 
    }, { status: 500 });
  }
}

// DELETE - Xóa đánh giá
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');
    const isAdmin = searchParams.get('isAdmin');
    
    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: "Review ID is required" 
      }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), "src", "app", "data", "reviews.json");
    const fileData = await readFile(filePath, "utf-8");
    const reviews = JSON.parse(fileData);

    const reviewIndex = reviews.findIndex((review: any) => review.id === id);
    if (reviewIndex === -1) {
      return NextResponse.json({ 
        success: false, 
        error: "Review not found" 
      }, { status: 404 });
    }

    // Kiểm tra quyền (user tạo review hoặc admin mới được xóa)
    if (isAdmin !== 'true' && reviews[reviewIndex].userId !== userId) {
      return NextResponse.json({ 
        success: false, 
        error: "Unauthorized" 
      }, { status: 403 });
    }

    reviews.splice(reviewIndex, 1);
    await writeFile(filePath, JSON.stringify(reviews, null, 2));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error deleting review:", err);
    return NextResponse.json({ 
      success: false, 
      error: "Cannot delete review" 
    }, { status: 500 });
  }
}
