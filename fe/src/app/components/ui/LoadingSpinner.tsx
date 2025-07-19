import React from 'react';
import { cn } from '@/lib/utils';
import styles from './LoadingSpinner.module.css';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  fullscreen?: boolean;
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className,
  fullscreen = false,
  text
}) => {
  if (fullscreen) {
    return (
      <div className={styles.fullscreenContainer}>
        <div className={styles.spinnerWrapper}>
          <div className={cn(styles.spinner, styles[size])}>
            <div className={styles.circle}></div>
          </div>
          {text && <p className={styles.text}>{text}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(styles.container, className)}>
      <div className={cn(styles.spinner, styles[size])}>
        <div className={styles.circle}></div>
      </div>
      {text && <p className={styles.text}>{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
