/**
 * Avatar Component with Upload Functionality
 * Enhanced user feature for profile management
 */

'use client';
import React, { useState, useRef } from 'react';
import Image from 'next/image';
import styles from './Avatar.module.css';

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  editable?: boolean;
  onImageChange?: (file: File) => void;
  loading?: boolean;
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'Avatar',
  size = 'medium',
  editable = false,
  onImageChange,
  loading = false,
  className = ''
}) => {
  const [imageError, setImageError] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    small: styles.avatarSmall,
    medium: styles.avatarMedium,
    large: styles.avatarLarge,
    xlarge: styles.avatarXLarge,
  };

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Kích thước file không được vượt quá 5MB');
        return;
      }
      onImageChange?.(file);
    } else {
      alert('Vui lòng chọn file hình ảnh hợp lệ');
    }
  };

  const handleClick = () => {
    if (editable) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (editable) {
      setDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (editable) {
      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileSelect(file);
      }
    }
  };

  const getDisplayImage = () => {
    if (imageError || !src) {
      return '/images/default-avatar.png';
    }
    return src;
  };

  const containerClasses = [
    styles.avatarContainer,
    sizeClasses[size],
    editable ? styles.editable : '',
    dragOver ? styles.dragOver : '',
    loading ? styles.loading : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={containerClasses}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className={styles.imageWrapper}>
        <Image
          src={getDisplayImage()}
          alt={alt}
          fill
          className={styles.avatarImage}
          onError={() => setImageError(true)}
          onLoad={() => setImageError(false)}
        />
        
        {loading && (
          <div className={styles.loadingOverlay}>
            <div className={styles.spinner} />
          </div>
        )}
        
        {editable && !loading && (
          <div className={styles.editOverlay}>
            <i className="fas fa-camera" />
            <span>Thay đổi</span>
          </div>
        )}
      </div>

      {editable && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className={styles.hiddenInput}
        />
      )}

      {dragOver && editable && (
        <div className={styles.dropZone}>
          <i className="fas fa-cloud-upload-alt" />
          <span>Thả file để tải lên</span>
        </div>
      )}
    </div>
  );
};

export default Avatar;
