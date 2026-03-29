'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { logger } from '@/config/logger';
import { Calendar, Receipt, ArrowLeft, Filter } from 'lucide-react';
import { salonDashboardService, BookingFeesData } from '@/services/salonDashboardService';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Link from 'next/link';

function getMonthRange(year: number, month: number): { start: string; end: string } {
  const m = String(month).padStart(2, '0');
  const lastDay = new Date(year, month, 0).getDate();
  return {
    start: `${year}-${m}-01`,
    end: `${year}-${m}-${String(lastDay).padStart(2, '0')}`,
  };
}

const BookingFeesPage: React.FC = () => {
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [useCustomRange, setUseCustomRange] = useState(false);
  const [feesData, setFeesData] = useState<BookingFeesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const fetchFees = useCallback(async (start: string, end: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await salonDashboardService.getBookingFees(start, end);
      setFeesData(data);
    } catch (err: any) {
      logger.error('Error fetching booking fees:', err);
      setError(err.message || 'Failed to load booking fees');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const { start, end } = getMonthRange(selectedYear, selectedMonth);
    fetchFees(start, end);
  }, [selectedYear, selectedMonth, fetchFees]);

  const handleMonthChange = (month: number) => {
    setUseCustomRange(false);
    setSelectedMonth(month);
  };

  const handleYearChange = (delta: number) => {
    setUseCustomRange(false);
    setSelectedYear((y) => y + delta);
  };

  const handleCustomFilter = () => {
    if (customStart && customEnd) {
      setUseCustomRange(true);
      fetchFees(customStart, customEnd);
    }
  };

  const handleClearCustom = () => {
    setUseCustomRange(false);
    setCustomStart('');
    setCustomEnd('');
    const { start, end } = getMonthRange(selectedYear, selectedMonth);
    fetchFees(start, end);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED': return 'bg-green-100 text-green-800';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center gap-3 mb-3">
            <Link
              href="/salon"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Booking Fees</h1>
              <p className="text-sm text-gray-500">
                Fees for confirmed or completed bookings only (pending excluded)
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-3 sm:px-4 py-4 space-y-4">
        {/* Summary Card */}
        {feesData && !loading && (
          <div className="bg-gradient-to-br from-orange-50 to-amber-100 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">
                  {useCustomRange
                    ? `${customStart} to ${customEnd}`
                    : `${monthNames[selectedMonth - 1]} ${selectedYear}`}
                </p>
                <p className="text-3xl font-bold text-orange-800 mt-1">
                  ₹{feesData.totalBookingFees.toLocaleString('en-IN')}
                </p>
                <p className="text-sm text-orange-600 mt-1">
                  From {feesData.bookingCount} booking{feesData.bookingCount !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="p-4 bg-orange-200/50 rounded-full">
                <Receipt className="h-8 w-8 text-orange-700" />
              </div>
            </div>
          </div>
        )}

        {/* Month Selector */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-700">Select Month</h3>
          </div>

          {/* Year selector */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => handleYearChange(-1)}
              className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              &larr; {selectedYear - 1}
            </button>
            <span className="text-lg font-bold text-gray-900">{selectedYear}</span>
            <button
              onClick={() => handleYearChange(1)}
              disabled={selectedYear >= today.getFullYear()}
              className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {selectedYear + 1} &rarr;
            </button>
          </div>

          {/* Month grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {monthNames.map((name, idx) => {
              const m = idx + 1;
              const isFuture = selectedYear === today.getFullYear() && m > today.getMonth() + 1;
              const isSelected = !useCustomRange && m === selectedMonth;
              return (
                <button
                  key={m}
                  onClick={() => handleMonthChange(m)}
                  disabled={isFuture}
                  className={`py-2 px-1 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                    isSelected
                      ? 'bg-orange-600 text-white shadow-sm'
                      : isFuture
                        ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                        : 'bg-gray-50 text-gray-700 hover:bg-orange-50 hover:text-orange-700'
                  }`}
                >
                  {name.slice(0, 3)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Date Range */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-700">Custom Date Range</h3>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">Start Date</label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">End Date</label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCustomFilter}
                disabled={!customStart || !customEnd}
                className="px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
              >
                Apply
              </button>
              {useCustomRange && (
                <button
                  onClick={handleClearCustom}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Loading / Error */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Fees List */}
        {!loading && feesData && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700">
                Confirmed and completed ({feesData.bookingCount})
              </h3>
            </div>
            {feesData.entries.length === 0 ? (
              <div className="text-center py-12">
                <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-gray-900 mb-1">No bookings found</h3>
                <p className="text-sm text-gray-500">No bookings in the selected period</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {feesData.entries.map((entry) => (
                  <div key={entry.id} className="px-4 py-3 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-medium text-gray-900 truncate">{entry.customerName}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(entry.status)}`}>
                          {entry.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{entry.serviceName}</p>
                      <p className="text-xs text-gray-400">{entry.date} at {entry.time}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <p className="text-sm font-bold text-orange-700">₹{entry.bookingFee}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingFeesPage;
