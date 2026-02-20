import React, { useState, useEffect } from 'react';
import { logger } from '@/config/logger';
import { Filter, X } from 'lucide-react';

interface AnalyticsFiltersProps {
  filters: {
    salonId?: string;
    serviceId?: string;
    userRole?: string;
    deviceType?: string;
  };
  onChange: (filters: {
    salonId?: string;
    serviceId?: string;
    userRole?: string;
    deviceType?: string;
  }) => void;
}

interface FilterOption {
  value: string;
  label: string;
}

export function AnalyticsFilters({ filters, onChange }: AnalyticsFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [salons, setSalons] = useState<FilterOption[]>([]);
  const [services, setServices] = useState<FilterOption[]>([]);
  const [loading, setLoading] = useState(false);

  // User role options
  const userRoleOptions: FilterOption[] = [
    { value: 'CUSTOMER', label: 'Customer' },
    { value: 'SALON_OWNER', label: 'Salon Owner' },
    { value: 'ADMIN', label: 'Admin' }
  ];

  // Device type options
  const deviceTypeOptions: FilterOption[] = [
    { value: 'MOBILE', label: 'Mobile' },
    { value: 'DESKTOP', label: 'Desktop' },
    { value: 'TABLET', label: 'Tablet' }
  ];

  // Load salons and services for filter options
  useEffect(() => {
    const loadFilterOptions = async () => {
      setLoading(true);
      try {
        // In a real app, you'd fetch these from your API
        // For now, we'll use placeholder data
        setSalons([
          { value: '1', label: 'Glamour Studio' },
          { value: '2', label: 'Style Haven' },
          { value: '3', label: 'Beauty Lounge' }
        ]);

        setServices([
          { value: '1', label: 'Haircut' },
          { value: '2', label: 'Hair Color' },
          { value: '3', label: 'Manicure' },
          { value: '4', label: 'Facial' }
        ]);
      } catch (error) {
        logger.error('Failed to load filter options:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      loadFilterOptions();
    }
  }, [isOpen]);

  const handleFilterChange = (key: string, value: string) => {
    onChange({
      ...filters,
      [key]: value || undefined
    });
  };

  const clearFilter = (key: string) => {
    const newFilters = { ...filters };
    delete newFilters[key as keyof typeof newFilters];
    onChange(newFilters);
  };

  const clearAllFilters = () => {
    // Preserve dateRange when clearing all filters
    onChange({ dateRange: (filters as any).dateRange } as any);
  };

  const getActiveFilterCount = () => {
    // Exclude dateRange from filter count as it has its own component
    const filterEntries = Object.entries(filters).filter(([key]) => key !== 'dateRange');
    return filterEntries.filter(([_, value]) => value !== undefined && value !== '').length;
  };

  const getFilterLabel = (key: string, value: string) => {
    switch (key) {
      case 'salonId':
        return salons.find(s => s.value === value)?.label || value;
      case 'serviceId':
        return services.find(s => s.value === value)?.label || value;
      case 'userRole':
        return userRoleOptions.find(r => r.value === value)?.label || value;
      case 'deviceType':
        return deviceTypeOptions.find(d => d.value === value)?.label || value;
      default:
        return value;
    }
  };

  return (
    <div className="relative">
      {/* Filter Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
      >
        <Filter className="w-4 h-4 mr-2 text-gray-500" />
        Filters
        {getActiveFilterCount() > 0 && (
          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
            {getActiveFilterCount()}
          </span>
        )}
      </button>

      {/* Active Filters Display */}
      {getActiveFilterCount() > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {Object.entries(filters)
            .filter(([key]) => key !== 'dateRange') // Exclude dateRange as it has its own component
            .map(([key, value]) => {
              if (!value) return null;
              return (
                <span
                  key={key}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800"
                >
                  {getFilterLabel(key, value as string)}
                  <button
                    onClick={() => clearFilter(key)}
                    className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-primary-200"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
          <button
            onClick={clearAllFilters}
            className="inline-flex items-center px-3 py-1 rounded-full text-sm text-gray-600 hover:bg-gray-100"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Filter Dropdown */}
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
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Filters</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Salon Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Salon
                  </label>
                  <select
                    value={filters.salonId || ''}
                    onChange={(e) => handleFilterChange('salonId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    disabled={loading}
                  >
                    <option value="">All Salons</option>
                    {salons.map((salon) => (
                      <option key={salon.value} value={salon.value}>
                        {salon.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Service Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Service
                  </label>
                  <select
                    value={filters.serviceId || ''}
                    onChange={(e) => handleFilterChange('serviceId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    disabled={loading}
                  >
                    <option value="">All Services</option>
                    {services.map((service) => (
                      <option key={service.value} value={service.value}>
                        {service.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* User Role Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    User Role
                  </label>
                  <select
                    value={filters.userRole || ''}
                    onChange={(e) => handleFilterChange('userRole', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">All Roles</option>
                    {userRoleOptions.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Device Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Device Type
                  </label>
                  <select
                    value={filters.deviceType || ''}
                    onChange={(e) => handleFilterChange('deviceType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">All Devices</option>
                    {deviceTypeOptions.map((device) => (
                      <option key={device.value} value={device.value}>
                        {device.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={clearAllFilters}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
