/**
 * Favorites Service
 * Handles adding/removing movies from user favorites
 */

import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Add movie to user favorites
 * @param {string} userId - User ID
 * @param {string} movieId - Movie ID
 * @returns {Promise<Object>} - Operation result
 */
export const addToFavorites = async (userId, movieId) => {
  try {
    if (!userId || !movieId) {
      throw new Error('User ID and Movie ID are required');
    }

    const userFavoritesRef = doc(db, 'userFavorites', userId);
    const userFavoritesDoc = await getDoc(userFavoritesRef);

    if (userFavoritesDoc.exists()) {
      const currentFavorites = userFavoritesDoc.data().movieIds || [];
      if (currentFavorites.includes(movieId)) {
        return {
          success: true,
          alreadyFavorite: true,
          message: 'Movie is already in favorites.'
        };
      }
      
      await updateDoc(userFavoritesRef, {
        movieIds: [...currentFavorites, movieId],
        updatedAt: new Date().toISOString()
      });
    } else {
      await setDoc(userFavoritesRef, {
        movieIds: [movieId],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    return {
      success: true,
      alreadyFavorite: false,
      message: 'Movie added to favorites!'
    };
  } catch (error) {
    console.error('Add to favorites error:', error);
    throw error;
  }
};

/**
 * Remove movie from user favorites
 * @param {string} userId - User ID
 * @param {string} movieId - Movie ID
 * @returns {Promise<Object>} - Operation result
 */
export const removeFromFavorites = async (userId, movieId) => {
  try {
    if (!userId || !movieId) {
      throw new Error('User ID and Movie ID are required');
    }

    const userFavoritesRef = doc(db, 'userFavorites', userId);
    const userFavoritesDoc = await getDoc(userFavoritesRef);

    if (userFavoritesDoc.exists()) {
      const currentFavorites = userFavoritesDoc.data().movieIds || [];
      if (!currentFavorites.includes(movieId)) {
        return {
          success: true,
          notFavorite: true,
          message: 'Movie is not in favorites.'
        };
      }
      
      const updatedFavorites = currentFavorites.filter(id => id !== movieId);
      
      if (updatedFavorites.length === 0) {
        // Delete document if no favorites left
        await updateDoc(userFavoritesRef, {
          movieIds: [],
          updatedAt: new Date().toISOString()
        });
      } else {
        await updateDoc(userFavoritesRef, {
          movieIds: updatedFavorites,
          updatedAt: new Date().toISOString()
        });
      }
    }

    return {
      success: true,
      message: 'Movie removed from favorites!'
    };
  } catch (error) {
    console.error('Remove from favorites error:', error);
    throw error;
  }
};

/**
 * Check if movie is in user favorites
 * @param {string} userId - User ID
 * @param {string} movieId - Movie ID
 * @returns {Promise<boolean>} - Whether movie is favorite
 */
export const isFavorite = async (userId, movieId) => {
  try {
    if (!userId || !movieId) return false;

    const userFavoritesRef = doc(db, 'userFavorites', userId);
    const userFavoritesDoc = await getDoc(userFavoritesRef);

    if (!userFavoritesDoc.exists()) return false;

    const favorites = userFavoritesDoc.data().movieIds || [];
    return favorites.includes(movieId);
  } catch (error) {
    console.error('Check favorite error:', error);
    return false;
  }
};

/**
 * Get user's favorite movies
 * @param {string} userId - User ID
 * @returns {Promise<Array<string>>} - Array of favorite movie IDs
 */
export const getUserFavorites = async (userId) => {
  try {
    if (!userId) return [];

    const userFavoritesRef = doc(db, 'userFavorites', userId);
    const userFavoritesDoc = await getDoc(userFavoritesRef);

    if (!userFavoritesDoc.exists()) return [];

    return userFavoritesDoc.data().movieIds || [];
  } catch (error) {
    console.error('Get favorites error:', error);
    return [];
  }
};







