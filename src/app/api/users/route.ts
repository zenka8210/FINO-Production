import { NextResponse } from "next/server";
import { readFile, writeFile } from "fs/promises";
import path from "path";

const filePath = path.join(process.cwd(), "src", "data", "users.json");

// GET: Lấy danh sách người dùng
export async function GET() {
  try {
    const fileData = await readFile(filePath, "utf-8");
    const users = JSON.parse(fileData);
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: "Không đọc được file." }, { status: 500 });
  }
}

// POST: Thêm người dùng mới
export async function POST(req: Request) {
  const newUser = await req.json();
  try {
    const fileData = await readFile(filePath, "utf-8");
    const users = JSON.parse(fileData);
    const newId = users.length ? users[users.length - 1].id + 1 : 1;
    users.push({ ...newUser, id: newId });
    await writeFile(filePath, JSON.stringify(users, null, 2), "utf-8");
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Không thêm được user." }, { status: 500 });
  }
}
