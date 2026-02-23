'use client';
import React, { useEffect, useState } from 'react';
import { adminService, AdminStats } from '../../services/adminService';
import { logger } from '@/config/logger';
import { BarChart3, Users, Store, Calendar, TrendingUp } from 'lucide-react';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

interface DashboardStats {
  totalUsers: number;
  activeSalons: number;
  totalBookings: number;
  bookingsByStatus: Record<string, number>;
}

const AdminAnalyticsPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await adminService.getStats();
      // Map AdminStats to DashboardStats
      const statusMap: Record<string, number> = {};
      data.bookingStatusDistribution.forEach(({ status, count }) => {
        statusMap[status] = count;
      });
      setStats({
        totalUsers: data.overview.totalUsers,
        activeSalons: data.overview.activeSalons,
        totalBookings: data.overview.totalBookings,
        bookingsByStatus: statusMap,
      });
    } catch (err: any) {
      logger.error('Failed to load analytics:', err);
      setError(err.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={loadStats} className="btn btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'Active Salons',
      value: stats?.activeSalons || 0,
      icon: Store,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      title: 'Total Bookings',
      value: stats?.totalBookings || 0,
      icon: Calendar,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      title: 'Completed',
      value: stats?.bookingsByStatus?.COMPLETED || 0,
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            Analytics Overview
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Platform-wide statistics
          </p>
        </div>
        <button
          onClick={loadStats}
          className="btn btn-outline text-sm"
        >
          Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.title}</p>
                <p className="text-2xl font-bold mt-1">{stat.value.toLocaleString()}</p>
              </div>
              <div className={`${stat.bg} p-3 rounded-full`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Booking Status Breakdown */}
      {stats?.bookingsByStatus && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Bookings by Status</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.entries(stats.bookingsByStatus).map(([status, count]) => (
              <div key={status} className="text-center p-3 rounded-lg bg-gray-50">
                <p className="text-sm text-gray-500 capitalize">{status.toLowerCase()}</p>
                <p className="text-xl font-bold mt-1">{count}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default AdminAnalyticsPage;
