import type { Metadata } from "next";
import { Poppins, Inter } from "next/font/google";
import '@fortawesome/fontawesome-free/css/all.min.css';
import "./globals.css";
import LayoutWrapper from "./components/LayoutWrapper";
import { ToastContainer } from "./components/ui";
import { AppProvider } from "../contexts"; // 👉 Cập nhật import

const poppins = Poppins({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FINO - Thời trang hiện đại cho Gen Z",
  description: "FINO Fashion Store - Cửa hàng thời trang trực tuyến với các sản phẩm trendy dành cho giới trẻ",
  icons: {
    icon: "/images/favicon-fino.svg",
    shortcut: "/images/favicon-fino.svg",
    apple: "/images/favicon-fino.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script src="https://accounts.google.com/gsi/client" async defer></script>
      </head>
      <body className={`${poppins.variable} ${inter.variable}`} suppressHydrationWarning>
        <AppProvider>
          <LayoutWrapper>{children}</LayoutWrapper>
          <ToastContainer />
        </AppProvider>
      </body>
    </html>
  );
}