import { NextResponse } from "next/server";
import { readFile, writeFile } from "fs/promises";
import path from "path";

const DATA_PATH = path.join(process.cwd(), "src", "app", "data.json");

export async function GET() {
  try {
    const fileData = await readFile(DATA_PATH, "utf-8");
    const data = JSON.parse(fileData);
    return NextResponse.json({ products: data.product });
  } catch (err) {
    return NextResponse.json({ products: [] }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const newProduct = await req.json();
  try {
    const fileData = await readFile(DATA_PATH, "utf-8");
    const data = JSON.parse(fileData);
    newProduct.id = Date.now().toString();
    data.product.push(newProduct);
    await writeFile(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
    return NextResponse.json({ success: true, product: newProduct });
  } catch (err) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const updatedProduct = await req.json();
  try {
    const fileData = await readFile(DATA_PATH, "utf-8");
    const data = JSON.parse(fileData);
    const idx = data.product.findIndex((p: any) => p.id === updatedProduct.id);
    if (idx === -1) return NextResponse.json({ success: false }, { status: 404 });
    data.product[idx] = { ...data.product[idx], ...updatedProduct };
    await writeFile(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
    return NextResponse.json({ success: true, product: data.product[idx] });
  } catch (err) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  try {
    const fileData = await readFile(DATA_PATH, "utf-8");
    const data = JSON.parse(fileData);
    data.product = data.product.filter((p: any) => p.id !== id);
    await writeFile(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
