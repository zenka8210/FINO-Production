"use client";
import { useRouter } from 'next/navigation';
import Button from './ui/Button';

export default function CheckoutButton() {
  const router = useRouter();
  return (
    <div style={{width:'100%',display:'flex',justifyContent:'center',margin:'24px 0 0 0'}}>
      <Button
        variant="primary"
        size="lg"
        onClick={() => router.push('/checkout')}
      >
        Thanh toán tất cả sản phẩm trong giỏ hàng
      </Button>
    </div>
  );
}
