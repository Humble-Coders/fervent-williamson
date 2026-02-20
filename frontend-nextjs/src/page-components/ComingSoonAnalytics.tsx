'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '@/config/logger';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Calendar, Users, Heart, TrendingUp, Eye, MousePointer, UserCheck, BarChart3 } from 'lucide-react';
import { env } from '@/config/env';

interface AnalyticsData {
  summary: {
    totalPageViews: number;
    uniqueVisitors: number;
    totalSignups: number;
    conversionRate: number;
    loveClicks: number;
  };
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

interface EarlyUserStats {
  totalUsers: number;
  emailUsers: number;
  phoneUsers: number;
  recentSignups: number;
}

const ComingSoonAnalytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [earlyUserStats, setEarlyUserStats] = useState<EarlyUserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30'); // days

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [analyticsResponse, statsResponse] = await Promise.all([
        fetch(`${env.API_URL}/early-users/analytics?days=${dateRange}`),
        fetch(`${env.API_URL}/early-users/stats`)
      ]);

      if (analyticsResponse.ok) {
        const analyticsResult = await analyticsResponse.json();
        if (analyticsResult.success) {
          setAnalyticsData(analyticsResult.data);
        }
      }

      if (statsResponse.ok) {
        const statsResult = await statsResponse.json();
        if (statsResult.success) {
          setEarlyUserStats(statsResult.data);
        }
      }
    } catch (error) {
      logger.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Coming Soon Page Analytics</h1>
          <p className="text-gray-600">Track visitor engagement and conversion metrics</p>
          
          {/* Date Range Selector */}
          <div className="mt-4 flex gap-2">
            {['7', '30', '90'].map((days) => (
              <Button
                key={days}
                variant={dateRange === days ? 'primary' : 'outline'}
                onClick={() => setDateRange(days)}
                className="text-sm"
              >
                Last {days} days
              </Button>
            ))}
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
          {/* Page Views */}
          <Card className="p-6 bg-white/80 backdrop-blur-sm border border-white/50 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Page Views</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analyticsData?.summary.totalPageViews || 0}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>

          {/* Unique Visitors */}
          <Card className="p-6 bg-white/80 backdrop-blur-sm border border-white/50 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unique Visitors</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analyticsData?.summary.uniqueVisitors || 0}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>

          {/* Signups */}
          <Card className="p-6 bg-white/80 backdrop-blur-sm border border-white/50 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Signups</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analyticsData?.summary.totalSignups || 0}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <UserCheck className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>

          {/* Conversion Rate */}
          <Card className="p-6 bg-white/80 backdrop-blur-sm border border-white/50 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analyticsData?.summary.conversionRate || 0}%
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </Card>

          {/* Love Clicks */}
          <Card className="p-6 bg-white/80 backdrop-blur-sm border border-white/50 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Love Clicks</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analyticsData?.summary.loveClicks || 0}
                </p>
              </div>
              <div className="bg-pink-100 p-3 rounded-full">
                <Heart className="w-6 h-6 text-pink-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Early User Stats */}
        {earlyUserStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="p-6 bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-100">Total Waitlist</p>
                  <p className="text-3xl font-bold">{earlyUserStats.totalUsers}</p>
                </div>
                <Users className="w-8 h-8 text-primary-200" />
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-100">Email Signups</p>
                  <p className="text-3xl font-bold">{earlyUserStats.emailUsers}</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-200" />
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-100">Phone Signups</p>
                  <p className="text-3xl font-bold">{earlyUserStats.phoneUsers}</p>
                </div>
                <MousePointer className="w-8 h-8 text-green-200" />
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-100">Last 24h</p>
                  <p className="text-3xl font-bold">{earlyUserStats.recentSignups}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-orange-200" />
              </div>
            </Card>
          </div>
        )}

        {/* Key Insights */}
        <Card className="p-6 bg-white/80 backdrop-blur-sm border border-white/50 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Engagement Rate</h4>
              <p className="text-sm text-blue-700">
                {analyticsData && analyticsData.summary.loveClicks > 0 && analyticsData.summary.uniqueVisitors > 0
                  ? `${Math.round((analyticsData.summary.loveClicks / analyticsData.summary.uniqueVisitors) * 100)}% of visitors clicked the love button`
                  : 'No engagement data yet'
                }
              </p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Conversion Quality</h4>
              <p className="text-sm text-green-700">
                {analyticsData && analyticsData.summary.conversionRate > 5
                  ? 'Excellent conversion rate! 🎉'
                  : analyticsData && analyticsData.summary.conversionRate > 2
                  ? 'Good conversion rate 👍'
                  : 'Room for improvement in conversion'
                }
              </p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-2">Contact Preference</h4>
              <p className="text-sm text-purple-700">
                {earlyUserStats && earlyUserStats.emailUsers > earlyUserStats.phoneUsers
                  ? `${Math.round((earlyUserStats.emailUsers / earlyUserStats.totalUsers) * 100)}% prefer email contact`
                  : earlyUserStats && earlyUserStats.phoneUsers > earlyUserStats.emailUsers
                  ? `${Math.round((earlyUserStats.phoneUsers / earlyUserStats.totalUsers) * 100)}% prefer phone contact`
                  : 'Equal preference for email and phone'
                }
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ComingSoonAnalytics;
