import React, { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

interface DateRange {
  startDate: string;
  endDate: string;
}

interface DateRangePreset {
  label: string;
  startDate: string;
  endDate: string;
}

interface DateRangeSelectorProps {
  value: DateRange;
  onChange: (dateRange: DateRange) => void;
  presets: Record<string, DateRangePreset>;
}

export function DateRangeSelector({ value, onChange, presets }: DateRangeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customMode, setCustomMode] = useState(false);

  // Find current preset
  const currentPreset = Object.entries(presets).find(([_, preset]) => 
    preset.startDate === value.startDate && preset.endDate === value.endDate
  );

  const handlePresetSelect = (preset: DateRangePreset) => {
    onChange({
      startDate: preset.startDate,
      endDate: preset.endDate
    });
    setCustomMode(false);
    setIsOpen(false);
  };

  const handleCustomDateChange = (field: 'startDate' | 'endDate', date: string) => {
    onChange({
      ...value,
      [field]: date
    });
  };

  const formatDateRange = () => {
    if (currentPreset && currentPreset[1] && currentPreset[1].label) {
      return currentPreset[1].label;
    }

    const start = new Date(value.startDate);
    const end = new Date(value.endDate);

    if (start.toDateString() === end.toDateString()) {
      return start.toLocaleDateString();
    }

    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
      >
        <Calendar className="w-4 h-4 mr-2 text-gray-500" />
        {formatDateRange()}
        <ChevronDown className="w-4 h-4 ml-2 text-gray-500" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="p-4">
              {/* Preset/Custom Toggle */}
              <div className="flex mb-4">
                <button
                  onClick={() => setCustomMode(false)}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-l-md border ${
                    !customMode 
                      ? 'bg-primary-50 border-primary-200 text-primary-700' 
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Presets
                </button>
                <button
                  onClick={() => setCustomMode(true)}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-r-md border-t border-r border-b ${
                    customMode 
                      ? 'bg-primary-50 border-primary-200 text-primary-700' 
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Custom
                </button>
              </div>

              {!customMode ? (
                /* Preset Options */
                <div className="space-y-1">
                  {Object.entries(presets).map(([key, preset]) => (
                    <button
                      key={key}
                      onClick={() => handlePresetSelect(preset)}
                      className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                        currentPreset && currentPreset[0] === key
                          ? 'bg-primary-50 text-primary-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              ) : (
                /* Custom Date Inputs */
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={value.startDate}
                      onChange={(e) => handleCustomDateChange('startDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={value.endDate}
                      onChange={(e) => handleCustomDateChange('endDate', e.target.value)}
                      min={value.startDate}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-full px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Apply Custom Range
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
