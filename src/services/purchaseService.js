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
 * Get transaction history for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Array of purchase transactions with movie details
 */
export const getUserTransactionHistory = async (userId) => {
  try {
    if (!userId) {
      return [];
    }

    // Get all purchases for this user
    const purchasesRef = collection(db, 'purchases');
    const q = query(purchasesRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);

    const transactions = [];
    const movieIds = [];

    querySnapshot.forEach((doc) => {
      const purchase = { id: doc.id, ...doc.data() };
      transactions.push(purchase);
      if (purchase.movieId) {
        movieIds.push(purchase.movieId);
      }
    });

    // Sort by purchase date (newest first)
    transactions.sort((a, b) => {
      const dateA = new Date(a.purchasedAt || 0);
      const dateB = new Date(b.purchasedAt || 0);
      return dateB - dateA;
    });

    // Fetch movie details for each transaction
    const transactionsWithMovies = await Promise.all(
      transactions.map(async (transaction) => {
        try {
          const movieDoc = await getDoc(doc(db, 'movies', transaction.movieId));
          if (movieDoc.exists()) {
            return {
              ...transaction,
              movie: { id: movieDoc.id, ...movieDoc.data() }
            };
          }
          return {
            ...transaction,
            movie: null
          };
        } catch (error) {
          console.error(`Error fetching movie ${transaction.movieId}:`, error);
          return {
            ...transaction,
            movie: null
          };
        }
      })
    );

    return transactionsWithMovies;
  } catch (error) {
    console.error('Error getting transaction history:', error);
    return [];
  }
};

/**
 * Get all transactions (for admin)
 * @returns {Promise<Array>} - Array of all purchase transactions
 */
export const getAllTransactions = async () => {
  try {
    const purchasesRef = collection(db, 'purchases');
    const querySnapshot = await getDocs(purchasesRef);

    const transactions = [];

    querySnapshot.forEach((doc) => {
      transactions.push({ id: doc.id, ...doc.data() });
    });

    // Sort by purchase date (newest first)
    transactions.sort((a, b) => {
      const dateA = new Date(a.purchasedAt || 0);
      const dateB = new Date(b.purchasedAt || 0);
      return dateB - dateA;
    });

    // Fetch movie and user details for each transaction
    const transactionsWithDetails = await Promise.all(
      transactions.map(async (transaction) => {
        try {
          const [movieDoc, userDoc] = await Promise.all([
            getDoc(doc(db, 'movies', transaction.movieId)).catch(() => null),
            getDoc(doc(db, 'users', transaction.userId)).catch(() => null)
          ]);

          return {
            ...transaction,
            movie: movieDoc?.exists() ? { id: movieDoc.id, ...movieDoc.data() } : null,
            user: userDoc?.exists() ? { id: userDoc.id, ...userDoc.data() } : null
          };
        } catch (error) {
          console.error(`Error fetching details for transaction ${transaction.id}:`, error);
          return {
            ...transaction,
            movie: null,
            user: null
          };
        }
      })
    );

    return transactionsWithDetails;
  } catch (error) {
    console.error('Error getting all transactions:', error);
    return [];
  }
};

/**
 * Get transaction statistics (for admin)
 * @returns {Promise<Object>} - Transaction statistics
 */
export const getTransactionStats = async () => {
  try {
    const transactions = await getAllTransactions();

    const stats = {
      totalTransactions: transactions.length,
      totalRevenue: 0,
      totalUsers: new Set(),
      transactionsByDate: {},
      recentTransactions: transactions.slice(0, 10)
    };

    transactions.forEach((transaction) => {
      // Calculate revenue
      if (transaction.price) {
        stats.totalRevenue += parseFloat(transaction.price);
      }

      // Count unique users
      if (transaction.userId) {
        stats.totalUsers.add(transaction.userId);
      }

      // Group by date
      if (transaction.purchasedAt) {
        const date = new Date(transaction.purchasedAt).toLocaleDateString();
        stats.transactionsByDate[date] = (stats.transactionsByDate[date] || 0) + 1;
      }
    });

    stats.totalUsers = stats.totalUsers.size;

    return stats;
  } catch (error) {
    console.error('Error getting transaction stats:', error);
    return {
      totalTransactions: 0,
      totalRevenue: 0,
      totalUsers: 0,
      transactionsByDate: {},
      recentTransactions: []
    };
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



