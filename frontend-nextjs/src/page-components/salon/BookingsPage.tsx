'use client';
import React, { useState, useEffect } from 'react';
import { logger } from '@/config/logger';
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  CheckCircle,
  AlertCircle,
  XCircle,
  Key,
  Copy,
  Check
} from 'lucide-react';
import { bookingService, Booking } from '../../services/bookingService';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Button from '../../components/ui/Button';

const BookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [statusCounts, setStatusCounts] = useState({ pending: 0, confirmed: 0, completed: 0, cancelled: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'confirmed' | 'completed' | 'cancelled'>('pending');
  const [confirmingBooking, setConfirmingBooking] = useState<string | null>(null);
  const [completingBooking, setCompletingBooking] = useState<string | null>(null);
  const [cancellingBooking, setCancellingBooking] = useState<string | null>(null);
  const [userCodeInput, setUserCodeInput] = useState('');
  const [copiedCodes, setCopiedCodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const init = async () => {
      try {
        const salonId = await bookingService.getCurrentSalonId();

        unsubscribe = bookingService.listenAllSalonBookings(salonId, (allBookings) => {
          setBookings(allBookings);
          setStatusCounts({
            pending: allBookings.filter((b) => b.status === 'PENDING').length,
            confirmed: allBookings.filter((b) => b.status === 'CONFIRMED').length,
            completed: allBookings.filter((b) => b.status === 'COMPLETED').length,
            cancelled: allBookings.filter((b) => b.status === 'CANCELLED').length,
          });
          setLoading(false);
        });
      } catch (err) {
        logger.error('Failed to initialise bookings:', err);
        setError((err as Error).message);
        setBookings(mockBookings);
        setLoading(false);
      }
    };

    init();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleConfirmBooking = async (bookingId: string) => {
    try {
      setConfirmingBooking(bookingId);
      const updatedBooking = await bookingService.confirmBooking(bookingId);
      alert(`Booking confirmed! User code: ${updatedBooking.userCode}`);
    } catch (err: unknown) {
      alert(`Error confirming booking: ${(err as Error).message}`);
    } finally {
      setConfirmingBooking(null);
    }
  };

  const handleSalonCancelBooking = async (bookingId: string) => {
    if (
      !confirm(
        'Cancel this booking? The customer will receive an email and the booking will move to Cancelled.',
      )
    ) {
      return;
    }
    try {
      setCancellingBooking(bookingId);
      await bookingService.cancelBooking(bookingId, { cancelledBy: 'SALON' });
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to cancel booking');
    } finally {
      setCancellingBooking(null);
    }
  };

  const handleCompleteBooking = async (bookingId: string) => {
    if (!userCodeInput.trim()) {
      alert('Please enter the user code');
      return;
    }

    try {
      setCompletingBooking(bookingId);
      await bookingService.completeBooking(bookingId, userCodeInput);
      setUserCodeInput('');
      alert('Booking completed successfully!');
    } catch (err: unknown) {
      alert(`Error completing booking: ${(err as Error).message}`);
    } finally {
      setCompletingBooking(null);
    }
  };

  const copyToClipboard = async (text: string, bookingId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCodes(prev => new Set([...prev, bookingId]));
      setTimeout(() => {
        setCopiedCodes(prev => {
          const newSet = new Set(prev);
          newSet.delete(bookingId);
          return newSet;
        });
      }, 2000);
    } catch (err) {
      logger.error('Failed to copy:', err);
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    switch (activeTab) {
      case 'pending':
        return booking.status === 'PENDING';
      case 'confirmed':
        return booking.status === 'CONFIRMED';
      case 'completed':
        return booking.status === 'COMPLETED';
      case 'cancelled':
        return booking.status === 'CANCELLED';
      default:
        return false;
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'CONFIRMED':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'COMPLETED':
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
      case 'CANCELLED':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-3 sm:px-4 py-3 sm:py-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Salon Bookings</h1>

          {/* Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 bg-gray-100 p-1 rounded-lg">
            {[
              { id: 'pending', label: 'Pending', count: statusCounts.pending },
              { id: 'confirmed', label: 'Confirmed', count: statusCounts.confirmed },
              { id: 'completed', label: 'Completed', count: statusCounts.completed },
              { id: 'cancelled', label: 'Cancelled', count: statusCounts.cancelled },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as 'pending' | 'confirmed' | 'completed' | 'cancelled')}
                className={`py-2 px-1 sm:px-3 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap text-center ${activeTab === tab.id
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-3 sm:mx-4 mt-3 sm:mt-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-xs sm:text-sm">{error}</p>
        </div>
      )}

      {/* Bookings List */}
      <div className="px-3 sm:px-4 py-3 sm:py-4">
        {filteredBookings.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <Calendar className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
              No {activeTab} bookings
            </h3>
            <p className="text-sm sm:text-base text-gray-600 px-4">
              {activeTab === 'pending'
                ? 'New bookings will appear here for confirmation or cancellation'
                : activeTab === 'cancelled'
                  ? 'Bookings you or the customer cancelled appear here'
                  : `No ${activeTab} appointments at the moment`}
            </p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {filteredBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onConfirm={handleConfirmBooking}
                onComplete={handleCompleteBooking}
                onSalonCancel={handleSalonCancelBooking}
                confirmingBooking={confirmingBooking}
                completingBooking={completingBooking}
                cancellingBooking={cancellingBooking}
                userCodeInput={userCodeInput}
                setUserCodeInput={setUserCodeInput}
                copiedCodes={copiedCodes}
                copyToClipboard={copyToClipboard}
                getStatusIcon={getStatusIcon}
                getStatusColor={getStatusColor}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// BookingCard component
interface BookingCardProps {
  booking: Booking;
  onConfirm: (bookingId: string) => void;
  onComplete: (bookingId: string) => void;
  onSalonCancel: (bookingId: string) => void;
  confirmingBooking: string | null;
  completingBooking: string | null;
  cancellingBooking: string | null;
  userCodeInput: string;
  setUserCodeInput: (value: string) => void;
  copiedCodes: Set<string>;
  copyToClipboard: (text: string, bookingId: string) => void;
  getStatusIcon: (status: string) => React.ReactElement;
  getStatusColor: (status: string) => string;
}

const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  onConfirm,
  onComplete,
  onSalonCancel,
  confirmingBooking,
  completingBooking,
  cancellingBooking,
  userCodeInput,
  setUserCodeInput,
  copiedCodes,
  copyToClipboard,
  getStatusIcon,
  getStatusColor,
}) => {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{booking.user?.name || 'Unknown'}</h3>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded flex-shrink-0">
                #{booking.id.slice(0, 6)}
              </span>
            </div>
            {booking.serviceItems && booking.serviceItems.length > 0 ? (
              <div className="space-y-0.5">
                {booking.serviceItems.map((item, idx) => (
                  <p key={idx} className="text-xs sm:text-sm text-gray-600">
                    <span className="font-medium">{item.subServiceName || item.serviceName}</span>
                    {item.subServiceName && <span className="text-gray-500 ml-1">({item.serviceName})</span>}
                    {(item.quantity ?? 1) > 1 && <span className="text-gray-500 ml-1">×{item.quantity}</span>}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-gray-600 truncate">{booking.service?.name ?? 'Service'}</p>
            )}
            <div className="flex items-center space-x-1 text-xs text-gray-500 mt-1 overflow-hidden">
              <span className="truncate">User #{booking.user?.id?.slice(0, 6)}</span>
              <span>•</span>
              <span className="truncate">
                {booking.serviceItems && booking.serviceItems.length > 0
                  ? `${booking.serviceItems.length} service${booking.serviceItems.length !== 1 ? 's' : ''}`
                  : `Service: ${booking.service?.name ?? ''}`}
              </span>
              {booking.stylist && (
                <>
                  <span>•</span>
                  <span className="truncate">Stylist: {booking.stylist.name}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0 ml-2">
          <div className="hidden sm:block">
            {getStatusIcon(booking.status)}
          </div>
          <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
            {booking.status}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
        <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
          <Calendar className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{booking.date}</span>
        </div>
        <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
          <Clock className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{booking.time}</span>
        </div>
        <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600 sm:col-span-2">
          <Mail className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{booking.user?.email}</span>
        </div>
        {booking.user?.phone && (
          <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600 sm:col-span-2">
            <Phone className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{booking.user?.phone}</span>
          </div>
        )}
      </div>

      {/* Price */}
      <div className="mb-4">
        <span className="text-base sm:text-lg font-semibold text-gray-900">₹{(Number(booking.totalPrice) || 0) + (Number(booking.bookingFee) > 0 ? Number(booking.bookingFee) : 0)}</span>
        <span className="text-xs sm:text-sm text-gray-600 ml-2">
          ({booking.serviceItems?.reduce((sum, i) => sum + i.duration * (i.quantity ?? 1), 0) ?? booking.service?.duration ?? 0} min)
        </span>
        {Number(booking.bookingFee) > 0 && (
          <span className="text-xs text-gray-500 ml-2">(incl. ₹{Number(booking.bookingFee)} booking fee)</span>
        )}
      </div>

      {booking.status === 'CANCELLED' && booking.cancelledBy && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg">
          <p className="text-xs sm:text-sm text-red-800">
            {booking.cancelledBy === 'SALON'
              ? 'Cancelled by salon'
              : 'Cancelled by customer'}
          </p>
        </div>
      )}

      {/* Notes */}
      {booking.notes && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs sm:text-sm text-gray-700">{booking.notes}</p>
        </div>
      )}

      {/* User Code Display */}
      {booking.userCode && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-green-800">User Code</p>
              <p className="text-lg sm:text-xl font-mono font-bold text-green-900">{booking.userCode}</p>
            </div>
            <button
              onClick={() => copyToClipboard(booking.userCode!, booking.id)}
              className="p-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-lg transition-colors flex-shrink-0 ml-2"
            >
              {copiedCodes.has(booking.id) ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
          <p className="text-xs text-green-600 mt-2">
            Share this code with the customer. They&apos;ll need it when they arrive.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3">
        {booking.status === 'PENDING' && (
          <>
            <Button
              onClick={() => onConfirm(booking.id)}
              disabled={
                confirmingBooking === booking.id ||
                cancellingBooking === booking.id
              }
              className="w-full sm:flex-1 min-w-0 bg-green-600 hover:bg-green-700 text-sm sm:text-base py-2.5 sm:py-2"
            >
              {confirmingBooking === booking.id ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  <span className="hidden sm:inline">Confirming...</span>
                  <span className="sm:hidden">Confirming</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Confirm Booking</span>
                  <span className="sm:hidden">Confirm</span>
                </>
              )}
            </Button>
            <Button
              variant="danger"
              onClick={() => onSalonCancel(booking.id)}
              disabled={
                cancellingBooking === booking.id ||
                confirmingBooking === booking.id
              }
              className="w-full sm:flex-1 min-w-0 text-sm sm:text-base py-2.5 sm:py-2"
            >
              {cancellingBooking === booking.id ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Cancelling...
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Cancel booking</span>
                  <span className="sm:hidden">Cancel</span>
                </>
              )}
            </Button>
          </>
        )}

        {booking.status === 'CONFIRMED' && (
          <div className="w-full space-y-3">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <input
                type="text"
                placeholder="Enter user code"
                value={userCodeInput}
                onChange={(e) => setUserCodeInput(e.target.value)}
                className="w-full sm:flex-1 px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base"
                maxLength={6}
              />
              <Button
                onClick={() => onComplete(booking.id)}
                disabled={completingBooking === booking.id || !userCodeInput.trim()}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-sm sm:text-base py-2.5 sm:py-2"
              >
                {completingBooking === booking.id ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <Key className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Complete</span>
                    <span className="sm:hidden">✓</span>
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Ask the customer for their 6-digit code to mark as completed
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Mock data for demo
const mockBookings: Booking[] = [
  {
    id: 'mock1',
    userId: 'user1',
    salonId: 'salon1',
    serviceId: 'service1',
    date: '2025-01-10',
    time: '10:00',
    duration: 60,
    status: 'PENDING',
    totalPrice: 50,
    bookingFee: 5,
    notes: 'First time customer',
    discount: 0,
    rescheduleCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    salon: { id: 'salon1', name: 'Demo Salon', address: '123 Main St', phone: '+1234567890', images: [] },
    user: {
      id: 'user1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
    },
    service: {
      id: 'service1',
      name: 'Haircut & Style',
      description: 'Classic haircut with styling',
      duration: 60,
      price: 50,
      category: 'Hair',
    },
  },
  {
    id: 'mock2',
    userId: 'user2',
    salonId: 'salon1',
    serviceId: 'service2',
    date: '2025-01-10',
    time: '14:00',
    duration: 120,
    status: 'CONFIRMED',
    totalPrice: 75,
    bookingFee: 5,
    userCode: '123456',
    discount: 0,
    rescheduleCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    salon: { id: 'salon1', name: 'Demo Salon', address: '123 Main St', phone: '+1234567890', images: [] },
    user: {
      id: 'user2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '+1234567891',
    },
    service: {
      id: 'service2',
      name: 'Color & Cut',
      description: 'Full color treatment with cut',
      duration: 120,
      price: 75,
      category: 'Hair',
    },
    stylist: {
      id: 'stylist1',
      name: 'Sarah Johnson',
      specialties: ['Coloring', 'Cutting'],
    },
  },
  {
    id: 'mock3',
    userId: 'user3',
    salonId: 'salon1',
    serviceId: 'service1',
    date: '2025-01-08',
    time: '11:00',
    duration: 45,
    status: 'CANCELLED',
    totalPrice: 40,
    bookingFee: 5,
    cancelledBy: 'SALON',
    discount: 0,
    rescheduleCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    salon: { id: 'salon1', name: 'Demo Salon', address: '123 Main St', phone: '+1234567890', images: [] },
    user: {
      id: 'user3',
      name: 'Alex Lee',
      email: 'alex@example.com',
      phone: '+1234567892',
    },
    service: {
      id: 'service1',
      name: 'Beard trim',
      description: 'Beard trim',
      duration: 45,
      price: 40,
      category: 'Hair',
    },
  },
];

export default BookingsPage;
