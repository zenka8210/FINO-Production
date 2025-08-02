import React from 'react';
import styles from './ProductStatisticsCards.module.css';

interface ProductStatistics {
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  totalVariants: number;
}

interface ProductStatisticsCardsProps {
  statistics: ProductStatistics;
}

const ProductStatisticsCards: React.FC<ProductStatisticsCardsProps> = ({ statistics }) => {
  return (
    <div className={styles.statisticsGrid}>
      <div className={styles.statisticsCard + ' ' + styles.totalProducts}>
        <div className={styles.statisticsValue}>
          {statistics.totalProducts}
        </div>
        <div className={styles.statisticsLabel}>
          Tổng sản phẩm
        </div>
      </div>
      
      <div className={styles.statisticsCard + ' ' + styles.activeProducts}>
        <div className={styles.statisticsValue}>
          {statistics.activeProducts}
        </div>
        <div className={styles.statisticsLabel}>
          Đang bán
        </div>
      </div>
      
      <div className={styles.statisticsCard + ' ' + styles.lowStockProducts}>
        <div className={styles.statisticsValue}>
          {statistics.lowStockProducts}
        </div>
        <div className={styles.statisticsLabel}>
          Hết hàng/Sắp hết
        </div>
      </div>
      
      <div className={styles.statisticsCard + ' ' + styles.totalVariants}>
        <div className={styles.statisticsValue}>
          {statistics.totalVariants}
        </div>
        <div className={styles.statisticsLabel}>
          Tổng tồn kho
        </div>
      </div>
    </div>
  );
};

export default ProductStatisticsCards;
