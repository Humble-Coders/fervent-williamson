'use client';
import React, { useState, useEffect } from 'react';
import { logger } from '@/config/logger';
import { BarChart3, TrendingUp, Users, Calendar, Clock, Star, Download, Filter } from 'lucide-react';
import Button from '../../components/ui/Button';

interface AnalyticsData {
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  noShowBookings: number;
  avgRating: number;
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  peakHours: { hour: string; bookings: number }[];
  popularServices: { name: string; bookings: number; revenue: number }[];
  monthlyTrends: { month: string; bookings: number; revenue: number }[];
}

const AnalyticsPage: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);

        // TODO: Implement proper analytics API endpoint
        // For now, set empty analytics data
        const emptyAnalytics: AnalyticsData = {
          totalBookings: 0,
          completedBookings: 0,
          cancelledBookings: 0,
          noShowBookings: 0,
          avgRating: 0,
          totalCustomers: 0,
          newCustomers: 0,
          returningCustomers: 0,
          peakHours: [],
          popularServices: [],
          monthlyTrends: [],
        };

        setAnalytics(emptyAnalytics);
      } catch (error) {
        logger.error('Error fetching analytics:', error);
        setError('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeframe]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <BarChart3 className="mx-auto h-12 w-12" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Analytics</h3>
        <p className="text-gray-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!analytics) return null;

  const completionRate = ((analytics.completedBookings / analytics.totalBookings) * 100).toFixed(1);
  const cancellationRate = ((analytics.cancelledBookings / analytics.totalBookings) * 100).toFixed(1);
  const noShowRate = ((analytics.noShowBookings / analytics.totalBookings) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Insights into your salon&apos;s performance</p>
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as 'week' | 'month' | 'quarter' | 'year')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalBookings}</p>
              <p className="text-xs text-green-600">+12% from last month</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900">{completionRate}%</p>
              <p className="text-xs text-green-600">+2.1% from last month</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalCustomers}</p>
              <p className="text-xs text-green-600">{analytics.newCustomers} new this month</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Average Rating</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.avgRating}</p>
              <p className="text-xs text-green-600">+0.2 from last month</p>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Booking Status</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Completed</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: `${completionRate}%` }}></div>
                </div>
                <span className="text-sm font-medium">{analytics.completedBookings}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Cancelled</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div className="bg-red-500 h-2 rounded-full" style={{ width: `${cancellationRate}%` }}></div>
                </div>
                <span className="text-sm font-medium">{analytics.cancelledBookings}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">No Show</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${noShowRate}%` }}></div>
                </div>
                <span className="text-sm font-medium">{analytics.noShowBookings}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Types</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Returning Customers</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(analytics.returningCustomers / analytics.totalCustomers) * 100}%` }}></div>
                </div>
                <span className="text-sm font-medium">{analytics.returningCustomers}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">New Customers</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${(analytics.newCustomers / analytics.totalCustomers) * 100}%` }}></div>
                </div>
                <span className="text-sm font-medium">{analytics.newCustomers}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Popular Services</h3>
          <div className="space-y-3">
            {analytics.popularServices.map((service, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{service.name}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary-500 h-2 rounded-full" 
                      style={{ width: `${(service.bookings / analytics.popularServices[0].bookings) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{service.bookings}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Peak Hours Chart */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">Peak Hours</h3>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
        
        <div className="space-y-3">
          {analytics.peakHours.map((hour, index) => (
            <div key={index} className="flex items-center space-x-4">
              <div className="w-20 text-sm text-gray-600">{hour.hour}</div>
              <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                <div
                  className="bg-gradient-to-r from-primary-500 to-accent-500 h-4 rounded-full flex items-center justify-end pr-2"
                  style={{ width: `${(hour.bookings / 20) * 100}%` }}
                >
                  <span className="text-xs text-white font-medium">
                    {hour.bookings}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Trends */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Monthly Trends</h3>
        <div className="space-y-4">
          {analytics.monthlyTrends.map((trend, index) => (
            <div key={index} className="flex items-center space-x-4">
              <div className="w-12 text-sm text-gray-600">{trend.month}</div>
              <div className="flex-1 space-y-1">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Bookings: {trend.bookings}</span>
                  <span>Revenue: ${trend.revenue}</span>
                </div>
                <div className="bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-500 h-2 rounded-full"
                    style={{ width: `${(trend.bookings / 200) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
