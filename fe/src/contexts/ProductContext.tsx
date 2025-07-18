'use client';

import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { ProductFilters } from '@/types';

interface ProductState {
  filters: ProductFilters;
  isFiltersOpen: boolean;
}

// Simple product context for managing filters and UI state only
// Product data operations are handled directly through productService
interface ProductContextType {
  filters: ProductFilters;
  isFiltersOpen: boolean;
  setFilters: (filters: Partial<ProductFilters>) => void;
  clearFilters: () => void;
  toggleFilters: () => void;
  setCategory: (categoryId: string) => void;
  setPriceRange: (minPrice: number, maxPrice: number) => void;
  setSearchTerm: (term: string) => void;
}

type ProductAction =
  | { type: 'SET_FILTERS'; payload: Partial<ProductFilters> }
  | { type: 'CLEAR_FILTERS' }
  | { type: 'TOGGLE_FILTERS' }
  | { type: 'SET_CATEGORY'; payload: string }
  | { type: 'SET_PRICE_RANGE'; payload: { minPrice: number; maxPrice: number } }
  | { type: 'SET_SEARCH_TERM'; payload: string };

const initialState: ProductState = {
  filters: {},
  isFiltersOpen: false,
};

function productReducer(state: ProductState, action: ProductAction): ProductState {
  switch (action.type) {
    case 'SET_FILTERS':
      return {
        ...state,
        filters: { ...state.filters, ...action.payload }
      };
    case 'CLEAR_FILTERS':
      return {
        ...state,
        filters: {}
      };
    case 'TOGGLE_FILTERS':
      return {
        ...state,
        isFiltersOpen: !state.isFiltersOpen
      };
    case 'SET_CATEGORY':
      return {
        ...state,
        filters: { ...state.filters, category: action.payload }
      };
    case 'SET_PRICE_RANGE':
      return {
        ...state,
        filters: { 
          ...state.filters, 
          minPrice: action.payload.minPrice,
          maxPrice: action.payload.maxPrice
        }
      };
    case 'SET_SEARCH_TERM':
      return {
        ...state,
        filters: { ...state.filters, search: action.payload }
      };
    default:
      return state;
  }
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

interface ProductProviderProps {
  children: React.ReactNode;
}

export function ProductProvider({ children }: ProductProviderProps) {
  const [state, dispatch] = useReducer(productReducer, initialState);

  const setFilters = useCallback((filters: Partial<ProductFilters>): void => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  }, []);

  const clearFilters = useCallback((): void => {
    dispatch({ type: 'CLEAR_FILTERS' });
  }, []);

  const toggleFilters = useCallback((): void => {
    dispatch({ type: 'TOGGLE_FILTERS' });
  }, []);

  const setCategory = useCallback((categoryId: string): void => {
    dispatch({ type: 'SET_CATEGORY', payload: categoryId });
  }, []);

  const setPriceRange = useCallback((minPrice: number, maxPrice: number): void => {
    dispatch({ type: 'SET_PRICE_RANGE', payload: { minPrice, maxPrice } });
  }, []);

  const setSearchTerm = useCallback((term: string): void => {
    dispatch({ type: 'SET_SEARCH_TERM', payload: term });
  }, []);

  const contextValue: ProductContextType = {
    filters: state.filters,
    isFiltersOpen: state.isFiltersOpen,
    setFilters,
    clearFilters,
    toggleFilters,
    setCategory,
    setPriceRange,
    setSearchTerm,
  };

  return (
    <ProductContext.Provider value={contextValue}>
      {children}
    </ProductContext.Provider>
  );
}

export function useProduct(): ProductContextType {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProduct must be used within a ProductProvider');
  }
  return context;
}

export default ProductContext;
