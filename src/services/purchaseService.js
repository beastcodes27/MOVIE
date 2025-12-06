/**
 * Purchase Service
 * Handles movie purchases and payment tracking
 */

import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Purchase a premium movie
 * @param {string} userId - User ID
 * @param {string} movieId - Movie ID
 * @param {number} price - Movie price
 * @param {string} transactionId - FastLipa transaction ID (optional)
 * @returns {Promise<Object>} - Purchase result
 */
export const purchaseMovie = async (userId, movieId, price, transactionId = null) => {
  try {
    if (!userId || !movieId) {
      throw new Error('User ID and Movie ID are required');
    }

    // Check if already purchased
    const purchaseRef = doc(db, 'purchases', `${userId}_${movieId}`);
    const purchaseDoc = await getDoc(purchaseRef);

    if (purchaseDoc.exists()) {
      return {
        success: true,
        alreadyPurchased: true,
        message: 'You have already purchased this movie.'
      };
    }

    // Create purchase record
    const purchaseData = {
      userId,
      movieId,
      price: parseFloat(price),
      purchasedAt: new Date().toISOString(),
      status: 'completed',
      paymentMethod: 'FastLipa',
      ...(transactionId && { transactionId })
    };

    await setDoc(purchaseRef, purchaseData);

    // Update user's purchased movies list
    const userPurchasesRef = doc(db, 'userPurchases', userId);
    const userPurchasesDoc = await getDoc(userPurchasesRef);

    if (userPurchasesDoc.exists()) {
      const currentPurchases = userPurchasesDoc.data().movieIds || [];
      if (!currentPurchases.includes(movieId)) {
        await updateDoc(userPurchasesRef, {
          movieIds: [...currentPurchases, movieId],
          updatedAt: new Date().toISOString()
        });
      }
    } else {
      await setDoc(userPurchasesRef, {
        movieIds: [movieId],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    return {
      success: true,
      alreadyPurchased: false,
      message: 'Movie purchased successfully!'
    };
  } catch (error) {
    console.error('Purchase error:', error);
    throw error;
  }
};

/**
 * Check if user has purchased a movie
 * @param {string} userId - User ID
 * @param {string} movieId - Movie ID
 * @returns {Promise<boolean>} - Whether user has purchased
 */
export const hasUserPurchased = async (userId, movieId) => {
  try {
    if (!userId || !movieId) {
      return false;
    }

    const purchaseRef = doc(db, 'purchases', `${userId}_${movieId}`);
    const purchaseDoc = await getDoc(purchaseRef);
    
    return purchaseDoc.exists();
  } catch (error) {
    console.error('Error checking purchase:', error);
    return false;
  }
};

/**
 * Get all purchased movies for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Array of purchased movie IDs
 */
export const getUserPurchasedMovies = async (userId) => {
  try {
    if (!userId) {
      return [];
    }

    const userPurchasesRef = doc(db, 'userPurchases', userId);
    const userPurchasesDoc = await getDoc(userPurchasesRef);

    if (userPurchasesDoc.exists()) {
      return userPurchasesDoc.data().movieIds || [];
    }

    return [];
  } catch (error) {
    console.error('Error getting purchased movies:', error);
    return [];
  }
};

/**
 * Simulate payment processing
 * @param {number} amount - Payment amount
 * @returns {Promise<Object>} - Payment result
 */
export const processPayment = async (amount) => {
  // Simulate payment processing delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // For demo purposes, always succeed
  // In production, integrate with a real payment gateway (Stripe, PayPal, etc.)
  return {
    success: true,
    transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    amount: parseFloat(amount),
    message: 'Payment processed successfully'
  };
};



