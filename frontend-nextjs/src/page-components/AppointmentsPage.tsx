'use client';
import React, { useState, useEffect } from 'react';
import { logger } from '@/config/logger';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  Star,
  ChevronRight,
  Filter,
  Search,
  Plus,
  CheckCircle,
  AlertCircle,
  XCircle,
  X,
  Copy
} from 'lucide-react';
import Link from 'next/link'; // import Link from 'next/link'; import Link from 'next/link'; // import { Link, , useRouter } from 'next/navigation';
import { useAuthStore } from '../store/authStore';
import { bookingService, Booking } from '../services/bookingService';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import RescheduleModal from '../components/booking/RescheduleModal';

const AppointmentsPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [appointments, setAppointments] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rescheduleModal, setRescheduleModal] = useState<{
    isOpen: boolean;
    booking: Booking | null;
  }>({ isOpen: false, booking: null });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Load appointments from API
  const loadAppointments = async () => {
    if (!isAuthenticated || !user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const userBookings = await bookingService.getUserBookings();
      setAppointments(userBookings);
    } catch (err: unknown) {
      logger.error('Error loading appointments:', err);
      setError((err as Error).message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  // Check for success message from booking flow and handle query parameters
  useEffect(() => {
    // Handle query parameters for reschedule and highlight
    const rescheduleId = searchParams.get('reschedule');
    const highlightId = searchParams.get('highlight');
    const message = searchParams.get('message');

    if (message) {
      setSuccessMessage(message);
      setShowSuccessMessage(true);
    }

    if (rescheduleId && appointments.length > 0) {
      const appointmentToReschedule = appointments.find(apt => apt.id === rescheduleId);
      if (appointmentToReschedule) {
        setRescheduleModal({ isOpen: true, booking: appointmentToReschedule });
        // Remove the reschedule parameter from URL
        const newParams = new URLSearchParams(searchParams.toString());
        newParams.delete('reschedule');
        const newUrl = newParams.toString() ? `?${newParams.toString()}` : '';
        router.replace(window.location.pathname + newUrl);
      }
    }

    if (highlightId) {
      // Scroll to the highlighted appointment after a short delay
      setTimeout(() => {
        const element = document.getElementById(`appointment-${highlightId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('ring-2', 'ring-primary-500', 'ring-opacity-50');
          // Remove highlight after 3 seconds
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-primary-500', 'ring-opacity-50');
          }, 3000);
        }
      }, 500);
    }
  }, [searchParams, appointments, router]);

  // Load appointments when component mounts or user changes
  useEffect(() => {
    loadAppointments();
  }, [isAuthenticated, user]);

  // Removed: handleCardClick - appointments should show details, not navigate to salon

  // Handle reschedule button click
  const handleRescheduleClick = (appointment: Booking, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    setRescheduleModal({ isOpen: true, booking: appointment });
  };

  // Handle cancel booking
  const handleCancelBooking = async (appointment: Booking, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click

    if (!confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      setActionLoading(appointment.id);
      await bookingService.cancelBooking(appointment.id);

      // Update the appointment in the list
      setAppointments(prev =>
        prev.map(apt =>
          apt.id === appointment.id
            ? { ...apt, status: 'CANCELLED' as const }
            : apt
        )
      );

      setSuccessMessage('Appointment cancelled successfully');
      setShowSuccessMessage(true);
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to cancel appointment');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle reschedule success
  const handleRescheduleSuccess = (updatedBooking: Booking) => {
    setAppointments(prev =>
      prev.map(apt =>
        apt.id === updatedBooking.id ? updatedBooking : apt
      )
    );
    setSuccessMessage('Appointment rescheduled successfully');
    setShowSuccessMessage(true);
  };

  // Copy user code to clipboard
  const copyUserCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    navigator.clipboard.writeText(code);
    // You could add a toast notification here
  };

  // Helper functions for appointment filtering
  const isUpcomingAppointment = (appointment: Booking) => {
    const appointmentDate = new Date(appointment.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return appointmentDate >= today && (appointment.status === 'PENDING' || appointment.status === 'CONFIRMED');
  };

  const isPastAppointment = (appointment: Booking) => {
    const appointmentDate = new Date(appointment.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return appointmentDate < today || appointment.status === 'COMPLETED' || appointment.status === 'CANCELLED';
  };

  // Get counts for tabs
  const upcomingCount = appointments.filter(isUpcomingAppointment).length;
  const pastCount = appointments.filter(isPastAppointment).length;

  // Filter appointments based on tab and search query
  const filteredAppointments = appointments.filter(appointment => {
    // Filter by tab (upcoming vs past)
    const matchesTab = activeTab === 'upcoming' ? isUpcomingAppointment(appointment) : isPastAppointment(appointment);

    // Filter by search query
    const matchesSearch = searchQuery === '' ||
      appointment.salon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appointment.service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appointment.stylist?.name.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-700';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-700';
      case 'CANCELLED':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case 'CONFIRMED':
        return <CheckCircle className="w-4 h-4" />;
      case 'PENDING':
        return <AlertCircle className="w-4 h-4" />;
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4" />;
      case 'CANCELLED':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      <div className="max-w-4xl mx-auto">
        {/* Gradient Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 md:rounded-2xl md:mt-6">
          {/* Decorative Elements */}
          <div className="absolute top-4 left-4 text-2xl opacity-20 animate-float">📅</div>
          <div className="absolute top-6 right-6 text-xl opacity-15 animate-bounce-soft">✨</div>
          <div className="absolute bottom-4 left-1/4 text-xl opacity-25 animate-pulse-soft">💇‍♀️</div>

          <div className="relative z-10 px-4 py-6">
            {/* Header Content */}
            <div className="text-center text-white mb-4">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm mb-3">
                <Calendar className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-2xl font-bold mb-1">My Appointments</h1>
              <p className="text-white/80 text-sm">Track and manage your bookings</p>
            </div>

            {/* Book New Button */}
            <div className="flex justify-center">
              <Link
                href="/salons"
                className="px-6 py-2.5 bg-white text-purple-600 rounded-full font-medium hover:bg-white/90 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Book New
              </Link>
            </div>
          </div>
        </div>

        {/* Success Message Banner */}
        {showSuccessMessage && (
          <div className="mx-4 mt-4 p-4 rounded-xl bg-green-50 text-green-700 border border-green-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">{successMessage}</span>
              </div>
              <button
                onClick={() => setShowSuccessMessage(false)}
                className="text-green-600 hover:text-green-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="mx-4 mt-4 p-4 rounded-xl bg-red-50 text-red-700 border border-red-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                <span className="font-medium">{error}</span>
              </div>
              <button
                onClick={loadAppointments}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Main Content - only show when not loading and no error */}
        {!loading && !error && (
          <>
            {/* Search and Tabs Section */}
            <div className="p-4 md:p-6 space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search appointments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all"
                />
              </div>

              {/* Tabs */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab('upcoming')}
                    className={`flex-1 px-4 py-4 font-semibold text-sm transition-all ${
                      activeTab === 'upcoming'
                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-b-3 border-green-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>Upcoming</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        activeTab === 'upcoming' ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-700'
                      }`}>
                        {upcomingCount}
                      </span>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('past')}
                    className={`flex-1 px-4 py-4 font-semibold text-sm transition-all ${
                      activeTab === 'past'
                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-b-3 border-green-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      <span>Past</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        activeTab === 'past' ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-700'
                      }`}>
                        {pastCount}
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Appointments List */}
              {filteredAppointments.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
                    <Calendar className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {searchQuery ? 'No matching appointments' : `No ${activeTab} appointments`}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {searchQuery
                      ? 'Try adjusting your search terms'
                      : activeTab === 'upcoming'
                        ? 'Book your first appointment to get started'
                        : 'Your completed appointments will appear here'
                    }
                  </p>
                  {!searchQuery && activeTab === 'upcoming' && (
                    <Link
                      href="/salons"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg"
                    >
                      Browse Salons
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredAppointments.map((appointment, index) => (
                    <div
                      key={appointment.id}
                      id={`appointment-${appointment.id}`}
                      className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 animate-slide-up transition-all duration-300"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      {/* Appointment Header */}
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center flex-shrink-0">
                          {appointment.salon.images && appointment.salon.images.length > 0 ? (
                            <img
                              src={appointment.salon.images[0]}
                              alt={appointment.salon.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-2xl">💇‍♀️</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-gray-900 text-base truncate">{appointment.salon.name}</h3>
                              {/* Show all booked services */}
                              {(appointment as any).bookingItems && (appointment as any).bookingItems.length > 0 ? (
                                <div className="mt-1 space-y-0.5">
                                  {(appointment as any).bookingItems.map((item: any, idx: number) => (
                                    <div key={idx} className="text-gray-600 text-sm">
                                      <span className="font-medium">{item.subService?.name || item.service.name}</span>
                                      {item.subService && (
                                        <span className="text-xs text-gray-500 ml-1">({item.service.name})</span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-gray-600 text-sm truncate mt-1">{appointment.service.name}</p>
                              )}
                            </div>
                            <div className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 flex-shrink-0 ${getStatusColor(appointment.status)}`}>
                              {getStatusIcon(appointment.status)}
                              {appointment.status}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Appointment Details */}
                      <div className="bg-gradient-to-r from-gray-50 to-gray-50/50 rounded-xl p-4 space-y-3 mb-4">
                        <div className="flex items-center gap-3 text-sm">
                          <div className="flex items-center gap-2 text-gray-700">
                            <Calendar className="w-4 h-4 text-purple-500" />
                            <span className="font-medium">{appointment.date}</span>
                          </div>
                          <span className="text-gray-400">•</span>
                          <div className="flex items-center gap-2 text-gray-700">
                            <Clock className="w-4 h-4 text-pink-500" />
                            <span className="font-medium">{appointment.time}</span>
                          </div>
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-600">{appointment.duration} min</span>
                        </div>
                        {appointment.stylist && (
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Star className="w-4 h-4 text-orange-500" />
                            <span>with <span className="font-medium">{appointment.stylist.name}</span></span>
                          </div>
                        )}
                        <div className="flex items-start gap-2 text-sm text-gray-700">
                          <MapPin className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{appointment.salon.address}</span>
                        </div>
                      </div>

                      {/* Price and Quick Actions */}
                      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Total Amount</p>
                          <div className="text-2xl font-bold text-gray-900">
                            {appointment.totalPrice}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={`tel:${appointment.salon.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-3 text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl transition-all shadow-md hover:shadow-lg"
                          >
                            <Phone className="w-5 h-5" />
                          </a>
                          {appointment.status === 'CONFIRMED' && appointment.userCode ? (
                            <button
                              onClick={(e) => copyUserCode(appointment.userCode!, e)}
                              className="flex items-center gap-2 text-green-700 bg-green-50 hover:bg-green-100 px-4 py-2.5 rounded-xl font-semibold text-sm border-2 border-green-200 transition-all"
                            >
                              <span className="font-mono text-base">{appointment.userCode}</span>
                              <Copy className="w-4 h-4" />
                            </button>
                          ) : null}
                        </div>
                      </div>

                      {/* Action Buttons for Upcoming Appointments */}
                      {activeTab === 'upcoming' && (
                        <div className="flex gap-3 mt-4">
                          <button
                            onClick={(e) => handleRescheduleClick(appointment, e)}
                            disabled={!bookingService.canRescheduleBooking(appointment) || actionLoading === appointment.id}
                            className="flex-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 py-3 px-4 rounded-xl text-sm font-semibold hover:from-purple-200 hover:to-pink-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                          >
                            {actionLoading === appointment.id ? 'Loading...' : 'Reschedule'}
                          </button>
                          <button
                            onClick={(e) => handleCancelBooking(appointment, e)}
                            disabled={!bookingService.canCancelBooking(appointment) || actionLoading === appointment.id}
                            className="flex-1 bg-red-50 text-red-700 py-3 px-4 rounded-xl text-sm font-semibold hover:bg-red-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed border-2 border-red-200"
                          >
                            {actionLoading === appointment.id ? 'Cancelling...' : 'Cancel'}
                          </button>
                        </div>
                      )}

                      {/* Action Buttons for Past Appointments */}
                      {activeTab === 'past' && (
                        <div className="flex gap-3 mt-4">
                          <button className="flex-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 py-3 px-4 rounded-xl text-sm font-semibold hover:from-green-200 hover:to-emerald-200 transition-all shadow-sm">
                            Book Again
                          </button>
                          <button className="flex-1 bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-700 py-3 px-4 rounded-xl text-sm font-semibold hover:from-yellow-200 hover:to-orange-200 transition-all shadow-sm">
                            Rate & Review
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Reschedule Modal */}
        {rescheduleModal.booking && (
          <RescheduleModal
            isOpen={rescheduleModal.isOpen}
            onClose={() => setRescheduleModal({ isOpen: false, booking: null })}
            booking={rescheduleModal.booking}
            onRescheduleSuccess={handleRescheduleSuccess}
            maxRescheduleLimit={3} // This could be fetched from salon config
          />
        )}
      </div>
    </div>
  );
};

export default AppointmentsPage;