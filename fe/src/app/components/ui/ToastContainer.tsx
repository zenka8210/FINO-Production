"use client";

import React from 'react';
import { createPortal } from 'react-dom';
import { useNotification } from '@/contexts';
import { Notification } from '@/types';
import Toast from './Toast';
import styles from './ToastContainer.module.css';

const ToastContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotification();

  if (notifications.length === 0) return null;

  const toastContainer = (
    <div className={styles.container}>
      {notifications.map((notification: Notification) => (
        <Toast
          key={notification.id}
          id={notification.id}
          type={notification.type}
          title={notification.title}
          message={notification.message}
          duration={notification.duration}
          onRemove={removeNotification}
        />
      ))}
    </div>
  );

  return typeof window !== 'undefined' 
    ? createPortal(toastContainer, document.body)
    : null;
};

export default ToastContainer;
