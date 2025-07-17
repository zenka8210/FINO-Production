/**
 * FormError component for displaying field validation errors
 * Following MIGRATION_SCRIPT.md - Clean code, reusable UI components
 */
import React from 'react';
import styles from './FormError.module.css';

interface FormErrorProps {
  error?: string;
  className?: string;
}

export const FormError: React.FC<FormErrorProps> = ({ error, className }) => {
  if (!error) return null;
  
  return (
    <div className={`${styles.errorMessage} ${className || ''}`}>
      <span className={styles.errorIcon}>⚠️</span>
      <span className={styles.errorText}>{error}</span>
    </div>
  );
};

export default FormError;
