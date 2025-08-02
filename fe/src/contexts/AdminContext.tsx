'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AdminContextType {
  userMenuOpen: boolean;
  setUserMenuOpen: (open: boolean) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleUserMenu: () => void;
  toggleMobileMenu: () => void;
  toggleSidebar: () => void;
  closeAllMenus: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

interface AdminProviderProps {
  children: ReactNode;
}

export function AdminProvider({ children }: AdminProviderProps) {
  // Persistent state using localStorage
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Load saved state from localStorage on mount
  useEffect(() => {
    const savedSidebarState = localStorage.getItem('admin-sidebar-collapsed');
    if (savedSidebarState) {
      setSidebarCollapsed(JSON.parse(savedSidebarState));
    }
  }, []);

  // Save sidebar state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('admin-sidebar-collapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // Close menus when clicking outside or navigating
  useEffect(() => {
    const handleOutsideClick = () => {
      setUserMenuOpen(false);
      setMobileMenuOpen(false);
    };

    if (userMenuOpen || mobileMenuOpen) {
      document.addEventListener('click', handleOutsideClick);
      return () => document.removeEventListener('click', handleOutsideClick);
    }
  }, [userMenuOpen, mobileMenuOpen]);

  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
    setMobileMenuOpen(false); // Close mobile menu if open
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    setUserMenuOpen(false); // Close user menu if open
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const closeAllMenus = () => {
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
  };

  return (
    <AdminContext.Provider
      value={{
        userMenuOpen,
        setUserMenuOpen,
        mobileMenuOpen,
        setMobileMenuOpen,
        sidebarCollapsed,
        setSidebarCollapsed,
        toggleUserMenu,
        toggleMobileMenu,
        toggleSidebar,
        closeAllMenus,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
