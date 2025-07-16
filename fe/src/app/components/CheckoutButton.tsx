"use client";
import { useRouter } from 'next/navigation';

export default function CheckoutButton() {
  const router = useRouter();
  return (
    <div style={{width:'100%',display:'flex',justifyContent:'center',margin:'24px 0 0 0'}}>
      <button
        onClick={() => router.push('/checkout')}
        className="btn-brand btn-lg"
        style={{
          fontSize: '1.2rem',
          fontWeight: 700,
          padding: '14px 38px',
          letterSpacing: 1,
        }}
      >
        Thanh toán tất cả sản phẩm trong giỏ hàng
      </button>
    </div>
  );
}
