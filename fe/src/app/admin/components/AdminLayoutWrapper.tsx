"use client";
import styles from "../admin.module.css";
import AdminNavigation from "../components/AdminNavigation";

interface AdminLayoutWrapperProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

const AdminLayoutWrapper = ({ children, title, subtitle }: AdminLayoutWrapperProps) => {
  return (
    <div className={styles.adminContainer}>
      {/* Header */}
      <div className={styles.dashboardHeader}>
        <div className={styles.headerTitle}>
          <h1 className={styles.welcomeText}>{title}</h1>
          {subtitle && <p className={styles.dateText}>{subtitle}</p>}
        </div>
      </div>

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
