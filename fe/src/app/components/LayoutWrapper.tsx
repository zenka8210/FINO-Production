"use client"; // 🚀 Đánh dấu đây là Client Component

import { usePathname } from "next/navigation";
import Header from "./Header";
import AdminHeader from "./AdminHeader";
import Footer from "../components/footer";
import ChatBox from "../components/ChatBox";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  // Admin pages have their own layout with AdminHeader + Sidebar
  if (isAdmin) {
    return <>{children}</>;
  }

  // User pages use normal Header + Footer + ChatBox
  return (
    <>
      <Header />
      {children}
      <Footer />
      <ChatBox />
    </>
  );
}
