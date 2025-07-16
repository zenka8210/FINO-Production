'use client';
import { useEffect, useReducer, useState } from 'react';
import { useRouter } from 'next/navigation';
import CartList from '../components/cartList'; 
import styles from './cart.module.css';

const COUPONS = [
    {
        code: "SUMMER2025",
        desc: "Hè rực rỡ với mã SUMMER2025! Giảm 20% cho 2 sản phẩm bất kỳ.",
        expire: "30-07-2025",
        value: 0.2,
        type: "percent"
    },
    {
        code: "DONDATIEN", 
        desc: "Tặng voucher 100k và miễn phí vận chuyển",
        expire: null,
        value: 100000,
        type: "fixed"
    }
];

interface CartItem {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    size?: string;
    quantity: number;
    image: string;
}

type Action =
    | { type: 'LOAD_CART'; payload: CartItem[] }
    | { type: 'INCREASE'; id: string; size?: string }
    | { type: 'DECREASE'; id: string; size?: string }
    | { type: 'REMOVE'; id: string; size?: string }
    | { type: 'CHECKOUT' };

interface State {
    items: CartItem[];
    total: number;
}

const initialState: State = {
    items: [],
    total: 0,
};

function calculateTotal(items: CartItem[]) {
    return items.reduce((acc, item) => acc + item.price * item.quantity, 0);
}

function saveToStorage(items: CartItem[]) {
    localStorage.setItem('cart', JSON.stringify(items));
}

function cartReducer(state: State, action: Action): State {
    let updatedItems: CartItem[] = [];

    switch (action.type) {
        case 'LOAD_CART':
            return {
                items: action.payload,
                total: calculateTotal(action.payload),
            };        case 'INCREASE':
            updatedItems = state.items.map(item =>
                item.id === action.id && (item.size === action.size || (!item.size && !action.size))
                    ? { ...item, quantity: item.quantity + 1 } 
                    : item
            );
            saveToStorage(updatedItems);
            return {
                items: updatedItems,
                total: calculateTotal(updatedItems),
            };

        case 'DECREASE':
            updatedItems = state.items.map(item =>
                item.id === action.id && (item.size === action.size || (!item.size && !action.size)) && item.quantity > 1
                    ? { ...item, quantity: item.quantity - 1 }
                    : item
            );
            saveToStorage(updatedItems);
            return {
                items: updatedItems,
                total: calculateTotal(updatedItems),
            };

        case 'REMOVE':
            updatedItems = state.items.filter(item => 
                !(item.id === action.id && (item.size === action.size || (!item.size && !action.size)))
            );
            saveToStorage(updatedItems);
            return {
                items: updatedItems,
                total: calculateTotal(updatedItems),
            };

        case 'CHECKOUT':
            localStorage.removeItem('cart');
            return { items: [], total: 0 };

        default:
            return state;
    }
}

export default function CartPage() {
    const [state, dispatch] = useReducer(cartReducer, initialState);
    const [voucherCode, setVoucherCode] = useState('');
    const [selectedCoupon, setSelectedCoupon] = useState<any>(null);
    const [showCoupons, setShowCoupons] = useState(false);
    const [discount, setDiscount] = useState(0);
    const [discountAmount, setDiscountAmount] = useState(0);
    const router = useRouter();    // Tính toán giảm giá
    useEffect(() => {
        if (selectedCoupon && state.total > 0) {
            let discountValue = 0;
            if (selectedCoupon.type === "percent") {
                discountValue = state.total * selectedCoupon.value;
            } else if (selectedCoupon.type === "fixed") {
                discountValue = Math.min(selectedCoupon.value, state.total);
            }
            setDiscountAmount(discountValue);
            setDiscount(selectedCoupon.value);
            
            // Lưu thông tin giảm giá vào localStorage để checkout có thể lấy
            localStorage.setItem('cartDiscount', JSON.stringify({
                code: selectedCoupon.code,
                amount: discountValue,
                type: selectedCoupon.type,
                value: selectedCoupon.value
            }));
        } else {
            setDiscountAmount(0);
            setDiscount(0);
            localStorage.removeItem('cartDiscount');
        }
    }, [selectedCoupon, state.total]);

    useEffect(() => {
        const storedItems: CartItem[] = JSON.parse(localStorage.getItem('cart') || '[]');
        dispatch({ type: 'LOAD_CART', payload: storedItems });

        const handleStorage = () => {
            const updated: CartItem[] = JSON.parse(localStorage.getItem('cart') || '[]');
            dispatch({ type: 'LOAD_CART', payload: updated });
        };

        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);    const handleIncrease = (id: string, size?: string) => dispatch({ type: 'INCREASE', id, size });
    const handleDecrease = (id: string, size?: string) => dispatch({ type: 'DECREASE', id, size });
    const handleRemove = (id: string, size?: string) => dispatch({ type: 'REMOVE', id, size });
    
    const handleApplyVoucher = () => {
        const foundCoupon = COUPONS.find(coupon => coupon.code === voucherCode.toUpperCase());
        if (foundCoupon) {
            setSelectedCoupon(foundCoupon);
            setVoucherCode(foundCoupon.code);
            alert(`Áp dụng mã ${foundCoupon.code} thành công!`);
        } else {
            alert('Mã voucher không hợp lệ!');
            setVoucherCode('');
        }
    };

    const handleSelectCoupon = (coupon: any) => {
        setSelectedCoupon(coupon);
        setVoucherCode(coupon.code);
        setShowCoupons(false);
    };    const handleRemoveCoupon = () => {
        setSelectedCoupon(null);
        setVoucherCode('');
        setDiscountAmount(0);
        localStorage.removeItem('cartDiscount');
    };
    
    const finalTotal = Math.max(0, state.total - discountAmount);const handleCheckout = () => {
        const confirmed = window.confirm('Bạn có chắc chắn muốn thanh toán không?');
        if (confirmed) {
            // Không xóa giỏ hàng ở đây, chỉ chuyển sang trang checkout nhập thông tin
            router.push('/checkout');
        }
    };    return (
        <div className="container">
            <div className="row">
                <div className="col-12">
                    <div className={styles.cartPage}>
                        <h1>Giỏ hàng của bạn</h1>
                        {state.items.length === 0 ? (
                            <div className={styles.emptyCart}>
                                <p>Giỏ hàng đang trống.</p>
                                <a href="/products" className={styles.continueShopping}>
                                    Tiếp tục mua sắm
                                </a>
                            </div>
                        ) : (                            <div className="row">
                                <div className="col-8 col-md-12 col-sm-12">
                                    <div className={styles.cartListContainer}>
                                        <CartList
                                            items={state.items}
                                            onIncrease={handleIncrease}
                                            onDecrease={handleDecrease}
                                            onRemove={handleRemove}
                                        />
                                          {/* Voucher Section */}
                                        <div className={styles.voucherSection}>
                                            <h3>Mã giảm giá</h3>
                                            <div className={styles.voucherInput}>
                                                <input
                                                    type="text"
                                                    placeholder="Nhập mã voucher"
                                                    value={voucherCode}
                                                    onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                                                    className={styles.voucherField}
                                                />
                                                <button 
                                                    onClick={handleApplyVoucher}
                                                    className={styles.applyBtn}
                                                    disabled={!voucherCode.trim()}
                                                >
                                                    Áp dụng
                                                </button>
                                            </div>
                                            
                                            {/* Available Coupons */}
                                            <div className={styles.availableCoupons}>
                                                <div className={styles.couponHeader}>
                                                    <span>Mã giảm giá có sẵn:</span>
                                                    <button 
                                                        type="button" 
                                                        className={styles.toggleCouponsBtn}
                                                        onClick={() => setShowCoupons(!showCoupons)}
                                                    >
                                                        {showCoupons ? 'Ẩn' : 'Xem tất cả'}
                                                    </button>
                                                </div>
                                                
                                                <div className={styles.quickCoupons}>
                                                    {COUPONS.map(coupon => (
                                                        <button
                                                            key={coupon.code}
                                                            type="button"
                                                            className={`${styles.quickCouponBtn} ${selectedCoupon?.code === coupon.code ? styles.selected : ''}`}
                                                            onClick={() => handleSelectCoupon(coupon)}
                                                        >
                                                            {coupon.code}
                                                        </button>
                                                    ))}
                                                </div>

                                                {showCoupons && (
                                                    <div className={styles.couponList}>
                                                        {COUPONS.map(coupon => (
                                                            <div key={coupon.code} className={styles.couponCard}>
                                                                <div className={styles.couponInfo}>
                                                                    <div className={styles.couponCode}>{coupon.code}</div>
                                                                    <div className={styles.couponDesc}>{coupon.desc}</div>
                                                                    <div className={styles.couponExpire}>
                                                                        Hết hạn: {coupon.expire || 'Không thời hạn'}
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    className={styles.selectCouponBtn}
                                                                    onClick={() => handleSelectCoupon(coupon)}
                                                                >
                                                                    {selectedCoupon?.code === coupon.code ? 'Đã chọn' : 'Chọn'}
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {selectedCoupon && (
                                                <div className={styles.selectedCoupon}>
                                                    <div className={styles.selectedCouponInfo}>
                                                        <span>🎉 Đã áp dụng: <strong>{selectedCoupon.code}</strong></span>
                                                        <button 
                                                            onClick={handleRemoveCoupon}
                                                            className={styles.removeCouponBtn}
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                    <div className={styles.discountInfo}>
                                                        Bạn được giảm: <strong>{discountAmount.toLocaleString('vi-VN')} VNĐ</strong>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="col-4 col-md-12 col-sm-12">
                                    <div className={styles.cartSummary}>
                                        <div className={styles.summaryRow}>
                                            <span>Tạm tính:</span>
                                            <span>{state.total.toLocaleString('vi-VN')} VNĐ</span>
                                        </div>                                        {selectedCoupon && (
                                            <div className={styles.summaryRow}>
                                                <span>Giảm giá ({selectedCoupon.code}):</span>
                                                <span className={styles.discountAmount}>-{discountAmount.toLocaleString('vi-VN')} VNĐ</span>
                                            </div>
                                        )}
                                        <div className={styles.total}>
                                            <strong>Tổng cộng: {finalTotal.toLocaleString('vi-VN')} VNĐ</strong>
                                        </div>
                                        <button className={styles.checkoutBtn} onClick={handleCheckout}>
                                            Thanh toán
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
