import React from 'react';
import { Shield, Scissors, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
// import { UserRole } from '../../types'; // Removed unused import

const RoleIndicator: React.FC = () => {
  const { user, isAdmin, isSalonOwner, isCustomer } = useAuth();

  if (!user) return null;

  const getRoleInfo = () => {
    if (isAdmin()) {
      return {
        icon: Shield,
        label: 'Administrator',
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        description: 'Full system access'
      };
    }
    if (isSalonOwner()) {
      return {
        icon: Scissors,
        label: 'Salon Owner',
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
        description: 'Salon management access'
      };
    }
    if (isCustomer()) {
      return {
        icon: User,
        label: 'Customer',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        description: 'Booking and profile access'
      };
    }
    return {
      icon: User,
      label: 'User',
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      description: 'Basic access'
    };
  };

  const roleInfo = getRoleInfo();
  const Icon = roleInfo.icon;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${roleInfo.bgColor}`}>
      <Icon className={`h-4 w-4 ${roleInfo.color}`} />
      <span className={`text-sm font-medium ${roleInfo.color}`}>
        {roleInfo.label}
      </span>
    </div>
  );
};

export default RoleIndicator;
