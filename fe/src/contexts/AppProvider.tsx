'use client';

import React from 'react';
import {
  AuthProvider,
  NotificationProvider,
  CartProvider,
  WishlistProvider,
  ProductProvider,
  OrderProvider,
} from './index';

interface AppProviderProps {
  children: React.ReactNode;
}

/**
 * Simplified App Provider with only essential contexts that manage global state.
 * Removed contexts that only wrapped services without managing global state.
 * 
 * Order is important: 
 * 1. NotificationProvider - foundational, used by all others
 * 2. AuthProvider - authentication context
 * 3. CartProvider, WishlistProvider - depend on auth
 * 4. ProductProvider, OrderProvider - manage UI state/filters only
 */
export function AppProvider({ children }: AppProviderProps) {
  return (
    <NotificationProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <ProductProvider>
              <OrderProvider>
                {children}
              </OrderProvider>
            </ProductProvider>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </NotificationProvider>
  );
}
