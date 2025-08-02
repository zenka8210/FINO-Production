"use client";
import AdminNavigation from "./AdminNavigation";
import styles from "./admin.module.css";
import "./admin-globals.css";
import { useState, useEffect } from "react";

interface AdminLayoutWrapperProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

const AdminLayoutWrapper = ({ 
  children, 
  title = "Dashboard Admin", 
  subtitle = "Cập nhật lúc" 
}: AdminLayoutWrapperProps) => {
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    // Only set time on client side to avoid hydration mismatch
    setCurrentTime(new Date().toLocaleString('vi-VN'));
    
    // Update time every minute
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleString('vi-VN'));
    }, 60000);

    // Aggressive footer hiding
    const hideFooter = () => {
      // Hide all footer elements
      const footers = document.querySelectorAll('footer, [class*="footer"], [class*="Footer"]');
      footers.forEach(footer => {
        if (footer instanceof HTMLElement) {
          footer.style.display = 'none';
          footer.style.visibility = 'hidden';
          footer.style.height = '0';
          footer.style.width = '0';
          footer.style.position = 'absolute';
          footer.style.left = '-99999px';
          footer.style.top = '-99999px';
          footer.style.zIndex = '-1';
        }
      });
    };

    // Run immediately and on DOM changes
    hideFooter();
    
    const observer = new MutationObserver(hideFooter);
    observer.observe(document.body, { 
      childList: true, 
      subtree: true 
    });

    return () => {
      clearInterval(interval);
      observer.disconnect();
    };
  }, []);

  return (
    <div className={styles.adminContainer}>
      <div className={styles.adminMainWrapper}>
        {/* Navigation */}
        <AdminNavigation />

        {/* Main Content */}
        <main className={styles.adminMainContent}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayoutWrapper;
