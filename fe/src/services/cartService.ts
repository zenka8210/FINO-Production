import { apiClient } from '@/lib/api';
import { 
  Cart, 
  CartWithRefs, 
  CartItem, 
  AddToCartRequest, 
  ApiResponse,
  PaginatedResponse
} from '@/types';

export class CartService {
  private static instance: CartService;

  private constructor() {}

  public static getInstance(): CartService {
    if (!CartService.instance) {
      CartService.instance = new CartService();
    }
    return CartService.instance;
  }

  /**
   * Get user's cart
   */
  async getCart(): Promise<CartWithRefs> {
    try {
      const response = await apiClient.get<CartWithRefs>('/api/cart');
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch cart');
    }
  }

  /**
   * Get cart items count
   */
  async getCartCount(): Promise<number> {
    try {
      const response = await apiClient.get<{ count: number }>('/api/cart/count');
      return response.data?.count || 0;
    } catch (error: any) {
      console.error('Failed to get cart count:', error);
      return 0;
    }
  }

  /**
   * Add item to cart
   */
  async addToCart(productVariantId: string, quantity: number): Promise<CartWithRefs> {
    try {
      const requestData: AddToCartRequest = {
        productVariant: productVariantId,
        quantity
      };
      
      const response = await apiClient.post<CartWithRefs>('/api/cart/items', requestData);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to add item to cart');
    }
  }

  /**
   * Update cart item quantity
   */
  async updateCartItem(productVariantId: string, quantity: number): Promise<CartWithRefs> {
    try {
      const response = await apiClient.put<CartWithRefs>(`/api/cart/items/${productVariantId}`, { quantity });
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update cart item');
    }
  }

  /**
   * Remove item from cart
   */
  async removeFromCart(productVariantId: string): Promise<CartWithRefs> {
    try {
      const response = await apiClient.delete<CartWithRefs>(`/api/cart/items/${productVariantId}`);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to remove item from cart');
    }
  }

  /**
   * Clear cart
   */
  async clearCart(): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.delete('/api/cart/clear');
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to clear cart');
    }
  }

  /**
   * Apply voucher to cart
   */
  async applyVoucher(voucherCode: string): Promise<CartWithRefs> {
    try {
      const response = await apiClient.post<CartWithRefs>('/api/cart/apply-voucher', { voucherCode });
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to apply voucher');
    }
  }

  /**
   * Remove voucher from cart
   */
  async removeVoucher(): Promise<CartWithRefs> {
    try {
      const response = await apiClient.post<CartWithRefs>('/api/cart/remove-voucher');
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to remove voucher');
    }
  }

  /**
   * Sync cart from session to database (after login)
   * POST /api/cart/sync
   */
  async syncCart(sessionCart: any): Promise<CartWithRefs> {
    try {
      const response = await apiClient.post<CartWithRefs>('/api/cart/sync', { sessionCart });
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to sync cart');
    }
  }

  /**
   * Validate cart items (check availability, stock, etc.)
   * POST /api/cart/validate
   */
  async validateCart(): Promise<{ isValid: boolean; errors: any[] }> {
    try {
      const response = await apiClient.post<{ isValid: boolean; errors: any[] }>('/api/cart/validate');
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to validate cart');
    }
  }

  /**
   * Calculate cart total with shipping and discounts
   * POST /api/cart/calculate-total
   */
  async calculateTotal(addressId?: string, voucherCode?: string): Promise<{
    subtotal: number;
    discountAmount: number;
    shippingFee: number;
    finalTotal: number;
  }> {
    try {
      const response = await apiClient.post('/api/cart/calculate-total', { addressId, voucherCode });
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to calculate total');
    }
  }

  /**
   * Checkout cart and create order
   * POST /api/cart/checkout
   */
  async checkout(checkoutData: {
    addressId: string;
    paymentMethod: string;
    voucherCode?: string;
    notes?: string;
  }): Promise<{ order: any; cart: CartWithRefs }> {
    try {
      const response = await apiClient.post('/api/cart/checkout', checkoutData);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to checkout');
    }
  }

  // ========== ADMIN METHODS ==========

  /**
   * Get all carts (Admin)
   * GET /api/cart/admin/all
   */
  async getAllCarts(filters?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<CartWithRefs>> {
    try {
      const response = await apiClient.getPaginated<CartWithRefs>('/api/cart/admin/all', filters);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch all carts');
    }
  }

  /**
   * Get cart-related orders (Admin)
   * GET /api/cart/admin/orders
   */
  async getCartOrders(filters?: any): Promise<any> {
    try {
      const response = await apiClient.get('/api/cart/admin/orders', filters);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch cart orders');
    }
  }

  /**
   * Get active carts (Admin)
   * GET /api/cart/admin/active-carts
   */
  async getActiveCarts(filters?: any): Promise<CartWithRefs[]> {
    try {
      const response = await apiClient.get<CartWithRefs[]>('/api/cart/admin/active-carts', filters);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch active carts');
    }
  }

  /**
   * Get cart statistics (Admin)
   * GET /api/cart/admin/statistics
   */
  async getCartStatistics(): Promise<{
    totalCarts: number;
    activeCarts: number;
    abandonedCarts: number;
    averageCartValue: number;
    conversionRate: number;
  }> {
    try {
      const response = await apiClient.get('/api/cart/admin/statistics');
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch cart statistics');
    }
  }

  /**
   * Get cart trends (Admin)
   * GET /api/cart/admin/trends
   */
  async getCartTrends(period?: 'day' | 'week' | 'month'): Promise<{
    chartData: any[];
    summary: any;
  }> {
    try {
      const params = period ? { period } : {};
      const response = await apiClient.get('/api/cart/admin/trends', params);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch cart trends');
    }
  }

  /**
   * Get cart total
   */
  getCartTotal(cart: CartWithRefs): number {
    return cart.finalTotal || 0;
  }

  /**
   * Get cart items count from cart data
   */
  getCartItemsCount(cart: CartWithRefs): number {
    return cart.items.reduce((total, item) => total + item.quantity, 0);
  }

  /**
   * Check if item exists in cart
   */
  isItemInCart(cart: CartWithRefs, productVariantId: string): boolean {
    return cart.items.some(item => item.productVariant._id === productVariantId);
  }

  /**
   * Get cart item quantity
   */
  getItemQuantity(cart: CartWithRefs, productVariantId: string): number {
    const item = cart.items.find(item => item.productVariant._id === productVariantId);
    return item?.quantity || 0;
  }
}

// Export singleton instance
export const cartService = CartService.getInstance();
export default cartService;
