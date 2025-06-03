import AdminHeader from "../component/adHeader";
import Sidebar from "../component/sidebar";
import styles from "./admin.module.css";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.adminContainer}>
      <AdminHeader />
      <div className={styles.adminBody}>
        <Sidebar />
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
