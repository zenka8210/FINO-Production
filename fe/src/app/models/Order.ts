export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentMethod = 'COD' | 'CreditCard' | 'BankTransfer' | 'Momo' | 'ZaloPay' | 'VNPay';

export interface Order {
  id: number;
  createdAt: string; // ISO date
  finalTotal: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  items: OrderItem[];
}
