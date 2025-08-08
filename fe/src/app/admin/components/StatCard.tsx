"use client";
import { ReactNode } from 'react';
import styles from '../admin.module.css';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  variant: 'revenue' | 'orders' | 'users' | 'lowStock' | 'daily-revenue' | 'weekly-revenue' | 'monthly-revenue';
  change?: {
    type: 'positive' | 'negative' | 'neutral';
    value: string;
    icon: string;
  };
  note?: string;
}

export default function StatCard({
  title,
  value,
  icon,
  variant,
  change,
  note
}: StatCardProps) {
  // Function to format large numbers for better display
  const formatValue = (val: string | number) => {
    // Handle null, undefined, or empty values
    if (val === null || val === undefined || val === '') {
      return '0';
    }
    
    // If it's already a string, return as-is
    if (typeof val === 'string') {
      return val;
    }
    
    // Convert to number if needed
    const numVal = typeof val === 'number' ? val : parseFloat(String(val));
    if (isNaN(numVal)) {
      return '0'; // Default to 0 for invalid numbers
    }
    
    // Apply formatting to all revenue-related cards and large numbers
    const isRevenueCard = variant === 'revenue' || variant === 'daily-revenue' || variant === 'weekly-revenue' || variant === 'monthly-revenue';
    
    if (isRevenueCard && numVal >= 100000) {
      if (numVal >= 1000000000) {
        // Billions: 1,500,000,000 → "1T5" (1 tỷ 5)
        const billions = Math.floor(numVal / 1000000000);
        const remainder = Math.floor((numVal % 1000000000) / 100000000);
        return remainder > 0 ? `${billions}T${remainder}` : `${billions}T`;
      } else if (numVal >= 1000000) {
        // Millions: 90,312,090 → "90M3", 8,500,000 → "8M5"
        const millions = Math.floor(numVal / 1000000);
        const remainder = Math.floor((numVal % 1000000) / 100000);
        return remainder > 0 ? `${millions}M${remainder}` : `${millions}M`;
      } else if (numVal >= 100000) {
        // Hundred thousands: 150,000 → "150K"
        const hundreds = Math.floor(numVal / 1000);
        return `${hundreds}K`;
      }
    }
    
    // For other cards or smaller numbers, use normal formatting
    return numVal.toLocaleString("vi-VN");
  };

  // Convert variant to className
  const getVariantClass = (variant: string) => {
    switch (variant) {
      case 'daily-revenue':
        return 'dailyRevenue';
      case 'weekly-revenue':
        return 'weeklyRevenue';
      case 'monthly-revenue':
        return 'monthlyRevenue';
      default:
        return variant;
    }
  };

  return (
    <article className={`${styles.statCard} ${styles[getVariantClass(variant)]}`}>
      <header className={styles.statCardHeader}>
        <h3 className={styles.statCardTitle}>{title}</h3>
      </header>
      
      <div 
        className={styles.statCardValue} 
        aria-live="polite"
        title={typeof value === 'number' ? value.toLocaleString("vi-VN") : 
               (typeof value === 'string' && !isNaN(parseFloat(value))) ? 
               parseFloat(value).toLocaleString("vi-VN") : value.toString()}
      >
        <span className={styles.valueNumber}>
          {formatValue(value)} {/* Debug: {JSON.stringify({value, variant, formatted: formatValue(value)})} */}
        </span>
        <span className={styles.valueUnit}>
          {(variant === 'revenue' || variant === 'daily-revenue') && '₫'}
        </span>
      </div>
      
      {change && (
        <div className={`${styles.statCardChange} ${styles[change.type]}`}>
          <span>{change.value}</span>
        </div>
      )}
      
      {note && (
        <p className={styles.statCardNote}>
          {note}
        </p>
      )}
    </article>
  );
}
