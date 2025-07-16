import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  const { username, password } = await req.json();
  const filePath = path.join(process.cwd(), "src", "data", "users.json");

  try {
    const fileData = await readFile(filePath, "utf-8");
    const users = JSON.parse(fileData);

    const user = users.find(
      (u: any) => u.username === username && u.password === password
    );    if (user) {
      // Trả về thông tin đầy đủ của user (không bao gồm password)
      const { password: _, ...userInfo } = user;
      
      const res = new Response(
        JSON.stringify({ 
          success: true, 
          ...userInfo
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Set-Cookie": `username=${user.username}; Path=/; SameSite=Lax`,
          },
        }
      );
      return res;
    } else {
      return NextResponse.json({ success: false }, { status: 401 });
    }
  } catch (err) {
    console.error("Error reading user file:", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}