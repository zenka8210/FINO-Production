'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useCart, useApiNotification } from '@/hooks';
import { Button, PageHeader, LoadingSpinner } from '@/app/components/ui';
import AddressSelectionModal from '@/app/components/AddressSelectionModal';
import { FaCreditCard, FaShoppingCart, FaMapMarkerAlt, FaTicketAlt, FaExclamationTriangle } from 'react-icons/fa';
import { formatCurrency } from '@/lib/utils';
import { addressService, voucherService, cartService, paymentMethodService, vnpayService, momoService, orderService } from '@/services';
import { Address, Voucher, PaymentMethod } from '@/types';
import Image from 'next/image';
import axios from 'axios';
import styles from './CheckoutPage.module.css';

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { cart, isLoading: cartLoading, isEmpty, loadCart } = useCart();
  const { showSuccess, showError } = useApiNotification();

  // Memoized cart subtotal calculation using sale price
  const cartSubtotal = useMemo(() => {
    if (!cart?.items?.length) return 0;
    
    const total = cart.items.reduce((sum, item) => {
      // Add null checks to prevent errors
      if (!item.productVariant?.product) {
        console.warn('Cart item missing productVariant or product:', item);
        return sum;
      }
      
      // Use same logic as CartContext: sale price from product, regular price from variant
      const salePrice = item.productVariant.product.salePrice;
      const regularPrice = item.productVariant.price; // Get from variant, not product
      const currentPrice = salePrice || regularPrice;
      
      // Additional safety check for price
      if (!currentPrice || isNaN(currentPrice)) {
        console.warn('Cart item has invalid price:', { item, salePrice, regularPrice });
        return sum;
      }
      
      const itemTotal = currentPrice * item.quantity;
      if (isNaN(itemTotal)) {
        console.warn('Cart item total is NaN:', { currentPrice, quantity: item.quantity });
        return sum;
      }
      
      return sum + itemTotal;
    }, 0);
    
    return total;
  }, [cart?.items]);

  // State management
  const [defaultAddress, setDefaultAddress] = useState<Address | null>(null);
  const [availableVouchers, setAvailableVouchers] = useState<Voucher[]>([]);
  const [selectedVoucher, setSelectedVoucher] = useState<string>('');
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<PaymentMethod[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingAddress, setIsLoadingAddress] = useState(true);
  const [isLoadingVouchers, setIsLoadingVouchers] = useState(true);
  const [isLoadingPaymentMethods, setIsLoadingPaymentMethods] = useState(true);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false); // Track checkout success
  const [shippingFee, setShippingFee] = useState(30000); // Default shipping fee
  const [isLoadingShipping, setIsLoadingShipping] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false); // Modal state

  // Filter available vouchers based on order subtotal (before shipping)
  const eligibleVouchers = useMemo(() => {
    if (!availableVouchers.length) return [];
    
    const now = new Date();
    
    return availableVouchers.filter(voucher => {
      // Check if voucher is active
      if (!voucher.isActive) return false;
      
      // Check if voucher is within valid date range
      const startDate = new Date(voucher.startDate);
      const endDate = new Date(voucher.endDate);
      if (now < startDate || now > endDate) return false;
      
      // Check minimum order value requirement against subtotal (before shipping)
      if (cartSubtotal < (voucher.minimumOrderValue || 0)) return false;
      
      // Check maximum order value if set
      if (voucher.maximumOrderValue && cartSubtotal > voucher.maximumOrderValue) return false;
      
      return true;
    });
  }, [availableVouchers, cartSubtotal]);

  // Calculate discount amount for selected voucher (based on subtotal)
  const voucherDiscount = useMemo(() => {
    if (!selectedVoucher || !eligibleVouchers.length) return 0;
    
    const voucher = eligibleVouchers.find(v => v._id === selectedVoucher);
    if (!voucher) return 0;
    
    // Safety check for cartSubtotal
    if (!cartSubtotal || isNaN(cartSubtotal)) {
      console.warn('Cart subtotal is invalid for voucher calculation:', cartSubtotal);
      return 0;
    }
    
    // Calculate percentage discount based on subtotal (before shipping)
    const discountAmount = Math.floor(cartSubtotal * (voucher.discountPercent / 100));
    
    // Safety check for discount amount
    if (isNaN(discountAmount)) {
      console.warn('Discount amount is NaN:', { cartSubtotal, discountPercent: voucher.discountPercent });
      return 0;
    }
    
    // Apply maximum discount limit if exists
    if (voucher.maximumDiscountAmount) {
      return Math.min(discountAmount, voucher.maximumDiscountAmount);
    }
    
    return discountAmount;
  }, [selectedVoucher, eligibleVouchers, cartSubtotal]);

  // Real-time order calculation: subtotal - discount + shipping
  const realTimeOrderTotal = useMemo(() => {
    const subtotal = cartSubtotal || 0;
    const discount = voucherDiscount || 0;
    const shipping = shippingFee || 30000; // Fallback to default shipping
    
    // Safety checks for NaN values
    if (isNaN(subtotal)) {
      console.warn('Subtotal is NaN, using 0:', subtotal);
    }
    if (isNaN(discount)) {
      console.warn('Discount is NaN, using 0:', discount);
    }
    if (isNaN(shipping)) {
      console.warn('Shipping is NaN, using 30000:', shipping);
    }
    
    const finalTotal = (subtotal || 0) - (discount || 0) + (shipping || 30000);
    
    const result = {
      subtotal: subtotal || 0,
      discountAmount: discount || 0,
      shippingFee: shipping || 30000,
      finalTotal: Math.max(finalTotal, shipping || 30000) // Ensure final total never goes below shipping
    };
    
    return result;
  }, [cartSubtotal, voucherDiscount, shippingFee]);

  // Clear selected voucher if it's no longer eligible
  // Clear selected voucher if it's no longer eligible
  useEffect(() => {
    if (selectedVoucher && eligibleVouchers.length > 0) {
      const isStillEligible = eligibleVouchers.some(v => v._id === selectedVoucher);
      if (!isStillEligible) {
        setSelectedVoucher('');
      }
    }
  }, [selectedVoucher, eligibleVouchers]);

  // Order calculation (kept for backend sync)
  const [orderCalculation, setOrderCalculation] = useState({
    subtotal: 0,
    discountAmount: 0,
    shippingFee: 0,
    finalTotal: 0
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/checkout');
      return;
    }
  }, [user, router, authLoading]);

  // Redirect if cart is empty (but not during checkout success)
  useEffect(() => {
    if (!cartLoading && isEmpty && !checkoutSuccess) {
      router.push('/cart');
      return;
    }
  }, [cartLoading, isEmpty, router, checkoutSuccess]);

  // Load default address
  useEffect(() => {
    const loadDefaultAddress = async () => {
      if (!user) return;
      
      try {
        setIsLoadingAddress(true);
        const userAddresses = await addressService.getUserAddresses();
        
        // Find default address
        const defaultAddr = userAddresses.find(addr => addr.isDefault) || userAddresses[0];
        setDefaultAddress(defaultAddr || null);
      } catch (error) {
        console.error('Error loading default address:', error);
        showError('Không thể tải địa chỉ');
      } finally {
        setIsLoadingAddress(false);
      }
    };

    loadDefaultAddress();
  }, [user]);

  // Load vouchers
  useEffect(() => {
    const loadVouchers = async () => {
      if (!user) {
        return;
      }
      
      try {
        setIsLoadingVouchers(true);
        
        const response = await voucherService.getActiveVouchers();
        const vouchers = Array.isArray(response) ? response : [];
        
        setAvailableVouchers(vouchers);
      } catch (error) {
        console.error('❌ Error loading vouchers:', error);
        showError('Không thể tải voucher');
        setAvailableVouchers([]);
      } finally {
        setIsLoadingVouchers(false);
      }
    };

    loadVouchers();
  }, [user]);

  // Load payment methods
  useEffect(() => {
    const loadPaymentMethods = async () => {
      try {
        setIsLoadingPaymentMethods(true);
        
        const paymentMethods = await paymentMethodService.getActivePaymentMethods();
        
        // Ensure we have an array
        const methodsArray = Array.isArray(paymentMethods) ? paymentMethods : [];
        
        // Sort to put COD first
        const sortedMethods = methodsArray.sort((a, b) => {
          if (a.method === 'COD') return -1;
          if (b.method === 'COD') return 1;
          return 0;
        });
        
        setAvailablePaymentMethods(sortedMethods);
        
        // Set default payment method to COD first, or first available
        if (sortedMethods.length > 0 && !paymentMethod) {
          const defaultMethod = sortedMethods.find(m => m.method === 'COD') || sortedMethods[0];
          setPaymentMethod(defaultMethod._id);
        }
      } catch (error) {
        console.error('❌ Error loading payment methods:', error);
        showError('Không thể tải phương thức thanh toán');
        setAvailablePaymentMethods([]);
      } finally {
        setIsLoadingPaymentMethods(false);
      }
    };

    loadPaymentMethods();
  }, []);

  // Clear selected voucher if it's no longer eligible
  useEffect(() => {
    if (selectedVoucher && eligibleVouchers.length > 0) {
      const isStillEligible = eligibleVouchers.some(v => v._id === selectedVoucher);
      if (!isStillEligible) {
        setSelectedVoucher('');
      }
    }
  }, [selectedVoucher, eligibleVouchers]);

  // Calculate order total when address or voucher changes
  // Calculate order total when address or voucher changes
  useEffect(() => {
    const calculateTotal = async () => {
      if (!defaultAddress || !cart?.items?.length) return;
      
      try {
        const calculation = await cartService.calculateTotal(defaultAddress._id, selectedVoucher || undefined);
        
        // Use frontend real-time calculation for display (more accurate and faster)
        setOrderCalculation(realTimeOrderTotal);
      } catch (error) {
        console.error('❌ Error calculating total:', error);
        // Use real-time calculation as fallback
        setOrderCalculation(realTimeOrderTotal);
      }
    };

    calculateTotal();
  }, [defaultAddress?._id, selectedVoucher, cartSubtotal]);

  // Calculate shipping fee when address changes
  useEffect(() => {
    const calculateShipping = async () => {
      if (!defaultAddress?._id) {
        setShippingFee(30000);
        return;
      }

      try {
        setIsLoadingShipping(true);
        
        const result = await orderService.calculateShippingFee(defaultAddress._id);
        
        setShippingFee(result.shippingFee);
      } catch (error) {
        console.error('❌ Error calculating shipping fee:', error);
        // Use fallback shipping fee
        setShippingFee(30000);
      } finally {
        setIsLoadingShipping(false);
      }
    };

    calculateShipping();
  }, [defaultAddress?._id]);

  // Handle address selection from modal
  const handleAddressSelect = async (address: Address) => {
    setDefaultAddress(address);
    
    // Recalculate shipping fee for new address
    try {
      setIsLoadingShipping(true);
      const result = await orderService.calculateShippingFee(address._id);
      setShippingFee(result.shippingFee || 30000);
    } catch (error) {
      console.error('Error calculating shipping for selected address:', error);
      // Keep default shipping fee if calculation fails
      setShippingFee(30000);
    } finally {
      setIsLoadingShipping(false);
    }
  };

  // Helper function to determine address badge
  const getAddressBadge = () => {
    if (!defaultAddress) return null;
    
    // Only show "Địa chỉ mặc định" badge if the address is actually marked as default in the system
    if (defaultAddress.isDefault) {
      return { text: 'Địa chỉ mặc định', className: styles.defaultBadge };
    }
    
    // If it's not the default address but was selected, show selected badge
    return { text: 'Địa chỉ đã chọn', className: styles.selectedBadge };
  };

  // Handle checkout
  const handleCheckout = async () => {
    console.log('🚀 CHECKOUT DEBUG - handleCheckout function called!');
    
    if (!defaultAddress) {
      showError('Vui lòng thiết lập địa chỉ mặc định');
      return;
    }

    if (!paymentMethod) {
      showError('Vui lòng chọn phương thức thanh toán');
      return;
    }

    try {
      setIsProcessing(true);
      
      const checkoutData = {
        addressId: defaultAddress._id,
        paymentMethodId: paymentMethod,
        voucherId: selectedVoucher || undefined
      };

      // Check payment method and handle accordingly
      const selectedPaymentMethod = availablePaymentMethods.find(pm => pm._id === paymentMethod);

      console.log('🔍 CHECKOUT DEBUG - Selected payment method:', selectedPaymentMethod);
      console.log('🔍 CHECKOUT DEBUG - Available methods:', availablePaymentMethods);
      console.log('🔍 CHECKOUT DEBUG - Payment method ID:', paymentMethod);
      console.log('🔍 CHECKOUT DEBUG - Method value:', selectedPaymentMethod?.method);
      console.log('🔍 CHECKOUT DEBUG - Method comparison result:', selectedPaymentMethod?.method === 'Momo');

      if (selectedPaymentMethod?.method === 'VNPay') {
        console.log('🔄 CHECKOUT DEBUG - Processing VNPay payment...');
        try {
          // Use new VNPay checkout endpoint that handles everything properly
          const vnpayResponse = await vnpayService.createVNPayCheckout(checkoutData);
          
          // Show loading message
          showSuccess('Đang chuyển hướng đến VNPay...');
          
          // Small delay to show the message
          setTimeout(() => {
            // Redirect to VNPay payment page
            window.location.href = vnpayResponse.paymentUrl;
          }, 1000);
          
          return; // Exit early - order will be created after successful payment
          
        } catch (vnpayError) {
          console.error('❌ VNPay checkout creation failed:', vnpayError);
          showError('Không thể tạo thanh toán VNPay', vnpayError);
          return;
        }

      } else if (selectedPaymentMethod?.method === 'Momo') {
        try {
          console.log('🔄 CHECKOUT DEBUG - Processing MoMo payment...');
          
          // Use MoMo checkout endpoint similar to VNPay
          const momoResponse = await momoService.createMoMoCheckout(checkoutData);
          
          console.log('✅ CHECKOUT DEBUG - MoMo response:', momoResponse);
          
          // Show loading message
          showSuccess('Đang chuyển hướng đến MoMo...');
          
          // Small delay to show the message
          setTimeout(() => {
            // Redirect to MoMo payment page
            console.log('🚀 CHECKOUT DEBUG - Redirecting to MoMo URL:', momoResponse.paymentUrl);
            window.location.href = momoResponse.paymentUrl;
          }, 1000);
          
          return; // Exit early - order will be created after successful payment
          
        } catch (momoError) {
          console.error('❌ MoMo checkout creation failed:', momoError);
          showError('Không thể tạo thanh toán MoMo', momoError);
          return;
        }
        
      } else {
        // For COD only: Create order immediately
        const result = await cartService.checkout(checkoutData);
        
        // Mark checkout as successful to prevent cart redirect
        setCheckoutSuccess(true);
        
        // Extract order ID from response
        let orderId = null;
        
        if (result?.data?._id) {
          orderId = result.data._id;
        } else if (result?._id) {
          orderId = result._id;
        } else if (result?.order?._id) {
          orderId = result.order._id;
        } else {
          console.error('❌ Could not find order ID in expected locations');
          console.error('❌ Full response structure:', JSON.stringify(result, null, 2));
        }
        
        // Reload cart after successful checkout
        loadCart().catch(console.error);
        
        if (orderId) {
          // Redirect to success page
          const successUrl = `/checkout/success?orderId=${orderId}`;
          router.push(successUrl);
        } else {
          console.error('❌ No order ID found, redirecting to profile orders');
          router.push('/profile?section=orders');
        }
      }

    } catch (error: any) {
      console.error('❌ Checkout error:', error);
      console.error('❌ Error response:', error.response?.data);
      
      // Redirect to failure page with error info
      const errorMessage = error.response?.data?.message || error.message || 'Đặt hàng thất bại';
      showError('Đặt hàng thất bại', errorMessage);
      router.push(`/checkout/fail?error=${encodeURIComponent(errorMessage)}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Loading state
  if (authLoading || cartLoading || isLoadingAddress || isLoadingPaymentMethods) {
    return (
      <div className="container">
        <div className={styles.pageContainer}>
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className={styles.pageContainer}>
        <PageHeader
          title="Thanh toán"
          subtitle="Hoàn tất đơn hàng của bạn"
          icon={FaCreditCard}
          breadcrumbs={[
            { label: 'Trang chủ', href: '/' },
            { label: 'Giỏ hàng', href: '/cart' },
            { label: 'Thanh toán', href: '/checkout' }
          ]}
        />

        <div className={styles.checkoutContainer}>
          {/* Main Checkout Form */}
          <div className={styles.leftColumn}>
            {/* Shipping Address Section */}
            <div className={styles.checkoutSection}>
              <div className={styles.sectionHeader}>
                <FaMapMarkerAlt className={styles.sectionIcon} />
                <h3 className={styles.sectionTitle}>Địa chỉ giao hàng</h3>
              </div>
              
              {defaultAddress ? (
                <div className={styles.selectedAddress}>
                  <div className={styles.addressDetails}>
                    <div className={styles.addressName}>
                      {defaultAddress.fullName} - {defaultAddress.phone}
                      {getAddressBadge() && (
                        <span className={getAddressBadge()?.className}>
                          {getAddressBadge()?.text}
                        </span>
                      )}
                    </div>
                    <div className={styles.addressText}>
                      {defaultAddress.addressLine}, {defaultAddress.ward}, {defaultAddress.district}, {defaultAddress.city}
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowAddressModal(true)}
                  >
                    Thay đổi
                  </Button>
                </div>
              ) : (
                <div className={styles.noAddress}>
                  <FaExclamationTriangle className={styles.warningIcon} />
                  <div>
                    <p className={styles.warningText}>Bạn chưa có địa chỉ mặc định</p>
                    <p className={styles.warningSubtext}>Vui lòng thiết lập địa chỉ mặc định để có thể thanh toán</p>
                  </div>
                  <Button 
                    variant="primary" 
                    onClick={() => router.push('/profile?section=addresses')}
                  >
                    Thiết lập địa chỉ
                  </Button>
                </div>
              )}
            </div>

            {/* Voucher Section */}
            <div className={styles.checkoutSection}>
              <div className={styles.sectionHeader}>
                <FaTicketAlt className={styles.sectionIcon} />
                <h3 className={styles.sectionTitle}>Mã giảm giá</h3>
              </div>
              
              <div className={styles.voucherSection}>
                {isLoadingVouchers ? (
                  <div className={styles.loadingVouchers}>
                    <LoadingSpinner />
                    <span>Đang tải voucher...</span>
                  </div>
                ) : (
                  <>
                    <select
                      value={selectedVoucher}
                      onChange={(e) => setSelectedVoucher(e.target.value)}
                      className={styles.voucherSelect}
                    >
                      <option value="">Chọn mã giảm giá (tùy chọn)</option>
                      {eligibleVouchers.map((voucher) => (
                        <option key={voucher._id} value={voucher._id}>
                          {voucher.code} - Giảm {voucher.discountPercent}%
                          {voucher.maximumDiscountAmount && 
                            ` (tối đa ${formatCurrency(voucher.maximumDiscountAmount)})`}
                          {voucher.minimumOrderValue > 0 && 
                            ` - Đơn tối thiểu ${formatCurrency(voucher.minimumOrderValue)}`}
                        </option>
                      ))}
                    </select>
                    
                    {eligibleVouchers.length === 0 && availableVouchers.length > 0 && (
                      <div className={styles.noVouchers}>
                        <p>Không có voucher khả dụng cho đơn hàng này</p>
                        <small>Tăng giá trị đơn hàng để sử dụng voucher</small>
                      </div>
                    )}
                    
                    {availableVouchers.length === 0 && (
                      <div className={styles.noVouchers}>
                        <p>Không có voucher khả dụng</p>
                      </div>
                    )}
                    
                    {selectedVoucher && (
                      <div className={styles.selectedVoucherInfo}>
                        {(() => {
                          const voucher = availableVouchers.find(v => v._id === selectedVoucher);
                          if (!voucher) return null;
                          return (
                            <div className={styles.voucherDetails}>
                              <div className={styles.voucherCode}>{voucher.code}</div>
                              <div className={styles.voucherDescription}>
                                Giảm {voucher.discountPercent}% 
                                {voucher.maximumDiscountAmount && 
                                  `, tối đa ${formatCurrency(voucher.maximumDiscountAmount)}`}
                              </div>
                              {voucher.minimumOrderValue > 0 && (
                                <div className={styles.voucherCondition}>
                                  Áp dụng cho đơn hàng từ {formatCurrency(voucher.minimumOrderValue)}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Payment Method Section */}
            <div className={styles.checkoutSection}>
              <div className={styles.sectionHeader}>
                <FaCreditCard className={styles.sectionIcon} />
                <h3 className={styles.sectionTitle}>Phương thức thanh toán</h3>
              </div>
              
              <div className={styles.paymentMethods}>                
                {isLoadingPaymentMethods ? (
                  <div className={styles.loadingPaymentMethods}>
                    <LoadingSpinner />
                    <span>Đang tải phương thức thanh toán...</span>
                  </div>
                ) : (
                  <>
                    {Array.isArray(availablePaymentMethods) && availablePaymentMethods.length > 0 ? (
                      availablePaymentMethods.map((method) => (
                        <div 
                          key={method._id}
                          className={`${styles.paymentOption} ${paymentMethod === method._id ? styles.selected : ''}`}
                          onClick={() => setPaymentMethod(method._id)}
                        >
                            <input
                              type="radio"
                              name="payment"
                              value={method._id}
                              checked={paymentMethod === method._id}
                              onChange={() => setPaymentMethod(method._id)}
                              className={styles.paymentRadio}
                            />
                            <div className={styles.paymentDetails}>
                              <strong>
                                {method.method === 'COD' ? 'Thanh toán khi nhận hàng (COD)' : 
                                 method.method === 'VNPay' ? 'Thanh toán VNPay' : 
                                 method.method}
                              </strong>
                              <p>
                                {method.method === 'COD' ? 'Thanh toán bằng tiền mặt khi nhận hàng' :
                                 method.method === 'VNPay' ? 'Thanh toán trực tuyến qua VNPay' :
                                 'Phương thức thanh toán'}
                              </p>
                            </div>
                            <div className={styles.paymentIcon}>
                              {method.method === 'COD' ? '💵' : 
                               method.method === 'VNPay' ? '💳' : '💰'}
                            </div>
                          </div>
                        ))
                    ) : (
                      <div className={styles.noPaymentMethods}>
                        <p>Không có phương thức thanh toán khả dụng</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className={styles.rightColumn}>
            <div className={styles.orderSummary}>
              <h3 className={styles.summaryTitle}>Tóm tắt đơn hàng</h3>
              
              {/* Cart Items */}
              <div className={styles.summaryItems}>
                {cart?.items.map((item, index) => {
                  const { productVariant, quantity } = item;
                  
                  // Add null checks to prevent errors
                  if (!productVariant?.product) {
                    console.warn('Skipping cart item with missing product data:', item);
                    return null;
                  }
                  
                  const { product, price, size, color } = productVariant;
                  // Use same logic as CartContext: sale price from product, regular price from variant
                  const currentPrice = product.salePrice || price;
                  const totalPrice = currentPrice * quantity;
                  const mainImage = product.images && product.images.length > 0 ? product.images[0] : null;

                  return (
                    <div key={`${productVariant._id}-${index}-${quantity}`} className={styles.summaryItem}>
                      <div className={styles.itemImage}>
                        {mainImage ? (
                          <Image
                            src={mainImage}
                            alt={product.name}
                            width={60}
                            height={60}
                            className={styles.productImage}
                          />
                        ) : (
                          <div className={styles.noImage}>
                            <FaShoppingCart />
                          </div>
                        )}
                      </div>
                      <div className={styles.itemDetails}>
                        <h4 className={styles.itemName}>{product.name}</h4>
                        <div className={styles.itemVariant}>
                          {color && <span>Màu: {color.name}</span>}
                          {size && <span>Size: {size.name}</span>}
                        </div>
                        <div className={styles.itemPrice}>
                          {quantity} × {formatCurrency(currentPrice)} = {formatCurrency(totalPrice)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Order Calculation - Using Real-time Calculation */}
              <div className={styles.orderCalculation}>
                <div className={styles.calculationRow}>
                  <span>Tạm tính:</span>
                  <span>{formatCurrency(realTimeOrderTotal.subtotal)}</span>
                </div>
                
                {realTimeOrderTotal.discountAmount > 0 && (
                  <div className={styles.calculationRow}>
                    <span>Giảm giá:</span>
                    <span className={styles.discount}>-{formatCurrency(realTimeOrderTotal.discountAmount)}</span>
                  </div>
                )}
                
                <div className={styles.calculationRow}>
                  <span>Phí vận chuyển:</span>
                  <span>{formatCurrency(realTimeOrderTotal.shippingFee)}</span>
                </div>
                
                <div className={`${styles.calculationRow} ${styles.total}`}>
                  <span>Tổng cộng:</span>
                  <span>{formatCurrency(realTimeOrderTotal.finalTotal)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <Button
                onClick={handleCheckout}
                disabled={!defaultAddress || isProcessing}
                className={styles.checkoutButton}
                size="lg"
                isLoading={isProcessing}
              >
                {isProcessing ? 'Đang xử lý...' : `Đặt hàng - ${formatCurrency(realTimeOrderTotal.finalTotal)}`}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Address Selection Modal */}
      <AddressSelectionModal
        isOpen={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        currentAddress={defaultAddress}
        onSelectAddress={handleAddressSelect}
        onCreateNew={() => {
          setShowAddressModal(false);
          router.push('/profile?section=addresses');
        }}
      />
    </div>
  );
}
