import React, { useState, useEffect } from 'react';
import { logger } from '@/config/logger';
import { Star, Users, TrendingUp, Package, LucideIcon } from 'lucide-react';
import Card from '../ui/Card';
// import EmptyState from '../ui/EmptyState'; // Removed unused import
import { buildApiUrl } from '../../config/env';

interface ServiceCategory {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
  emoji: string;
  description: string;
}

export interface ServiceCategoriesProps {
  categories: ServiceCategory[];
  onCategoryClick: (categoryId: string) => void;
}

const ServiceCategories: React.FC<ServiceCategoriesProps> = ({
  categories,
  onCategoryClick,
}) => {
  const [stats, setStats] = useState({
    totalSalons: 0,
    totalUsers: 0,
    totalBookings: 0,
    totalStylists: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) return;

        const response = await fetch(buildApiUrl('admin/stats'), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data.stats) {
            setStats({
              totalSalons: data.data.stats.totalSalons || 0,
              totalUsers: data.data.stats.totalUsers || 0,
              totalBookings: data.data.stats.totalBookings || 0,
              totalStylists: Math.floor((data.data.stats.totalUsers || 0) * 0.3), // Estimate stylists as 30% of users
            });
          }
        }
      } catch (error) {
        logger.error('Error fetching stats:', error);
        // Keep default values on error
      }
    };

    fetchStats();
  }, []);
  return (
    <section className="py-8 md:py-16">
      <div className="container-custom px-4">
        <div className="text-center mb-12 animate-slide-up">
          <div className="flex items-center justify-center gap-3 mb-4">
            <h2 className="text-2xl md:text-4xl font-bold text-text-primary font-heading">
              Popular Services
            </h2>
          </div>
          <p className="text-sm md:text-lg text-text-secondary max-w-2xl mx-auto flex items-center justify-center gap-2">
            Discover our most popular beauty services and book with top-rated professionals
          </p>
        </div>

        {/* Simple elegant cards design */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {categories.map((category, index) => {
            // Define elegant colors for each category
            const colors = [
              'bg-gradient-to-br from-pink-500 to-purple-600',    // Facial & Skincare
              'bg-gradient-to-br from-orange-500 to-red-600',     // Hair Services
              'bg-gradient-to-br from-teal-500 to-blue-600',      // Nail Services
              'bg-gradient-to-br from-green-500 to-emerald-600'   // Spa Services
            ];

            const bgColor = colors[index % colors.length];

            return (
              <div
                key={category.id}
                className={`${bgColor} rounded-2xl p-6 text-white cursor-pointer transform hover:scale-105 transition-all duration-300 hover:shadow-xl`}
                onClick={() => onCategoryClick(category.id)}
              >
                {/* Large Emoji */}
                <div className="text-center mb-4">
                  <div className="text-3xl md:text-4xl mb-2">
                    {category.emoji}
                  </div>
                </div>

                {/* Category Name */}
                <h3 className="font-bold text-sm md:text-lg text-center mb-2">
                  {category.name}
                </h3>

                {/* Description */}
                <p className="text-xs md:text-sm text-white/90 text-center leading-relaxed">
                  {category.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Dynamic stats section */}
        {/* <div className="mt-8 md:mt-16 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 animate-slide-up" style={{ animationDelay: '600ms' }}>
          <div className="text-center">
            <div className="flex justify-center mb-1 md:mb-2">
              <Package className="w-6 h-6 md:w-8 md:h-8 text-primary-500" />
            <div className="text-lg md:text-2xl font-bold pl-2 text-primary-600">{stats.totalSalons}+</div>
            </div>
            <div className="text-xs md:text-sm text-text-muted">Salons</div>
          </div>
          <div className="text-center">
            <div className="flex justify-center mb-1 md:mb-2">
              <Users className="w-6 h-6 md:w-8 md:h-8 text-accent-500" />
            <div className="text-lg md:text-2xl font-bold pl-2 text-accent-600">{stats.totalUsers}+</div>
            </div>
            <div className="text-xs md:text-sm text-text-muted">Happy Customers</div>
          </div>
          <div className="text-center">
            <div className="flex justify-center mb-1 md:mb-2">
              <Star className="w-6 h-6 md:w-8 md:h-8 text-purple-500" />
            <div className="text-lg md:text-2xl font-bold pl-2 text-purple-600">{stats.totalBookings}+</div>
            </div>
            <div className="text-xs md:text-sm text-text-muted">Bookings Completed</div>
          </div>
          <div className="text-center">
            <div className="flex justify-center mb-1 md:mb-2">
              <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-blue-500" />
            <div className="text-lg md:text-2xl font-bold pl-2 text-blue-600">{stats.totalStylists}+</div>
            </div>
            <div className="text-xs md:text-sm text-text-muted">Professional Stylists</div>
          </div>
        </div> */}
      </div>
    </section>
  );
};

export default ServiceCategories;