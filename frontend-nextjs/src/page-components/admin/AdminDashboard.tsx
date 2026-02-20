'use client';
import React, { useState, useEffect } from 'react';
import { logger } from '@/config/logger';
import {
  Users,
  Building2,
  BarChart3,
  IndianRupee,
  TrendingUp,
  Calendar,
  Activity,
  Zap,
  Crown,
  Sparkles,
  ArrowUpRight,
  Plus,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import Button from '../../components/ui/Button';
// import LoadingSpinner from '../../components/ui/LoadingSpinner'; // Removed unused import
import { adminService, AdminStats } from '../../services/adminService';

const AdminDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getStats();
      setDashboardData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch dashboard data');
      logger.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const stats = dashboardData ? [
    {
      name: 'Total Users',
      value: dashboardData.overview.totalUsers.toLocaleString(),
      icon: Users,
      change: `${dashboardData.overview.activeUsers} active`,
      trend: 'up',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50',
      description: 'Registered users'
    },
    {
      name: 'Active Salons',
      value: dashboardData.overview.activeSalons.toString(),
      icon: Building2,
      change: `${dashboardData.overview.totalSalons} total`,
      trend: 'up',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50',
      description: 'Partner salons'
    },
    {
      name: 'Total Revenue',
      value: formatCurrency(dashboardData.overview.totalRevenue),
      icon: IndianRupee,
      change: `${dashboardData.overview.totalBookings} bookings`,
      trend: 'up',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50',
      description: 'All time'
    },
    {
      name: 'Total Bookings',
      value: dashboardData.overview.totalBookings.toLocaleString(),
      icon: Calendar,
      change: `${dashboardData.overview.activeSalons} salons`,
      trend: 'up',
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-50',
      description: 'All appointments'
    },
  ] : [];

  return (
    <div className="space-y-8 pb-8">
      {/* Header Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-accent-500/10 rounded-2xl sm:rounded-3xl" />
        <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-neutral-200/50 shadow-xl">
          {/* Mobile Layout */}
          <div className="lg:hidden space-y-4">
            {/* Title Section */}
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl shadow-lg">
                <Crown className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent truncate">
                  Admin Dashboard
                </h1>
                <p className="text-xs text-text-secondary flex items-center space-x-1.5">
                  <Sparkles className="h-3 w-3 text-accent-500 flex-shrink-0" />
                  <span className="truncate">Welcome to your command center</span>
                </p>
              </div>
            </div>

            {/* Action Buttons - Mobile */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="rounded-xl flex-1 h-9 text-xs"
                onClick={fetchDashboardData}
                disabled={loading}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button variant="outline" className="rounded-xl flex-1 h-9 text-xs">
                <BarChart3 className="h-3.5 w-3.5 sm:mr-1.5" />
                <span className="hidden sm:inline">Analytics</span>
              </Button>
              <Button variant="primary" className="rounded-xl flex-1 h-9 text-xs bg-gradient-to-r from-primary-500 to-accent-500">
                <Plus className="h-3.5 w-3.5 sm:mr-1.5" />
                <span className="hidden sm:inline">Action</span>
              </Button>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden lg:flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-r from-primary-500 to-accent-500 rounded-2xl shadow-lg">
                  <Crown className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                    Admin Dashboard
                  </h1>
                  <p className="text-text-secondary flex items-center space-x-2">
                    <Sparkles className="h-4 w-4 text-accent-500" />
                    <span>Welcome to your command center</span>
                  </p>
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                className="rounded-2xl"
                onClick={fetchDashboardData}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" className="rounded-2xl">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Button>
              <Button variant="primary" className="rounded-2xl bg-gradient-to-r from-primary-500 to-accent-500">
                <Plus className="h-4 w-4 mr-2" />
                Quick Action
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          // Loading skeleton
          Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-neutral-200/50 shadow-lg"
            >
              <div className="animate-pulse">
                <div className="flex items-start justify-between mb-4">
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                  </div>
                  <div className="w-12 h-12 bg-gray-200 rounded-2xl"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          ))
        ) : (
          stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.name}
                className="group relative bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-neutral-200/50 shadow-lg hover:shadow-2xl transition-all duration-500 hover:transform hover:scale-105"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-3xl"
                  style={{ backgroundImage: `linear-gradient(135deg, var(--tw-gradient-stops))` }} />

                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-text-secondary">{stat.name}</p>
                      <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
                      <p className="text-xs text-text-secondary">{stat.description}</p>
                    </div>
                    <div className={`p-3 bg-gradient-to-r ${stat.color} rounded-2xl shadow-lg group-hover:shadow-xl transition-shadow duration-300`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="h-3 w-3 text-green-500" />
                        <span className="text-sm font-semibold text-green-600">{stat.change}</span>
                      </div>
                      <span className="text-xs text-text-secondary">vs last month</span>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-text-secondary group-hover:text-primary-500 transition-colors" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-neutral-200/50 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-text-primary">Recent Activity</h3>
            </div>
            <Button variant="ghost" size="sm" className="text-text-secondary hover:text-primary-600">
              View All
            </Button>
          </div>

          <div className="space-y-4">
            {loading ? (
              // Loading skeleton for recent activity
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex items-start space-x-4 p-4 rounded-2xl">
                  <div className="w-3 h-3 bg-gray-200 rounded-full mt-2 animate-pulse" />
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
                  </div>
                </div>
              ))
            ) : dashboardData ? (
              // Show recent users and bookings
              [
                ...dashboardData.recent.users.slice(0, 2).map((user) => ({
                  type: 'success',
                  message: `New user "${user.name}" registered`,
                  time: new Date(user.createdAt).toLocaleDateString(),
                  color: 'from-green-500 to-emerald-500'
                })),
                ...dashboardData.recent.bookings.slice(0, 2).map((booking) => ({
                  type: 'info',
                  message: `New booking at ${booking.salon.name}`,
                  time: new Date(booking.createdAt).toLocaleDateString(),
                  color: 'from-blue-500 to-cyan-500'
                }))
              ].map((activity, index) => (
                <div key={index} className="flex items-start space-x-4 p-4 rounded-2xl hover:bg-neutral-50 transition-colors">
                  <div className={`w-3 h-3 bg-gradient-to-r ${activity.color} rounded-full mt-2 shadow-lg`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary">{activity.message}</p>
                    <p className="text-xs text-text-secondary mt-1">{activity.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No recent activity</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-neutral-200/50 shadow-lg">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-text-primary">Quick Actions</h3>
          </div>

          <div className="space-y-4">
            {[
              {
                title: 'Add New Salon',
                description: 'Register a new salon partner',
                icon: Building2,
                color: 'from-red-500 to-pink-500',
                bgColor: 'bg-red-50'
              },
              {
                title: 'Manage Users',
                description: 'View and edit user accounts',
                icon: Users,
                color: 'from-blue-500 to-cyan-500',
                bgColor: 'bg-blue-50'
              },
              {
                title: 'View Analytics',
                description: 'Check system performance',
                icon: BarChart3,
                color: 'from-green-500 to-emerald-500',
                bgColor: 'bg-green-50'
              },
              {
                title: 'System Settings',
                description: 'Configure platform settings',
                icon: Activity,
                color: 'from-purple-500 to-pink-500',
                bgColor: 'bg-purple-50'
              }
            ].map((action, index) => (
              <button
                key={index}
                className="w-full group p-4 rounded-2xl border border-neutral-200 hover:border-primary-300 hover:shadow-lg transition-all duration-300 text-left"
              >
                <div className="flex items-center space-x-4">
                  <div className={`p-3 bg-gradient-to-r ${action.color} rounded-xl shadow-lg group-hover:shadow-xl transition-shadow`}>
                    <action.icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-text-primary group-hover:text-primary-600 transition-colors">
                      {action.title}
                    </h4>
                    <p className="text-sm text-text-secondary">{action.description}</p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-text-secondary group-hover:text-primary-500 transition-colors" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Advanced Analytics */}
      {dashboardData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Salons by Revenue */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-neutral-200/50 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl">
                  <Crown className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-text-primary">Top Salons (Revenue)</h3>
              </div>
            </div>
            <div className="space-y-4">
              {dashboardData.topSalonsByRevenue.map((salon, index) => (
                <div key={salon.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-neutral-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-400 w-6">#{index + 1}</span>
                    <span className="font-medium text-text-primary">{salon.name}</span>
                  </div>
                  <span className="font-bold text-green-600">{formatCurrency(salon.revenue)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Booking Status Distribution */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-neutral-200/50 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-text-primary">Booking Status</h3>
              </div>
            </div>
            <div className="space-y-4">
              {dashboardData.bookingStatusDistribution.map((item) => (
                <div key={item.status} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">{item.status}</span>
                    <span className="text-gray-500">{item.count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{ width: `${(item.count / dashboardData.overview.totalBookings) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
