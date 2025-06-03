'use client';

import { useEffect, useReducer } from 'react';
import styles from './checkout.module.css';
import { useRouter } from 'next/navigation';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface CheckoutState {
  items: CartItem[];
  total: number;
  name: string;
  address: string;
  isSubmitting: boolean;
  success: boolean;
}

type Action =
  | { type: 'LOAD_CART'; payload: CartItem[] }
  | { type: 'UPDATE_FIELD'; field: string; value: string }
  | { type: 'SUBMIT' }
  | { type: 'SUCCESS' };

const initialState: CheckoutState = {
  items: [],
  total: 0,
  name: '',
  address: '',
  isSubmitting: false,
  success: false,
};

function calculateTotal(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function checkoutReducer(state: CheckoutState, action: Action): CheckoutState {
  switch (action.type) {
    case 'LOAD_CART':
      return {
        ...state,
        items: action.payload,
        total: calculateTotal(action.payload),
      };
    case 'UPDATE_FIELD':
      return {
        ...state,
        [action.field]: action.value,
      };
    case 'SUBMIT':
      return {
        ...state,
        isSubmitting: true,
      };
    case 'SUCCESS':
      return {
        ...initialState,
        success: true,
      };
    default:
      return state;
  }
}

export default function CheckoutPage() {
  const [state, dispatch] = useReducer(checkoutReducer, initialState);
  const router = useRouter();

  useEffect(() => {
    const cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
    dispatch({ type: 'LOAD_CART', payload: cartItems });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.name || !state.address) {
      alert('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    dispatch({ type: 'SUBMIT' });

    setTimeout(() => {
      localStorage.removeItem('cart');
      dispatch({ type: 'SUCCESS' });
      alert('Đặt hàng thành công! 🎉');
      router.push('/');
    }, 1000);
  };

  if (state.success) {
    return <p>Đặt hàng thành công! Cảm ơn bạn đã mua hàng 🙏</p>;
  }

  return (
    <div className={styles.checkoutPage}>
      <h1>Thanh Toán</h1>
      <ul className={styles.itemList}>
  {state.items.map(item => (
    <li key={item.id} className={styles.item}>
      <img src={item.image} alt={item.name} className={styles.itemImage} width="100px"/>
      <div className={styles.itemInfo}>
        <p className={styles.itemName}>{item.name}</p>
        <p className={styles.itemPrice}>
          {item.quantity} x {item.price.toLocaleString('vi-VN')} = {(item.price * item.quantity).toLocaleString('vi-VN')} VNĐ
        </p>
      </div>
    </li>
  ))}
</ul>


      <p><strong>Tổng cộng:</strong> {state.total.toLocaleString('vi-VN')} VNĐ</p>

      <form onSubmit={handleSubmit} className={styles.checkoutForm}>
        <div>
          <label>Họ tên:</label>
          <input
            type="text"
            value={state.name}
            onChange={e => dispatch({ type: 'UPDATE_FIELD', field: 'name', value: e.target.value })}
            required
          />
        </div>
        <div>
          <label>Địa chỉ giao hàng:</label>
          <input
            type="text"
            value={state.address}
            onChange={e => dispatch({ type: 'UPDATE_FIELD', field: 'address', value: e.target.value })}
            required
          />
        </div>

        <button type="submit" disabled={state.isSubmitting}>
          {state.isSubmitting ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
        </button>
      </form>
    </div>
  );
}
