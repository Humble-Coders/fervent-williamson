'use client';
import React, { useState, useEffect } from 'react';
import { logger } from '@/config/logger';
import { Calendar, Clock, Plus, Edit, Trash2, User, AlertCircle, CheckCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import { bookingService } from '../../services/bookingService';

interface TimeSlot {
  id: string;
  time: string;
  isAvailable: boolean;
  booking?: {
    id: string;
    customerName: string;
    service: string;
    duration: number;
    status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
    displayId: number;
  };
}

interface DaySchedule {
  date: string;
  dayName: string;
  timeSlots: TimeSlot[];
}

interface BookingCounts {
  pending: number;
  confirmed: number;
  total: number;
}

const SchedulePage: React.FC = () => {
  const [selectedWeek, setSelectedWeek] = useState(0); // 0 = current week, 1 = next week, etc.
  const [weekSchedule, setWeekSchedule] = useState<DaySchedule[]>([]);
  const [bookingCounts, setBookingCounts] = useState<BookingCounts>({ pending: 0, confirmed: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScheduleData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch salon bookings to populate schedule
        const bookingsResponse = await bookingService.getSalonBookings();
        const bookings = bookingsResponse.data || [];

        // Calculate booking counts
        const counts = {
          pending: bookings.filter(b => b.status === 'PENDING').length,
          confirmed: bookings.filter(b => b.status === 'CONFIRMED').length,
          total: bookings.length
        };
        setBookingCounts(counts);

        // Generate schedule with real booking data
        const scheduleWithBookings = generateWeekScheduleWithBookings(selectedWeek, bookings as any);
        setWeekSchedule(scheduleWithBookings);
      } catch (error) {
        logger.error('Error fetching schedule:', error);
        setError('Failed to load schedule data');
        // Fallback to empty schedule
        const emptySchedule = generateEmptyWeekSchedule(selectedWeek);
        setWeekSchedule(emptySchedule);
      } finally {
        setLoading(false);
      }
    };

    fetchScheduleData();
  }, [selectedWeek]);

  // Generate schedule with real booking data
  const generateWeekScheduleWithBookings = (weekOffset: number, bookings: Record<string, unknown>[]): DaySchedule[] => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + (weekOffset * 7));

    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dateString = date.toISOString().split('T')[0];

      const timeSlots: TimeSlot[] = [];
      for (let hour = 9; hour <= 18; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

          // Find booking for this date and time
          const booking = bookings.find(b => b.date === dateString && b.time === time);

          timeSlots.push({
            id: `${dateString}-${time}`,
            time,
            isAvailable: !booking,
            booking: booking ? {
              id: (booking as any).id as string,
              customerName: ((booking as any).user?.name || 'Unknown Customer') as string,
              service: ((booking as any).service?.name || 'Unknown Service') as string,
              duration: ((booking as any).service?.duration || 30) as number,
              status: (booking as any).status as 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED',
              displayId: (booking as any).displayId as number
            } : undefined
          });
        }
      }

      days.push({
        date: dateString,
        dayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
        timeSlots
      });
    }
    return days;
  };

  // Generate empty schedule structure (fallback)
  const generateEmptyWeekSchedule = (weekOffset: number): DaySchedule[] => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + (weekOffset * 7));

    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);

      const timeSlots: TimeSlot[] = [];
      for (let hour = 9; hour <= 18; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

          timeSlots.push({
            id: `${date.toISOString().split('T')[0]}-${time}`,
            time,
            isAvailable: true,
            booking: undefined
          });
        }
      }

      days.push({
        date: date.toISOString().split('T')[0],
        dayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
        timeSlots
      });
    }
    return days;
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setSelectedWeek(prev => direction === 'next' ? prev + 1 : prev - 1);
  };

  const getWeekRange = () => {
    if (weekSchedule.length === 0) return '';
    const firstDay = new Date(weekSchedule[0].date);
    const lastDay = new Date(weekSchedule[6].date);
    return `${firstDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${lastDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  const getBookingStatusStyle = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'CONFIRMED':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'COMPLETED':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'CANCELLED':
        return 'bg-red-100 border-red-300 text-red-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <AlertCircle className="w-3 h-3" />;
      case 'CONFIRMED':
        return <CheckCircle className="w-3 h-3" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <Calendar className="mx-auto h-12 w-12" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Schedule</h3>
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
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-3 sm:px-4 py-3 sm:py-4">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Schedule Management</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage your salon&apos;s weekly schedule and availability</p>

          {/* Booking Counts */}
          <div className="flex flex-wrap gap-3 sm:gap-4 mt-4">
            <div className="flex items-center space-x-2 bg-yellow-50 px-3 py-2 rounded-lg border border-yellow-200">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">
                {bookingCounts.pending} Pending
              </span>
            </div>
            <div className="flex items-center space-x-2 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                {bookingCounts.confirmed} Confirmed
              </span>
            </div>
            <div className="flex items-center space-x-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                {bookingCounts.total} Total
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="mx-3 sm:mx-4 mb-4 sm:mb-6">
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Week Navigation */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => navigateWeek('prev')}
                  className="text-xs sm:text-sm px-3 py-2"
                >
                  <span className="hidden sm:inline">← Previous Week</span>
                  <span className="sm:hidden">← Prev</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigateWeek('next')}
                  className="text-xs sm:text-sm px-3 py-2"
                >
                  <span className="hidden sm:inline">Next Week →</span>
                  <span className="sm:hidden">Next →</span>
                </Button>
              </div>
              <div className="text-center sm:text-left">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">{getWeekRange()}</h2>
                <p className="text-xs sm:text-sm text-gray-600">
                  {selectedWeek === 0 ? 'Current Week' :
                   selectedWeek === 1 ? 'Next Week' :
                   selectedWeek > 1 ? `${selectedWeek} weeks ahead` :
                   `${Math.abs(selectedWeek)} weeks ago`}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" className="flex items-center justify-center gap-2 text-xs sm:text-sm px-3 py-2">
                <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Edit Hours</span>
                <span className="sm:hidden">Edit</span>
              </Button>
              <Button variant="primary" className="flex items-center justify-center gap-2 text-xs sm:text-sm px-3 py-2">
                <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Block Time</span>
                <span className="sm:hidden">Block</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Grid */}
      <div className="mx-3 sm:mx-4">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[800px] sm:min-w-full">
              {/* Header */}
              <div className="grid grid-cols-8 bg-gray-50 border-b">
                <div className="p-2 sm:p-4 text-xs sm:text-sm font-medium text-gray-700">Time</div>
                {weekSchedule.map((day) => (
                  <div key={day.date} className="p-2 sm:p-4 text-center border-l">
                    <div className="text-xs sm:text-sm font-medium text-gray-900">
                      <span className="hidden sm:inline">{day.dayName}</span>
                      <span className="sm:hidden">{day.dayName.slice(0, 3)}</span>
                    </div>
                    <div className="text-xs text-gray-600">{new Date(day.date).getDate()}</div>
                  </div>
                ))}
              </div>

              {/* Time Slots */}
              <div className="max-h-[60vh] sm:max-h-96 overflow-y-auto">
                {Array.from(new Set(weekSchedule[0]?.timeSlots.map(slot => slot.time) || [])).map((time) => (
                  <div key={time} className="grid grid-cols-8 border-b border-gray-100 hover:bg-gray-50">
                    <div className="p-2 sm:p-3 text-xs sm:text-sm text-gray-600 font-medium border-r bg-gray-50">
                      {time}
                    </div>
                    {weekSchedule.map((day) => {
                      const slot = day.timeSlots.find(s => s.time === time);
                      return (
                        <div key={`${day.date}-${time}`} className="p-1 border-l min-h-[50px] sm:min-h-[60px]">
                          {slot?.booking ? (
                            <div className={`border rounded p-1 sm:p-2 h-full cursor-pointer hover:shadow-sm transition-shadow ${getBookingStatusStyle(slot.booking.status)}`}>
                              <div className="flex items-start justify-between mb-1">
                                <div className="text-xs font-medium truncate flex-1">
                                  #{slot.booking.displayId}
                                </div>
                                {getStatusIcon(slot.booking.status)}
                              </div>
                              <div className="text-xs truncate mb-1">
                                {slot.booking.customerName}
                              </div>
                              <div className="text-xs truncate opacity-90">
                                {slot.booking.service}
                              </div>
                              <div className="text-xs opacity-75 mt-1">
                                {slot.booking.duration}min
                              </div>
                            </div>
                          ) : (
                            <div className="h-full flex items-center justify-center">
                              <button className="w-full h-full text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors touch-manipulation active:scale-95">
                                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mx-auto" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
          </div>
        </div>
      </div>

        {/* Legend */}
        <div className="mx-3 sm:mx-4 mt-4 sm:mt-6 bg-white rounded-lg shadow p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Legend</h3>
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3 sm:gap-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded flex items-center justify-center">
                <AlertCircle className="w-2 h-2 text-yellow-600" />
              </div>
              <span className="text-xs sm:text-sm text-gray-600">Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border border-green-300 rounded flex items-center justify-center">
                <CheckCircle className="w-2 h-2 text-green-600" />
              </div>
              <span className="text-xs sm:text-sm text-gray-600">Confirmed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
              <span className="text-xs sm:text-sm text-gray-600">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-white border border-gray-300 rounded"></div>
              <span className="text-xs sm:text-sm text-gray-600">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
              <span className="text-xs sm:text-sm text-gray-600">Cancelled</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchedulePage;
