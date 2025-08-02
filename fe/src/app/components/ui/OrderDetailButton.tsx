'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui';

interface OrderDetailButtonProps {
  orderId: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children?: React.ReactNode;
}

/**
 * Reusable button component for navigating to order detail page
 * Used in both profile orders section and orders list page
 */
const OrderDetailButton: React.FC<OrderDetailButtonProps> = ({
  orderId,
  variant = 'primary',
  size = 'sm',
  className,
  children = 'Xem chi tiết'
}) => {
  const router = useRouter();

  const handleViewDetail = () => {
    router.push(`/orders/${orderId}`);
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleViewDetail}
      className={className}
    >
      {children}
    </Button>
  );
};

export default OrderDetailButton;
