import { useState, useEffect } from 'react';
import { ProductWithCategory } from '@/types';
import { productService } from '@/services';

/**
 * Hook for fetching a single product by ID
 * Optimized to prevent infinite re-renders
 */
export function useProductDebug(productId: string) {
  const [product, setProduct] = useState<ProductWithCategory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🚀 useProduct: useEffect triggered with productId:', productId);
    console.log('🚀 useProduct: typeof productId:', typeof productId);
    
    // Force alert to debug
    if (typeof window !== 'undefined') {
      // alert(`useProduct called with: ${productId}`);
    }
    
    if (!productId) {
      console.log('⚠️ useProduct: No productId provided, skipping fetch');
      return;
    }

    console.log('✅ useProduct: Calling fetchProduct...');

    // Add a slight delay to ensure logs appear
    setTimeout(() => {
      console.log('⏰ useProduct: About to start fetchProduct');
    }, 100);

    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('🔍 useProduct: Fetching product with ID:', productId);
        
        const productData = await productService.getPublicProductById(productId);
        console.log('✅ useProduct: Product data received:', productData);
        console.log('🎨 useProduct: Variants check:', productData?.variants?.length || 'No variants');
        
        setProduct(productData);
      } catch (err: any) {
        console.error('❌ useProduct: Error fetching product:', err);
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
