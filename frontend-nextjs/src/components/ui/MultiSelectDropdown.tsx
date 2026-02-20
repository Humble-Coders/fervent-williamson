'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Search, Check } from 'lucide-react';

export interface MultiSelectOption {
  id: string;
  name: string;
  description?: string;
  price?: number;
  duration?: number;
  category?: string;
}

interface MultiSelectDropdownProps {
  options: MultiSelectOption[];
  selectedIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  maxHeight?: number;
  showSearch?: boolean;
  showSelectAll?: boolean;
  className?: string;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  options,
  selectedIds,
  onSelectionChange,
  placeholder = "Select options...",
  disabled = false,
  maxHeight: _maxHeight = 300,
  showSearch = true,
  showSelectAll = true,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get selected options for display
  const selectedOptions = options.filter(option => selectedIds.includes(option.id));

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, showSearch]);

  const handleToggleOption = (optionId: string) => {
    if (disabled) return;
    
    const newSelectedIds = selectedIds.includes(optionId)
      ? selectedIds.filter(id => id !== optionId)
      : [...selectedIds, optionId];
    
    onSelectionChange(newSelectedIds);
  };

  const handleSelectAll = () => {
    if (disabled) return;
    
    const allFilteredIds = filteredOptions.map(option => option.id);
    const allSelected = allFilteredIds.every(id => selectedIds.includes(id));
    
    if (allSelected) {
      // Deselect all filtered options
      const newSelectedIds = selectedIds.filter(id => !allFilteredIds.includes(id));
      onSelectionChange(newSelectedIds);
    } else {
      // Select all filtered options
      const newSelectedIds = [...new Set([...selectedIds, ...allFilteredIds])];
      onSelectionChange(newSelectedIds);
    }
  };

  const handleRemoveSelected = (optionId: string) => {
    if (disabled) return;
    const newSelectedIds = selectedIds.filter(id => id !== optionId);
    onSelectionChange(newSelectedIds);
  };

  const handleClearAll = () => {
    if (disabled) return;
    onSelectionChange([]);
  };

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setSearchTerm('');
      }
    }
  };

  const allFilteredSelected = filteredOptions.length > 0 && 
    filteredOptions.every(option => selectedIds.includes(option.id));

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Main Input Area */}
      <div
        className={`
          min-h-[44px] w-full px-3 py-2 border rounded-lg cursor-pointer
          flex items-center justify-between gap-2
          ${disabled 
            ? 'bg-gray-100 border-gray-300 cursor-not-allowed opacity-50' 
            : 'bg-white border-gray-300 hover:border-gray-400 focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500'
          }
          ${isOpen ? 'border-primary-500 ring-1 ring-primary-500' : ''}
        `}
        onClick={toggleDropdown}
      >
        <div className="flex-1 flex flex-wrap gap-1 min-h-[20px]">
          {selectedOptions.length === 0 ? (
            <span className="text-gray-500 text-sm py-1">{placeholder}</span>
          ) : (
            <>
              {selectedOptions.slice(0, 3).map((option) => (
                <span
                  key={option.id}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded-md"
                >
                  {option.name}
                  {!disabled && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveSelected(option.id);
                      }}
                      className="hover:bg-primary-200 rounded-full p-0.5"
                    >
                      <X size={12} />
                    </button>
                  )}
                </span>
              ))}
              {selectedOptions.length > 3 && (
                <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                  +{selectedOptions.length - 3} more
                </span>
              )}
            </>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {selectedOptions.length > 0 && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClearAll();
              }}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <X size={16} className="text-gray-400" />
            </button>
          )}
          <ChevronDown 
            size={16} 
            className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          />
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
          {/* Search Input */}
          {showSearch && (
            <div className="p-3 border-b border-gray-200">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search services..."
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>
          )}

          {/* Select All Option */}
          {showSelectAll && filteredOptions.length > 0 && (
            <div className="p-2 border-b border-gray-200">
              <button
                type="button"
                onClick={handleSelectAll}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 rounded-md"
              >
                <div className={`w-4 h-4 border rounded flex items-center justify-center ${
                  allFilteredSelected ? 'bg-primary-600 border-primary-600' : 'border-gray-300'
                }`}>
                  {allFilteredSelected && <Check size={12} className="text-white" />}
                </div>
                <span className="font-medium">
                  {allFilteredSelected ? 'Deselect All' : 'Select All'} 
                  {searchTerm && ` (${filteredOptions.length} filtered)`}
                </span>
              </button>
            </div>
          )}

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                {searchTerm ? 'No services found' : 'No services available'}
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = selectedIds.includes(option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleToggleOption(option.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <div className={`w-4 h-4 border rounded flex items-center justify-center ${
                      isSelected ? 'bg-primary-600 border-primary-600' : 'border-gray-300'
                    }`}>
                      {isSelected && <Check size={12} className="text-white" />}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-gray-900">{option.name}</div>
                      {(option.price || option.duration) && (
                        <div className="text-xs text-gray-500">
                          {option.price && `₹${option.price}`}
                          {option.price && option.duration && ' • '}
                          {option.duration && `${option.duration}min`}
                        </div>
                      )}
                      {option.description && (
                        <div className="text-xs text-gray-500 mt-1">{option.description}</div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer with selection count */}
          {selectedIds.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <div className="text-xs text-gray-600">
                {selectedIds.length} service{selectedIds.length !== 1 ? 's' : ''} selected
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;
