"use client"; // 🚀 Đánh dấu đây là Client Component

import { usePathname } from "next/navigation";
import Header from "./Header";
import AdminHeader from "./AdminHeader";
import Footer from "../components/footer";
import FloatingCartWishlist from "./FloatingCartWishlist";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  
  // Pages where FloatingCartWishlist should be shown
  const showFloatingCartWishlist = !isAdmin && (
    pathname === "/" ||
    pathname.startsWith("/products") ||
    pathname.startsWith("/new") ||
    pathname.startsWith("/sale") ||
    pathname.startsWith("/featured") ||
    pathname.startsWith("/categories") ||
    pathname.startsWith("/search")
  ) && (
    // Hide on cart/checkout/wishlist pages as they already show these features
    !pathname.startsWith("/cart") &&
    !pathname.startsWith("/checkout") &&
    !pathname.startsWith("/wishlist")
  );

  // Admin pages have their own layout with AdminHeader + Sidebar
  if (isAdmin) {
    return <>{children}</>;
  }

  // User pages use normal Header + Footer + conditionally FloatingCartWishlist
  return (
    <>
      <Header />
      {children}
      <Footer />
      {showFloatingCartWishlist && <FloatingCartWishlist />}
    </>
  );
}
