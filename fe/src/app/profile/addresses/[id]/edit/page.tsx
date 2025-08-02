'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { FaMapMarkerAlt, FaSave, FaTimes } from 'react-icons/fa';
import { Button, PageHeader, LoadingSpinner } from '@/app/components/ui';
import { useApiNotification } from '@/hooks/useApiNotification';
import { userService } from '@/services/userService';
import { CreateAddressRequest, Address } from '@/types';
import styles from '../../AddressForm.module.css';

interface AddressFormData {
  fullName: string;
  phone: string;
  streetAddress: string;
  ward: string;
  district: string;
  city: string;
  isDefault: boolean;
}

export default function EditAddressPage() {
  const router = useRouter();
  const params = useParams();
  const { showSuccess, showError } = useApiNotification();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  const [formData, setFormData] = useState<AddressFormData>({
    fullName: '',
    phone: '',
    streetAddress: '',
    ward: '',
    district: '',
    city: '',
    isDefault: false
  });

  // Fetch existing address data
  useEffect(() => {
    if (params.id) {
      fetchAddressData();
    }
  }, [params.id]);

  const fetchAddressData = async () => {
    try {
      setInitialLoading(true);
      const addresses = await userService.getUserAddresses();
      const address = addresses.find((addr: Address) => addr._id === params.id);
      
      if (!address) {
        showError('Không tìm thấy địa chỉ');
        router.push('/profile?section=addresses');
        return;
      }

      setFormData({
        fullName: address.fullName,
        phone: address.phone,
        streetAddress: address.addressLine,
        ward: address.ward,
        district: address.district,
        city: address.city,
        isDefault: address.isDefault
      });
    } catch (error: any) {
      showError('Không thể tải thông tin địa chỉ', error);
      router.push('/profile?section=addresses');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.fullName.trim()) {
      showError('Vui lòng nhập họ tên');
      return;
    }
    
    if (!formData.phone.trim()) {
      showError('Vui lòng nhập số điện thoại');
      return;
    }
    
    if (!validatePhone(formData.phone.trim())) {
      showError('Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam đúng định dạng');
      return;
    }
    
    if (!formData.streetAddress.trim()) {
      showError('Vui lòng nhập địa chỉ');
      return;
    }
    
    if (!formData.ward.trim()) {
      showError('Vui lòng nhập phường/xã');
      return;
    }
    
    if (!formData.district.trim()) {
      showError('Vui lòng nhập quận/huyện');
      return;
    }
    
    if (!formData.city.trim()) {
      showError('Vui lòng nhập tỉnh/thành phố');
      return;
    }

    try {
      setLoading(true);
      
      const addressRequest: Partial<CreateAddressRequest> = {
        fullName: formData.fullName,
        phone: formData.phone,
        addressLine: formData.streetAddress,
        ward: formData.ward,
        district: formData.district,
        city: formData.city,
        isDefault: formData.isDefault
      };

      await userService.updateUserAddress(params.id as string, addressRequest);
      showSuccess('Cập nhật địa chỉ thành công');
      router.push('/profile?section=addresses');
    } catch (error: any) {
      showError('Cập nhật địa chỉ thất bại', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/profile?section=addresses');
  };

  // Phone validation function
  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
    return phoneRegex.test(phone);
  };

  if (initialLoading) {
    return (
      <div className="container">
        <div className={styles.pageContainer}>
          <div className={styles.loadingContainer}>
            <LoadingSpinner />
            <p>Đang tải thông tin địa chỉ...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className={styles.pageContainer}>
        {/* Page Header */}
        <PageHeader
          title="Chỉnh sửa địa chỉ"
          subtitle="Cập nhật thông tin địa chỉ giao hàng"
          icon={FaMapMarkerAlt}
          breadcrumbs={[
            { label: 'Trang chủ', href: '/' },
            { label: 'Tài khoản', href: '/profile' },
            { label: 'Địa chỉ', href: '/profile?section=addresses' },
            { label: 'Chỉnh sửa', href: `/profile/addresses/${params.id}/edit` }
          ]}
          backLink={{
            href: '/profile?section=addresses',
            label: 'Quay lại'
          }}
        />

        {/* Main Content */}
        <div className={styles.mainContent}>
          <div className="row">
            <div className="col-8 offset-2">
              <div className={styles.formCard}>
                <form onSubmit={handleSubmit} className={styles.addressForm}>
                  <div className={styles.formSection}>
                    <h3 className={styles.sectionTitle}>Thông tin liên hệ</h3>
                    
                    <div className={styles.formGrid}>
                      <div className={styles.formGroup}>
                        <label htmlFor="fullName" className={styles.label}>
                          Họ và tên <span className={styles.required}>*</span>
                        </label>
                        <input
                          type="text"
                          id="fullName"
                          name="fullName"
                          value={formData.fullName}
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
                          value={formData.phone}
                          onChange={handleInputChange}
                          className={styles.input}
                          placeholder="Nhập số điện thoại"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className={styles.formSection}>
                    <h3 className={styles.sectionTitle}>Địa chỉ giao hàng</h3>
                    
                    <div className={styles.formGrid}>
                      <div className={styles.formGroup + ' ' + styles.fullWidth}>
                        <label htmlFor="streetAddress" className={styles.label}>
                          Địa chỉ <span className={styles.required}>*</span>
                        </label>
                        <input
                          type="text"
                          id="streetAddress"
                          name="streetAddress"
                          value={formData.streetAddress}
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
                          value={formData.ward}
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
                          value={formData.district}
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
                          value={formData.city}
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
                          checked={formData.isDefault}
                          onChange={handleInputChange}
                          className={styles.checkbox}
                        />
                        <span className={styles.checkboxText}>Đặt làm địa chỉ mặc định</span>
                      </label>
                    </div>
                  </div>

                  <div className={styles.formActions}>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                      disabled={loading}
                      className={styles.cancelButton}
                    >
                      <FaTimes className={styles.buttonIcon} />
                      Hủy
                    </Button>
                    
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={loading}
                      className={styles.submitButton}
                    >
                      {loading ? (
                        <>
                          <LoadingSpinner size="sm" />
                          Đang cập nhật...
                        </>
                      ) : (
                        <>
                          <FaSave className={styles.buttonIcon} />
                          Cập nhật địa chỉ
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
