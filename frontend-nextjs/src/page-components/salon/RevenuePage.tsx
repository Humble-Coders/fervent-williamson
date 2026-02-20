'use client';
import React, { useState, useEffect } from 'react';
import { logger } from '@/config/logger';
import { IndianRupee, TrendingUp, TrendingDown, Calendar, Download, Filter } from 'lucide-react';
import Button from '../../components/ui/Button';

interface RevenueData {
  period: string;
  revenue: number;
  bookings: number;
  avgBookingValue: number;
  growth: number;
}

interface RevenueStats {
  totalRevenue: number;
  monthlyRevenue: number;
  totalBookings: number;
  avgBookingValue: number;
  monthlyGrowth: number;
}

const RevenuePage: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRevenueData = async () => {
      try {
        setLoading(true);
        setError(null);

        // TODO: Implement proper revenue API endpoint
        // For now, set empty revenue data
        const emptyStats: RevenueStats = {
          totalRevenue: 0,
          monthlyRevenue: 0,
          totalBookings: 0,
          avgBookingValue: 0,
          monthlyGrowth: 0,
        };

        setStats(emptyStats);
        setRevenueData([]);
      } catch (error) {
        logger.error('Error fetching revenue data:', error);
        setError('Failed to load revenue data');
      } finally {
        setLoading(false);
      }
    };

    fetchRevenueData();
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
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Revenue Data</h3>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Revenue</h1>
          <p className="text-gray-600">Track your salon&apos;s financial performance</p>
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as 'week' | 'month' | 'quarter' | 'year')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{stats.monthlyRevenue.toFixed(2)}</p>
                <div className="flex items-center mt-1">
                  {stats.monthlyGrowth >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm ${stats.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(stats.monthlyGrowth)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Booking Value</p>
                <p className="text-2xl font-bold text-gray-900">{stats.avgBookingValue.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revenue Chart Placeholder */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">Revenue Trend</h3>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
        
        {/* Simple bar chart representation */}
        <div className="space-y-4">
          {revenueData.map((data, index) => (
            <div key={index} className="flex items-center space-x-4">
              <div className="w-20 text-sm text-gray-600">{data.period}</div>
              <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                <div
                  className="bg-gradient-to-r from-primary-500 to-accent-500 h-6 rounded-full flex items-center justify-end pr-2"
                  style={{ width: `${(data.revenue / 1600) * 100}%` }}
                >
                  <span className="text-xs text-white font-medium">
                    ${data.revenue}
                  </span>
                </div>
              </div>
              <div className="w-16 text-sm text-gray-600">{data.bookings} bookings</div>
              <div className="w-16 flex items-center">
                {data.growth >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                )}
                <span className={`text-xs ${data.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(data.growth)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue by Service</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Haircut</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div className="bg-primary-500 h-2 rounded-full" style={{ width: '80%' }}></div>
                </div>
                <span className="text-sm font-medium">$1,960</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Hair Styling</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div className="bg-primary-500 h-2 rounded-full" style={{ width: '20%' }}></div>
                </div>
                <span className="text-sm font-medium">$490</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Methods</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Credit Card</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                </div>
                <span className="text-sm font-medium">$1,470</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Cash</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '30%' }}></div>
                </div>
                <span className="text-sm font-medium">$735</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Digital Wallet</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: '10%' }}></div>
                </div>
                <span className="text-sm font-medium">$245</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenuePage;
