/**
 * Reviews Service
 * Handles movie reviews/comments
 */

import { collection, addDoc, query, where, getDocs, orderBy, doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Add a review to a movie
 * @param {string} userId - User ID
 * @param {string} userName - User name/display name
 * @param {string} userAvatar - User avatar URL (optional)
 * @param {string} movieId - Movie ID
 * @param {string} comment - Review comment text
 * @param {number} rating - Rating (1-5)
 * @returns {Promise<Object>} - Operation result
 */
export const addReview = async (userId, userName, userAvatar, movieId, comment, rating = null) => {
  try {
    if (!userId || !movieId || !comment || !comment.trim()) {
      throw new Error('User ID, Movie ID, and comment are required');
    }

    const reviewData = {
      userId,
      userName: userName || 'Anonymous',
      userAvatar: userAvatar || null,
      movieId,
      comment: comment.trim(),
      rating: rating && rating >= 1 && rating <= 5 ? rating : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const reviewRef = await addDoc(collection(db, 'reviews'), reviewData);

    // Update movie's review count if needed (optional, don't fail if this fails)
    try {
      const movieRef = doc(db, 'movies', movieId);
      const movieDoc = await getDoc(movieRef);
      
      if (movieDoc.exists()) {
        await updateDoc(movieRef, {
          reviewCount: increment(1)
        });
      }
    } catch (updateError) {
      // Log but don't fail the review submission if updating count fails
      console.warn('Failed to update review count:', updateError);
    }

    return {
      success: true,
      reviewId: reviewRef.id,
      message: 'Review added successfully!'
    };
  } catch (error) {
    console.error('Add review error:', error);
    throw error;
  }
};

/**
 * Get reviews for a movie
 * @param {string} movieId - Movie ID
 * @param {number} limit - Maximum number of reviews to fetch (optional)
 * @returns {Promise<Array>} - Array of review objects
 */
export const getMovieReviews = async (movieId, limit = null) => {
  try {
    if (!movieId) return [];

    let reviewsQuery = query(
      collection(db, 'reviews'),
      where('movieId', '==', movieId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(reviewsQuery);
    const reviews = [];
    
    querySnapshot.forEach((doc) => {
      reviews.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Apply limit if specified
    if (limit && limit > 0) {
      return reviews.slice(0, limit);
    }

    return reviews;
  } catch (error) {
    console.error('Get reviews error:', error);
    
    // If error is about missing index, try without orderBy as fallback
    if (error.code === 'failed-precondition' || error.message?.includes('index')) {
      console.warn('Firestore index missing, fetching without orderBy');
      try {
        const fallbackQuery = query(
          collection(db, 'reviews'),
          where('movieId', '==', movieId)
        );
        const querySnapshot = await getDocs(fallbackQuery);
        const reviews = [];
        
        querySnapshot.forEach((doc) => {
          reviews.push({
            id: doc.id,
            ...doc.data()
          });
        });

        // Sort manually by createdAt in descending order
        reviews.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return dateB - dateA;
        });

        if (limit && limit > 0) {
          return reviews.slice(0, limit);
        }

        return reviews;
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
        return [];
      }
    }
    
    return [];
  }
};

/**
 * Get user's review for a movie (if exists)
 * @param {string} userId - User ID
 * @param {string} movieId - Movie ID
 * @returns {Promise<Object|null>} - Review object or null
 */
export const getUserReview = async (userId, movieId) => {
  try {
    if (!userId || !movieId) return null;

    const reviewsQuery = query(
      collection(db, 'reviews'),
      where('userId', '==', userId),
      where('movieId', '==', movieId)
    );

    const querySnapshot = await getDocs(reviewsQuery);
    
    if (querySnapshot.empty) return null;

    const reviewDoc = querySnapshot.docs[0];
    return {
      id: reviewDoc.id,
      ...reviewDoc.data()
    };
  } catch (error) {
    console.error('Get user review error:', error);
    return null;
  }
};

/**
 * Calculate average rating for a movie
 * @param {string} movieId - Movie ID
 * @returns {Promise<number>} - Average rating (0-5)
 */
export const getAverageRating = async (movieId) => {
  try {
    const reviews = await getMovieReviews(movieId);
    
    if (reviews.length === 0) return 0;

    const ratingsWithValue = reviews.filter(r => r.rating !== null && r.rating >= 1 && r.rating <= 5);
    
    if (ratingsWithValue.length === 0) return 0;

    const sum = ratingsWithValue.reduce((acc, review) => acc + review.rating, 0);
    const average = sum / ratingsWithValue.length;
    
    return Math.round(average * 10) / 10; // Round to 1 decimal place
  } catch (error) {
    console.error('Get average rating error:', error);
    return 0;
  }
};

