"use client";
import { ReactNode } from 'react';
import styles from '../admin.module.css';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  variant: 'revenue' | 'orders' | 'users' | 'lowStock';
  change?: {
    type: 'positive' | 'negative' | 'neutral';
    value: string;
    icon: string;
  };
  note?: string;
  onRefresh?: () => void;
  refreshLabel?: string;
  loading?: boolean;
}

export default function StatCard({
  title,
  value,
  icon,
  variant,
  change,
  note,
  onRefresh,
  refreshLabel,
  loading = false
}: StatCardProps) {
  return (
    <article className={`${styles.statCard} ${styles[variant]}`}>
      <header className={styles.statCardHeader}>
        <h3 className={styles.statCardTitle}>{title}</h3>
        <div className={styles.statCardActions}>
          {onRefresh && (
            <button 
              className={styles.statCardRefreshButton}
              onClick={onRefresh}
              title={refreshLabel}
              aria-label={refreshLabel}
              disabled={loading}
              style={{
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              <span 
                style={{
                  animation: loading ? 'spin 1s linear infinite' : 'none',
                  display: 'inline-block'
                }}
              >
                🔄
              </span>
            </button>
          )}
          <div className={styles.statCardIcon} aria-hidden="true">
            {icon}
          </div>
        </div>
      </header>
      
      <div className={styles.statCardValue} aria-live="polite">
        {typeof value === 'number' ? value.toLocaleString("vi-VN") : value}
        {variant === 'revenue' && '₫'}
        {variant === 'users' && '+'}
      </div>
      
      {change && (
        <div className={`${styles.statCardChange} ${styles[change.type]}`}>
          <span className={styles.statCardChangeIcon} aria-hidden="true">
            {change.icon}
          </span>
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
