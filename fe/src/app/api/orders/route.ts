import { NextResponse } from "next/server"
import { readFile, writeFile } from "fs/promises"
import path from "path"

// GET - Lấy danh sách đơn hàng
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("userId")
  const orderId = searchParams.get("orderId")
  const status = searchParams.get("status") // Thêm tham số status

  const filePath = path.join(process.cwd(), "src", "app", "data", "orders.json")

  try {
    const fileData = await readFile(filePath, "utf-8")
    let orders = JSON.parse(fileData)

    if (orderId) {
      // Lấy đơn hàng theo ID (ưu tiên cao nhất)
      const order = orders.filter((order: any) => order.id.toString() === orderId)
      return NextResponse.json({ success: true, orders: order })
    }

    if (userId) {
      // Lọc đơn hàng theo user
      orders = orders.filter((order: any) => order.userId === userId)
    }

    if (status) {
      // Lọc đơn hàng theo trạng thái (áp dụng sau userId nếu có)
      orders = orders.filter((order: any) => order.status === status)
    }

    // Trả về các đơn hàng đã lọc (hoặc tất cả nếu không có tham số nào)
    return NextResponse.json({ success: true, orders })
  } catch (err) {
    console.error("Error reading orders file:", err)
    return NextResponse.json({ success: false, orders: [] })
  }
}

// POST - Tạo đơn hàng mới
export async function POST(req: Request) {
  const orderData = await req.json()
  const filePath = path.join(process.cwd(), "src", "app", "data", "orders.json")

  try {
    let orders = []
    try {
      const fileData = await readFile(filePath, "utf-8")
      orders = JSON.parse(fileData)
    } catch (err) {
      // Nếu file không tồn tại, tạo mảng mới
      orders = []
    }

    // Tạo ID mới
    const newId = orders.length > 0 ? Math.max(...orders.map((o: any) => o.id)) + 1 : 1

    const newOrder = {
      id: newId,
      ...orderData,
      status: "pending", // pending, confirmed, shipping, delivered, cancelled
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    orders.push(newOrder)
    await writeFile(filePath, JSON.stringify(orders, null, 2))
    return NextResponse.json({ success: true, order: newOrder })
  } catch (err) {
    console.error("Error saving order:", err)
    return NextResponse.json({ success: false, error: "Cannot save order" }, { status: 500 })
  }
}

// PUT - Cập nhật trạng thái đơn hàng (cho admin)
export async function PUT(req: Request) {
  const { id, status } = await req.json()
  const filePath = path.join(process.cwd(), "src", "app", "data", "orders.json")

  try {
    const fileData = await readFile(filePath, "utf-8")
    const orders = JSON.parse(fileData)
    const orderIndex = orders.findIndex((order: any) => order.id === id)

    if (orderIndex === -1) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 })
    }

    orders[orderIndex].status = status
    orders[orderIndex].updatedAt = new Date().toISOString()

    await writeFile(filePath, JSON.stringify(orders, null, 2))
    return NextResponse.json({ success: true, order: orders[orderIndex] })
  } catch (err) {
    console.error("Error updating order:", err)
    return NextResponse.json({ success: false, error: "Cannot update order" }, { status: 500 })
  }
}
