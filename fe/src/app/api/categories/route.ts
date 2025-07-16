import { NextResponse } from "next/server";
import { readFile, writeFile } from "fs/promises";
import path from "path";

// GET - Lấy danh sách danh mục
export async function GET(req: Request) {
  const filePath = path.join(process.cwd(), "src", "app", "data", "categories.json");

  try {
    const fileData = await readFile(filePath, "utf-8");
    const categories = JSON.parse(fileData);
    return NextResponse.json({ success: true, categories });
  } catch (err) {
    console.error("Error reading categories file:", err);
    return NextResponse.json({ success: false, categories: [] });
  }
}

// POST - Tạo danh mục mới
export async function POST(req: Request) {
  const categoryData = await req.json();
  const filePath = path.join(process.cwd(), "src", "app", "data", "categories.json");

  try {
    let categories = [];
    try {
      const fileData = await readFile(filePath, "utf-8");
      categories = JSON.parse(fileData);
    } catch (err) {
      // Nếu file không tồn tại, tạo mảng mới
      categories = [];
    }

    // Tạo ID mới
    const newId = categories.length > 0 ? Math.max(...categories.map((c: any) => c.id)) + 1 : 1;
    
    const newCategory = {
      id: newId,
      ...categoryData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    categories.push(newCategory);
    await writeFile(filePath, JSON.stringify(categories, null, 2));

    return NextResponse.json({ success: true, category: newCategory });
  } catch (err) {
    console.error("Error saving category:", err);
    return NextResponse.json({ success: false, error: "Cannot save category" }, { status: 500 });
  }
}

// PUT - Cập nhật danh mục
export async function PUT(req: Request) {
  const { id, ...updateData } = await req.json();
  const filePath = path.join(process.cwd(), "src", "app", "data", "categories.json");

  try {
    const fileData = await readFile(filePath, "utf-8");
    const categories = JSON.parse(fileData);

    const categoryIndex = categories.findIndex((category: any) => category.id === id);
    if (categoryIndex === -1) {
      return NextResponse.json({ success: false, error: "Category not found" }, { status: 404 });
    }

    categories[categoryIndex] = {
      ...categories[categoryIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    await writeFile(filePath, JSON.stringify(categories, null, 2));

    return NextResponse.json({ success: true, category: categories[categoryIndex] });
  } catch (err) {
    console.error("Error updating category:", err);
    return NextResponse.json({ success: false, error: "Cannot update category" }, { status: 500 });
  }
}

// DELETE - Xóa danh mục
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = parseInt(searchParams.get('id') || '0');
  const filePath = path.join(process.cwd(), "src", "app", "data", "categories.json");

  try {
    const fileData = await readFile(filePath, "utf-8");
    const categories = JSON.parse(fileData);

    const updatedCategories = categories.filter((category: any) => category.id !== id);
    
    if (updatedCategories.length === categories.length) {
      return NextResponse.json({ success: false, error: "Category not found" }, { status: 404 });
    }

    await writeFile(filePath, JSON.stringify(updatedCategories, null, 2));

    return NextResponse.json({ success: true, message: "Category deleted successfully" });
  } catch (err) {
    console.error("Error deleting category:", err);
    return NextResponse.json({ success: false, error: "Cannot delete category" }, { status: 500 });
  }
}
