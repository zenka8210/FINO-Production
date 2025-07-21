"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProductWithCategory } from '@/types';
import { useProducts } from '@/hooks';
import { cn, debounce, truncate } from '@/lib/utils';
import styles from './SearchBar.module.css';

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  onChange?: (query: string) => void; // For real-time onChange
  value?: string; // Controlled value
  className?: string;
  showSuggestions?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = "Tìm kiếm sản phẩm...",
  onSearch,
  onChange,
  value,
  className,
  showSuggestions = true
}) => {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState<ProductWithCategory[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  const { searchProducts } = useProducts();

  // Sync with external value prop
  useEffect(() => {
    if (value !== undefined && value !== query) {
      setQuery(value);
    }
  }, [value]); // Remove query from dependencies to avoid loop

  // Debounced search function
  const debouncedSearch = debounce(async (searchQuery: string) => {
    if (!showSuggestions || searchQuery.length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    try {
      const results = await searchProducts(searchQuery, { limit: 5 });
      setSuggestions(results.data || []);
      setIsOpen(true);
    } catch (error) {
      console.error('Search error:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, 300);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    // Call onChange prop for real-time updates
    if (onChange) {
      onChange(value);
    }
    
    if (value.length >= 2) {
      setIsLoading(true);
    }
    
    debouncedSearch(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      handleSearch(query.trim());
    }
  };

  const handleSearch = (searchQuery: string) => {
    setIsOpen(false);
    if (onSearch) {
      onSearch(searchQuery);
    } else {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleSuggestionClick = (product: ProductWithCategory) => {
    setQuery(product.name);
    setIsOpen(false);
    router.push(`/products/${product._id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn(styles.searchContainer, className)}>
      <form onSubmit={handleSubmit} className={styles.searchForm}>
        <div className={styles.inputWrapper}>
          <svg
            className={styles.searchIcon}
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => query.length >= 2 && suggestions.length > 0 && setIsOpen(true)}
            placeholder={placeholder}
            className={styles.searchInput}
            autoComplete="off"
          />
          
          {isLoading && (
            <div className={styles.loadingIcon}>
              <svg
                className={styles.spinner}
                width="16"
                height="16"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  className={styles.spinnerCircle}
                />
                <path
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  className={styles.spinnerPath}
                />
              </svg>
            </div>
          )}
          
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSuggestions([]);
                setIsOpen(false);
                inputRef.current?.focus();
              }}
              className={styles.clearButton}
              aria-label="Xóa tìm kiếm"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
        
        <button type="submit" className={styles.searchButton}>
          Tìm kiếm
        </button>
      </form>

      {/* Suggestions dropdown */}
      {showSuggestions && isOpen && suggestions.length > 0 && (
        <div ref={suggestionsRef} className={styles.suggestions}>
          {suggestions.map((product) => (
            <button
              key={product._id}
              onClick={() => handleSuggestionClick(product)}
              className={styles.suggestionItem}
            >
              <div className={styles.suggestionContent}>
                <span className={styles.suggestionName}>
                  {truncate(product.name, 50)}
                </span>
                <span className={styles.suggestionCategory}>
                  {product.category?.name}
                </span>
              </div>
            </button>
          ))}
          
          {query && (
            <button
              onClick={() => handleSearch(query)}
              className={styles.viewAllButton}
            >
              Xem tất cả kết quả cho "{truncate(query, 20)}"
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
