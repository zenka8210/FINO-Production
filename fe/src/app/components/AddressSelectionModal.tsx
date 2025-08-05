'use client';

import { useState, useEffect } from 'react';
import { FaTimes, FaMapMarkerAlt, FaCheck, FaPlus } from 'react-icons/fa';
import { Button } from '@/app/components/ui';
import { Address } from '@/types';
import { addressService } from '@/services';
import { useApiNotification } from '@/hooks';
import styles from './AddressSelectionModal.module.css';

interface AddressSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAddress: Address | null;
  onSelectAddress: (address: Address) => void;
  onCreateNew?: () => void;
}

export default function AddressSelectionModal({
  isOpen,
  onClose,
  currentAddress,
  onSelectAddress,
  onCreateNew
}: AddressSelectionModalProps) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { showError } = useApiNotification();

  // Load user addresses
  useEffect(() => {
    if (isOpen) {
      loadAddresses();
    }
  }, [isOpen]);

  const loadAddresses = async () => {
    try {
      setIsLoading(true);
      const userAddresses = await addressService.getUserAddresses();
      setAddresses(userAddresses);
    } catch (error) {
      console.error('Error loading addresses:', error);
      showError('Không thể tải danh sách địa chỉ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAddress = (address: Address) => {
    onSelectAddress(address);
    onClose();
  };

  const handleCreateNew = () => {
    if (onCreateNew) {
      onCreateNew();
    } else {
      // Fallback to profile page
      window.open('/profile?section=addresses', '_blank');
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerTitle}>
            <FaMapMarkerAlt className={styles.headerIcon} />
            <h3>Chọn địa chỉ giao hàng</h3>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {/* Modal Body */}
        <div className={styles.modalBody}>
          {isLoading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              <p>Đang tải địa chỉ...</p>
            </div>
          ) : addresses.length === 0 ? (
            <div className={styles.emptyState}>
              <FaMapMarkerAlt className={styles.emptyIcon} />
              <p>Bạn chưa có địa chỉ nào</p>
              <Button variant="primary" onClick={handleCreateNew}>
                <FaPlus /> Thêm địa chỉ mới
              </Button>
            </div>
          ) : (
            <>
              {/* Address List */}
              <div className={styles.addressList}>
                {addresses.map((address) => (
                  <div
                    key={address._id}
                    className={`${styles.addressItem} ${
                      currentAddress?._id === address._id ? styles.currentAddress : ''
                    }`}
                    onClick={() => handleSelectAddress(address)}
                  >
                    <div className={styles.addressContent}>
                      <div className={styles.addressHeader}>
                        <span className={styles.addressName}>
                          {address.fullName} - {address.phone}
                        </span>
                        {address.isDefault && (
                          <span className={styles.defaultBadge}>Mặc định</span>
                        )}
                        {currentAddress?._id === address._id && (
                          <FaCheck className={styles.currentIcon} />
                        )}
                      </div>
                      <div className={styles.addressDetails}>
                        {address.addressLine}, {address.ward}, {address.district}, {address.city}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Create New Address Button */}
              <div className={styles.createNewSection}>
                <Button 
                  variant="outline" 
                  onClick={handleCreateNew}
                  className={styles.createNewButton}
                >
                  <FaPlus /> Thêm địa chỉ mới
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
