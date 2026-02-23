'use client';
import React, { useState, useEffect } from 'react';
import { logger } from '@/config/logger';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Star, 
  MessageCircle, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  Scissors,
  User,
  Send
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { bookingService, Booking } from '../services/bookingService';
import { reviewService } from '../services/reviewService';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const WriteReviewPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuthStore();
  
  // Get salon info from URL params
  const salonId = searchParams.get('salonId');
  const salonName = searchParams.get('salonName') || 'CutQ';
  const bookingId = searchParams.get('bookingId');

  // Form state
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(bookingId || '');
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [userBookings, setUserBookings] = useState<Booking[]>([]);

  // Load user's completed bookings for this salon
  useEffect(() => {
    const loadBookings = async () => {
      if (!isAuthenticated || !user || !salonId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const result = await bookingService.getUserBookings({ pageSize: 100 });
        const salonBookings = result.data.filter(
          booking => booking.salon.id === salonId && booking.status === 'COMPLETED'
        );
        setUserBookings(salonBookings);
      } catch (err: unknown) {
        logger.error('Error loading bookings:', err);
        setError('Failed to load your bookings');
      } finally {
        setLoading(false);
      }
    };

    loadBookings();
  }, [isAuthenticated, user, salonId]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedBooking) {
      setError('Please select a completed booking to review');
      return;
    }
    
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }
    
    if (!comment.trim()) {
      setError('Please write a comment');
      return;
    }

    if (comment.trim().length < 10) {
      setError('Comment must be at least 10 characters long');
      return;
    }

    if (!salonId) {
      setError('Salon information is missing');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await reviewService.createReview({
        salonId,
        bookingId: selectedBooking,
        rating,
        comment: comment.trim()
      });
      
      setSuccess(true);
      
      // Redirect after success
      setTimeout(() => {
        router.push(`/salons/${salonName}/${salonId}?reviewSubmitted=true`);
      }, 2000);
      
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center p-6">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Sign In Required</h2>
          <p className="text-gray-600 mb-6">
            Please sign in to write a review
          </p>
          <Link
            href="/welcome"
            className="bg-primary-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-700 transition-colors"
          >
            Sign In
          </Link>
        </Card>
      </div>
    );
  }

  // Show success state
  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center p-6">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Review Submitted!</h2>
          <p className="text-gray-600 mb-4">
            Thank you for sharing your experience with {salonName}
          </p>
          <div className="flex items-center justify-center gap-1 mb-6">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-6 h-6 ${
                  i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-500">Redirecting you back...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-900">Write a Review</h1>
              <p className="text-sm text-gray-600">{salonName}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="p-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* No Bookings State */}
      {!loading && userBookings.length === 0 && !error && (
        <div className="p-4">
          <Card className="text-center p-8">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Completed Bookings
            </h3>
            <p className="text-gray-600 mb-6">
              You can only review services after completing a booking at this CutQ.
            </p>
            <Link
              href={`/salons/${salonName}/${salonId}`}
              className="bg-primary-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-700 transition-colors"
            >
              Book a Service
            </Link>
          </Card>
        </div>
      )}

      {/* Review Form */}
      {!loading && userBookings.length > 0 && !error && (
        <form onSubmit={handleSubmit} className="p-4 space-y-6">
          {/* Booking Selection */}
          <Card className="p-4">
            <label className="block text-sm font-medium text-gray-900 mb-3">
              <Calendar className="w-4 h-4 inline mr-2" />
              Select Booking to Review
            </label>
            <select
              value={selectedBooking}
              onChange={(e) => setSelectedBooking(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
              required
            >
              <option value="">Choose a completed booking...</option>
              {userBookings.map((booking) => (
                <option key={booking.id} value={booking.id}>
                  {booking.service.name} - {new Date(booking.date).toLocaleDateString()}
                </option>
              ))}
            </select>
          </Card>

          {/* Rating Selection */}
          <Card className="p-4">
            <label className="block text-sm font-medium text-gray-900 mb-3">
              <Star className="w-4 h-4 inline mr-2" />
              Rating
            </label>
            <div className="flex items-center justify-center gap-2 py-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-2 transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-10 h-10 ${
                      star <= (hoveredRating || rating)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-center text-sm text-gray-600">
                {rating === 1 && "Poor"}
                {rating === 2 && "Fair"}
                {rating === 3 && "Good"}
                {rating === 4 && "Very Good"}
                {rating === 5 && "Excellent"}
              </p>
            )}
          </Card>

          {/* Comment */}
          <Card className="p-4">
            <label className="block text-sm font-medium text-gray-900 mb-3">
              <MessageCircle className="w-4 h-4 inline mr-2" />
              Your Review
            </label>
            <textarea
              value={comment}
              onChange={(e) => {
                if (e.target.value.length <= 500) {
                  setComment(e.target.value);
                }
              }}
              placeholder="Share your experience with this CutQ..."
              rows={6}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
              required
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-gray-500">
                Minimum 10 characters required
              </p>
              <p className={`text-xs ${comment.length > 450 ? 'text-orange-500' : 'text-gray-500'}`}>
                {comment.length}/500
              </p>
            </div>
          </Card>

          {/* Submit Button */}
          <div className="sticky bottom-4 bg-gray-50 p-4 -mx-4 border-t border-gray-200">
            <Button
              type="submit"
              disabled={submitting || rating === 0 || !comment.trim() || comment.trim().length < 10 || !selectedBooking}
              className="w-full py-4 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
            >
              {submitting ? (
                <>
                  <LoadingSpinner size="sm" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Submit Review
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default WriteReviewPage;
