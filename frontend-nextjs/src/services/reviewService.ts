import {
  FirestoreService,
  db,
  runTransaction,
  doc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  limit,
  startAfter,
} from './firestore/firestoreService';
import { docToObject, type QueryDocumentSnapshot, type PaginatedResult } from './firestore/firestoreService';
import { auth } from '@/config/firebase';

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

export interface ReviewsResponseData {
  reviews: Review[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  averageRating: number;
  totalReviews: number;
  // Cursor-based pagination fields
  lastDoc: QueryDocumentSnapshot | null;
  hasMore: boolean;
}

const reviewsFs = new FirestoreService<Review>('reviews');

export const reviewService = {
  // Get reviews for a salon (cursor-based pagination)
  async getReviewsBySalon(
    salonId: string,
    pageOrOptions: number | { pageSize?: number; lastDoc?: QueryDocumentSnapshot | null } = 1,
    pageSizeArg: number = 10
  ): Promise<ReviewsResponseData> {
    try {
      // Support both old (page, pageSize) and new ({ pageSize, lastDoc }) signatures
      let pageSize: number;
      let lastDocCursor: QueryDocumentSnapshot | null | undefined;

      if (typeof pageOrOptions === 'object') {
        pageSize = pageOrOptions.pageSize || 10;
        lastDocCursor = pageOrOptions.lastDoc;
      } else {
        pageSize = pageSizeArg;
        lastDocCursor = undefined; // No cursor for old-style calls
      }

      // Use cursor-based pagination via getPaginated
      const result: PaginatedResult<Review & { id: string }> = await reviewsFs.getPaginated({
        filters: [{ field: 'salonId', op: '==', value: salonId }],
        sort: { field: 'createdAt', direction: 'desc' },
        pageSize,
        lastDoc: lastDocCursor,
      });

      // Get total count for display
      const totalReviews = await reviewsFs.count([
        { field: 'salonId', op: '==', value: salonId },
      ]);

      // Get salon's stored average rating
      let averageRating = 0;
      try {
        const salonDoc = await getDoc(doc(db, 'salons', salonId));
        if (salonDoc.exists()) {
          const salonData = salonDoc.data();
          if (salonData?.rating) averageRating = salonData.rating;
        }
      } catch {
        // Calculate from fetched reviews
        if (result.data.length > 0) {
          const totalRating = result.data.reduce((sum, r) => sum + r.rating, 0);
          averageRating = totalRating / result.data.length;
        }
      }

      return {
        reviews: result.data,
        pagination: {
          page: typeof pageOrOptions === 'number' ? pageOrOptions : 1,
          limit: pageSize,
          total: totalReviews,
          pages: Math.ceil(totalReviews / pageSize),
        },
        averageRating,
        totalReviews,
        lastDoc: result.lastDoc,
        hasMore: result.hasMore,
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch reviews');
    }
  },

  // Create a new review (with transaction to update salon rating)
  async createReview(reviewData: CreateReviewData): Promise<Review> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      // Get user profile for denormalization
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();

      // Get booking data for denormalization
      let bookingServiceName = '';
      try {
        const bookingDoc = await getDoc(doc(db, 'bookings', reviewData.bookingId));
        const bookingData = bookingDoc.data();
        bookingServiceName = bookingData?.service?.name || '';
      } catch {
        // Booking data optional for review
      }

      const review: any = {
        ...reviewData,
        userId: user.uid,
        user: {
          id: user.uid,
          name: userData?.name || user.displayName || 'Anonymous',
          avatar: userData?.avatar || null,
        },
        booking: {
          id: reviewData.bookingId,
          service: {
            name: bookingServiceName,
          },
        },
      };

      // Use transaction to create review AND update salon rating
      const reviewRef = doc(collection(db, 'reviews'));
      const salonRef = doc(db, 'salons', reviewData.salonId);

      await runTransaction(db, async (transaction) => {
        const salonSnap = await transaction.get(salonRef);
        const salonData = salonSnap.data();

        const currentRating = salonData?.rating || 0;
        const currentCount = salonData?.reviewCount || 0;

        // Calculate new average
        const newCount = currentCount + 1;
        const newRating = ((currentRating * currentCount) + reviewData.rating) / newCount;

        // Create the review
        transaction.set(reviewRef, {
          ...review,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        // Update salon rating
        transaction.update(salonRef, {
          rating: Math.round(newRating * 10) / 10,
          reviewCount: newCount,
        });
      });

      // Return the created review
      const createdDoc = await getDoc(reviewRef);
      return docToObject<Review>(createdDoc);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create review');
    }
  },

  // Update a review
  async updateReview(reviewId: string, reviewData: UpdateReviewData): Promise<Review> {
    try {
      return await reviewsFs.update(reviewId, reviewData as any);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update review');
    }
  },

  // Delete a review
  async deleteReview(reviewId: string): Promise<void> {
    try {
      await reviewsFs.delete(reviewId);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete review');
    }
  },

  // Check if user can review a booking
  async canUserReview(bookingId: string): Promise<boolean> {
    try {
      const user = auth.currentUser;
      if (!user) return false;

      // Check if a review already exists for this booking
      const existing = await reviewsFs.getAll({
        filters: [
          { field: 'bookingId', op: '==', value: bookingId },
          { field: 'userId', op: '==', value: user.uid },
        ],
        limitCount: 1,
      });

      return existing.length === 0;
    } catch {
      return false;
    }
  },
};
