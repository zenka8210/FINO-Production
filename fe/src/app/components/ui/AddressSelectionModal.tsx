'use client';

import React, { useState, useEffect } from 'react';
import { FaTimes, FaMapMarkerAlt, FaCheck } from 'react-icons/fa';
import Modal from './Modal';
import Button from './Button';
import { addressService } from '@/services/addressService';
import { orderService } from '@/services/orderService';
import { useApiNotification } from '@/hooks';
import { OrderWithRefs, Address } from '@/types';
import styles from './AddressSelectionModal.module.css';

interface AddressSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderWithRefs;
  onSuccess: (updatedOrder: OrderWithRefs) => void;
}

export const AddressSelectionModal: React.FC<AddressSelectionModalProps> = ({
  isOpen,
  onClose,
  order,
  onSuccess,
}) => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { showSuccess, showError } = useApiNotification();

  useEffect(() => {
    if (isOpen) {
      console.log('🔍 Modal opened for order:', order);
      console.log('🔍 Order address:', order.address);
      console.log('🔍 Order address type:', typeof order.address);
      
      loadAddresses();
      
      // For snapshot addresses, we can't pre-select since _id is null
      const addressData = order.address as any;
      if (addressData?.isSnapshot) {
        console.log('⚠️ Address is snapshot with null _id, cannot pre-select');
        setSelectedAddressId(''); // Reset selection for snapshot addresses
      } else if (order.address?._id) {
        console.log('🔍 Setting selected address ID:', order.address._id);
        setSelectedAddressId(order.address._id);
      } else {
        console.log('⚠️ No address ID found in order.address');
        setSelectedAddressId('');
      }
    }
  }, [isOpen, order.address?._id]);

  const loadAddresses = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 Loading user addresses...');
      
      const addresses = await addressService.getUserAddresses();
      console.log('🔍 Loaded addresses:', addresses);
      
      setAddresses(addresses || []);
      
      if (!addresses || addresses.length === 0) {
        console.log('⚠️ No addresses found for user');
      }
    } catch (error) {
      console.error('❌ Error loading addresses:', error);
      showError('Không thể tải danh sách địa chỉ', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateAddress = async () => {
    if (!selectedAddressId) {
      showError('Vui lòng chọn địa chỉ');
      return;
    }

    // For snapshot addresses, we can always update since _id is null
    const addressData = order.address as any;
    if (!addressData?.isSnapshot && selectedAddressId === order.address?._id) {
      showError('Địa chỉ được chọn giống với địa chỉ hiện tại');
      return;
    }

    try {
      setIsUpdating(true);
      const updatedOrder = await orderService.updateOrderAddress(order._id, selectedAddressId);
      showSuccess('Cập nhật địa chỉ thành công');
      onSuccess(updatedOrder);
      onClose();
    } catch (error) {
      showError('Không thể cập nhật địa chỉ', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const formatAddress = (address: any) => {
    if (!address) return 'Chưa có địa chỉ';
    
    const parts = [
      address.addressLine || address.address || address.street,
      address.ward,
      address.district,
      address.city
    ].filter(Boolean);
    
    return parts.length > 0 ? parts.join(', ') : 'Địa chỉ không hợp lệ';
  };

  const getCurrentAddressDisplay = () => {
    console.log('🔍 Debug order.address:', order.address);
    
    if (!order.address) return 'Chưa có địa chỉ';
    
    const addressData = order.address as any;
    
    // Handle snapshot address (isSnapshot: true)
    if (addressData.isSnapshot) {
      console.log('🔍 Address is snapshot, full object:', addressData);
      
      // Extract address fields from snapshot
      const parts = [
        addressData.addressLine || addressData.address || addressData.street,
        addressData.ward,
        addressData.district, 
        addressData.city
      ].filter(Boolean);
      
      return parts.length > 0 ? parts.join(', ') : 'Địa chỉ snapshot không hợp lệ';
    }
    
    // Handle regular address object
    if (typeof order.address === 'string') {
      return order.address;
    }
    
    return formatAddress(order.address);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className={styles.modal}>
      <div className={styles.modalHeader}>
        <h3 className={styles.modalTitle}>
          <FaMapMarkerAlt className={styles.titleIcon} />
          Chọn địa chỉ giao hàng
        </h3>
        <button onClick={onClose} className={styles.closeButton}>
          <FaTimes />
        </button>
      </div>

      <div className={styles.modalContent}>
        <div className={styles.orderInfo}>
          <p className={styles.orderCode}>Đơn hàng: {order.orderCode}</p>
          <p className={styles.currentAddress}>
            <strong>Địa chỉ hiện tại:</strong> {getCurrentAddressDisplay()}
          </p>
        </div>

        {isLoading ? (
          <div className={styles.loading}>Đang tải địa chỉ...</div>
        ) : addresses.length === 0 ? (
          <div className={styles.noAddresses}>
            <p>Bạn chưa có địa chỉ nào.</p>
            <p>Vui lòng thêm địa chỉ mới trong trang hồ sơ.</p>
          </div>
        ) : (
          <div className={styles.addressList}>
            <h4 className={styles.sectionTitle}>Chọn địa chỉ mới:</h4>
            {addresses.map((address) => {
              const addressData = order.address as any;
              const isCurrentAddress = !addressData?.isSnapshot && address._id === order.address?._id;
              
              return (
                <div
                  key={address._id}
                  className={`${styles.addressItem} ${
                    selectedAddressId === address._id ? styles.selected : ''
                  } ${isCurrentAddress ? styles.current : ''}`}
                  onClick={() => setSelectedAddressId(address._id)}
                >
                  <div className={styles.addressContent}>
                    <div className={styles.addressInfo}>
                      <p className={styles.recipientName}>{address.fullName}</p>
                      <p className={styles.recipientPhone}>{address.phone}</p>
                      <p className={styles.addressText}>{formatAddress(address)}</p>
                    </div>
                    <div className={styles.addressStatus}>
                      {isCurrentAddress && (
                        <span className={styles.currentBadge}>Hiện tại</span>
                      )}
                      {selectedAddressId === address._id && (
                        <FaCheck className={styles.checkIcon} />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className={styles.modalActions}>
        <Button
          variant="outline"
          onClick={onClose}
          disabled={isUpdating}
        >
          Hủy
        </Button>
        <Button
          variant="primary"
          onClick={handleUpdateAddress}
          disabled={isUpdating || !selectedAddressId || (!((order.address as any)?.isSnapshot) && selectedAddressId === order.address?._id)}
        >
          {isUpdating ? 'Đang cập nhật...' : 'Cập nhật địa chỉ'}
        </Button>
      </div>
    </Modal>
  );
};

export default AddressSelectionModal;
