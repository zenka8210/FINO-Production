import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export async function GET(req: Request) {
  const url = new URL(req.url!);
  const username = url.searchParams.get("username");
  const filePath = path.join(process.cwd(), "src", "data", "users.json");
  try {
    const fileData = await readFile(filePath, "utf-8");
    const users = JSON.parse(fileData);
    const user = users.find((u: any) => u.username === username);
    return NextResponse.json({ user: user || null });
  } catch (err) {
    return NextResponse.json({ user: null });
  }
}
