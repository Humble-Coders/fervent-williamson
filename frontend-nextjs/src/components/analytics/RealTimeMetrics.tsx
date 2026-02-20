import React, { useState, useEffect } from 'react';
import {
  Activity,
  Users,
  Eye,
  Zap,
  MousePointer,
  TrendingUp,
  Circle
} from 'lucide-react';
import { RealTimeMetrics as RealTimeMetricsType, analyticsUtils } from '../../services/analyticsApi';

interface RealTimeMetricsProps {
  data: RealTimeMetricsType;
}

interface LiveMetricCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: 'green' | 'blue' | 'purple' | 'orange';
  subtitle?: string;
}

function LiveMetricCard({ title, value, icon, color, subtitle }: LiveMetricCardProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [prevValue, setPrevValue] = useState(value);

  useEffect(() => {
    if (value !== prevValue) {
      setIsAnimating(true);
      setPrevValue(value);
      const timer = setTimeout(() => setIsAnimating(false), 500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [value, prevValue]);

  const colorClasses = {
    green: 'bg-green-500 text-green-600 bg-green-50 border-green-200',
    blue: 'bg-blue-500 text-blue-600 bg-blue-50 border-blue-200',
    purple: 'bg-purple-500 text-purple-600 bg-purple-50 border-purple-200',
    orange: 'bg-orange-500 text-orange-600 bg-orange-50 border-orange-200'
  };

  const [_bgColor, textColor, lightBg, borderColor] = colorClasses[color].split(' ');

  return (
    <div className={`bg-white rounded-lg shadow-sm border-2 ${borderColor} p-6 relative overflow-hidden`}>
      {/* Live indicator */}
      <div className="absolute top-3 right-3">
        <div className="flex items-center">
          <Circle className="w-2 h-2 text-green-500 fill-current animate-pulse mr-1" />
          <span className="text-xs text-gray-500 font-medium">LIVE</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className={`text-3xl font-bold text-gray-900 transition-all duration-300 ${
            isAnimating ? 'scale-110 text-primary-600' : ''
          }`}>
            {analyticsUtils.formatNumber(value)}
          </p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${lightBg}`}>
          <div className={textColor}>
            {icon}
          </div>
        </div>
      </div>

      {/* Animation overlay */}
      {isAnimating && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
      )}
    </div>
  );
}

function CurrentPageViews({ data }: { data: Array<{ page: string; count: number }> }) {
  const formatPageName = (page: string) => {
    const pageNames: Record<string, string> = {
      '/': 'Home',
      '/salons': 'Salon Listing',
      '/services': 'Services',
      '/booking': 'Booking',
      '/profile': 'Profile',
      '/login': 'Login',
      '/signup': 'Sign Up'
    };

    return pageNames[page] || page.replace(/^\//, '').replace(/\//g, ' > ') || 'Unknown';
  };

  const maxCount = Math.max(...data.map(item => item.count), 1);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Eye className="w-5 h-5 text-blue-500 mr-2" />
          Current Page Views
        </h3>
        <div className="flex items-center text-sm text-gray-500">
          <Circle className="w-2 h-2 text-green-500 fill-current animate-pulse mr-1" />
          Last minute
        </div>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-8">
          <Eye className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No active page views</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.slice(0, 8).map((item, index) => {
            const percentage = (item.count / maxCount) * 100;
            return (
              <div key={item.page} className="flex items-center">
                <div className="w-6 text-center">
                  <span className="text-sm font-medium text-gray-500">
                    {index + 1}
                  </span>
                </div>
                <div className="flex-1 mx-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {formatPageName(item.page)}
                    </span>
                    <span className="text-sm text-gray-600 ml-2">
                      {item.count} {item.count === 1 ? 'viewer' : 'viewers'}
                    </span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RecentActions({ data }: { data: Array<{
  eventType: string;
  page: string;
  action?: string;
  timestamp: string;
  userRole?: string;
}> }) {
  const getActionIcon = (eventType: string) => {
    switch (eventType) {
      case 'CONVERSION':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'ACTION':
        return <MousePointer className="w-4 h-4 text-blue-500" />;
      case 'ERROR':
        return <Zap className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActionColor = (eventType: string) => {
    switch (eventType) {
      case 'CONVERSION':
        return 'bg-green-50 border-green-200';
      case 'ACTION':
        return 'bg-blue-50 border-blue-200';
      case 'ERROR':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    return `${Math.floor(diffInSeconds / 3600)}h ago`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Activity className="w-5 h-5 text-purple-500 mr-2" />
          Recent Actions
        </h3>
        <div className="flex items-center text-sm text-gray-500">
          <Circle className="w-2 h-2 text-green-500 fill-current animate-pulse mr-1" />
          Live feed
        </div>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-8">
          <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No recent actions</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {data.map((item, index) => (
            <div
              key={index}
              className={`flex items-start p-3 rounded-lg border ${getActionColor(item.eventType)} transition-all duration-300 hover:shadow-sm`}
            >
              <div className="flex-shrink-0 mr-3 mt-0.5">
                {getActionIcon(item.eventType)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.action || item.eventType.toLowerCase()}
                  </p>
                  <span className="text-xs text-gray-500 ml-2">
                    {formatTimeAgo(item.timestamp)}
                  </span>
                </div>
                <p className="text-xs text-gray-600 truncate">
                  {item.page}
                </p>
                {item.userRole && (
                  <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                    {item.userRole.replace('_', ' ')}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function RealTimeMetrics({ data }: RealTimeMetricsProps) {
  return (
    <div className="space-y-6">
      {/* Live Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <LiveMetricCard
          title="Active Users"
          value={data.activeUsers}
          icon={<Users className="w-6 h-6" />}
          color="green"
          subtitle="Currently online"
        />
        
        <LiveMetricCard
          title="Active Sessions"
          value={data.activeSessions}
          icon={<Activity className="w-6 h-6" />}
          color="blue"
          subtitle="Last 5 minutes"
        />
        
        <LiveMetricCard
          title="Page Views"
          value={data.currentPageViews.reduce((sum, item) => sum + item.count, 0)}
          icon={<Eye className="w-6 h-6" />}
          color="purple"
          subtitle="Last minute"
        />
        
        <LiveMetricCard
          title="Recent Actions"
          value={data.recentActions.length}
          icon={<Zap className="w-6 h-6" />}
          color="orange"
          subtitle="Last minute"
        />
      </div>

      {/* Detailed Real-time Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CurrentPageViews data={data.currentPageViews} />
        <RecentActions data={data.recentActions} />
      </div>
    </div>
  );
}
