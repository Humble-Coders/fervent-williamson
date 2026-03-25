'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { logger } from '@/config/logger';
import { Calendar, Users, IndianRupee, Clock, TrendingUp, Scissors, Sparkles, BarChart3, CheckCircle, XCircle, AlertCircle, Receipt } from 'lucide-react';
import { salonDashboardService, DashboardStats, UpcomingBooking, SalonInsights, BookingFeesData } from '@/services/salonDashboardService';
import Link from 'next/link';

const SalonDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    todaysBookings: 0,
    activeCustomers: 0,
    todaysRevenue: 0,
    avgServiceTime: 0,
  });
  const [upcomingBookings, setUpcomingBookings] = useState<UpcomingBooking[]>([]);
  const [insights, setInsights] = useState<SalonInsights | null>(null);
  const [monthlyFees, setMonthlyFees] = useState<BookingFeesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Date range state for insights
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const fetchInsights = useCallback(async (start?: string, end?: string) => {
    try {
      setInsightsLoading(true);
      const data = await salonDashboardService.getInsights(start, end);
      setInsights(data);
    } catch (error: any) {
      logger.error('Error fetching insights:', error);
    } finally {
      setInsightsLoading(false);
    }
  }, []);

  useEffect(() => {
    let unsubFees: (() => void) | null = null;

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await salonDashboardService.getDashboardStats();
        setStats(data.stats);
        setUpcomingBookings(data.upcomingBookings);

        await fetchInsights();

        const now = new Date();
        const y = now.getFullYear();
        const month = now.getMonth() + 1;
        const m = String(month).padStart(2, '0');
        const firstDay = `${y}-${m}-01`;
        const lastDay = new Date(y, month, 0).getDate();
        const endDay = `${y}-${m}-${String(lastDay).padStart(2, '0')}`;

        unsubFees = salonDashboardService.listenBookingFees(
          firstDay,
          endDay,
          (feesData) => setMonthlyFees(feesData),
          (err) => logger.error('Error listening to booking fees:', err),
        );
      } catch (error: any) {
        logger.error('Error fetching dashboard data:', error);
        setError(error.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    return () => {
      if (unsubFees) unsubFees();
    };
  }, [fetchInsights]);

  const handleDateFilter = () => {
    fetchInsights(startDate || undefined, endDate || undefined);
  };

  const clearDateFilter = () => {
    setStartDate('');
    setEndDate('');
    fetchInsights();
  };

  const statsDisplay = [
    {
      name: 'Today\'s Bookings',
      value: stats.todaysBookings.toString(),
      icon: Calendar,
      change: stats.todaysBookings > 0 ? `${stats.todaysBookings} bookings today` : 'No bookings yet'
    },
    {
      name: 'Active Customers',
      value: stats.activeCustomers.toString(),
      icon: Users,
      change: stats.activeCustomers > 0 ? `${stats.activeCustomers} total customers` : 'No customers yet'
    },
    {
      name: 'Today\'s Revenue',
      value: `₹${stats.todaysRevenue.toLocaleString('en-IN')}`,
      icon: IndianRupee,
      change: stats.todaysRevenue > 0 ? 'From completed bookings' : 'No revenue yet'
    },
    {
      name: 'Avg. Service Time',
      value: `${stats.avgServiceTime}min`,
      icon: Clock,
      change: stats.avgServiceTime > 0 ? 'Average duration' : 'No data yet'
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-accent-500/10 rounded-2xl sm:rounded-3xl" />
        <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-neutral-200/50 shadow-xl">
          {/* Mobile Layout */}
          <div className="lg:hidden space-y-4">
            {/* Title Section */}
            <div className="flex items-center space-x-3">
              <div className="flex-1 min-w-0">
                <h1 className="font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent truncate">
                  Salon Dashboard
                </h1>
                <p className="text-xs text-text-secondary flex items-center space-x-1.5">
                  <Sparkles className="h-3 w-3 text-accent-500 flex-shrink-0" />
                  <span className="truncate">Manage your salon operations</span>
                </p>
              </div>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden lg:flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-r from-primary-500 to-accent-500 rounded-2xl shadow-lg">
                  <Scissors className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                    Salon Dashboard
                  </h1>
                  <p className="text-text-secondary flex items-center space-x-2">
                    <Sparkles className="h-4 w-4 text-accent-500" />
                    <span>Manage your salon operations and bookings</span>
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsDisplay.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className="p-3 bg-primary-100 rounded-full">
                  <Icon className="h-6 w-6 text-primary-600" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-gray-500">{stat.change}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Monthly Booking Fees */}
      {monthlyFees && (
        <Link href="/salon/booking-fees" className="block">
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Booking Fees This Month</p>
                <p className="text-2xl font-bold text-orange-700">
                  ₹{monthlyFees.totalBookingFees.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Receipt className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                From {monthlyFees.bookingCount} booking{monthlyFees.bookingCount !== 1 ? 's' : ''} this month
              </span>
              <span className="text-sm text-orange-600 font-medium">View Details &rarr;</span>
            </div>
          </div>
        </Link>
      )}

      {/* Today's Schedule */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Today&apos;s Schedule</h3>
          <div className="space-y-4">
            {upcomingBookings.length > 0 ? (
              upcomingBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{booking.time}</p>
                    <p className="text-sm text-gray-600">{booking.customerName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{booking.serviceName}</p>
                    <p className="text-xs text-gray-500">{booking.duration}min</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings today</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Your schedule is clear for today.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Business Insights Section */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-primary-500 to-accent-500 rounded-lg">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Business Insights</h3>
              <p className="text-sm text-gray-500">
                {insights?.dateRange.isAllTime ? 'All-time statistics' : 'Filtered by date range'}
              </p>
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <div className="flex gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Start Date"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="End Date"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDateFilter}
                disabled={insightsLoading}
                className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                {insightsLoading ? 'Loading...' : 'Apply'}
              </button>
              {(startDate || endDate) && (
                <button
                  onClick={clearDateFilter}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {insightsLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : insights ? (
          <>
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-blue-600 text-sm font-medium">Total Bookings</span>
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                </div>
                <p className="text-2xl font-bold text-blue-700">{insights.totalBookings}</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-green-600 text-sm font-medium">Total Revenue</span>
                  <IndianRupee className="h-4 w-4 text-green-500" />
                </div>
                <p className="text-2xl font-bold text-green-700">₹{insights.totalRevenue.toLocaleString('en-IN')}</p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-purple-600 text-sm font-medium">Avg. Booking Value</span>
                  <BarChart3 className="h-4 w-4 text-purple-500" />
                </div>
                <p className="text-2xl font-bold text-purple-700">₹{insights.avgBookingValue.toLocaleString('en-IN')}</p>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-amber-600 text-sm font-medium">Completion Rate</span>
                  <CheckCircle className="h-4 w-4 text-amber-500" />
                </div>
                <p className="text-2xl font-bold text-amber-700">{insights.completionRate}%</p>
              </div>
            </div>

            {/* Booking Status & Top Services Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Booking Status Breakdown */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-4">Booking Status</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-gray-600">Completed</span>
                    </div>
                    <span className="font-semibold text-gray-900">{insights.completedBookings}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm text-gray-600">Pending</span>
                    </div>
                    <span className="font-semibold text-gray-900">{insights.pendingBookings}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-gray-600">Cancelled</span>
                    </div>
                    <span className="font-semibold text-gray-900">{insights.cancelledBookings}</span>
                  </div>
                </div>
              </div>

              {/* Top Services */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-4">Top Services</h4>
                {insights.topServices.length > 0 ? (
                  <div className="space-y-3">
                    {insights.topServices.map((service, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="flex items-center justify-center w-6 h-6 bg-primary-100 text-primary-600 text-xs font-medium rounded-full">
                            {index + 1}
                          </span>
                          <span className="text-sm text-gray-600 truncate max-w-[150px]">{service.serviceName}</span>
                        </div>
                        <span className="font-semibold text-gray-900">{service.bookingCount} bookings</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No services data available</p>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No insights available</h3>
            <p className="mt-1 text-sm text-gray-500">
              Start getting bookings to see your business insights.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalonDashboard;
