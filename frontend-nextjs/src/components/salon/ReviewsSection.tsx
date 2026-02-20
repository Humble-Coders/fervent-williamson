'use client';

import React, { useState } from 'react';
import { logger } from '@/config/logger';
import { useRouter } from 'next/navigation';
import { Star, ThumbsUp, MessageCircle, Filter, Plus, Users, Calendar, CheckCircle, Loader2, ChevronDown } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { useSalonStore } from '../../store/salonStore';

interface Review {
  id: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  date: string;
  service: string;
  helpful: number;
  verified: boolean;
}

export interface ReviewsSectionProps {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
  onWriteReview: () => void;
  isAuthenticated: boolean;
  salonId?: string;
  salonName?: string;
}

const ReviewsSection: React.FC<ReviewsSectionProps> = ({
  reviews,
  averageRating,
  totalReviews,
  onWriteReview,
  isAuthenticated,
  salonId,
  salonName,
}) => {
  const router = useRouter();
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [showWriteReview, setShowWriteReview] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 5,
    comment: '',
    service: '',
  });

  const { reviewsLoading, reviewsPagination, loadMoreReviews } = useSalonStore();

  const filteredReviews = filterRating
    ? reviews.filter(review => review.rating === filterRating)
    : reviews;

  // Check if mobile device
  const isMobile = window.innerWidth < 768;

  const handleWriteReview = () => {
    if (!isAuthenticated) {
      onWriteReview();
      return;
    }

    // On mobile, navigate to dedicated review page
    if (isMobile && salonId && salonName) {
      const params = new URLSearchParams({
        salonId,
        salonName,
      });
      router.push(`/write-review?${params.toString()}`);
    } else {
      // On desktop, use modal
      setShowWriteReview(true);
    }
  };

  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => r.rating === rating).length,
    percentage: reviews.length > 0
      ? (reviews.filter(r => r.rating === rating).length / reviews.length) * 100
      : 0
  }));

  const handleSubmitReview = () => {
    // Handle review submission
    logger.info('Submitting review:', newReview);
    setShowWriteReview(false);
    setNewReview({ rating: 5, comment: '', service: '' });
  };

  return (
    <section className="py-8 lg:py-16 bg-gradient-to-r from-neutral-50 to-primary-50 relative overflow-hidden">
      {/* Background decorations - hidden on mobile for cleaner look */}
      {/* <div className="hidden lg:block absolute top-10 left-10 opacity-10 animate-float">
        <Star className="w-12 h-12 text-primary-300" />
      </div>
      <div className="hidden lg:block absolute bottom-10 right-10 opacity-10 animate-bounce-soft">
        <MessageCircle className="w-10 h-10 text-accent-300" />
      </div>
      <div className="hidden lg:block absolute top-1/2 left-1/3 opacity-5 animate-pulse-soft">
        <Users className="w-8 h-8 text-primary-200" />
      </div> */}

      <div className="container-custom relative px-4 lg:px-6">
        <div className="text-center mb-8 lg:mb-12 animate-slide-up">
          <div className="flex items-center justify-center gap-2 lg:gap-3 mb-3 lg:mb-4">
            <MessageCircle className="w-6 h-6 lg:w-8 lg:h-8 text-primary-500 animate-pulse-soft" />
            <h2 className="text-2xl lg:text-4xl font-bold text-text-primary font-heading">
              Customer Reviews
            </h2>
          </div>
          <p className="text-sm lg:text-lg text-text-secondary flex items-center justify-center gap-2">
            See what our customers are saying
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-12">
          {/* Rating Overview */}
          <div className="lg:col-span-1 animate-slide-up">
            <Card className="text-center mb-6 p-4 lg:p-6">
              <div className="mb-4 lg:mb-6">
                <div className="text-4xl lg:text-6xl font-bold text-primary-600 mb-2 flex items-center justify-center gap-2">
                  {averageRating > 0 ? averageRating.toFixed(1) : '0.0'}
                  <Star className="w-8 h-8 lg:w-12 lg:h-12 text-yellow-400 fill-current" />
                </div>
                {/* <div className="flex items-center justify-center mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 lg:w-6 lg:h-6 ${
                        i < Math.floor(averageRating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div> */}
                <p className="text-text-secondary flex items-center justify-center gap-1 text-sm lg:text-base">
                  Based on {totalReviews} review{totalReviews !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Rating Distribution */}
              <div className="space-y-2 lg:space-y-3">
                {ratingDistribution.map(({ rating, count, percentage }) => (
                  <div key={rating} className="flex items-center gap-2 lg:gap-3">
                    <div className="flex items-center gap-1 w-6 lg:w-8">
                      <span className="text-xs lg:text-sm font-medium">{rating}</span>
                      <Star className="w-3 h-3 lg:w-4 lg:h-4 text-yellow-400 fill-current" />
                    </div>
                    <div className="flex-1 bg-neutral-200 rounded-full h-1.5 lg:h-2">
                      <div
                        className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-1.5 lg:h-2 rounded-full smooth-hover"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-xs lg:text-sm text-text-muted w-6 lg:w-8 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Write Review Button */}
            <Button
              variant="primary"
              className="w-full flex items-center justify-center gap-2 py-3 lg:py-4 bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 text-white shadow-glow smooth-transform hover:scale-105"
              onClick={handleWriteReview}
            >
              <Plus className="w-4 h-4 lg:w-5 lg:h-5" />
              <span className="text-sm lg:text-base font-medium">
                {isAuthenticated ? 'Write a Review' : 'Sign Up to Review'}
              </span>
              <MessageCircle className="w-4 h-4 lg:w-5 lg:h-5" />
            </Button>

            {/* Filter Options - Mobile Optimized */}
            <Card className="mt-4 lg:mt-6 p-3 lg:p-4">
              <h3 className="font-semibold text-text-primary mb-2 lg:mb-3 flex items-center gap-2 text-sm">
                <Filter className="w-4 h-4 text-primary-500" />
                Filter Reviews
              </h3>
              {/* Mobile: 2 rows layout, Desktop: single row */}
              <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-1.5 sm:gap-2">
                <button
                  onClick={() => setFilterRating(null)}
                  className={`px-2 py-1.5 sm:px-3 sm:py-2 rounded-full text-xs smooth-hover flex items-center justify-center gap-1 ${
                    filterRating === null
                      ? 'bg-primary-500 text-white shadow-glow'
                      : 'bg-neutral-100 text-text-secondary hover:bg-primary-50'
                  }`}
                >
                  All
                  <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                </button>
                {[5, 4, 3, 2, 1].map(rating => (
                  <button
                    key={rating}
                    onClick={() => setFilterRating(rating)}
                    className={`px-2 py-1.5 sm:px-3 sm:py-2 rounded-full text-xs smooth-hover flex items-center justify-center gap-1 ${
                      filterRating === rating
                        ? 'bg-primary-500 text-white shadow-glow'
                        : 'bg-neutral-100 text-text-secondary hover:bg-primary-50'
                    }`}
                  >
                    {rating}
                    <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Reviews List */}
          <div className="lg:col-span-2">
            {filteredReviews.length === 0 ? (
              <Card className="text-center py-12 lg:py-16">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-r from-primary-100 to-accent-100 rounded-full flex items-center justify-center">
                    <Star className="w-8 h-8 lg:w-10 lg:h-10 text-primary-500" />
                  </div>
                  <div>
                    <h3 className="text-lg lg:text-xl font-semibold text-text-primary mb-2">
                      {filterRating ? `No ${filterRating}-star reviews yet` : 'No reviews yet'}
                    </h3>
                    <p className="text-text-secondary text-sm lg:text-base">
                      {filterRating
                        ? 'Try selecting a different rating filter or be the first to leave a review!'
                        : 'Be the first to share your experience with this CutQ!'
                      }
                    </p>
                  </div>
                  {!filterRating && (
                    <Button
                      onClick={() => isAuthenticated ? setShowWriteReview(true) : onWriteReview()}
                      className="mt-4 bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 text-white"
                    >
                      Write First Review ⭐
                    </Button>
                  )}
                </div>
              </Card>
            ) : (
              <div className="space-y-4 lg:space-y-6">
                {filteredReviews.map((review) => (
                <Card
                  key={review.id}
                  className="group smooth-transform gpu-accelerated animate-slide-up hover:shadow-hover p-4 lg:p-6"

                >
                  <div className="flex items-start gap-3 lg:gap-4">
                    {/* User Avatar */}
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-primary-100 to-accent-100 rounded-full flex items-center justify-center smooth-transform group-hover:scale-110 flex-shrink-0">
                      {review.userAvatar ? (
                        <img
                          src={review.userAvatar}
                          alt={review.userName}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <Users className="w-5 h-5 lg:w-6 lg:h-6 text-primary-500" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Review Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 lg:mb-3 gap-1 sm:gap-3">
                        <div className="flex items-center gap-2 lg:gap-3">
                          <h4 className="font-semibold text-text-primary text-sm lg:text-base flex items-center gap-2">
                            {review.userName}
                            {review.verified && (
                              <Badge variant="success" size="sm" className="flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                <span className="hidden sm:inline">Verified</span>
                                <span className="sm:hidden">✓</span>
                              </Badge>
                            )}
                          </h4>
                        </div>
                        <span className="text-xs lg:text-sm text-text-muted flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {review.date}
                        </span>
                      </div>

                      {/* Rating and Service */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2 lg:mb-3">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 lg:w-4 lg:h-4 ${
                                i < review.rating
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <Badge variant="primary" size="sm" className="flex items-center gap-1 self-start">
                          <Star className="w-3 h-3" />
                          <span className="text-xs">{review.service}</span>
                        </Badge>
                      </div>

                      {/* Review Comment */}
                      <p className="text-text-secondary leading-relaxed mb-3 lg:mb-4 text-sm lg:text-base">
                        {review.comment}
                      </p>

                      {/* Review Actions */}
                      <div className="flex items-center gap-3 lg:gap-4">
                        <button className="flex items-center gap-1 lg:gap-2 text-text-muted hover:text-primary-600 smooth-hover">
                          <ThumbsUp className="w-3 h-3 lg:w-4 lg:h-4" />
                          <span className="text-xs lg:text-sm">Helpful ({review.helpful})</span>
                        </button>
                        <button className="flex items-center gap-1 lg:gap-2 text-text-muted hover:text-primary-600 smooth-hover">
                          <MessageCircle className="w-3 h-3 lg:w-4 lg:h-4" />
                          <span className="text-xs lg:text-sm">Reply</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
                ))}
              </div>
            )}

            {/* Load More Reviews */}
            {filteredReviews.length > 0 && reviewsPagination.hasMore && (
              <div className="text-center mt-6 lg:mt-8">
                <Button
                  variant="outline"
                  className="flex items-center gap-2 px-6 py-3 lg:px-8 lg:py-4 text-sm lg:text-base"
                  onClick={loadMoreReviews}
                  disabled={reviewsLoading}
                >
                  {reviewsLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                  {reviewsLoading ? 'Loading...' : 'Load More Reviews'}
                  {!reviewsLoading && <MessageCircle className="w-4 h-4" />}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Write Review Modal */}
      <Modal
        isOpen={showWriteReview}
        onClose={() => setShowWriteReview(false)}
        title="Write a Review"
      >
        <div className="space-y-6">
          <div>
            <label className="flex text-sm font-medium text-text-primary mb-2 items-center gap-2">
              <Star className="w-4 h-4 text-yellow-400" />
              Rating
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map(rating => (
                <button
                  key={rating}
                  onClick={() => setNewReview({ ...newReview, rating })}
                  className="smooth-hover"
                >
                  <Star
                    className={`w-8 h-8 ${
                      rating <= newReview.rating
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="flex text-sm font-medium text-text-primary mb-2 items-center gap-2">
              <Star className="w-4 h-4 text-primary-500" />
              Service
            </label>
            <select
              value={newReview.service}
              onChange={(e) => setNewReview({ ...newReview, service: e.target.value })}
              className="input w-full"
            >
              <option value="">Select a service</option>
              <option value="Hair Cut">Hair Cut</option>
              <option value="Hair Color">Hair Color</option>
              <option value="Manicure">Manicure</option>
              <option value="Facial">Facial</option>
            </select>
          </div>

          <div>
            <label className="flex text-sm font-medium text-text-primary mb-2 items-center gap-2">
              <MessageCircle className="w-4 h-4 text-primary-500" />
              Your Review
            </label>
            <textarea
              value={newReview.comment}
              onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
              placeholder="Share your experience..."
              rows={4}
              className="input w-full resize-none"
            />
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowWriteReview(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmitReview}
              className="flex-1 flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Submit Review
              <Star className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
};

export default ReviewsSection;