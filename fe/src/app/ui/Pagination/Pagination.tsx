import React from 'react';
import styles from './Pagination.module.css';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalProducts: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  onPageChange: (page: number) => void;
  className?: string;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalProducts,
  hasNextPage,
  hasPrevPage,
  onPageChange,
  className = ''
}) => {
  if (totalPages <= 1) return null;

  const renderPageNumbers = () => {
    const pages = [];
    const showPages = 5; // Số trang hiển thị tối đa
    let startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
    let endPage = Math.min(totalPages, startPage + showPages - 1);

    // Điều chỉnh startPage nếu endPage đạt tới totalPages
    if (endPage === totalPages) {
      startPage = Math.max(1, endPage - showPages + 1);
    }

    // Thêm trang đầu và dấu "..." nếu cần
    if (startPage > 1) {
      pages.push(
        <button
          key={1}
          onClick={() => onPageChange(1)}
          className={`${styles.pageButton} ${currentPage === 1 ? styles.active : ''}`}
        >
          1
        </button>
      );
      if (startPage > 2) {
        pages.push(
          <span key="start-ellipsis" className={styles.ellipsis}>
            ...
          </span>
        );
      }
    }

    // Thêm các trang trong khoảng
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          className={`${styles.pageButton} ${currentPage === i ? styles.active : ''}`}
        >
          {i}
        </button>
      );
    }

    // Thêm dấu "..." và trang cuối nếu cần
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(
          <span key="end-ellipsis" className={styles.ellipsis}>
            ...
          </span>
        );
      }
      pages.push(
        <button
          key={totalPages}
          onClick={() => onPageChange(totalPages)}
          className={`${styles.pageButton} ${currentPage === totalPages ? styles.active : ''}`}
        >
          {totalPages}
        </button>
      );
    }

    return pages;
  };

  return (
    <div className={`${styles.paginationContainer} ${className}`}>
      <div className={styles.paginationInfo}>
        <span>
          Hiển thị trang {currentPage} / {totalPages} 
          {totalProducts > 0 && ` (${totalProducts} sản phẩm)`}
        </span>
      </div>
      
      <div className={styles.paginationControls}>
        {/* Previous button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPrevPage}
          className={`${styles.navButton} ${!hasPrevPage ? styles.disabled : ''}`}
        >
          ← Trước
        </button>

        {/* Page numbers */}
        <div className={styles.pageNumbers}>
          {renderPageNumbers()}
        </div>

        {/* Next button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNextPage}
          className={`${styles.navButton} ${!hasNextPage ? styles.disabled : ''}`}
        >
          Tiếp →
        </button>
      </div>
    </div>
  );
};

export default Pagination;
