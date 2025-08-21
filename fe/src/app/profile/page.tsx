'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, useCart } from '@/contexts';
import { useApiNotification, useOrders } from '@/hooks';
import { Button, PageHeader, LoadingSpinner, OrderDetailButton, OrderReviewModal } from '@/app/components/ui';
import AddAddressModal from '@/app/components/AddAddressModal';
import EditAddressModal from '@/app/components/EditAddressModal';
import { userService } from '@/services/userService';
import { orderService } from '@/services/orderService';
import { reviewService } from '@/services/reviewService';
import { User, Address, OrderWithRefs } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { FaUser, FaMapMarkerAlt, FaShoppingBag, FaLock, FaChartBar, FaSignOutAlt, FaEdit, FaSave, FaTimes, FaPlus, FaTrash, FaHome, FaEye, FaClock, FaCheckCircle, FaTruck, FaTimesCircle, FaShoppingCart, FaStar } from 'react-icons/fa';
import styles from './ProfilePage.module.css';

// Profile sections
type ProfileSection = 'overview' | 'personal-info' | 'addresses' | 'orders' | 'security';

interface ProfileFormData {
  name: string;
  phone: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface AddressFormData {
  fullName: string;
  phone: string;
  streetAddress: string;
  ward: string;
  district: string;
  city: string;
  isDefault: boolean;
}

function ProfilePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, logout, isLoading: authLoading } = useAuth();
  const { loadCart } = useCart();
  const { showSuccess, showError, handleApiResponse } = useApiNotification();
  const { cancelOrder } = useOrders();

  // States
  const [activeSection, setActiveSection] = useState<ProfileSection>('overview');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sectionChanging, setSectionChanging] = useState(false);
  
  // Form states
  const [profileForm, setProfileForm] = useState<ProfileFormData>({
    name: '',
    phone: ''
  });
  const [passwordForm, setPasswordForm] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [addressForm, setAddressForm] = useState<AddressFormData>({
    fullName: '',
    phone: '',
    streetAddress: '',
    ward: '',
    district: '',
    city: '',
    isDefault: false
  });
  
  // Data states
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<OrderWithRefs[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [addressesKey, setAddressesKey] = useState(0); // Force re-render key
  
  // Modal states
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedOrderForReview, setSelectedOrderForReview] = useState<OrderWithRefs | null>(null);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [selectedAddressForEdit, setSelectedAddressForEdit] = useState<Address | null>(null);
  
  // Review states
  const [reviewedOrders, setReviewedOrders] = useState<Set<string>>(new Set());

  // Redirect if not authenticated
  useEffect(() => {
    // Wait for auth loading to complete before checking authentication
    if (!authLoading && !user) {
      router.push('/login?redirect=/profile');
      return;
    }
    
    // Only proceed if user is authenticated
    if (user) {
      fetchUserProfile();
      fetchAddresses(); // Always fetch addresses for overview
    }
  }, [user, router, authLoading]);

  // Separate useEffect to handle URL parameter changes and fetch orders accordingly
  useEffect(() => {
    setSectionChanging(true);
    const section = searchParams.get('section') as ProfileSection;
    if (section && ['overview', 'personal-info', 'addresses', 'orders', 'security'].includes(section)) {
      setActiveSection(section);
    } else {
      setActiveSection('overview');
    }
    
    // Fetch orders based on section
    if (user) {
      if (section === 'orders') {
        fetchOrders(10); // Get 10 most recent orders for orders section
      } else {
        fetchOrders(3); // Get only 3 for overview
      }
    }
    
    // Add a small delay to show smooth transition
    const timer = setTimeout(() => {
      setSectionChanging(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchParams, user]);

  // Fetch user profile data
  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const profile = await userService.getCurrentUserProfile();
      setUserProfile(profile);
      setProfileForm({
        name: profile.name || '',
        phone: profile.phone || ''
      });
    } catch (error: any) {
      showError('Không thể tải thông tin profile', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user addresses
  const fetchAddresses = async () => {
    try {
      console.log('🔄 Fetching addresses from server...');
      const userAddresses = await userService.getUserAddresses();
      console.log('📦 Received addresses:', userAddresses.map(addr => ({
        name: addr.fullName,
        isDefault: addr.isDefault,
        id: addr._id.slice(-4)
      })));
      setAddresses(userAddresses);
      setAddressesKey(prev => prev + 1); // Force re-render
      console.log('✅ Addresses state updated');
    } catch (error: any) {
      console.error('❌ Error fetching addresses:', error);
      showError('Không thể tải danh sách địa chỉ', error);
    }
  };

  // Fetch user orders (3 most recent for overview, 10 most recent for orders section)
  const fetchOrders = async (limitOrders = 3) => {
    try {
      setOrdersLoading(true);
      
      // Get orders - limited for both overview and orders section
      const queryParams = { page: 1, limit: limitOrders };
      const response = await orderService.getUserOrders(queryParams);
      
      // Handle different response structures
      let ordersData = [];
      if (Array.isArray(response)) {
        ordersData = response;
      } else if ((response as any)?.data?.documents && Array.isArray((response as any).data.documents)) {
        ordersData = (response as any).data.documents;
      } else if (response?.data && Array.isArray(response.data)) {
        ordersData = response.data;
      } else if ((response as any)?.orders && Array.isArray((response as any).orders)) {
        ordersData = (response as any).orders;
      } else if ((response as any)?.message?.data && Array.isArray((response as any).message.data)) {
        ordersData = (response as any).message.data;
      } else {
        console.warn('⚠️ Unexpected orders response structure:', response);
        ordersData = [];
      }
      
      setOrders(ordersData);
      
      // Check review status for all orders after loading
      if (ordersData.length > 0) {
        await checkOrderReviewStatus(ordersData);
      }
    } catch (error: any) {
      console.error('❌ Error fetching orders:', error);
      setOrders([]); // Set empty array on error
      // Don't show error for orders if it's just authentication issue
      if (error.message && !error.message.includes('Unauthorized')) {
        showError('Không thể tải lịch sử đơn hàng', error);
      }
    } finally {
      setOrdersLoading(false);
    }
  };

  // Handle profile update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.name.trim()) {
      showError('Tên không được để trống');
      return;
    }

    // Phone validation
    if (profileForm.phone.trim()) {
      const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
      if (!phoneRegex.test(profileForm.phone.trim())) {
        showError('Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam đúng định dạng');
        return;
      }
    }

    try {
      setLoading(true);
      const updatedProfile = await userService.updateCurrentUserProfile(profileForm);
      setUserProfile(updatedProfile);
      setIsEditingProfile(false);
      showSuccess('Cập nhật thông tin thành công');
    } catch (error: any) {
      showError('Cập nhật thông tin thất bại', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle password change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      showError('Vui lòng điền đầy đủ thông tin');
      return;
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showError('Mật khẩu xác nhận không khớp');
      return;
    }
    
    if (passwordForm.newPassword.length < 8) {
      showError('Mật khẩu mới phải có ít nhất 8 ký tự');
      return;
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      showError('Mật khẩu mới phải khác với mật khẩu hiện tại');
      return;
    }

    try {
      setLoading(true);
      await userService.changeCurrentUserPassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      );
      
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setIsChangingPassword(false);
      showSuccess('Đổi mật khẩu thành công');
    } catch (error: any) {
      // Handle specific error messages from backend
      const errorMessage = error.response?.data?.message || error.message || 'Đổi mật khẩu thất bại';
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete address
  const handleDeleteAddress = async (addressId: string) => {
    // Find the address to check if it's default
    const addressToDelete = addresses.find(addr => addr._id === addressId);
    
    if (addressToDelete?.isDefault) {
      showError('Không thể xóa địa chỉ mặc định. Vui lòng chọn địa chỉ khác làm mặc định trước khi xóa.');
      return;
    }
    
    if (!confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) return;

    try {
      await userService.deleteUserAddress(addressId);
      // Refetch all addresses to ensure state consistency
      await fetchAddresses();
      showSuccess('Xóa địa chỉ thành công');
    } catch (error: any) {
      // Handle specific error messages from backend
      if (error.response?.status === 400 && error.response?.data?.message?.includes('mặc định')) {
        showError('Không thể xóa địa chỉ mặc định. Vui lòng chọn địa chỉ khác làm mặc định trước khi xóa.');
      } else {
        showError('Xóa địa chỉ thất bại', error);
      }
    }
  };

  // Handle set default address
  const handleSetDefaultAddress = async (addressId: string) => {
    try {
      await userService.setDefaultUserAddress(addressId);
      // Refetch all addresses from server to ensure accurate isDefault states
      await fetchAddresses();
      showSuccess('Đặt địa chỉ mặc định thành công');
    } catch (error: any) {
      showError('Đặt địa chỉ mặc định thất bại', error);
    }
  };

  // Handle edit address button click
  const handleEditAddressClick = (address: Address) => {
    setSelectedAddressForEdit(address);
    setIsEditingAddress(true);
  };

  // Handle edit address success
  const handleEditAddressSuccess = (updatedAddress: Address) => {
    setAddresses(prev => prev.map(addr => 
      addr._id === updatedAddress._id ? updatedAddress : addr
    ));
    setIsEditingAddress(false);
    setSelectedAddressForEdit(null);
  };

  // Handle close edit address modal
  const handleCloseEditAddress = () => {
    setIsEditingAddress(false);
    setSelectedAddressForEdit(null);
  };

  // Handle add new address
  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    
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

      const newAddress = await userService.addUserAddress(addressRequest);
      console.log('🆕 New address created:', newAddress);
      
      // Refetch all addresses from server to ensure accurate isDefault states
      // This prevents showing multiple "Mặc định" badges temporarily
      console.log('🔄 Refetching addresses after add...');
      await fetchAddresses();
      console.log('✅ Addresses refetched, current count:', addresses.length);
      
      // Reset form
      setAddressForm({
        fullName: '',
        phone: '',
        streetAddress: '',
        ward: '',
        district: '',
        city: '',
        isDefault: false
      });
      setIsAddingAddress(false);
      
      showSuccess('Thêm địa chỉ thành công');
    } catch (error: any) {
      showError('Thêm địa chỉ thất bại', error);
    } finally {
      setLoading(false);
    }
  };

  // Phone validation function
  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
    return phoneRegex.test(phone);
  };

  // Handle address input change
  const handleAddressInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setAddressForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  // Profile navigation items
  const navigationItems = [
    { id: 'overview' as ProfileSection, label: 'Tổng quan', icon: <FaChartBar /> },
    { id: 'personal-info' as ProfileSection, label: 'Thông tin cá nhân', icon: <FaUser /> },
    { id: 'addresses' as ProfileSection, label: 'Địa chỉ', icon: <FaMapMarkerAlt /> },
    { id: 'orders' as ProfileSection, label: 'Đơn hàng', icon: <FaShoppingBag /> },
    { id: 'security' as ProfileSection, label: 'Bảo mật', icon: <FaLock /> }
  ];

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get order status badge class
  const getOrderStatusClass = (status: string) => {
    const statusClasses: Record<string, string> = {
      'pending': styles.statusPending,
      'processing': styles.statusProcessing,
      'shipped': styles.statusShipped,
      'delivered': styles.statusDelivered,
      'cancelled': styles.statusCancelled
    };
    return statusClasses[status] || styles.statusDefault;
  };

  // Get Vietnamese order status text
  const getOrderStatusText = (status: string) => {
    const statusTexts: Record<string, string> = {
      'pending': 'Chờ xác nhận',
      'processing': 'Đang xử lý',
      'shipped': 'Đã gửi hàng',
      'delivered': 'Đã giao',
      'cancelled': 'Đã hủy'
    };
    return statusTexts[status] || status;
  };

  // Handle reorder functionality
  const handleReorder = async (order: OrderWithRefs) => {
    try {
      setLoading(true);
      
      // Prepare items for batch add to cart
      const items = order.items?.map((item: any) => ({
        productVariant: item.productVariant?._id,
        quantity: item.quantity
      })).filter(item => item.productVariant) || [];

      if (items.length === 0) {
        showError('Không tìm thấy sản phẩm hợp lệ trong đơn hàng');
        return;
      }

      // Use batch add to cart (will update quantities if items already exist)
      const cartService = await import('@/services/cartService');
      const result = await cartService.CartService.getInstance().batchAddToCart(items);
      
      if (result.errorCount > 0) {
        showError(`Đã thêm ${result.successCount} sản phẩm. ${result.errorCount} sản phẩm không thể thêm.`);
      } else {
        showSuccess(`Đã thêm ${result.successCount} sản phẩm vào giỏ hàng`);
      }
      
      // Refresh cart context to ensure data is up to date
      await loadCart();
      
      // Redirect to cart page
      router.push('/cart');
    } catch (error) {
      showError('Không thể thêm sản phẩm vào giỏ hàng', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle review order functionality
  const handleReviewOrder = (order: OrderWithRefs) => {
    setSelectedOrderForReview(order);
    setReviewModalOpen(true);
  };

  // Handle review modal close
  const handleReviewModalClose = () => {
    setReviewModalOpen(false);
    setSelectedOrderForReview(null);
  };

  // Handle review success
  const handleReviewSuccess = () => {
    // Add the reviewed order to the set
    if (selectedOrderForReview) {
      setReviewedOrders(prev => new Set([...prev, selectedOrderForReview._id]));
    }
  };

  // Handle cancel order
  const handleCancelOrder = async (orderId: string) => {
    try {
      setLoading(true);
      console.log('Cancel order:', orderId);
      
      // Call the cancel order API
      await cancelOrder(orderId);
      
      // Show success message
      showSuccess('Đơn hàng đã được hủy thành công');
      
      // Refresh orders list
      await fetchOrders();
      
    } catch (error: any) {
      console.error('Error cancelling order:', error);
      showError('Không thể hủy đơn hàng', error);
    } finally {
      setLoading(false);
    }
  };

  // Check if order has been reviewed
  const checkOrderReviewStatus = async (orders: OrderWithRefs[]) => {
    try {
      const reviewPromises = orders
        .filter(order => order.status === 'delivered')
        .map(async (order) => {
          try {
            // Check each product in the order
            const productPromises = order.items?.map(async (item: any) => {
              try {
                const result = await reviewService.canReviewProduct(item.productVariant?.product?._id);
                return { orderId: order._id, canReview: result.canReview };
              } catch {
                return { orderId: order._id, canReview: true }; // Default to can review if check fails
              }
            }) || [];
            
            const results = await Promise.all(productPromises);
            // If any product can't be reviewed, consider order as reviewed
            const canReviewOrder = results.some(r => r.canReview);
            return { orderId: order._id, isReviewed: !canReviewOrder };
          } catch {
            return { orderId: order._id, isReviewed: false };
          }
        });

      const reviewStatuses = await Promise.all(reviewPromises);
      const reviewedOrderIds = reviewStatuses
        .filter(status => status.isReviewed)
        .map(status => status.orderId);
      
      setReviewedOrders(new Set(reviewedOrderIds));
    } catch (error) {
      console.error('Error checking review status:', error);
    }
  };

  // Check if specific order is reviewed
  const isOrderReviewed = (orderId: string) => {
    return reviewedOrders.has(orderId);
  };

  // Show loading if auth is still loading or user not authenticated
  if (authLoading || !user || !userProfile) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.loadingContainer}>
          <LoadingSpinner />
          <p>{authLoading ? 'Đang xác thực...' : 'Đang tải thông tin...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className={styles.pageContainer}>
        {/* Page Header */}
        <PageHeader
          title="Tài khoản cá nhân"
          subtitle="Quản lý thông tin và cài đặt tài khoản của bạn"
          icon={FaUser}
          breadcrumbs={[
            { label: 'Trang chủ', href: '/' },
            { label: 'Tài khoản', href: '/profile' }
          ]}
        />

        {/* Main Content */}
        <div className={styles.mainContent}>
          <div className="row">
            {/* Sidebar Navigation */}
            <div className="col-3">
              <div className={styles.sidebarCard}>
                {/* User Info Section */}
                <div className={styles.userInfoSection}>
                  <div className={styles.userAvatar}>
                    <span className={styles.avatarText}>
                      {userProfile.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className={styles.userDetails}>
                    <h3 className={styles.userName}>{userProfile.name || 'Người dùng'}</h3>
                    <p className={styles.userEmail}>{userProfile.email}</p>
                    <span className={`${styles.userRole} ${userProfile.role === 'admin' ? styles.roleAdmin : styles.roleCustomer}`}>
                      <FaUser className={styles.roleIcon} />
                      {userProfile.role === 'admin' ? 'Quản trị viên' : 'Khách hàng'}
                    </span>
                  </div>
                  <div className={styles.userActions}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        logout();
                        router.push('/');
                      }}
                      className={styles.logoutButton}
                    >
                      <FaSignOutAlt className={styles.buttonIcon} />
                      Đăng xuất
                    </Button>
                  </div>
                </div>

                {/* Navigation Menu */}
                <nav className={styles.navigationMenu}>
                  <h3 className={styles.navTitle}>Quản lý tài khoản</h3>
                  {navigationItems.map((item) => (
                    <button
                      key={item.id}
                      className={`${styles.navItem} ${activeSection === item.id ? styles.navItemActive : ''}`}
                      onClick={() => {
                        router.push(`/profile?section=${item.id}`);
                      }}
                    >
                      <span className={styles.navIcon}>{item.icon}</span>
                      <span className={styles.navLabel}>{item.label}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="col-9">
              <div className={styles.contentCard} style={{ position: 'relative' }}>
                {/* Loading overlay for section changes */}
                {sectionChanging && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(255, 255, 255, 0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10,
                    borderRadius: '12px'
                  }}>
                    <LoadingSpinner size="md" />
                  </div>
                )}
                
                {/* Overview Section */}
                {activeSection === 'overview' && (
                  <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                      <h2 className={styles.sectionTitle}>
                        <FaChartBar className={styles.sectionIcon} />
                        Tổng quan tài khoản
                      </h2>
                      <p className={styles.sectionSubtitle}>Thông tin tóm tắt về tài khoản của bạn</p>
                    </div>

              <div className={styles.overviewGrid}>
                <div className={styles.overviewCard} onClick={() => router.push('/profile?section=personal-info')}>
                  <div className={styles.cardIcon}>
                    <FaUser />
                  </div>
                  <div className={styles.cardContent}>
                    <h3>Thông tin cá nhân</h3>
                    <p>{userProfile.name || 'Chưa cập nhật'}</p>
                    <small>{userProfile.phone || 'Chưa có số điện thoại'}</small>
                  </div>
                  <Button variant="ghost" size="sm">
                    Chỉnh sửa
                  </Button>
                </div>

                <div className={styles.overviewCard} onClick={() => router.push('/profile?section=addresses')}>
                  <div className={styles.cardIcon}>
                    <FaMapMarkerAlt />
                  </div>
                  <div className={styles.cardContent}>
                    <h3>Địa chỉ</h3>
                    <p>{addresses.length} địa chỉ đã lưu</p>
                    <small>{addresses.find(addr => addr.isDefault)?.city || 'Chưa có địa chỉ mặc định'}</small>
                  </div>
                  <Button variant="ghost" size="sm">
                    Xem tất cả
                  </Button>
                </div>

                <div className={styles.overviewCard} onClick={() => router.push('/orders')}>
                  <div className={styles.cardIcon}>
                    <FaShoppingBag />
                  </div>
                  <div className={styles.cardContent}>
                    <h3>Đơn hàng</h3>
                    <p>{orders.length} đơn hàng gần đây</p>
                    <small>Lịch sử mua sắm của bạn</small>
                  </div>
                  <Button variant="ghost" size="sm">
                    Xem tất cả
                  </Button>
                </div>

                <div className={styles.overviewCard} onClick={() => router.push('/profile?section=security')}>
                  <div className={styles.cardIcon}>
                    <FaLock />
                  </div>
                  <div className={styles.cardContent}>
                    <h3>Bảo mật</h3>
                    <p>Tài khoản được bảo vệ</p>
                    <small>Cập nhật lần cuối: {formatDate(userProfile.updatedAt)}</small>
                  </div>
                  <Button variant="ghost" size="sm">
                    Cài đặt
                  </Button>
                </div>
              </div>

              {/* Recent Orders Section in Overview */}
              <div className={styles.recentOrdersSection}>
                <div className={styles.sectionHeader}>
                  <h3 className={styles.sectionTitle}>
                    <FaShoppingBag className={styles.sectionIcon} />
                    Đơn hàng gần đây
                  </h3>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => router.push('/orders')}
                  >
                    Xem tất cả
                  </Button>
                </div>

                <div className={styles.ordersContainer}>
                  {ordersLoading ? (
                    <div className={styles.loadingState}>
                      <LoadingSpinner size="md" />
                      <p>Đang tải đơn hàng...</p>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className={styles.emptyState}>
                      <div className={styles.emptyIcon}>
                        <FaShoppingBag />
                      </div>
                      <h3>Chưa có đơn hàng nào</h3>
                      <p>Bạn chưa có đơn hàng nào. Hãy bắt đầu mua sắm ngay!</p>
                      <Button variant="primary" onClick={() => router.push('/products')}>
                        <FaShoppingBag className={styles.buttonIcon} />
                        Bắt đầu mua sắm
                      </Button>
                    </div>
                  ) : (
                    <div className={styles.ordersList}>
                      {orders.slice(0, 3).map((order) => (
                        <div key={order._id} className={styles.orderCard}>
                          <div className={styles.orderHeader}>
                            <div className={styles.orderInfo}>
                              <h4 className={styles.orderCode}>#{order.orderCode}</h4>
                              <div className={styles.orderMeta}>
                                <span className={styles.orderDate}>
                                  <FaClock className={styles.metaIcon} />
                                  {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                                </span>
                                <span className={`${styles.orderStatus} ${styles[`status${order.status.charAt(0).toUpperCase() + order.status.slice(1)}`]}`}>
                                  {order.status === 'pending' && <FaClock className={styles.statusIcon} />}
                                  {order.status === 'processing' && <FaTruck className={styles.statusIcon} />}
                                  {order.status === 'shipped' && <FaTruck className={styles.statusIcon} />}
                                  {order.status === 'delivered' && <FaCheckCircle className={styles.statusIcon} />}
                                  {order.status === 'cancelled' && <FaTimesCircle className={styles.statusIcon} />}
                                  {order.status === 'pending' && 'Chờ xác nhận'}
                                  {order.status === 'processing' && 'Đang xử lý'}
                                  {order.status === 'shipped' && 'Đã gửi hàng'}
                                  {order.status === 'delivered' && 'Đã giao'}
                                  {order.status === 'cancelled' && 'Đã hủy'}
                                </span>
                              </div>
                            </div>
                            <div className={styles.orderTotal}>
                              <span className={styles.totalLabel}>Tổng tiền:</span>
                              <span className={styles.totalAmount}>{formatCurrency(order.finalTotal || 0)}</span>
                            </div>
                          </div>
                          
                          <div className={styles.orderItems}>
                            {order.items?.slice(0, 2).map((item: any, index: number) => (
                              <div key={index} className={styles.orderItem}>
                                <div className={styles.itemInfo}>
                                  <span className={styles.itemName}>
                                    {item.productVariant?.product?.name || item.productName}
                                  </span>
                                  <span className={styles.itemDetails}>
                                    Số lượng: {item.quantity} • {formatCurrency(item.price)}
                                  </span>
                                </div>
                              </div>
                            ))}
                            {(order.items?.length || 0) > 2 && (
                              <div className={styles.moreItems}>
                                +{(order.items?.length || 0) - 2} sản phẩm khác
                              </div>
                            )}
                          </div>

                          <div className={styles.orderActions}>
                            <OrderDetailButton 
                              orderId={order._id}
                              variant="outline"
                              size="sm"
                            >
                              <FaEye className={styles.buttonIcon} />
                              Xem chi tiết
                            </OrderDetailButton>
                            
                            {order.status === 'pending' && (
                              <Button
                                variant="outline"
                                size="sm"
                                className={styles.cancelButton}
                                onClick={() => {
                                  if (confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) {
                                    // Handle cancel order
                                    console.log('Cancel order:', order._id);
                                  }
                                }}
                              >
                                <FaTimesCircle className={styles.buttonIcon} />
                                Hủy đơn
                              </Button>
                            )}
                            
                            {/* Nút Đánh giá cho đơn hàng đã giao */}
                            {order.status === 'delivered' && (
                              <Button
                                variant="outline"
                                size="sm"
                                className={styles.reviewButton}
                                onClick={() => isOrderReviewed(order._id) ? undefined : handleReviewOrder(order)}
                                disabled={isOrderReviewed(order._id)}
                              >
                                <FaStar className={styles.buttonIcon} />
                                {isOrderReviewed(order._id) ? 'Đã đánh giá' : 'Đánh giá'}
                              </Button>
                            )}
                            
                            {/* Nút Mua lại - LUÔN Ở CUỐI (bên phải ngoài cùng) */}
                            <Button
                              variant="primary"
                              size="sm"
                              className={styles.reorderButton}
                              onClick={() => handleReorder(order)}
                              disabled={loading}
                            >
                              <FaShoppingCart className={styles.buttonIcon} />
                              Mua lại
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      {orders.length > 3 && (
                        <div className={styles.viewMoreContainer}>
                          <Button 
                            variant="outline"
                            onClick={() => router.push('/orders')}
                          >
                            Xem thêm {orders.length - 3} đơn hàng
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

                {/* Personal Info Section */}
                {activeSection === 'personal-info' && (
                  <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                      <h2 className={styles.sectionTitle}>
                        <FaUser className={styles.sectionIcon} />
                        Thông tin cá nhân
                      </h2>
                      <p className={styles.sectionSubtitle}>Cập nhật thông tin liên hệ của bạn</p>
                    </div>

              <div className={styles.formContainer}>
                <form onSubmit={handleUpdateProfile} className={styles.profileForm}>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Email *</label>
                      <input
                        type="email"
                        value={userProfile.email}
                        disabled
                        className={`${styles.input} ${styles.inputDisabled}`}
                      />
                      <small className={styles.helpText}>Email không thể thay đổi</small>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Vai trò</label>
                      <input
                        type="text"
                        value={userProfile.role === 'admin' ? 'Quản trị viên' : 'Khách hàng'}
                        disabled
                        className={`${styles.input} ${styles.inputDisabled}`}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Họ và tên *</label>
                      <input
                        type="text"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                        disabled={!isEditingProfile}
                        className={styles.input}
                        placeholder="Nhập họ và tên"
                        required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Số điện thoại</label>
                      <input
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                        disabled={!isEditingProfile}
                        className={styles.input}
                        placeholder="Nhập số điện thoại"
                        maxLength={11}
                      />
                    </div>
                  </div>

                  <div className={styles.formActions}>
                    {!isEditingProfile ? (
                      <Button variant="primary" onClick={() => setIsEditingProfile(true)} type="button">
                        <FaEdit className={styles.buttonIcon} />
                        Chỉnh sửa thông tin
                      </Button>
                    ) : (
                      <div className={styles.actionButtons}>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsEditingProfile(false);
                            setProfileForm({
                              name: userProfile.name || '',
                              phone: userProfile.phone || ''
                            });
                          }}
                          type="button"
                          disabled={loading}
                        >
                          <FaTimes className={styles.buttonIcon} />
                          Hủy
                        </Button>
                        <Button variant="primary" type="submit" disabled={loading}>
                          <FaSave className={styles.buttonIcon} />
                          {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </Button>
                      </div>
                    )}
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Addresses Section */}
          {activeSection === 'addresses' && (
                  <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                      <h2 className={styles.sectionTitle}>
                        <FaMapMarkerAlt className={styles.sectionIcon} />
                        Quản lý địa chỉ
                      </h2>
                      <p className={styles.sectionSubtitle}>Danh sách địa chỉ giao hàng của bạn</p>
                    </div>

              <div className={styles.addressesContainer}>
                <div className={styles.addressesHeader}>
                  {!isAddingAddress && (
                    <Button variant="primary" onClick={() => setIsAddingAddress(true)}>
                      <FaPlus className={styles.buttonIcon} />
                      Thêm địa chỉ mới
                    </Button>
                  )}
                </div>

                {/* Add New Address Form */}
                {isAddingAddress && (
                  <div className={styles.addressFormContainer}>
                    <div className={styles.formHeader}>
                      <h3 className={styles.formTitle}>Thêm địa chỉ mới</h3>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setIsAddingAddress(false);
                          setAddressForm({
                            fullName: '',
                            phone: '',
                            streetAddress: '',
                            ward: '',
                            district: '',
                            city: '',
                            isDefault: false
                          });
                        }}
                      >
                        <FaTimes />
                      </Button>
                    </div>
                    
                    <form onSubmit={handleAddAddress} className={styles.addressForm}>
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
                              onChange={handleAddressInputChange}
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
                              onChange={handleAddressInputChange}
                              className={styles.input}
                              placeholder="Nhập số điện thoại"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <div className={styles.formSection}>
                        <h4 className={styles.formSectionTitle}>Địa chỉ giao hàng</h4>
                        
                        <div className={styles.formGrid}>
                          <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                            <label htmlFor="streetAddress" className={styles.label}>
                              Địa chỉ <span className={styles.required}>*</span>
                            </label>
                            <input
                              type="text"
                              id="streetAddress"
                              name="streetAddress"
                              value={addressForm.streetAddress}
                              onChange={handleAddressInputChange}
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
                              onChange={handleAddressInputChange}
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
                              onChange={handleAddressInputChange}
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
                              onChange={handleAddressInputChange}
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
                              onChange={handleAddressInputChange}
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
                          onClick={() => {
                            setIsAddingAddress(false);
                            setAddressForm({
                              fullName: '',
                              phone: '',
                              streetAddress: '',
                              ward: '',
                              district: '',
                              city: '',
                              isDefault: false
                            });
                          }}
                          disabled={loading}
                        >
                          <FaTimes className={styles.buttonIcon} />
                          Hủy
                        </Button>
                        
                        <Button
                          type="submit"
                          variant="primary"
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <LoadingSpinner size="sm" />
                              Đang thêm...
                            </>
                          ) : (
                            <>
                              <FaSave className={styles.buttonIcon} />
                              Thêm địa chỉ
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </div>
                )}

                {addresses.length === 0 && !isAddingAddress ? (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>
                      <FaMapMarkerAlt />
                    </div>
                    <h3>Chưa có địa chỉ nào</h3>
                    <p>Thêm địa chỉ giao hàng để thuận tiện cho việc mua sắm</p>
                    <Button variant="primary" onClick={() => setIsAddingAddress(true)}>
                      <FaPlus className={styles.buttonIcon} />
                      Thêm địa chỉ đầu tiên
                    </Button>
                  </div>
                ) : (
                  <div className={styles.addressesList} key={`addresses-${addressesKey}`}>
                    {addresses.map((address) => (
                      <div key={`${address._id}-${addressesKey}`} className={`${styles.addressCard} ${address.isDefault ? styles.addressDefault : ''}`}>
                        <div className={styles.addressHeader}>
                          <div className={styles.addressTitle}>
                            <h4>{address.fullName}</h4>
                            {address.isDefault && (
                              <span className={styles.defaultBadge}>
                                <FaHome className={styles.badgeIcon} />
                                Mặc định
                              </span>
                            )}
                          </div>
                          <div className={styles.addressActions}>
                            {!address.isDefault && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSetDefaultAddress(address._id)}
                                title="Đặt làm mặc định"
                              >
                                <FaHome className={styles.buttonIcon} />
                                Đặt làm mặc định
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditAddressClick(address)}
                              title="Chỉnh sửa địa chỉ"
                            >
                              <FaEdit />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteAddress(address._id)}
                              title={address.isDefault ? "Không thể xóa địa chỉ mặc định" : "Xóa địa chỉ"}
                              className={address.isDefault ? styles.disabledDeleteButton : ''}
                            >
                              <FaTrash />
                            </Button>
                          </div>
                        </div>

                        <div className={styles.addressInfo}>
                          <p className={styles.addressPhone}>{address.phone}</p>
                          <p className={styles.addressLine}>
                            {address.addressLine}, {address.ward}, {address.district}, {address.city}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Orders Section */}
          {activeSection === 'orders' && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionHeaderContent}>
                  <h2 className={styles.sectionTitle}>
                    <FaShoppingBag className={styles.sectionIcon} />
                    Lịch sử đơn hàng
                  </h2>
                  <p className={styles.sectionSubtitle}>
                    Hiển thị {orders.length > 0 ? Math.min(orders.length, 10) : 0} đơn hàng gần nhất
                  </p>
                </div>
                <div className={styles.sectionActions}>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/orders')}
                  >
                    Xem tất cả đơn hàng
                  </Button>
                </div>
              </div>

              <div className={styles.ordersContainer}>
                {ordersLoading ? (
                  <div className={styles.loadingSection}>
                    <LoadingSpinner size="lg" />
                    <p>Đang tải danh sách đơn hàng...</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>
                      <FaShoppingBag />
                    </div>
                    <h3>Chưa có đơn hàng nào</h3>
                    <p>Bạn chưa thực hiện đơn hàng nào. Hãy bắt đầu mua sắm!</p>
                    <Button variant="primary" onClick={() => router.push('/products')}>
                      Khám phá sản phẩm
                    </Button>
                  </div>
                ) : (
                  <div className={styles.ordersList}>
                    {orders.map((order) => (
                      <div key={order._id} className={styles.orderCard}>
                        <div className={styles.orderHeader}>
                          <div className={styles.orderInfo}>
                            <h4>Đơn hàng #{order.orderCode}</h4>
                            <p className={styles.orderDate}>{formatDate(order.createdAt)}</p>
                          </div>
                          <div className={`${styles.orderStatus} ${getOrderStatusClass(order.status)}`}>
                            {getOrderStatusText(order.status)}
                          </div>
                        </div>

                        <div className={styles.orderItems}>
                          {order.items.slice(0, 3).map((item, index) => (
                            <div key={index} className={styles.orderItem}>
                              <span>{item.productVariant?.product?.name || 'Sản phẩm'}</span>
                              <span>x{item.quantity}</span>
                            </div>
                          ))}
                          {order.items.length > 3 && (
                            <p className={styles.moreItems}>+{order.items.length - 3} sản phẩm khác</p>
                          )}
                        </div>

                        <div className={styles.orderFooter}>
                          <div className={styles.orderTotal}>
                            <strong>{order.finalTotal?.toLocaleString('vi-VN')}đ</strong>
                          </div>
                          <div className={styles.orderActions}>
                            <OrderDetailButton 
                              orderId={order._id}
                              variant="outline"
                              size="sm"
                            >
                              Chi tiết
                            </OrderDetailButton>
                            
                            {order.status === 'pending' && (
                              <Button
                                variant="outline"
                                size="sm"
                                className={styles.cancelButton}
                                onClick={async () => {
                                  if (confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) {
                                    await handleCancelOrder(order._id);
                                  }
                                }}
                                disabled={loading}
                              >
                                {loading ? 'Đang hủy...' : 'Hủy đơn'}
                              </Button>
                            )}
                            
                            {/* Nút Đánh giá cho đơn hàng đã giao */}
                            {order.status === 'delivered' && (
                              <Button
                                variant="outline"
                                size="sm"
                                className={styles.reviewButton}
                                onClick={() => isOrderReviewed(order._id) ? undefined : handleReviewOrder(order)}
                                disabled={isOrderReviewed(order._id)}
                              >
                                {isOrderReviewed(order._id) ? 'Đã đánh giá' : 'Đánh giá'}
                              </Button>
                            )}
                            
                            {/* Nút Mua lại - LUÔN Ở CUỐI (bên phải ngoài cùng) */}
                            <Button
                              variant="primary"
                              size="sm"
                              className={styles.reorderButton}
                              onClick={() => handleReorder(order)}
                              disabled={loading}
                            >
                              Mua lại
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Security Section */}
          {activeSection === 'security' && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>
                  <FaLock className={styles.sectionIcon} />
                  Bảo mật & Mật khẩu
                </h2>
                <p className={styles.sectionSubtitle}>Cài đặt bảo mật cho tài khoản của bạn</p>
              </div>

              <div className={styles.securityContainer}>
                {/* Password Change */}
                <div className={styles.securityCard}>
                  <div className={styles.cardHeader}>
                    <h3><FaLock className={styles.cardIcon} />Đổi mật khẩu</h3>
                    <p>Cập nhật mật khẩu để bảo vệ tài khoản</p>
                  </div>

                  {!isChangingPassword ? (
                    <div className={styles.cardContent}>
                      <p>Mật khẩu được cập nhật lần cuối: {formatDate(userProfile.updatedAt)}</p>
                      <Button variant="outline" onClick={() => setIsChangingPassword(true)}>
                        <FaEdit className={styles.buttonIcon} />
                        Đổi mật khẩu
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleChangePassword} className={styles.profileForm}>
                      <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                          <label className={styles.label}>Mật khẩu hiện tại *</label>
                          <input
                            type="password"
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                            className={styles.input}
                            placeholder="Nhập mật khẩu hiện tại"
                            required
                          />
                        </div>

                        <div className={styles.formGroup}>
                          <label className={styles.label}>Mật khẩu mới *</label>
                          <input
                            type="password"
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                            className={styles.input}
                            placeholder="Nhập mật khẩu mới (ít nhất 8 ký tự)"
                            minLength={8}
                            required
                          />
                        </div>

                        <div className={styles.formGroup}>
                          <label className={styles.label}>Xác nhận mật khẩu mới *</label>
                          <input
                            type="password"
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            className={styles.input}
                            placeholder="Nhập lại mật khẩu mới"
                            required
                          />
                        </div>
                      </div>

                      <div className={styles.formActions}>
                        <div className={styles.actionButtons}>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setIsChangingPassword(false);
                              setPasswordForm({
                                currentPassword: '',
                                newPassword: '',
                                confirmPassword: ''
                              });
                            }}
                            type="button"
                            disabled={loading}
                          >
                            <FaTimes className={styles.buttonIcon} />
                            Hủy
                          </Button>
                          <Button variant="primary" type="submit" disabled={loading}>
                            <FaLock className={styles.buttonIcon} />
                            {loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                          </Button>
                        </div>
                      </div>
                    </form>
                  )}
                </div>

                {/* Account Security Info */}
                <div className={styles.securityCard}>
                  <div className={styles.cardHeader}>
                    <h3><FaChartBar className={styles.cardIcon} />Thông tin bảo mật</h3>
                    <p>Trạng thái và cài đặt bảo mật tài khoản</p>
                  </div>
                  
                  <div className={styles.securityInfo}>
                    <div className={styles.securityItem}>
                      <span className={styles.securityLabel}>Trạng thái tài khoản:</span>
                      <span className={`${styles.securityStatus} ${userProfile.isActive ? styles.statusActive : styles.statusInactive}`}>
                        {userProfile.isActive ? '✅ Hoạt động' : '❌ Bị khóa'}
                      </span>
                    </div>
                    
                    <div className={styles.securityItem}>
                      <span className={styles.securityLabel}>Ngày tạo tài khoản:</span>
                      <span className={styles.securityValue}>{formatDate(userProfile.createdAt)}</span>
                    </div>
                    
                    <div className={styles.securityItem}>
                      <span className={styles.securityLabel}>Cập nhật lần cuối:</span>
                      <span className={styles.securityValue}>{formatDate(userProfile.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order Review Modal */}
      {selectedOrderForReview && (
        <OrderReviewModal
          isOpen={reviewModalOpen}
          onClose={handleReviewModalClose}
          order={selectedOrderForReview}
          onSuccess={handleReviewSuccess}
        />
      )}

      {/* Add Address Modal */}
      <AddAddressModal
        isOpen={isAddingAddress}
        onClose={() => setIsAddingAddress(false)}
        onAddSuccess={(newAddress) => {
          setAddresses(prev => [...prev, newAddress]);
          setIsAddingAddress(false);
        }}
      />

      {/* Edit Address Modal */}
      <EditAddressModal
        isOpen={isEditingAddress}
        onClose={handleCloseEditAddress}
        onEditSuccess={handleEditAddressSuccess}
        address={selectedAddressForEdit}
      />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ProfilePageContent />
    </Suspense>
  );
}
