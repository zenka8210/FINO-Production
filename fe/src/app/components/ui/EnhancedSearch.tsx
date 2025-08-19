/**
 * Enhanced Search Component with Auto-complete
 * Advanced user feature for improved search experience
 */

'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/app/components/ui';
import styles from './EnhancedSearch.module.css';

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'product' | 'category' | 'brand' | 'recent';
  image?: string;
  price?: number;
  category?: string;
  url?: string;
}

interface EnhancedSearchProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
  className?: string;
  showRecentSearches?: boolean;
  maxSuggestions?: number;
  minSearchLength?: number;
}

const EnhancedSearch: React.FC<EnhancedSearchProps> = ({
  placeholder = 'Tìm kiếm sản phẩm...',
  onSearch,
  onSuggestionSelect,
  className = '',
  showRecentSearches = true,
  maxSuggestions = 8,
  minSearchLength = 2
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  // Load recent searches from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && showRecentSearches) {
      const saved = localStorage.getItem('recentSearches');
      if (saved) {
        try {
          setRecentSearches(JSON.parse(saved));
        } catch (error) {
          console.error('Failed to parse recent searches:', error);
        }
      }
    }
  }, [showRecentSearches]);

  // Save recent searches to localStorage
  const saveRecentSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim() || !showRecentSearches) return;

    const updated = [
      searchQuery,
      ...recentSearches.filter(item => item !== searchQuery)
    ].slice(0, 5); // Keep only 5 recent searches

    setRecentSearches(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('recentSearches', JSON.stringify(updated));
    }
  }, [recentSearches, showRecentSearches]);

  // Fetch search suggestions
  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < minSearchLength) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      // Mock API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay
      
      const mockSuggestions: SearchSuggestion[] = [
        {
          id: '1',
          text: 'iPhone 15 Pro Max',
          type: 'product' as const,
          image: '/images/products/iphone-15.jpg',
          price: 29990000,
          category: 'Điện thoại',
          url: '/products/iphone-15-pro-max'
        },
        {
          id: '2',
          text: 'Samsung Galaxy S24',
          type: 'product' as const,
          image: '/images/products/samsung-s24.jpg',
          price: 22990000,
          category: 'Điện thoại',
          url: '/products/samsung-galaxy-s24'
        },
        {
          id: '3',
          text: 'Điện thoại',
          type: 'category' as const,
          url: '/categories/smartphones'
        },
        {
          id: '4',
          text: 'Apple',
          type: 'brand' as const,
          url: '/brands/apple'
        }
      ].filter(item => 
        item.text.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, maxSuggestions);

      setSuggestions(mockSuggestions);
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [minSearchLength, maxSuggestions]);

  // Debounced search
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      if (query.trim()) {
        fetchSuggestions(query);
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [query, fetchSuggestions]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);
    setShowSuggestions(true);
  };

  // Handle search submission
  const handleSearch = (searchQuery: string = query) => {
    if (!searchQuery.trim()) return;

    saveRecentSearch(searchQuery);
    setShowSuggestions(false);
    setQuery(searchQuery);
    
    if (onSearch) {
      onSearch(searchQuery);
    } else {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text);
    setShowSuggestions(false);
    saveRecentSearch(suggestion.text);

    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion);
    } else if (suggestion.url) {
      router.push(suggestion.url);
    } else {
      handleSearch(suggestion.text);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const totalSuggestions = suggestions.length + (showRecentSearches ? recentSearches.length : 0);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % totalSuggestions);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev <= 0 ? totalSuggestions - 1 : prev - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          if (selectedIndex < suggestions.length) {
            handleSuggestionSelect(suggestions[selectedIndex]);
          } else {
            const recentIndex = selectedIndex - suggestions.length;
            handleSearch(recentSearches[recentIndex]);
          }
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle focus/blur
  const handleFocus = () => {
    setIsFocused(true);
    setShowSuggestions(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Delay hiding suggestions to allow for click
    setTimeout(() => setShowSuggestions(false), 150);
  };

  // Format price for display
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  // Get icon for suggestion type
  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'product': return 'fas fa-cube';
      case 'category': return 'fas fa-tags';
      case 'brand': return 'fas fa-trademark';
      case 'recent': return 'fas fa-history';
      default: return 'fas fa-search';
    }
  };

  const containerClasses = [
    styles.searchContainer,
    isFocused ? styles.focused : '',
    className
  ].filter(Boolean).join(' ');

  const showSuggestionsDropdown = showSuggestions && (suggestions.length > 0 || (showRecentSearches && recentSearches.length > 0 && !query));

  return (
    <div className={containerClasses}>
      <div className={styles.inputWrapper}>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={styles.searchInput}
        />
        
        <div className={styles.inputActions}>
          {isLoading && (
            <div className={styles.loadingIndicator}>
              <LoadingSpinner size="sm" />
            </div>
          )}
          
          <button
            type="button"
            onClick={() => handleSearch()}
            className={styles.searchButton}
            aria-label="Tìm kiếm"
          >
            <i className="fas fa-search" />
          </button>
        </div>
      </div>

      {showSuggestionsDropdown && (
        <div ref={suggestionsRef} className={styles.suggestionsDropdown}>
          {/* Search Suggestions */}
          {suggestions.length > 0 && (
            <div className={styles.suggestionGroup}>
              <div className={styles.groupHeader}>
                <i className="fas fa-search" />
                <span>Gợi ý tìm kiếm</span>
              </div>
              {suggestions.map((suggestion, index) => (
                <div
                  key={suggestion.id}
                  className={`${styles.suggestionItem} ${index === selectedIndex ? styles.selected : ''}`}
                  onClick={() => handleSuggestionSelect(suggestion)}
                >
                  <div className={styles.suggestionIcon}>
                    <i className={getSuggestionIcon(suggestion.type)} />
                  </div>
                  
                  {suggestion.image && (
                    <div className={styles.suggestionImage}>
                      <img src={suggestion.image} alt={suggestion.text} />
                    </div>
                  )}
                  
                  <div className={styles.suggestionContent}>
                    <div className={styles.suggestionText}>
                      {suggestion.text}
                    </div>
                    {suggestion.category && (
                      <div className={styles.suggestionCategory}>
                        trong {suggestion.category}
                      </div>
                    )}
                    {suggestion.price && (
                      <div className={styles.suggestionPrice}>
                        {formatPrice(suggestion.price)}
                      </div>
                    )}
                  </div>
                  
                  <div className={styles.suggestionType}>
                    {suggestion.type === 'product' && 'Sản phẩm'}
                    {suggestion.type === 'category' && 'Danh mục'}
                    {suggestion.type === 'brand' && 'Thương hiệu'}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recent Searches */}
          {showRecentSearches && recentSearches.length > 0 && !query && (
            <div className={styles.suggestionGroup}>
              <div className={styles.groupHeader}>
                <i className="fas fa-history" />
                <span>Tìm kiếm gần đây</span>
                <button
                  type="button"
                  onClick={() => {
                    setRecentSearches([]);
                    localStorage.removeItem('recentSearches');
                  }}
                  className={styles.clearButton}
                >
                  Xóa
                </button>
              </div>
              {recentSearches.map((search, index) => (
                <div
                  key={`recent-${index}`}
                  className={`${styles.suggestionItem} ${(suggestions.length + index) === selectedIndex ? styles.selected : ''}`}
                  onClick={() => handleSearch(search)}
                >
                  <div className={styles.suggestionIcon}>
                    <i className="fas fa-history" />
                  </div>
                  <div className={styles.suggestionContent}>
                    <div className={styles.suggestionText}>
                      {search}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedSearch;
