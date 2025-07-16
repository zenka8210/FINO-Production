import { NextResponse } from "next/server";
import { readFile, writeFile } from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  const body = await req.json();
  const filePath = path.join(process.cwd(), "src", "data", "users.json");
  try {
    const fileData = await readFile(filePath, "utf-8");
    const users = JSON.parse(fileData);
    const idx = users.findIndex((u: any) => u.username === body.username);
    if (idx === -1) {
      return NextResponse.json({ success: false, message: "Không tìm thấy user!" }, { status: 404 });
    }
    // Kiểm tra mật khẩu hiện tại
    if (users[idx].password !== body.password) {
      return NextResponse.json({ success: false, message: "Mật khẩu hiện tại không đúng!" }, { status: 400 });
    }
    // Cập nhật thông tin
    if (body.fullname) users[idx].fullname = body.fullname;
    if (body.address) users[idx].address = body.address;
    if (body.newPassword) {
      users[idx].password = body.newPassword;
    }
    await writeFile(filePath, JSON.stringify(users, null, 2), "utf-8");
    // Nếu đổi mật khẩu thì yêu cầu đăng nhập lại
    return NextResponse.json({ success: true, logout: !!body.newPassword });
  } catch (err) {
    return NextResponse.json({ success: false, message: "Lỗi hệ thống!" }, { status: 500 });
  }
}
