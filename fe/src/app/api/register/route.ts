import { NextResponse } from "next/server";
import { readFile, writeFile } from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  const body = await req.json();
  const filePath = path.join(process.cwd(), "src", "data", "users.json");

  try {
    const fileData = await readFile(filePath, "utf-8");
    const users = JSON.parse(fileData);
    // Kiểm tra trùng username/email
    if (users.some((u: any) => u.username === body.username || u.email === body.email)) {
      return NextResponse.json({ success: false, message: "Tài khoản hoặc email đã tồn tại!" }, { status: 400 });
    }
    users.push(body);
    await writeFile(filePath, JSON.stringify(users, null, 2), "utf-8");
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error writing user file:", err);
    return NextResponse.json({ success: false, message: "Lỗi hệ thống!" }, { status: 500 });
  }
}
