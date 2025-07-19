'use client';

import { useParams } from 'next/navigation';
import ProductDetailPage from './ProductDetailPage';

export default function ProductDetail() {
  const params = useParams();
  const productId = params?.id as string;

  if (!productId) {
    return <div>Invalid product ID</div>;
  }

  return <ProductDetailPage productId={productId} />;
}