import { readFile, writeFile } from "fs/promises";
import path from "path";

const filePath = path.join(process.cwd(), "src", "data", "users.json");

// GET user
export async function GET(_: Request, context: { params: { id: string } }) {
  const id = Number(context.params.id);
  const data = await readFile(filePath, "utf-8");
  const users = JSON.parse(data);
  const user = users.find((u: any) => u.id === id);

  if (!user) {
    return new Response(JSON.stringify({ error: "Không tìm thấy user" }), { status: 404 });
  }

  return new Response(JSON.stringify(user), { status: 200 });
}

// PUT (cập nhật user)
export async function PUT(req: Request, context: { params: { id: string } }) {
  const id = Number(context.params.id);
  const updatedData = await req.json();

  try {
    const data = await readFile(filePath, "utf-8");
    const users = JSON.parse(data);

    const index = users.findIndex((u: any) => u.id === id);
    if (index === -1) {
      return new Response(JSON.stringify({ error: "Không tìm thấy user" }), { status: 404 });
    }

    users[index] = { ...users[index], ...updatedData };
    await writeFile(filePath, JSON.stringify(users, null, 2), "utf-8");

    return new Response(JSON.stringify(users[index]), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Lỗi server" }), { status: 500 });
  }
}

// DELETE user
export async function DELETE(_: Request, context: { params: { id: string } }) {
  const id = Number(context.params.id);

  try {
    const data = await readFile(filePath, "utf-8");
    let users = JSON.parse(data);

    const index = users.findIndex((u: any) => u.id === id);
    if (index === -1) {
      return new Response(JSON.stringify({ error: "Không tìm thấy user" }), { status: 404 });
    }

    users.splice(index, 1);
    await writeFile(filePath, JSON.stringify(users, null, 2), "utf-8");

    return new Response(JSON.stringify({ message: "Xoá thành công" }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Lỗi server" }), { status: 500 });
  }
}
