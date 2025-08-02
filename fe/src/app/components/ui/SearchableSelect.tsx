"use client";
import { useState, useRef, useEffect } from 'react';
import styles from './SearchableSelect.module.css';

interface Option {
  _id: string;
  name: string;
  isActive?: boolean;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const SearchableSelect = ({
  options,
  value,
  onChange,
  placeholder = "Chọn...",
  disabled = false,
  className = ""
}: SearchableSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get selected option display name
  const selectedOption = options.find(opt => opt._id === value);
  const displayValue = selectedOption ? selectedOption.name : '';

  // Handle input focus
  const handleInputFocus = () => {
    setIsOpen(true);
    setSearchTerm('');
    setHighlightedIndex(-1);
  };

  // Handle input blur
  const handleInputBlur = () => {
    // Delay to allow option click
    setTimeout(() => {
      setIsOpen(false);
      setSearchTerm('');
      setHighlightedIndex(-1);
    }, 150);
  };

  // Handle option select
  const handleOptionSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
    inputRef.current?.blur();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleOptionSelect(filteredOptions[highlightedIndex]._id);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Scroll highlighted option into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [highlightedIndex]);

  return (
    <div className={`${styles.searchableSelect} ${className}`}>
      <div className={styles.inputContainer}>
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? searchTerm : displayValue}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={styles.input}
          autoComplete="off"
        />
        <div className={`${styles.arrow} ${isOpen ? styles.arrowUp : ''}`}>
          ▼
        </div>
      </div>

      {isOpen && (
        <ul ref={listRef} className={styles.optionsList}>
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <li
                key={option._id}
                className={`${styles.option} ${
                  index === highlightedIndex ? styles.highlighted : ''
                } ${
                  option._id === value ? styles.selected : ''
                } ${
                  option.isActive === false ? styles.inactive : ''
                }`}
                onMouseDown={(e) => e.preventDefault()} // Prevent blur
                onClick={() => handleOptionSelect(option._id)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                {option.name}
                {option.isActive === false && <span className={styles.inactiveLabel}> (Không hoạt động)</span>}
              </li>
            ))
          ) : (
            <li className={styles.noOptions}>
              Không tìm thấy kết quả cho "{searchTerm}"
            </li>
          )}
        </ul>
      )}
    </div>
  );
};

export default SearchableSelect;
