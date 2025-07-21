'use client';

import { useState, useEffect } from 'react';
import Button from '../Button';
import styles from './Pagination.module.css';

export interface PaginationInfo {
  page: number;
  limit: number;
  totalPages: number;
  totalProducts: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginationProps {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  className?: string;
  showJumpToPage?: boolean;
  showInfo?: boolean;
}

const Pagination: React.FC<PaginationProps> = ({
  pagination,
  onPageChange,
  className = '',
  showJumpToPage = true,
  showInfo = true
}) => {
  const [jumpToPageValue, setJumpToPageValue] = useState(pagination.page.toString());

  // Update jump to page value when currentPage changes
  useEffect(() => {
    setJumpToPageValue(pagination.page.toString());
  }, [pagination.page]);

  const handleJumpToPage = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      onPageChange(page);
      setJumpToPageValue(page.toString());
    } else {
      setJumpToPageValue(pagination.page.toString());
    }
  };

  // Don't render if only 1 page or no pages
  if (pagination.totalPages <= 1) {
    return null;
  }

  return (
    <div className={`${styles.pagination} ${className}`}>
      {/* Pagination Info */}
      {showInfo && (
        <div className={styles.paginationInfo}>
          Trang {pagination.page} / {pagination.totalPages}
        </div>
      )}
      
      {/* Pagination Controls */}
      <div className={styles.paginationControls}>
        <Button
          variant="secondary"
          disabled={!pagination.hasPrevPage}
          onClick={() => onPageChange(pagination.page - 1)}
          className={styles.navButton}
        >
          Trước
        </Button>

        <div className={styles.pageNumbers}>
          {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
            // Calculate which pages to show (max 5 pages)
            let startPage = Math.max(1, pagination.page - 2);
            let endPage = Math.min(pagination.totalPages, startPage + 4);
            
            // Adjust startPage if we're near the end
            if (endPage - startPage < 4) {
              startPage = Math.max(1, endPage - 4);
            }
            
            const pageNumber = startPage + i;
            
            if (pageNumber <= pagination.totalPages && pageNumber >= 1) {
              return (
                <button
                  key={pageNumber}
                  className={`${styles.pageNumber} ${pageNumber === pagination.page ? styles.active : ''}`}
                  onClick={() => onPageChange(pageNumber)}
                  aria-label={`Đi tới trang ${pageNumber}`}
                  aria-current={pageNumber === pagination.page ? 'page' : undefined}
                >
                  {pageNumber}
                </button>
              );
            }
            return null;
          }).filter(Boolean)}
        </div>

        <Button
          variant="secondary"
          disabled={!pagination.hasNextPage}
          onClick={() => onPageChange(pagination.page + 1)}
          className={styles.navButton}
        >
          Sau
        </Button>
      </div>

      {/* Jump to page */}
      {showJumpToPage && pagination.totalPages > 5 && (
        <div className={styles.jumpToPage}>
          <span>Đi tới trang:</span>
          <input
            type="number"
            min="1"
            max={pagination.totalPages}
            value={jumpToPageValue}
            onChange={(e) => {
              const value = e.target.value;
              setJumpToPageValue(value);
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                const page = parseInt(jumpToPageValue);
                handleJumpToPage(page);
              }
            }}
            onBlur={() => {
              const page = parseInt(jumpToPageValue);
              handleJumpToPage(page);
            }}
            className={styles.pageInput}
            aria-label="Nhập số trang muốn chuyển tới"
          />
        </div>
      )}
    </div>
  );
};

export default Pagination;
