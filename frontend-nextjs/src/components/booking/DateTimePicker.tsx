'use client';

import React, { useState } from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

interface BookingConfig {
  salon: {
    id: string;
    displayId?: number;
    name: string;
  };
  slotDuration: number;
  breakDuration: number;
  advanceBookingDays: number;
  minimumNoticeHours: number;
  bufferTime: number;
  maxBookingsPerDay: number;
  allowSameDayBooking: boolean;
  workingHours: Record<string, unknown>;
  paymentMethods: Record<string, unknown>[];
  timeSlots: string[];
}

interface DateTimePickerProps {
  selectedDate: string | null;
  selectedTime: string | null;
  onDateSelect: (date: string) => void;
  onTimeSelect: (time: string) => void;
  bookingConfig?: BookingConfig | null;
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({
  selectedDate,
  selectedTime,
  onDateSelect,
  onTimeSelect,
  bookingConfig,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Auto-select today's date if no date is selected and today is bookable
  React.useEffect(() => {
    if (!selectedDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check if today is bookable based on booking config
      const minimumNoticeHours = bookingConfig?.minimumNoticeHours || 0.5;
      const allowSameDayBooking = bookingConfig?.allowSameDayBooking !== false;

      if (allowSameDayBooking) {
        const minimumBookingTime = new Date();
        minimumBookingTime.setHours(minimumBookingTime.getHours() + minimumNoticeHours);

        // If there's still time today after minimum notice, select today
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);

        if (minimumBookingTime < endOfDay) {
          const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
          onDateSelect(todayString);
        }
      }
    }
  }, [selectedDate, onDateSelect, bookingConfig]);

  // Use time slots from booking config or generate default ones
  const availableTimeSlots = bookingConfig?.timeSlots || (() => {
    const defaultSlots = [];
    for (let hour = 9; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === 18 && minute > 0) break; // Stop at 6:00 PM
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        defaultSlots.push(time);
      }
    }
    return defaultSlots;
  })();

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate booking limits from configuration
    const advanceBookingDays = bookingConfig?.advanceBookingDays || 30;
    const minimumNoticeHours = bookingConfig?.minimumNoticeHours || 2;
    const allowSameDayBooking = bookingConfig?.allowSameDayBooking ?? true;

    // Calculate minimum booking date (considering minimum notice)
    const minBookingDate = new Date();
    if (!allowSameDayBooking) {
      minBookingDate.setDate(minBookingDate.getDate() + 1);
    } else {
      minBookingDate.setHours(minBookingDate.getHours() + minimumNoticeHours);
    }
    minBookingDate.setHours(0, 0, 0, 0);

    // Calculate maximum booking date
    const maxBookingDate = new Date();
    maxBookingDate.setDate(maxBookingDate.getDate() + advanceBookingDays);
    maxBookingDate.setHours(23, 59, 59, 999);

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      const isCurrentMonth = date.getMonth() === month;
      const isToday = date.getTime() === today.getTime();
      const isPast = date < today;
      const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const isSelected = selectedDate === dateString;

      // Check if date is within booking limits
      const isTooEarly = date < minBookingDate;
      const isTooLate = date > maxBookingDate;
      const isBookable = !isPast && !isTooEarly && !isTooLate && isCurrentMonth;

      days.push({
        date,
        isCurrentMonth,
        isToday,
        isPast,
        isSelected,
        isBookable,
        isTooEarly,
        isTooLate,
        dateString,
      });
    }

    return days;
  };



  const days = generateCalendarDays();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + (direction === 'next' ? 1 : -1));

    // Check if the new month has any bookable days
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const advanceBookingDays = bookingConfig?.advanceBookingDays || 30;
    const maxBookingDate = new Date();
    maxBookingDate.setDate(maxBookingDate.getDate() + advanceBookingDays);
    maxBookingDate.setHours(23, 59, 59, 999);

    if (direction === 'next') {
      // Check if the new month has any days within the booking limit
      const firstDayOfNewMonth = new Date(newMonth.getFullYear(), newMonth.getMonth(), 1);
      if (firstDayOfNewMonth <= maxBookingDate) {
        setCurrentMonth(newMonth);
      }
    } else {
      // Don't allow navigation to past months
      const lastDayOfNewMonth = new Date(newMonth.getFullYear(), newMonth.getMonth() + 1, 0);
      if (lastDayOfNewMonth >= today) {
        setCurrentMonth(newMonth);
      }
    }
  };

  return (
    <div className="mb-4">
      <div className="flex items-center gap-1 sm:gap-2 mb-3 sm:mb-4">
        <span className="text-lg sm:text-2xl">📅</span>
        <h3 className="text-base sm:text-lg font-semibold text-text-primary">
          Select Date & Time
        </h3>
        <span className="text-lg sm:text-2xl">⏰</span>
      </div>

      {/* Booking Configuration Info */}
      {bookingConfig && (
        <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-xs sm:text-sm text-blue-800">
            <div className="flex flex-wrap gap-2 sm:gap-4">
              <span>📅 Book up to {bookingConfig.advanceBookingDays} days ahead</span>
              <span>⏰ {bookingConfig.minimumNoticeHours}h minimum notice</span>
              {!bookingConfig.allowSameDayBooking && <span>🚫 No same-day booking</span>}
              <span>⏱️ {bookingConfig.slotDuration}min slots</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3 lg:gap-4">
        {/* Calendar */}
        <div className="bg-white rounded-lg p-2 sm:p-3 lg:p-4 shadow-soft">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <h4 className="text-sm sm:text-base font-semibold text-text-primary flex items-center gap-1 sm:gap-2">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
              Choose Date
            </h4>
            <div className="flex items-center gap-2">
              {(() => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const advanceBookingDays = bookingConfig?.advanceBookingDays || 30;
                const maxBookingDate = new Date();
                maxBookingDate.setDate(maxBookingDate.getDate() + advanceBookingDays);
                maxBookingDate.setHours(23, 59, 59, 999);

                // Check if previous month has any valid days
                const prevMonth = new Date(currentMonth);
                prevMonth.setMonth(currentMonth.getMonth() - 1);
                const lastDayOfPrevMonth = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0);
                const canGoPrev = lastDayOfPrevMonth >= today;

                // Check if next month has any valid days within booking limit
                const nextMonth = new Date(currentMonth);
                nextMonth.setMonth(currentMonth.getMonth() + 1);
                const firstDayOfNextMonth = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1);
                const canGoNext = firstDayOfNextMonth <= maxBookingDate;

                return (
                  <>
                    <button
                      onClick={() => navigateMonth('prev')}
                      disabled={!canGoPrev}
                      className={`p-1.5 rounded-md transition-colors ${
                        canGoPrev
                          ? 'hover:bg-neutral-100 text-text-primary'
                          : 'text-neutral-300 cursor-not-allowed'
                      }`}
                    >
                      <ChevronLeft className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-medium min-w-[100px] text-center">
                      {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                    </span>
                    <button
                      onClick={() => navigateMonth('next')}
                      disabled={!canGoNext}
                      className={`p-1.5 rounded-md transition-colors ${
                        canGoNext
                          ? 'hover:bg-neutral-100 text-text-primary'
                          : 'text-neutral-300 cursor-not-allowed'
                      }`}
                    >
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="p-1 text-center text-xs font-medium text-text-muted">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {days.map((day, index) => (
              <button
                key={index}
                onClick={() => day.isBookable && onDateSelect(day.dateString)}
                disabled={!day.isBookable}
                className={`p-1 sm:p-1.5 text-xs rounded-md transition-all duration-200 min-h-[28px] sm:min-h-[32px] ${
                  day.isSelected
                    ? 'bg-primary-500 text-white shadow-soft'
                    : day.isToday && day.isBookable
                    ? 'bg-primary-100 text-primary-700 font-semibold'
                    : !day.isBookable
                    ? 'text-neutral-300 cursor-not-allowed'
                    : 'hover:bg-primary-50 text-text-primary'
                }`}
                title={
                  day.isTooEarly
                    ? `Too early (minimum ${bookingConfig?.minimumNoticeHours || 0.5}h notice required)`
                    : day.isTooLate
                    ? `Too late (max ${bookingConfig?.advanceBookingDays || 30} days in advance)`
                    : day.isPast
                    ? 'Past date'
                    : ''
                }
              >
                {day.date.getDate()}
                {day.isToday && <div className="text-xs leading-none">Today</div>}
              </button>
            ))}
          </div>
        </div>

        {/* Time Slots */}
        <div className="bg-white rounded-lg p-2 sm:p-3 lg:p-4 shadow-soft">
          <h4 className="text-sm sm:text-base font-semibold text-text-primary mb-2 sm:mb-3 flex items-center gap-1 sm:gap-2">
            <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
            Available Times
            {selectedDate && <span className="text-xs text-text-muted hidden sm:inline">for {selectedDate}</span>}
          </h4>

          {selectedDate ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1 sm:gap-1.5 max-h-48 sm:max-h-60 overflow-y-auto scrollbar-thin">
              {availableTimeSlots.map((time) => {
                // Check if time slot is available based on minimum notice and current time
                const isTimeAvailable = () => {
                  if (!selectedDate) return true;

                  const now = new Date();
                  const selectedDateTime = new Date(`${selectedDate}T${time}`);

                  // If the selected date/time is in the past, it's not available
                  if (selectedDateTime <= now) {
                    return false;
                  }

                  // Check minimum notice requirement (default to 30 minutes for better UX)
                  const minimumNoticeHours = bookingConfig?.minimumNoticeHours || 0.5;
                  const minimumNoticeMs = minimumNoticeHours * 60 * 60 * 1000;
                  const requiredTime = now.getTime() + minimumNoticeMs;

                  // Time slot must be at least minimum notice hours from now
                  return selectedDateTime.getTime() >= requiredTime;
                };

                const timeAvailable = isTimeAvailable();

                return (
                  <button
                    key={time}
                    onClick={() => timeAvailable && onTimeSelect(time)}
                    disabled={!timeAvailable}
                    className={`p-1.5 sm:p-2 text-xs rounded-lg transition-all duration-200 min-h-[32px] sm:min-h-[36px] ${
                      selectedTime === time
                        ? 'bg-primary-500 text-white shadow-soft'
                        : !timeAvailable
                        ? 'bg-neutral-100 border border-neutral-200 text-neutral-400 cursor-not-allowed'
                        : 'bg-neutral-50 hover:bg-primary-50 text-text-primary border border-neutral-200 hover:border-primary-300'
                    }`}
                    title={
                      !timeAvailable
                        ? `Requires ${bookingConfig?.minimumNoticeHours || 0.5}h advance notice`
                        : ''
                    }
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-4 sm:py-6 text-text-muted">
              <Clock className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs sm:text-sm">Please select a date first</p>
            </div>
          )}
        </div>
      </div>

      {selectedDate && selectedTime && (
        <div className="mt-3 p-3 bg-gradient-to-r from-green-50 to-primary-50 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 text-green-800 text-sm">
            <span className="text-xl">✅</span>
            <strong>Selected:</strong> {selectedDate} at {selectedTime}
          </div>
        </div>
      )}
    </div>
  );
};

export default DateTimePicker;