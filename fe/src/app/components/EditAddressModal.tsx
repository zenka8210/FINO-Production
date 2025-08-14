'use client';

import { useState, useEffect } from 'react';
import { FaTimes, FaEdit, FaMapMarkerAlt } from 'react-icons/fa';
import { Button } from '@/app/components/ui';
import { useApiNotification } from '@/hooks';
import { userService } from '@/services';
import { Address } from '@/types';
import styles from './AddAddressModal.module.css'; // Reuse the same styles

interface EditAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEditSuccess: (updatedAddress: Address) => void;
  address: Address | null;
}

interface AddressForm {
  fullName: string;
  phone: string;
  streetAddress: string;
  ward: string;
  district: string;
  city: string;
  isDefault: boolean;
}

export default function EditAddressModal({ isOpen, onClose, onEditSuccess, address }: EditAddressModalProps) {
  const { showSuccess, showError } = useApiNotification();
  const [loading, setLoading] = useState(false);
  const [addressForm, setAddressForm] = useState<AddressForm>({
    fullName: '',
    phone: '',
    streetAddress: '',
    ward: '',
    district: '',
    city: '',
    isDefault: false
  });

  // Initialize form when address changes
  useEffect(() => {
    if (address && isOpen) {
      setAddressForm({
        fullName: address.fullName || '',
        phone: address.phone || '',
        streetAddress: address.addressLine || '',
        ward: address.ward || '',
        district: address.district || '',
        city: address.city || '',
        isDefault: address.isDefault || false
      });
    }
  }, [address, isOpen]);

  // Phone validation function
  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
    return phoneRegex.test(phone);
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setAddressForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!address) {
      showError('Không tìm thấy địa chỉ để chỉnh sửa');
      return;
    }
    
    // Validation
    if (!addressForm.fullName.trim()) {
      showError('Vui lòng nhập họ tên');
      return;
    }
    
    if (!addressForm.phone.trim()) {
      showError('Vui lòng nhập số điện thoại');
      return;
    }
    
    if (!validatePhone(addressForm.phone.trim())) {
      showError('Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam đúng định dạng');
      return;
    }
    
    if (!addressForm.streetAddress.trim()) {
      showError('Vui lòng nhập địa chỉ');
      return;
    }
    
    if (!addressForm.ward.trim()) {
      showError('Vui lòng nhập phường/xã');
      return;
    }
    
    if (!addressForm.district.trim()) {
      showError('Vui lòng nhập quận/huyện');
      return;
    }
    
    if (!addressForm.city.trim()) {
      showError('Vui lòng nhập tỉnh/thành phố');
      return;
    }

    try {
      setLoading(true);
      
      const addressRequest = {
        fullName: addressForm.fullName,
        phone: addressForm.phone,
        addressLine: addressForm.streetAddress,
        ward: addressForm.ward,
        district: addressForm.district,
        city: addressForm.city,
        isDefault: addressForm.isDefault
      };

      const updatedAddress = await userService.updateUserAddress(address._id, addressRequest);
      
      showSuccess('Cập nhật địa chỉ thành công');
      onEditSuccess(updatedAddress);
      onClose();
      
    } catch (error: any) {
      showError('Cập nhật địa chỉ thất bại', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle close
  const handleClose = () => {
    // Reset form to original values
    if (address) {
      setAddressForm({
        fullName: address.fullName || '',
        phone: address.phone || '',
        streetAddress: address.addressLine || '',
        ward: address.ward || '',
        district: address.district || '',
        city: address.city || '',
        isDefault: address.isDefault || false
      });
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>
            <FaMapMarkerAlt className={styles.titleIcon} />
            <h3>Chỉnh sửa địa chỉ giao hàng</h3>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleClose}
            className={styles.closeButton}
          >
            <FaTimes />
          </Button>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.addressForm}>
          <div className={styles.formSection}>
            <h4 className={styles.formSectionTitle}>Thông tin liên hệ</h4>
            
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label htmlFor="fullName" className={styles.label}>
                  Họ và tên <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={addressForm.fullName}
                  onChange={handleInputChange}
                  className={styles.input}
                  placeholder="Nhập họ và tên"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="phone" className={styles.label}>
                  Số điện thoại <span className={styles.required}>*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={addressForm.phone}
                  onChange={handleInputChange}
                  className={styles.input}
                  placeholder="Nhập số điện thoại"
                  maxLength={11}
                  required
                />
              </div>
            </div>
          </div>

          <div className={styles.formSection}>
            <h4 className={styles.formSectionTitle}>Địa chỉ giao hàng</h4>
            
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label htmlFor="streetAddress" className={styles.label}>
                  Địa chỉ <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  id="streetAddress"
                  name="streetAddress"
                  value={addressForm.streetAddress}
                  onChange={handleInputChange}
                  className={styles.input}
                  placeholder="Số nhà, tên đường"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="ward" className={styles.label}>
                  Phường/Xã <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  id="ward"
                  name="ward"
                  value={addressForm.ward}
                  onChange={handleInputChange}
                  className={styles.input}
                  placeholder="Nhập phường/xã"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="district" className={styles.label}>
                  Quận/Huyện <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  id="district"
                  name="district"
                  value={addressForm.district}
                  onChange={handleInputChange}
                  className={styles.input}
                  placeholder="Nhập quận/huyện"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="city" className={styles.label}>
                  Tỉnh/Thành phố <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={addressForm.city}
                  onChange={handleInputChange}
                  className={styles.input}
                  placeholder="Nhập tỉnh/thành phố"
                  required
                />
              </div>
            </div>
          </div>

          <div className={styles.formSection}>
            <div className={styles.checkboxGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="isDefault"
                  checked={addressForm.isDefault}
                  onChange={handleInputChange}
                  className={styles.checkbox}
                />
                <span className={styles.checkboxText}>Đặt làm địa chỉ mặc định</span>
              </label>
              <small className={styles.helpText}>
                Địa chỉ mặc định sẽ được sử dụng cho các đơn hàng tiếp theo
              </small>
            </div>
          </div>

          <div className={styles.formActions}>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className={styles.submitButton}
            >
              <FaEdit className={styles.buttonIcon} />
              {loading ? 'Đang cập nhật...' : 'Cập nhật địa chỉ'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
