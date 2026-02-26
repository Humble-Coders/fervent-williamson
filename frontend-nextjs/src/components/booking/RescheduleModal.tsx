'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, AlertCircle } from 'lucide-react';
import { Booking, bookingService } from '../../services/bookingService';
import { useBookingStore } from '../../store/bookingStore';
import LoadingSpinner from '../ui/LoadingSpinner';

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking;
  onRescheduleSuccess: (updatedBooking: Booking) => void;
  maxRescheduleLimit?: number;
}

const RescheduleModal: React.FC<RescheduleModalProps> = ({
  isOpen,
  onClose,
  booking,
  onRescheduleSuccess,
  maxRescheduleLimit = 3
}) => {
  const [selectedDate, setSelectedDate] = useState(booking.date);
  const [selectedTime, setSelectedTime] = useState(booking.time);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingTimes, setLoadingTimes] = useState(false);

  const { loadAvailableTimes } = useBookingStore();

  // Load available times when date changes
  useEffect(() => {
    if (selectedDate && selectedDate !== booking.date) {
      loadTimesForDate();
    }
  }, [selectedDate]);

  const loadTimesForDate = async () => {
    try {
      setLoadingTimes(true);
      setError(null);
      
      // Load available times for the selected date
      const times = await loadAvailableTimes(
        booking.salon.id,
        booking.service.id,
        booking.stylist?.id,
        selectedDate
      );
      
      setAvailableTimes(times);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to load available times');
      setAvailableTimes([]);
    } finally {
      setLoadingTimes(false);
    }
  };

  const handleReschedule = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if anything actually changed
      if (selectedDate === booking.date && selectedTime === booking.time) {
        setError('Please select a different date or time');
        return;
      }

      const updatedBooking = await bookingService.rescheduleBooking(
        booking.id,
        selectedDate,
        selectedTime
      );

      onRescheduleSuccess(updatedBooking);
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to reschedule booking');
    } finally {
      setLoading(false);
    }
  };

  const canReschedule = bookingService.canRescheduleBooking(booking, maxRescheduleLimit);
  const remainingReschedules = Math.max(0, maxRescheduleLimit - booking.rescheduleCount);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Reschedule Appointment</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Reschedule Info */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900">Reschedule Information</span>
            </div>
            <p className="text-sm text-blue-700">
              You have {remainingReschedules} reschedule{remainingReschedules !== 1 ? 's' : ''} remaining for this booking.
            </p>
            {booking.rescheduleCount > 0 && (
              <p className="text-xs text-blue-600 mt-1">
                This booking has been rescheduled {booking.rescheduleCount} time{booking.rescheduleCount !== 1 ? 's' : ''}.
              </p>
            )}
          </div>

          {!canReschedule ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Cannot Reschedule</h3>
              <p className="text-gray-600">
                {booking.rescheduleCount >= maxRescheduleLimit
                  ? `You have reached the maximum reschedule limit of ${maxRescheduleLimit} for this booking.`
                  : 'This booking cannot be rescheduled at this time.'}
              </p>
            </div>
          ) : (
            <>
              {/* Current Booking Info */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Current Appointment</h3>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{booking.date} at {booking.time}</span>
                </div>
              </div>

              {/* Date Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none transition-all"
                />
              </div>

              {/* Time Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Time
                </label>
                {loadingTimes ? (
                  <div className="flex items-center justify-center py-4">
                    <LoadingSpinner size="sm" />
                    <span className="ml-2 text-sm text-gray-600">Loading available times...</span>
                  </div>
                ) : selectedDate === booking.date ? (
                  <input
                    type="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none transition-all"
                  />
                ) : availableTimes.length > 0 ? (
                  <select
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select a time</option>
                    {availableTimes.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm text-gray-500 py-2">No available times for this date</p>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleReschedule}
                  disabled={loading || !selectedDate || !selectedTime || (selectedDate !== booking.date && availableTimes.length === 0)}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Rescheduling...
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4" />
                      Reschedule
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RescheduleModal;
