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

        // Filter out products without stock/variants - check backend stockInfo if available
        const productsWithStock = filteredProducts.filter((product: ProductWithCategory) => {
          // If backend provides stockInfo, use it
          if (product.stockInfo) {
            const stockInfo = product.stockInfo as any;
            return stockInfo.available || stockInfo.totalStock > 0;
          }
          
          // Fallback: assume active products are available
          return product.isActive;
        });

        console.log('🔍 Products with stock after filtering:', productsWithStock.length, 'out of', filteredProducts.length);

        // Use products with stock for related logic
        filteredProducts = productsWithStock;

        // Enhanced related products logic
        if (category) {
          // Only get products from the SAME category (exact match)
          const sameCategoryProducts = filteredProducts.filter(
            (product: ProductWithCategory) => {
              if (!product.category) return false;
              
              // Get category name from product
              const productCategoryName = typeof product.category === 'object' 
                ? product.category.name 
                : product.category;
              
              // Exact match with current product's category
              return productCategoryName === category;
            }
          );
          
          console.log(`🔗 Same category "${category}" products found:`, sameCategoryProducts.length);
          
          // Use only same category products
          filteredProducts = sameCategoryProducts;
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
