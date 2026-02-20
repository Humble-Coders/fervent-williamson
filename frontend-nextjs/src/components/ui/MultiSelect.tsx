import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Check } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select options...",
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToggleOption = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue);
  };

  const handleRemoveOption = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter(v => v !== optionValue));
  };

  const getSelectedLabels = () => {
    return value.map(v => options.find(opt => opt.value === v)?.label || v);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div
        className="min-h-[42px] w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm bg-white cursor-pointer hover:border-gray-400 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-wrap gap-1 items-center min-h-[26px]">
          {value.length === 0 ? (
            <span className="text-gray-500 text-sm">{placeholder}</span>
          ) : (
            <>
              {getSelectedLabels().map((label, index) => (
                <span
                  key={value[index]}
                  className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
                >
                  {label}
                  <button
                    type="button"
                    className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-blue-200 transition-colors"
                    onClick={(e) => handleRemoveOption(value[index], e)}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-400 ml-auto transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto scrollbar-thin">
          {options.map((option) => {
            const isSelected = value.includes(option.value);
            return (
              <div
                key={option.value}
                className={`px-3 py-2 cursor-pointer hover:bg-gray-50 flex items-center justify-between transition-colors ${
                  isSelected ? 'bg-blue-50 text-blue-900' : 'text-gray-900'
                }`}
                onClick={() => handleToggleOption(option.value)}
              >
                <span className="text-sm">{option.label}</span>
                {isSelected && <Check className="w-4 h-4 text-blue-600" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MultiSelect;
