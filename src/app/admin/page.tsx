"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import style from "./admin.module.css";

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cookies = document.cookie;
    const username = cookies
      .split("; ")
      .find((row) => row.startsWith("username="))
      ?.split("=")[1];

    if (username !== "admin") {
      alert("Bạn không có quyền truy cập trang này!");
      router.push("/login");
    } else {
      setLoading(false);
    }
  }, [router]);

  if (loading) return null;

  return (
    <div className={style.admindashboard}>
      <h1>Dashboard</h1>
      <p>Chào mừng đến với trang quản trị!</p>
    </div>
  );
}
