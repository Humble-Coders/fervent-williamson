import React from 'react';
import { 
  Users, 
  Eye, 
  MousePointer, 
  Clock,
  Smartphone,
  Monitor,
  Tablet,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { AnalyticsOverview, analyticsUtils } from '../../services/analyticsApi';

interface OverviewCardsProps {
  data: AnalyticsOverview;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}

function MetricCard({ title, value, icon, trend, subtitle, color = 'blue' }: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-500 text-blue-600 bg-blue-50',
    green: 'bg-green-500 text-green-600 bg-green-50',
    purple: 'bg-purple-500 text-purple-600 bg-purple-50',
    orange: 'bg-orange-500 text-orange-600 bg-orange-50',
    red: 'bg-red-500 text-red-600 bg-red-50'
  };

  const [_bgColor, textColor, lightBg] = colorClasses[color].split(' ');

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center mt-2">
              {trend.isPositive ? (
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {analyticsUtils.formatPercentage(Math.abs(trend.value))}
              </span>
              <span className="text-sm text-gray-500 ml-1">vs last period</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${lightBg}`}>
          <div className={textColor}>
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
}

function DeviceBreakdownChart({ data }: { data: Array<{ deviceType: string; count: number }> }) {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  
  const deviceIcons = {
    MOBILE: <Smartphone className="w-4 h-4" />,
    DESKTOP: <Monitor className="w-4 h-4" />,
    TABLET: <Tablet className="w-4 h-4" />
  };

  const deviceColors = {
    MOBILE: 'bg-blue-500',
    DESKTOP: 'bg-green-500',
    TABLET: 'bg-purple-500'
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Breakdown</h3>
      
      {/* Progress bars */}
      <div className="space-y-3 mb-4">
        {data.map((item) => {
          const percentage = total > 0 ? (item.count / total) * 100 : 0;
          return (
            <div key={item.deviceType} className="flex items-center">
              <div className="flex items-center w-20">
                <div className="text-gray-600 mr-2">
                  {deviceIcons[item.deviceType as keyof typeof deviceIcons]}
                </div>
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {item.deviceType.toLowerCase()}
                </span>
              </div>
              <div className="flex-1 mx-3">
                <div className="bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${deviceColors[item.deviceType as keyof typeof deviceColors]}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
              <div className="w-16 text-right">
                <span className="text-sm font-medium text-gray-900">
                  {analyticsUtils.formatPercentage(percentage)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Total */}
      <div className="pt-3 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600">Total Sessions</span>
          <span className="text-sm font-bold text-gray-900">
            {analyticsUtils.formatNumber(total)}
          </span>
        </div>
      </div>
    </div>
  );
}

function TopPagesChart({ data }: { data: Array<{ page: string; count: number }> }) {
  const maxCount = Math.max(...data.map(item => item.count));

  const formatPageName = (page: string) => {
    // Convert URL paths to readable names
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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Pages</h3>
      
      <div className="space-y-3">
        {data.slice(0, 5).map((item, index) => {
          const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
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
                    {analyticsUtils.formatNumber(item.count)}
                  </span>
                </div>
                <div className="bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {data.length > 5 && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <p className="text-sm text-gray-500 text-center">
            +{data.length - 5} more pages
          </p>
        </div>
      )}
    </div>
  );
}

export function OverviewCards({ data }: OverviewCardsProps) {
  return (
    <div className="space-y-6">
      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Events"
          value={analyticsUtils.formatNumber(data.totalEvents)}
          icon={<Eye className="w-6 h-6" />}
          color="blue"
          subtitle="All tracked events"
        />
        
        <MetricCard
          title="Unique Users"
          value={analyticsUtils.formatNumber(data.uniqueUsers)}
          icon={<Users className="w-6 h-6" />}
          color="green"
          subtitle="Active users"
        />
        
        <MetricCard
          title="Sessions"
          value={analyticsUtils.formatNumber(data.uniqueSessions)}
          icon={<MousePointer className="w-6 h-6" />}
          color="purple"
          subtitle="User sessions"
        />
        
        <MetricCard
          title="Avg. Duration"
          value={data.averageDuration ? analyticsUtils.formatDuration(data.averageDuration) : 'N/A'}
          icon={<Clock className="w-6 h-6" />}
          color="orange"
          subtitle="Session duration"
        />
      </div>

      {/* Detailed Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DeviceBreakdownChart data={data.deviceBreakdown} />
        <TopPagesChart data={data.topPages} />
      </div>

      {/* User Role Breakdown */}
      {data.userRoleBreakdown.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Role Distribution</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.userRoleBreakdown.map((item) => {
              const total = data.userRoleBreakdown.reduce((sum, role) => sum + role.count, 0);
              const percentage = total > 0 ? (item.count / total) * 100 : 0;
              
              return (
                <div key={item.userRole} className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {analyticsUtils.formatNumber(item.count)}
                  </div>
                  <div className="text-sm font-medium text-gray-600 mb-1">
                    {item.userRole.replace('_', ' ')}
                  </div>
                  <div className="text-sm text-gray-500">
                    {analyticsUtils.formatPercentage(percentage)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
