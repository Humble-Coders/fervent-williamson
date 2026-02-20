'use client';
import React, { useState, useEffect } from 'react';
import { logger } from '@/config/logger';
import {
  BarChart3,
  Download,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { analyticsApi, AnalyticsDashboardData, DATE_RANGE_PRESETS, analyticsUtils } from '../../services/analyticsApi';
import { OverviewCards } from '../../components/analytics/OverviewCards';
import { BusinessMetricsCharts } from '../../components/analytics/BusinessMetricsCharts';
import { RealTimeMetrics } from '../../components/analytics/RealTimeMetrics';
import { DateRangeSelector } from '../../components/analytics/DateRangeSelector';
import { AnalyticsFilters } from '../../components/analytics/AnalyticsFilters';
import CommunicationMetrics from '../../components/analytics/CommunicationMetrics';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Alert from '../../components/ui/Alert';

interface DateRange {
  startDate: string;
  endDate: string;
}

interface DashboardFilters {
  dateRange: DateRange;
  salonId?: string;
  serviceId?: string;
  userRole?: string;
  deviceType?: string;
}

export default function AnalyticsDashboard() {
  const [dashboardData, setDashboardData] = useState<AnalyticsDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<DashboardFilters>({
    dateRange: {
      startDate: DATE_RANGE_PRESETS.LAST_7_DAYS.startDate,
      endDate: DATE_RANGE_PRESETS.LAST_7_DAYS.endDate
    }
  });

  // Load dashboard data
  const loadDashboardData = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const data = await analyticsApi.getDashboardData({
        startDate: filters.dateRange.startDate,
        endDate: filters.dateRange.endDate,
        salonId: filters.salonId,
        serviceId: filters.serviceId,
        userRole: filters.userRole,
        deviceType: filters.deviceType
      });

      setDashboardData(data);
    } catch (err) {
      logger.error('Failed to load dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load data on mount and filter changes
  useEffect(() => {
    loadDashboardData();
  }, [filters]);

  // Auto-refresh real-time data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (dashboardData) {
        loadDashboardData(true);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [dashboardData, filters]);

  // Handle filter changes
  const handleDateRangeChange = (dateRange: DateRange) => {
    setFilters(prev => ({ ...prev, dateRange }));
  };

  const handleFiltersChange = (newFilters: Partial<DashboardFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Export data functionality
  const handleExportData = async () => {
    try {
      const data = await analyticsApi.getEvents({
        startDate: filters.dateRange.startDate,
        endDate: filters.dateRange.endDate,
        limit: 10000
      });

      const csv = convertToCSV(data);
      downloadCSV(csv, `analytics-${filters.dateRange.startDate}-${filters.dateRange.endDate}.csv`);
    } catch (err) {
      logger.error('Failed to export data:', err);
    }
  };

  // CSV conversion utility
  const convertToCSV = (data: any[]): string => {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
        }).join(',')
      )
    ].join('\n');

    return csvContent;
  };

  // Download CSV utility
  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading analytics dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full">
          <Alert
            type="error"
            title="Failed to Load Analytics"
            message={error}
          />
          <div className="mt-4">
            <button
              onClick={() => loadDashboardData()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Data Available</h2>
          <p className="text-gray-600">No analytics data found for the selected time period.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <BarChart3 className="w-8 h-8 text-primary-600 mr-3" />
                Analytics Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                {analyticsUtils.getDateRangeLabel(filters.dateRange.startDate, filters.dateRange.endDate)}
              </p>
            </div>

            <div className="flex items-center space-x-3">
              {/* Refresh Button */}
              <button
                onClick={() => loadDashboardData(true)}
                disabled={refreshing}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>

              {/* Export Button */}
              <button
                onClick={handleExportData}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
            </div>
          </div>


        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <DateRangeSelector
              value={filters.dateRange}
              onChange={handleDateRangeChange}
              presets={DATE_RANGE_PRESETS}
            />

            <AnalyticsFilters
              filters={filters}
              onChange={handleFiltersChange}
            />
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="space-y-6">
          {/* Overview Cards */}
          <OverviewCards data={dashboardData.overview} />

          {/* Real-time Metrics */}
          <RealTimeMetrics data={dashboardData.realTime} />

          {/* Business Metrics Charts */}
          <BusinessMetricsCharts data={dashboardData.businessMetrics} />

          {/* Communication Metrics */}
          {dashboardData.communications && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Communication Analytics
              </h2>
              <CommunicationMetrics data={dashboardData.communications} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
