'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Star, MessageCircle, CheckCircle, AlertCircle } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reviewData: { rating: number; comment: string; bookingId: string }) => Promise<void>;
  salonName: string;
  salonId: string;
  userBookings?: Array<{
    id: string;
    service: { name: string };
    date: string;
    status: string;
  }>;
}

const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  salonName,
  salonId,
  userBookings = []
}) => {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedBooking, setSelectedBooking] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter completed bookings only
  const completedBookings = userBookings.filter(booking => booking.status === 'COMPLETED');

  // Check if mobile device
  const isMobile = window.innerWidth < 768;

  useEffect(() => {
    if (isOpen) {
      // On mobile, redirect to dedicated review page
      if (isMobile) {
        const params = new URLSearchParams({
          salonId,
          salonName,
        });
        router.push(`/write-review?${params.toString()}`);
        onClose();
        return;
      }

      setRating(0);
      setHoveredRating(0);
      setComment('');
      setSelectedBooking('');
      setError(null);
    }
  }, [isOpen, isMobile, router, salonId, salonName, onClose]);

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

    setLoading(true);
    setError(null);

    try {
      await onSubmit({
        rating,
        comment: comment.trim(),
        bookingId: selectedBooking
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || isMobile) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl text-text-primary">Write a Review</h2>
              <p className="text-sm text-text-secondary">{salonName}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          {/* No Completed Bookings */}
          {completedBookings.length === 0 && (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-text-primary mb-2">No Completed Bookings</h3>
              <p className="text-text-secondary mb-4">
                You can only review services after completing a booking at this salon.
              </p>
              <Button onClick={onClose} variant="outline">
                Close
              </Button>
            </div>
          )}

          {/* Review Form */}
          {completedBookings.length > 0 && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Booking Selection */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Select Booking to Review
                </label>
                <select
                  value={selectedBooking}
                  onChange={(e) => setSelectedBooking(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                >
                  <option value="">Choose a completed booking...</option>
                  {completedBookings.map((booking) => (
                    <option key={booking.id} value={booking.id}>
                      {booking.serviceItems?.length
                        ? booking.serviceItems.map(i => i.subServiceName || i.serviceName).join(', ')
                        : booking.service?.name ?? 'Service'} - {new Date(booking.date).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Rating
                </label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= (hoveredRating || rating)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-neutral-300'
                        }`}
                      />
                    </button>
                  ))}
                  {rating > 0 && (
                    <span className="ml-2 text-sm text-text-secondary">
                      {rating === 1 && '😞 Poor'}
                      {rating === 2 && '😐 Fair'}
                      {rating === 3 && '🙂 Good'}
                      {rating === 4 && '😊 Very Good'}
                      {rating === 5 && '🤩 Excellent'}
                    </span>
                  )}
                </div>
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Your Review
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience with this CutQ..."
                  rows={4}
                  className="w-full px-3 py-2 border-2 border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none transition-all resize-none"
                  required
                />
                <p className="text-xs text-text-muted mt-1">
                  {comment.length}/500 characters
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2"
                  disabled={loading || rating === 0 || !comment.trim() || !selectedBooking}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Submit Review
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ReviewModal;
