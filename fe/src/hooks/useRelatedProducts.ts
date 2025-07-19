import { useState, useCallback, useEffect } from 'react';
import { ProductWithCategory } from '@/types';
import { productService } from '@/services';

interface UseRelatedProductsOptions {
  currentId: string;
  category?: string;
  limit?: number;
}

export function useRelatedProducts({ currentId, category, limit = 8 }: UseRelatedProductsOptions) {
  const [relatedProducts, setRelatedProducts] = useState<ProductWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRelatedProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use public display products endpoint
      const products = await productService.getPublicDisplayProducts();
      
      if (Array.isArray(products)) {
        let filteredProducts = products.filter(
          (product: ProductWithCategory) => product._id !== currentId
        );

        // If category is provided, prioritize products from the same category
        if (category) {
          const sameCategoryProducts = filteredProducts.filter(
            (product: ProductWithCategory) => product.category?.name === category
          );
          const otherProducts = filteredProducts.filter(
            (product: ProductWithCategory) => product.category?.name !== category
          );
          
          // Mix same category products with others, prioritizing same category
          filteredProducts = [
            ...sameCategoryProducts.slice(0, Math.ceil(limit * 0.7)), // 70% same category
            ...otherProducts.slice(0, Math.floor(limit * 0.3)) // 30% other categories
          ];
        }
        
        // Limit the number of products
        const finalProducts = filteredProducts.slice(0, limit);
        setRelatedProducts(finalProducts);
      } else {
        setRelatedProducts([]);
      }
    } catch (err: any) {
      console.error('Error fetching related products:', err);
      setError(err.response?.data?.message || 'Failed to fetch related products');
      setRelatedProducts([]);
    } finally {
      setLoading(false);
    }
  }, [currentId, category, limit]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-fetch on mount or when dependencies change
  useEffect(() => {
    if (currentId) {
      fetchRelatedProducts();
    }
  }, [fetchRelatedProducts, currentId]);

  return {
    relatedProducts,
    loading,
    error,
    refetch: fetchRelatedProducts,
    clearError,
  };
}
