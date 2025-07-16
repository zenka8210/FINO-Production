'use client';
import Link from 'next/link';
import styles from './ActionButtons.module.css';

interface ActionButtonsProps {
  editUrl?: string;
  deleteAction?: () => void;
  viewUrl?: string;
  deleteLoading?: boolean;
  customActions?: Array<{
    label: string;
    action: () => void;
    type: 'primary' | 'secondary' | 'danger' | 'success';
    icon: string;
  }>;
}

export default function ActionButtons({ 
  editUrl, 
  deleteAction, 
  viewUrl, 
  deleteLoading = false,
  customActions = []
}: ActionButtonsProps) {
  return (
    <div className={styles.actions}>
      {/* Nút Sửa */}
      {editUrl && (
        <Link 
          href={editUrl} 
          className={styles.editBtn}
          title="Chỉnh sửa"
        >
          <i className="fas fa-edit"></i>
        </Link>
      )}

      {/* Nút Xóa */}
      {deleteAction && (
        <button
          onClick={deleteAction}
          className={styles.deleteBtn}
          title="Xóa"
          disabled={deleteLoading}
        >
          <i className="fas fa-trash"></i>
        </button>
      )}

      {/* Nút Xem */}
      {viewUrl && (
        <Link 
          href={viewUrl} 
          className={styles.viewBtn}
          title="Xem"
          target="_blank"
        >
          <i className="fas fa-eye"></i>
        </Link>
      )}

      {/* Các nút tùy chỉnh */}
      {customActions.map((action, index) => (
        <button
          key={index}
          onClick={action.action}
          className={`${styles.actionBtn} ${styles[action.type]}`}
          title={action.label}
        >
          <i className={action.icon}></i>
        </button>
      ))}
    </div>
  );
}
