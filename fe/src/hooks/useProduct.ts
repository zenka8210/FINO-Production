import { useState, useEffect } from 'react';
import { ProductWithCategory } from '@/types';
import { productService } from '@/services';

/**
 * Hook for fetching a single product by ID
 * Optimized to prevent infinite re-renders
 */
export function useProduct(productId: string) {
  const [product, setProduct] = useState<ProductWithCategory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) return;

    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching product with ID:', productId);
        
        const productData = await productService.getPublicProductById(productId);
        console.log('Product data received:', productData);
        
        setProduct(productData);
      } catch (err: any) {
        console.error('Error fetching product:', err);
        setError(err.message || 'Failed to fetch product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]); // Only re-run when productId changes

  return {
    product,
    loading,
    error,
    refetch: () => {
      if (productId) {
        const fetchProduct = async () => {
          try {
            setLoading(true);
            setError(null);
            const productData = await productService.getPublicProductById(productId);
            setProduct(productData);
          } catch (err: any) {
            setError(err.message);
          } finally {
            setLoading(false);
          }
        };
        fetchProduct();
      }
    }
  };
}
