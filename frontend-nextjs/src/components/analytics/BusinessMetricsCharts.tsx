import React from 'react';
import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  Scissors,
  Clock,
  Star,
  Calendar,
  BarChart3
} from 'lucide-react';
import { BusinessMetrics, analyticsUtils } from '../../services/analyticsApi';

interface BusinessMetricsChartsProps {
  data: BusinessMetrics;
}

interface FunnelStepProps {
  label: string;
  value: number;
  percentage: number;
  isLast?: boolean;
  color: string;
}

function FunnelStep({ label, value, percentage, isLast, color }: FunnelStepProps) {
  return (
    <div className="relative">
      <div className={`${color} rounded-lg p-4 text-white relative overflow-hidden`}>
        <div className="relative z-10">
          <div className="text-2xl font-bold mb-1">
            {analyticsUtils.formatNumber(value)}
          </div>
          <div className="text-sm opacity-90">{label}</div>
          <div className="text-xs opacity-75 mt-1">
            {analyticsUtils.formatPercentage(percentage)} of total
          </div>
        </div>
        
        {/* Funnel shape */}
        {!isLast && (
          <div className="absolute -right-4 top-0 bottom-0 w-8 bg-white transform skew-x-12 opacity-20" />
        )}
      </div>
      
      {/* Arrow */}
      {!isLast && (
        <div className="flex justify-center mt-2 mb-2">
          <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-400" />
        </div>
      )}
    </div>
  );
}

function BookingFunnelChart({ data }: { data: BusinessMetrics['bookingFunnel'] }) {
  const steps = [
    { label: 'Salon Views', value: data.salonViews, color: 'bg-blue-500' },
    { label: 'Service Views', value: data.serviceViews, color: 'bg-indigo-500' },
    { label: 'Stylist Views', value: data.stylistViews, color: 'bg-purple-500' },
    { label: 'Booking Attempts', value: data.bookingAttempts, color: 'bg-pink-500' },
    { label: 'Completed Bookings', value: data.bookingCompletions, color: 'bg-green-500' }
  ];

  const maxValue = Math.max(...steps.map(step => step.value));

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <TrendingUp className="w-5 h-5 text-primary-500 mr-2" />
          Booking Funnel
        </h3>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-600">
            {analyticsUtils.formatPercentage(data.conversionRate)}
          </div>
          <div className="text-sm text-gray-600">Conversion Rate</div>
        </div>
      </div>

      <div className="space-y-4">
        {steps.map((step, index) => {
          const percentage = maxValue > 0 ? (step.value / maxValue) * 100 : 0;
          return (
            <FunnelStep
              key={step.label}
              label={step.label}
              value={step.value}
              percentage={percentage}
              isLast={index === steps.length - 1}
              color={step.color}
            />
          );
        })}
      </div>
    </div>
  );
}

function PopularContentTable({
  title,
  data,
  icon,
  type: _type
}: {
  title: string;
  data: Array<{
    name: string;
    views: number;
    bookings: number;
    conversionRate: number;
  }>;
  icon: React.ReactNode;
  type: 'salon' | 'service' | 'stylist';
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
        {icon}
        {title}
      </h3>

      {data.length === 0 ? (
        <div className="text-center py-8">
          <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No data available</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 text-sm font-medium text-gray-600">Name</th>
                <th className="text-right py-2 text-sm font-medium text-gray-600">Views</th>
                <th className="text-right py-2 text-sm font-medium text-gray-600">Bookings</th>
                <th className="text-right py-2 text-sm font-medium text-gray-600">Conv. Rate</th>
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 5).map((item, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-medium text-primary-600">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 truncate max-w-32">
                          {item.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-right text-sm text-gray-600">
                    {analyticsUtils.formatNumber(item.views)}
                  </td>
                  <td className="py-3 text-right text-sm text-gray-600">
                    {analyticsUtils.formatNumber(item.bookings)}
                  </td>
                  <td className="py-3 text-right">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      item.conversionRate >= 10 
                        ? 'bg-green-100 text-green-800'
                        : item.conversionRate >= 5
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {analyticsUtils.formatPercentage(item.conversionRate)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function UserEngagementMetrics({ data }: { data: BusinessMetrics['userEngagement'] }) {
  // Add null checks for all data properties
  const safeData = {
    averageSessionDuration: data?.averageSessionDuration ?? 0,
    averagePagesPerSession: data?.averagePagesPerSession ?? 0,
    bounceRate: data?.bounceRate ?? 0,
    returnUserRate: data?.returnUserRate ?? 0
  };

  const metrics = [
    {
      label: 'Avg. Session Duration',
      value: analyticsUtils.formatDuration(safeData.averageSessionDuration),
      icon: <Clock className="w-5 h-5" />,
      color: 'text-blue-600 bg-blue-50'
    },
    {
      label: 'Pages per Session',
      value: safeData.averagePagesPerSession.toFixed(1),
      icon: <BarChart3 className="w-5 h-5" />,
      color: 'text-green-600 bg-green-50'
    },
    {
      label: 'Bounce Rate',
      value: analyticsUtils.formatPercentage(safeData.bounceRate),
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'text-orange-600 bg-orange-50'
    },
    {
      label: 'Return User Rate',
      value: analyticsUtils.formatPercentage(safeData.returnUserRate),
      icon: <Users className="w-5 h-5" />,
      color: 'text-purple-600 bg-purple-50'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Users className="w-5 h-5 text-primary-500 mr-2" />
        User Engagement
      </h3>

      <div className="grid grid-cols-2 gap-4">
        {metrics.map((metric, index) => (
          <div key={index} className="text-center p-4 rounded-lg border border-gray-100">
            <div className={`inline-flex p-2 rounded-lg ${metric.color} mb-2`}>
              {metric.icon}
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {metric.value}
            </div>
            <div className="text-sm text-gray-600">
              {metric.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PeakTimesChart({
  hourlyData,
  dailyData
}: {
  hourlyData: Array<{ hour: number; count: number }>;
  dailyData: Array<{ day: string; count: number }>;
}) {
  // Add null checks for data arrays
  const safeHourlyData = hourlyData || [];
  const safeDailyData = dailyData || [];

  const maxHourlyCount = Math.max(...safeHourlyData.map(h => h.count), 1);
  const maxDailyCount = Math.max(...safeDailyData.map(d => d.count), 1);

  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Calendar className="w-5 h-5 text-primary-500 mr-2" />
        Peak Usage Times
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Peak Hours */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Peak Hours</h4>
          <div className="space-y-2">
            {safeHourlyData.slice(0, 6).map((item) => {
              const percentage = (item.count / maxHourlyCount) * 100;
              return (
                <div key={item.hour} className="flex items-center">
                  <div className="w-16 text-sm text-gray-600">
                    {formatHour(item.hour)}
                  </div>
                  <div className="flex-1 mx-3">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-12 text-right text-sm text-gray-600">
                    {analyticsUtils.formatNumber(item.count)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Peak Days */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Peak Days</h4>
          <div className="space-y-2">
            {safeDailyData.map((item) => {
              const percentage = (item.count / maxDailyCount) * 100;
              return (
                <div key={item.day} className="flex items-center">
                  <div className="w-16 text-sm text-gray-600">
                    {item.day.substring(0, 3)}
                  </div>
                  <div className="flex-1 mx-3">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-12 text-right text-sm text-gray-600">
                    {analyticsUtils.formatNumber(item.count)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export function BusinessMetricsCharts({ data }: BusinessMetricsChartsProps) {
  return (
    <div className="space-y-6">
      {/* Booking Funnel */}
      <BookingFunnelChart data={data.bookingFunnel} />

      {/* Popular Content Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <PopularContentTable
          title="Popular Salons"
          data={data.popularSalons.map(salon => ({
            name: salon.salonName,
            views: salon.views,
            bookings: salon.bookings,
            conversionRate: salon.conversionRate
          }))}
          icon={<ShoppingBag className="w-5 h-5 text-primary-500 mr-2" />}
          type="salon"
        />

        <PopularContentTable
          title="Popular Services"
          data={data.popularServices.map(service => ({
            name: service.serviceName,
            views: service.views,
            bookings: service.bookings,
            conversionRate: service.conversionRate
          }))}
          icon={<Scissors className="w-5 h-5 text-primary-500 mr-2" />}
          type="service"
        />

        <PopularContentTable
          title="Popular Stylists"
          data={data.popularStylists.map(stylist => ({
            name: stylist.stylistName,
            views: stylist.views,
            bookings: stylist.bookings,
            conversionRate: stylist.conversionRate
          }))}
          icon={<Star className="w-5 h-5 text-primary-500 mr-2" />}
          type="stylist"
        />
      </div>

      {/* User Engagement and Peak Times */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UserEngagementMetrics data={data?.userEngagement} />
        <PeakTimesChart
          hourlyData={data?.peakHours || []}
          dailyData={data?.peakDays || []}
        />
      </div>
    </div>
  );
}
