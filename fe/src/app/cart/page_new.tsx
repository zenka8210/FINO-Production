'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts';
import { useCart, useNotifications } from '@/hooks';
import { CartWithRefs } from '@/types';
import styles from './cart.module.css';

export default function Cart() {
  const router = useRouter();
  const { user } = useAuth();
  const { cart, updateCartItem, removeFromCart, clearCart, isLoading, error } = useCart();
  const { showError, showSuccess } = useNotifications();
  const [couponCode, setCouponCode] = useState('');

  // Redirect nếu chưa đăng nhập
  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/cart');
    }
  }, [user, router]);

  const handleQuantityChange = async (variantId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    try {
      await updateCartItem(variantId, newQuantity);
    } catch (error: any) {
      showError('Không thể cập nhật số lượng: ' + error.message);
    }
  };

  const handleRemoveItem = async (variantId: string) => {
    try {
      await removeFromCart(variantId);
      showSuccess('Đã xóa sản phẩm khỏi giỏ hàng');
    } catch (error: any) {
      showError('Không thể xóa sản phẩm: ' + error.message);
    }
  };

  const handleClearCart = async () => {
    if (confirm('Bạn có chắc chắn muốn xóa toàn bộ giỏ hàng?')) {
      try {
        await clearCart();
        showSuccess('Đã xóa toàn bộ giỏ hàng');
      } catch (error: any) {
        showError('Không thể xóa giỏ hàng: ' + error.message);
      }
    }
  };

  const handleCheckout = () => {
    if (!cart || cart.items.length === 0) {
      showError('Giỏ hàng trống');
      return;
    }
    router.push('/checkout');
  };

  const handleApplyCoupon = () => {
    // TODO: Implement voucher logic
    showError('Chức năng áp dụng mã giảm giá đang được phát triển');
  };

  if (!user) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          Đang chuyển hướng...
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          Đang tải giỏ hàng...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          Lỗi: {error}
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyCart}>
          <h2>Giỏ hàng trống</h2>
          <p>Bạn chưa có sản phẩm nào trong giỏ hàng</p>
          <button 
            className={styles.continueShoppingBtn}
            onClick={() => router.push('/products')}
          >
            Tiếp tục mua sắm
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className="container">
        <h1 className={styles.title}>GIỎ HÀNG CỦA BẠN</h1>
        
        <div className={styles.cartContent}>
          <div className={styles.cartItems}>
            {cart.items.map((item) => (
              <div key={item.productVariant._id} className={styles.cartItem}>
                <div className={styles.productInfo}>
                  <img 
                    src={item.productVariant?.product?.images?.[0] || '/images/placeholder.jpg'} 
                    alt={item.productVariant?.product?.name || 'Product'}
                    className={styles.productImage}
                  />
                  <div className={styles.productDetails}>
                    <h3>{item.productVariant?.product?.name}</h3>
                    <p>Màu: {item.productVariant?.color?.name}</p>
                    <p>Size: {item.productVariant?.size?.name}</p>
                    <p className={styles.price}>
                      {item.price.toLocaleString('vi-VN')}đ
                    </p>
                  </div>
                </div>
                
                <div className={styles.quantityControls}>
                  <button 
                    onClick={() => handleQuantityChange(item.productVariant._id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button 
                    onClick={() => handleQuantityChange(item.productVariant._id, item.quantity + 1)}
                  >
                    +
                  </button>
                </div>
                
                <div className={styles.itemTotal}>
                  {item.totalPrice.toLocaleString('vi-VN')}đ
                </div>
                
                <button 
                  className={styles.removeBtn}
                  onClick={() => handleRemoveItem(item.productVariant._id)}
                >
                  Xóa
                </button>
              </div>
            ))}
          </div>
          
          <div className={styles.cartSummary}>
            <h3>Tóm tắt đơn hàng</h3>
            
            <div className={styles.couponSection}>
              <input
                type="text"
                placeholder="Mã giảm giá"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className={styles.couponInput}
              />
              <button 
                onClick={handleApplyCoupon}
                className={styles.couponBtn}
              >
                Áp dụng
              </button>
            </div>
            
            <div className={styles.summaryRow}>
              <span>Tạm tính:</span>
              <span>{cart.total.toLocaleString('vi-VN')}đ</span>
            </div>
            
            <div className={styles.summaryRow}>
              <span>Giảm giá:</span>
              <span>-{cart.discountAmount.toLocaleString('vi-VN')}đ</span>
            </div>
            
            <div className={styles.summaryRow}>
              <span>Phí vận chuyển:</span>
              <span>{cart.shippingFee.toLocaleString('vi-VN')}đ</span>
            </div>
            
            <div className={styles.totalRow}>
              <span>Tổng cộng:</span>
              <span>{cart.finalTotal.toLocaleString('vi-VN')}đ</span>
            </div>
            
            <button 
              className={styles.checkoutBtn}
              onClick={handleCheckout}
            >
              THANH TOÁN
            </button>
            
            <button 
              className={styles.clearCartBtn}
              onClick={handleClearCart}
            >
              Xóa toàn bộ giỏ hàng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
