'use client';
import { useEffect, useReducer } from 'react';
import { useRouter } from 'next/navigation';
import CartList from '../component/CartList';
import styles from './cart.module.css';

interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
}

type Action =
    | { type: 'LOAD_CART'; payload: CartItem[] }
    | { type: 'INCREASE'; id: string }
    | { type: 'DECREASE'; id: string }
    | { type: 'REMOVE'; id: string }
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
            };

        case 'INCREASE':
            updatedItems = state.items.map(item =>
                item.id === action.id ? { ...item, quantity: item.quantity + 1 } : item
            );
            saveToStorage(updatedItems);
            return {
                items: updatedItems,
                total: calculateTotal(updatedItems),
            };

        case 'DECREASE':
            updatedItems = state.items.map(item =>
                item.id === action.id && item.quantity > 1
                    ? { ...item, quantity: item.quantity - 1 }
                    : item
            );
            saveToStorage(updatedItems);
            return {
                items: updatedItems,
                total: calculateTotal(updatedItems),
            };

        case 'REMOVE':
            updatedItems = state.items.filter(item => item.id !== action.id);
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
    const router = useRouter();

    useEffect(() => {
        const storedItems: CartItem[] = JSON.parse(localStorage.getItem('cart') || '[]');
        dispatch({ type: 'LOAD_CART', payload: storedItems });

        const handleStorage = () => {
            const updated: CartItem[] = JSON.parse(localStorage.getItem('cart') || '[]');
            dispatch({ type: 'LOAD_CART', payload: updated });
        };

        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    const handleIncrease = (id: string) => dispatch({ type: 'INCREASE', id });
    const handleDecrease = (id: string) => dispatch({ type: 'DECREASE', id });
    const handleRemove = (id: string) => dispatch({ type: 'REMOVE', id });

    const handleCheckout = () => {
        router.push('/checkout');
    };

    return (
        <div className={styles.cartPage}>
            <h1>Giỏ hàng của bạn</h1>
            {state.items.length === 0 ? (
                <p>Giỏ hàng đang trống.</p>
            ) : (
                <>
                    <CartList
                        items={state.items}
                        onIncrease={handleIncrease}
                        onDecrease={handleDecrease}
                        onRemove={handleRemove}
                    />
                    <div className={styles.total}>
                        <h3>Tổng tiền: {state.total.toLocaleString('vi-VN')} VNĐ</h3>
                        <button className={styles.checkoutBtn} onClick={handleCheckout}>
                            Thanh toán
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
