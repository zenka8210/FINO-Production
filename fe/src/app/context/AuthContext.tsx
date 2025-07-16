"use client";
import { createContext, useContext, useState, useEffect } from "react";

interface User {
  id?: string | number;
  username: string;
  role: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  district?: string;
}

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    console.log('đăng nhập thành công:', userData)
  };
  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    // Xóa thêm các dữ liệu liên quan khi đăng xuất
    localStorage.removeItem("cart");
    localStorage.removeItem("cartDiscount");
    localStorage.removeItem("favorites");
    
    // Reload trang để đảm bảo tất cả component được cập nhật
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth phải được dùng bên trong AuthProvider");
  }
  return context;
};