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
      console.log('🔄 Fetching related products with review stats for:', { currentId, category, limit });
      setLoading(true);
      setError(null);
      
      // Use products with review stats like featured products
      const response = await productService.getProducts({ 
        limit: 50,
        includeReviewStats: true  // Get real review statistics
      });
      const products = Array.isArray(response.data) ? response.data : 
                      (response.data && Array.isArray((response.data as any).data)) ? (response.data as any).data : [];
      
      console.log('📊 Related products response:', products?.length, 'products with review stats');
      
      if (products && products.length > 0) {
        let filteredProducts = products.filter(
          (product: ProductWithCategory) => product._id !== currentId
        );

        // Enhanced related products logic
        if (category) {
          // 1. Same category products (highest priority)
          const sameCategoryProducts = filteredProducts.filter(
            (product: ProductWithCategory) => 
              product.category && 
              (typeof product.category === 'object' ? product.category.name === category : product.category === category)
          );
          
          // 2. Similar price range products from same category  
          const currentProduct = products.find((p: ProductWithCategory) => p._id === currentId);
          let similarPriceProducts: ProductWithCategory[] = [];
          
          if (currentProduct) {
            const priceRange = currentProduct.price * 0.3; // +/- 30% price range
            similarPriceProducts = sameCategoryProducts.filter(
              (product: ProductWithCategory) => 
                Math.abs(product.price - currentProduct.price) <= priceRange
            );
          }

          // 3. Other products from same category
          const otherSameCategoryProducts = sameCategoryProducts.filter(
            (product: ProductWithCategory) => 
              !similarPriceProducts.some(p => p._id === product._id)
          );

          // 4. Popular products from other categories (fallback)
          const otherCategoryProducts = filteredProducts.filter(
            (product: ProductWithCategory) => 
              product.category && 
              (typeof product.category === 'object' ? product.category.name !== category : product.category !== category)
          );

          // Combine with smart prioritization
          const combinedProducts = [
            ...similarPriceProducts.slice(0, Math.ceil(limit * 0.5)), // 50% similar price same category
            ...otherSameCategoryProducts.slice(0, Math.ceil(limit * 0.3)), // 30% other same category
            ...otherCategoryProducts.slice(0, Math.floor(limit * 0.2)) // 20% other categories
          ];

          filteredProducts = combinedProducts;
        }
        
        // Shuffle to add variety and limit
        const shuffled = filteredProducts.sort(() => 0.5 - Math.random());
        const finalProducts = shuffled.slice(0, limit);
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
