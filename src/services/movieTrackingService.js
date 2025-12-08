/**
 * Movie Tracking Service
 * Handles tracking of views, downloads, and searches for trending calculation
 */

import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Increment movie view count
 * @param {string} movieId - Movie ID
 * @returns {Promise<void>}
 */
export const incrementMovieViews = async (movieId) => {
  try {
    if (!movieId) return;

    const movieRef = doc(db, 'movies', movieId);
    const movieDoc = await getDoc(movieRef);

    if (movieDoc.exists()) {
      await updateDoc(movieRef, {
        views: increment(1),
        lastViewedAt: new Date().toISOString()
      });
    } else {
      // Initialize if movie doesn't have views field
      await updateDoc(movieRef, {
        views: 1,
        lastViewedAt: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error incrementing movie views:', error);
    // Don't throw - tracking shouldn't break the app
  }
};

/**
 * Increment movie download count
 * @param {string} movieId - Movie ID
 * @returns {Promise<void>}
 */
export const incrementMovieDownloads = async (movieId) => {
  try {
    if (!movieId) return;

    const movieRef = doc(db, 'movies', movieId);
    const movieDoc = await getDoc(movieRef);

    if (movieDoc.exists()) {
      await updateDoc(movieRef, {
        downloads: increment(1),
        lastDownloadedAt: new Date().toISOString()
      });
    } else {
      // Initialize if movie doesn't have downloads field
      await updateDoc(movieRef, {
        downloads: 1,
        lastDownloadedAt: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error incrementing movie downloads:', error);
    // Don't throw - tracking shouldn't break the app
  }
};

/**
 * Increment movie search count
 * @param {string} movieId - Movie ID
 * @returns {Promise<void>}
 */
export const incrementMovieSearchCount = async (movieId) => {
  try {
    if (!movieId) return;

    const movieRef = doc(db, 'movies', movieId);
    const movieDoc = await getDoc(movieRef);

    if (movieDoc.exists()) {
      await updateDoc(movieRef, {
        searchCount: increment(1),
        lastSearchedAt: new Date().toISOString()
      });
    } else {
      // Initialize if movie doesn't have searchCount field
      await updateDoc(movieRef, {
        searchCount: 1,
        lastSearchedAt: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error incrementing movie search count:', error);
    // Don't throw - tracking shouldn't break the app
  }
};

/**
 * Calculate trending score for a movie
 * @param {Object} movie - Movie object
 * @returns {number} - Trending score
 */
export const calculateTrendingScore = (movie) => {
  if (!movie) return 0;

  const views = movie.views || 0;
  const downloads = movie.downloads || 0;
  const searchCount = movie.searchCount || 0;
  
  // Weighted scoring: downloads are most important, then views, then searches
  // Downloads are worth 3 points, views 1 point, searches 2 points
  const score = (downloads * 3) + (views * 1) + (searchCount * 2);
  
  // If admin promoted, add bonus points
  if (movie.isTrending) {
    return score + 1000; // Boost promoted movies to the top
  }
  
  return score;
};






