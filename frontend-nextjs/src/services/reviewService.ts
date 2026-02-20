import { api } from './api';
import { extractErrorMessage } from '../utils/errorHandler';

export interface Review {
  id: string;
  salonId: string;
  bookingId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  booking: {
    id: string;
    service: {
      name: string;
    };
  };
}

export interface CreateReviewData {
  salonId: string;
  bookingId: string;
  rating: number;
  comment: string;
}

export interface UpdateReviewData {
  rating?: number;
  comment?: string;
}

export interface ReviewsResponse {
  success: boolean;
  data: {
    reviews: Review[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
    averageRating: number;
    totalReviews: number;
  };
  message: string;
}

interface ReviewResponse {
  success: boolean;
  data: Review;
  message: string;
}

export const reviewService = {
  // Get reviews for a salon
  async getReviewsBySalon(salonId: string, page: number = 1, limit: number = 10): Promise<ReviewsResponse['data']> {
    try {
      const response = await api.get<ReviewsResponse>(`/reviews/salon/${salonId}?page=${page}&limit=${limit}`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(extractErrorMessage(error));
    }
  },

  // Create a new review
  async createReview(reviewData: CreateReviewData): Promise<Review> {
    try {
      const response = await api.post<ReviewResponse>('/reviews', reviewData);
      return response.data.data;
    } catch (error: any) {
      throw new Error(extractErrorMessage(error));
    }
  },

  // Update a review
  async updateReview(reviewId: string, reviewData: UpdateReviewData): Promise<Review> {
    try {
      const response = await api.put<ReviewResponse>(`/reviews/${reviewId}`, reviewData);
      return response.data.data;
    } catch (error: any) {
      throw new Error(extractErrorMessage(error));
    }
  },

  // Delete a review
  async deleteReview(reviewId: string): Promise<void> {
    try {
      await api.delete(`/reviews/${reviewId}`);
    } catch (error: any) {
      throw new Error(extractErrorMessage(error));
    }
  },

  // Check if user can review a booking
  async canUserReview(bookingId: string): Promise<boolean> {
    try {
      // This would be implemented as a separate endpoint
      // For now, we'll handle this in the create review error handling
      return true;
    } catch (error: any) {
      return false;
    }
  },
};
