'use client';

import React, { useEffect } from 'react';
import { useNotification } from '@/contexts';
import { Notification } from '@/types';
import styles from './Toast.module.css';

export default function Toast() {
  const { notifications, removeNotification } = useNotification();

  if (!notifications || notifications.length === 0) {
    return null;
  }

  return (
    <div className={styles.toastContainer}>
      {notifications.map((notification) => (
        <ToastItem
          key={notification.id}
          notification={notification}
          onRemove={removeNotification}
        />
      ))}
    </div>
  );
}

interface ToastItemProps {
  notification: Notification;
  onRemove: (id: string) => void;
}

function ToastItem({ notification, onRemove }: ToastItemProps) {
  useEffect(() => {
    if (!notification.persistent && notification.duration) {
      const timer = setTimeout(() => {
        onRemove(notification.id);
      }, notification.duration);

      return () => clearTimeout(timer);
    }
  }, [notification, onRemove]);

  const handleClose = () => {
    onRemove(notification.id);
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return 'ℹ️';
    }
  };

  return (
    <div className={`${styles.toast} ${styles[notification.type]}`}>
      <div className={styles.toastIcon}>
        {getIcon()}
      </div>
      <div className={styles.toastContent}>
        <div className={styles.toastTitle}>
          {notification.title}
        </div>
        {notification.message && (
          <div className={styles.toastMessage}>
            {notification.message}
          </div>
        )}
      </div>
      <button
        className={styles.toastClose}
        onClick={handleClose}
        aria-label="Đóng thông báo"
      >
        ×
      </button>
    </div>
  );
}
