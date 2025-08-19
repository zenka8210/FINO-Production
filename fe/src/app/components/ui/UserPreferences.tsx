/**
 * User Preferences Component
 * Enhanced user feature for managing user settings and preferences
 */

'use client';
import React, { useState, useEffect } from 'react';
import { Button, Modal, LoadingSpinner } from '@/app/components/ui';
import styles from './UserPreferences.module.css';

export interface UserPreference {
  id: string;
  key: string;
  value: string | boolean | number;
  type: 'text' | 'boolean' | 'select' | 'number';
  label: string;
  description?: string;
  options?: { value: string; label: string }[];
  category: string;
}

interface UserPreferencesProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (preferences: Record<string, any>) => Promise<void>;
  initialPreferences?: Record<string, any>;
}

const defaultPreferences: UserPreference[] = [
  // Notification Preferences
  {
    id: 'email_notifications',
    key: 'emailNotifications',
    value: true,
    type: 'boolean',
    label: 'Thông báo qua Email',
    description: 'Nhận thông báo về đơn hàng và khuyến mãi qua email',
    category: 'notifications'
  },
  {
    id: 'sms_notifications',
    key: 'smsNotifications',
    value: false,
    type: 'boolean',
    label: 'Thông báo qua SMS',
    description: 'Nhận thông báo quan trọng qua tin nhắn',
    category: 'notifications'
  },
  {
    id: 'push_notifications',
    key: 'pushNotifications',
    value: true,
    type: 'boolean',
    label: 'Thông báo đẩy',
    description: 'Nhận thông báo trực tiếp trên trình duyệt',
    category: 'notifications'
  },
  
  // Display Preferences
  {
    id: 'theme',
    key: 'theme',
    value: 'light',
    type: 'select',
    label: 'Giao diện',
    description: 'Chọn chế độ hiển thị phù hợp',
    options: [
      { value: 'light', label: 'Sáng' },
      { value: 'dark', label: 'Tối' },
      { value: 'auto', label: 'Tự động' }
    ],
    category: 'display'
  },
  {
    id: 'products_per_page',
    key: 'productsPerPage',
    value: 20,
    type: 'select',
    label: 'Sản phẩm mỗi trang',
    description: 'Số lượng sản phẩm hiển thị trên mỗi trang',
    options: [
      { value: '12', label: '12 sản phẩm' },
      { value: '20', label: '20 sản phẩm' },
      { value: '40', label: '40 sản phẩm' }
    ],
    category: 'display'
  },
  {
    id: 'show_sale_badge',
    key: 'showSaleBadge',
    value: true,
    type: 'boolean',
    label: 'Hiển thị nhãn giảm giá',
    description: 'Hiển thị nhãn giảm giá trên sản phẩm',
    category: 'display'
  },
  
  // Privacy Preferences
  {
    id: 'data_collection',
    key: 'dataCollection',
    value: true,
    type: 'boolean',
    label: 'Thu thập dữ liệu',
    description: 'Cho phép thu thập dữ liệu để cải thiện trải nghiệm',
    category: 'privacy'
  },
  {
    id: 'personalized_ads',
    key: 'personalizedAds',
    value: false,
    type: 'boolean',
    label: 'Quảng cáo cá nhân hóa',
    description: 'Hiển thị quảng cáo dựa trên sở thích cá nhân',
    category: 'privacy'
  }
];

const UserPreferences: React.FC<UserPreferencesProps> = ({
  isOpen,
  onClose,
  onSave,
  initialPreferences = {}
}) => {
  const [preferences, setPreferences] = useState<Record<string, any>>(initialPreferences);
  const [loading, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('notifications');

  useEffect(() => {
    // Initialize preferences with default values
    const initialPrefs = { ...initialPreferences };
    defaultPreferences.forEach(pref => {
      if (!(pref.key in initialPrefs)) {
        initialPrefs[pref.key] = pref.value;
      }
    });
    setPreferences(initialPrefs);
  }, [initialPreferences]);

  const handlePreferenceChange = (key: string, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(preferences);
      onClose();
    } catch (error) {
      console.error('Failed to save preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  const renderPreferenceControl = (pref: UserPreference) => {
    const currentValue = preferences[pref.key] ?? pref.value;

    switch (pref.type) {
      case 'boolean':
        return (
          <label className={styles.switchContainer}>
            <input
              type="checkbox"
              checked={Boolean(currentValue)}
              onChange={(e) => handlePreferenceChange(pref.key, e.target.checked)}
              className={styles.switchInput}
            />
            <span className={styles.switchSlider}></span>
          </label>
        );

      case 'select':
        return (
          <select
            value={String(currentValue)}
            onChange={(e) => handlePreferenceChange(pref.key, e.target.value)}
            className={styles.selectInput}
          >
            {pref.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'number':
        return (
          <input
            type="number"
            value={Number(currentValue)}
            onChange={(e) => handlePreferenceChange(pref.key, parseInt(e.target.value))}
            className={styles.numberInput}
          />
        );

      case 'text':
      default:
        return (
          <input
            type="text"
            value={String(currentValue)}
            onChange={(e) => handlePreferenceChange(pref.key, e.target.value)}
            className={styles.textInput}
          />
        );
    }
  };

  const categories = [
    { id: 'notifications', label: 'Thông báo', icon: 'fas fa-bell' },
    { id: 'display', label: 'Hiển thị', icon: 'fas fa-display' },
    { id: 'privacy', label: 'Riêng tư', icon: 'fas fa-shield-alt' }
  ];

  const getPreferencesByCategory = (category: string) => {
    return defaultPreferences.filter(pref => pref.category === category);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cài đặt tài khoản"
      size="lg"
      className={styles.preferencesModal}
    >
      <div className={styles.preferencesContainer}>
        {/* Tabs */}
        <div className={styles.tabsContainer}>
          {categories.map(category => (
            <button
              key={category.id}
              className={`${styles.tab} ${activeTab === category.id ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(category.id)}
            >
              <i className={category.icon} />
              <span>{category.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className={styles.contentContainer}>
          {categories.map(category => (
            <div
              key={category.id}
              className={`${styles.tabContent} ${activeTab === category.id ? styles.tabContentActive : ''}`}
            >
              <h3 className={styles.categoryTitle}>
                <i className={category.icon} />
                {category.label}
              </h3>

              <div className={styles.preferencesGrid}>
                {getPreferencesByCategory(category.id).map(pref => (
                  <div key={pref.id} className={styles.preferenceItem}>
                    <div className={styles.preferenceInfo}>
                      <label className={styles.preferenceLabel}>
                        {pref.label}
                      </label>
                      {pref.description && (
                        <p className={styles.preferenceDescription}>
                          {pref.description}
                        </p>
                      )}
                    </div>
                    <div className={styles.preferenceControl}>
                      {renderPreferenceControl(pref)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className={styles.actionsContainer}>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Hủy
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={loading}
            isLoading={loading}
          >
            {loading ? 'Đang lưu...' : 'Lưu cài đặt'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default UserPreferences;
