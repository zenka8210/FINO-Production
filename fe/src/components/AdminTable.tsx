import React, { useState } from 'react';
import styles from './AdminTable.module.css';

interface Column<T> {
  key: string;
  title: string;
  align?: 'left' | 'center' | 'right';
  width?: string;
  render?: (value: any, item: T, index: number) => React.ReactNode;
}

interface AdminTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  error?: string | null;
  itemsPerPage?: number;
  searchTerm?: string;
  onRetry?: () => void;
  emptyMessage?: string;
  loadingMessage?: string;
}

function AdminTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  error = null,
  itemsPerPage = 10,
  searchTerm = '',
  onRetry,
  emptyMessage = 'No data available',
  loadingMessage = 'Loading...'
}: AdminTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate pagination
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = data.slice(startIndex, endIndex);

  // Reset to first page when data changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [data.length, searchTerm]);

  if (loading) {
    return (
      <div className={styles.tableContainer}>
        <div className={styles.loadingState}>
          <div>{loadingMessage}</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.tableContainer}>
        <div className={styles.errorState}>
          <p className="mb-4">{error}</p>
          {onRetry && (
            <button onClick={onRetry} className={styles.retryButton}>
              Thử lại
            </button>
          )}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={styles.tableContainer}>
        <div className={styles.emptyState}>
          <div>{emptyMessage}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.tableContainer}>
      {/* Table */}
      <table className={styles.adminTable}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                style={{ 
                  textAlign: column.align || 'left',
                  width: column.width || 'auto'
                }}
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {currentData.map((item, index) => (
            <tr key={index}>
              {columns.map((column) => (
                <td
                  key={column.key}
                  style={{ textAlign: column.align || 'left' }}
                >
                  {column.render 
                    ? column.render(item[column.key], item, startIndex + index)
                    : item[column.key]
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <div className={styles.paginationInfo}>
            Hiển thị {startIndex + 1}-{Math.min(endIndex, data.length)} của {data.length} sản phẩm
          </div>
          <div className={styles.paginationControls}>
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className={styles.paginationButton}
            >
              ««
            </button>
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className={styles.paginationButton}
            >
              ‹
            </button>
            
            {/* Page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`${styles.paginationButton} ${
                    currentPage === pageNum ? styles.paginationButtonActive : ''
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={styles.paginationButton}
            >
              ›
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className={styles.paginationButton}
            >
              »»
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminTable;