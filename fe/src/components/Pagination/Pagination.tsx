import { useState, useEffect } from 'react';
import styles from './Pagination.module.css';
import Button from '../../app/components/ui/Button';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  onPageChange: (page: number) => void;
  className?: string;
  showJumpToPage?: boolean;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  hasNextPage,
  hasPrevPage,
  onPageChange,
  className = '',
  showJumpToPage = true
}) => {
  const [jumpToPageValue, setJumpToPageValue] = useState(currentPage.toString());

  // Update jump to page value when currentPage changes
  useEffect(() => {
    setJumpToPageValue(currentPage.toString());
  }, [currentPage]);

  const handleJumpToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className={`${styles.pagination} ${className}`}>
      <div className={styles.paginationInfo}>
        Trang {currentPage} / {totalPages} ({totalItems} sản phẩm)
      </div>
      
      <div className={styles.paginationControls}>
        <Button
          variant="secondary"
          disabled={!hasPrevPage}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Trước
        </Button>

        <div className={styles.pageNumbers}>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            // Calculate which pages to show (max 5 pages)
            let startPage = Math.max(1, currentPage - 2);
            let endPage = Math.min(totalPages, startPage + 4);
            
            // Adjust startPage if we're near the end
            if (endPage - startPage < 4) {
              startPage = Math.max(1, endPage - 4);
            }
            
            const pageNumber = startPage + i;
            
            if (pageNumber <= totalPages && pageNumber >= 1) {
              return (
                <button
                  key={pageNumber}
                  className={`${styles.pageNumber} ${pageNumber === currentPage ? styles.active : ''}`}
                  onClick={() => onPageChange(pageNumber)}
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
          disabled={!hasNextPage}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Sau
        </Button>
      </div>

      {/* Jump to page */}
      {showJumpToPage && (
        <div className={styles.jumpToPage}>
          <span>Đi tới trang:</span>
          <input
            type="number"
            min="1"
            max={totalPages}
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
          />
        </div>
      )}
    </div>
  );
};

export default Pagination;
