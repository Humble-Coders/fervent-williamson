import React from 'react';
import { User, Users, UserCheck } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useLocalStorage } from '../../hooks/useLocalStorage';

interface GenderFilterProps {
  selectedGender: 'MALE' | 'FEMALE' | 'UNISEX' | 'ALL';
  onGenderChange: (gender: 'MALE' | 'FEMALE' | 'UNISEX' | 'ALL') => void;
}

const GenderFilter: React.FC<GenderFilterProps> = ({
  selectedGender,
  onGenderChange,
}) => {
  const { user, isAuthenticated } = useAuthStore();
  const [storedGenderFilter, setStoredGenderFilter] = useLocalStorage<'MALE' | 'FEMALE' | 'UNISEX' | 'ALL'>('service_gender_filter', 'ALL');

  // Initialize filter based on user gender or localStorage
  React.useEffect(() => {
    if (isAuthenticated && user?.gender && storedGenderFilter === 'ALL') {
      // If user is logged in and has gender set, and no preference in localStorage, use user's gender
      onGenderChange(user.gender);
    } else if (storedGenderFilter !== 'ALL') {
      // If there's a stored preference, use it
      onGenderChange(storedGenderFilter);
    } else {
      // Default to showing all services
      onGenderChange('ALL');
    }
  }, [isAuthenticated, user?.gender, storedGenderFilter, onGenderChange]);

  const handleGenderChange = (gender: 'MALE' | 'FEMALE' | 'UNISEX' | 'ALL') => {
    onGenderChange(gender);
    setStoredGenderFilter(gender);
  };

  const genderOptions = [
    {
      value: 'ALL' as const,
      label: 'All Services',
      icon: Users,
      description: 'Show all services'
    },
    {
      value: 'MALE' as const,
      label: 'For Men',
      icon: User,
      description: 'Services for men'
    },
    {
      value: 'FEMALE' as const,
      label: 'For Women',
      icon: UserCheck,
      description: 'Services for women'
    },
    {
      value: 'UNISEX' as const,
      label: 'Unisex',
      icon: Users,
      description: 'Services for everyone'
    }
  ];

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm font-medium text-text-secondary">Filter by:</span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {genderOptions.map((option) => {
          const IconComponent = option.icon;
          const isSelected = selectedGender === option.value;
          
          return (
            <button
              key={option.value}
              onClick={() => handleGenderChange(option.value)}
              className={`px-4 py-2 rounded-full font-medium smooth-hover flex items-center gap-2 text-sm transition-all duration-200 ${
                isSelected
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
                  : 'bg-white text-text-secondary hover:bg-primary-50 border border-neutral-200 hover:border-primary-200'
              }`}
              title={option.description}
            >
              <IconComponent className="w-4 h-4" />
              {option.label}
            </button>
          );
        })}
      </div>
      
      {/* Show current filter info */}
      {isAuthenticated && user?.gender && selectedGender === user.gender && (
        <div className="mt-2 text-xs text-text-muted flex items-center gap-1">
          <UserCheck className="w-3 h-3" />
          Showing services based on your profile
        </div>
      )}
    </div>
  );
};

export default GenderFilter;
