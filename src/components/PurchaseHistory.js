import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserTransactionHistory } from '../services/purchaseService';
import './Profile.css';

const formatPrice = (value) => {
  const amount = Number(value) || 0;
  return `$${amount.toFixed(2)}`;
};

const PurchaseHistory = () => {
  const { currentUser } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!currentUser) return;
      setLoading(true);
      try {
        const data = await getUserTransactionHistory(currentUser.uid);
        setTransactions(data);
      } catch (err) {
        console.error('Failed to load transactions', err);
        setError('Failed to load purchase history.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentUser]);

  return (
    <div className="profile-page">
      <div className="profile-container">
        <h1>Purchase History</h1>

        {error && <div className="profile-message error">{error}</div>}

        {loading ? (
          <div className="loading">Loading transactions...</div>
        ) : transactions.length === 0 ? (
          <div className="no-transactions">
            <p>No purchases yet. Start exploring movies to make your first purchase!</p>
          </div>
        ) : (
          <div className="transactions-section">
            <div className="transactions-list">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="transaction-item">
                  <div className="transaction-movie-info">
                    {transaction.movie?.posterImage && (
                      <img
                        src={transaction.movie.posterImage}
                        alt={transaction.movie.movieName || 'Movie'}
                        className="transaction-poster"
                      />
                    )}
                    <div className="transaction-details">
                      <span className="transaction-movie-title">
                        {transaction.movie?.movieName || 'N/A'}
                      </span>
                      <span className="transaction-date">
                        {transaction.purchasedAt
                          ? new Date(transaction.purchasedAt).toLocaleString()
                          : 'Date unavailable'}
                      </span>
                    </div>
                  </div>
                  <div className="transaction-meta">
                    <span className="transaction-amount">{formatPrice(transaction.price)}</span>
                    <span className={`status-badge ${transaction.status || 'completed'}`}>
                      {transaction.status || 'Completed'}
                    </span>
                    {transaction.transactionId && (
                      <div className="transaction-id">
                        <span>Transaction ID:</span>
                        <code>{transaction.transactionId}</code>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseHistory;

