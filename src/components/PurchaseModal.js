import React, { useState, useEffect, useRef } from 'react';
import { purchaseMovie } from '../services/purchaseService';
import { processFastLipaPayment, checkTransactionStatus } from '../services/fastlipaService';
import { useAuth } from '../contexts/AuthContext';
import { formatPrice } from '../utils/currency';
import './PurchaseModal.css';

const PurchaseModal = ({ movie, isOpen, onClose, onSuccess }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState('payment'); // 'payment', 'processing', or 'ussd-pushed'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(120); // 2 minutes in seconds
  const [transactionId, setTransactionId] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [checkingStatus, setCheckingStatus] = useState(false);
  const intervalRef = useRef(null);
  const paymentProcessRef = useRef(null);
  const transactionIdRef = useRef(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setPhoneNumber('');
      setError('');
      setStep('payment');
      setTimeRemaining(120);
      setTransactionId(null);
      transactionIdRef.current = null;
      setStatusMessage('');
      setCheckingStatus(false);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // Cancel any ongoing payment process
      if (paymentProcessRef.current) {
        paymentProcessRef.current = null;
      }
    }
  }, [isOpen]);

  // Countdown timer during processing
  useEffect(() => {
    if (step === 'processing' && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [step, timeRemaining]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const validatePhoneNumber = (phone) => {
    // Remove spaces and special characters
    const cleaned = phone.replace(/[\s\-()]/g, '');

    // Must be exactly 10 digits starting with 0 (Tanzania format)
    if (/^0\d{9}$/.test(cleaned)) {
      return cleaned; // Valid: 0793710144
    }

    // If it has country code 255, remove it
    if (/^255\d{9}$/.test(cleaned)) {
      return '0' + cleaned.substring(3); // Convert to 0XXXXXXXXX format
    }

    // Invalid format
    return null;
  };

  const handleStatusUpdate = (update) => {
    if (update.status === 'USSD_PUSHED') {
      setStep('ussd-pushed');
      setTransactionId(update.transactionId);
      transactionIdRef.current = update.transactionId;
      setStatusMessage('Payment request sent to your phone. Please check and approve.');
    } else if (update.status) {
      setStatusMessage(`Checking payment status... (Attempt ${update.attempt || 0})`);
    }
  };

  const handleManualCheckStatus = async () => {
    const currentTranId = transactionIdRef.current || transactionId;
    if (!currentTranId) return;

    setCheckingStatus(true);
    setError('');
    setStatusMessage('Checking payment status... (Please wait at least 15 seconds after confirming on your phone)');

    try {
      // Wait a moment before checking to give gateway time to process
      await new Promise(resolve => setTimeout(resolve, 2000));

      const statusResult = await checkTransactionStatus(currentTranId);
      const paymentStatus = (statusResult.paymentStatus || '').toUpperCase();

      console.log('Manual status check:', paymentStatus, statusResult);

      // Check if payment is completed
      if (
        paymentStatus === 'COMPLETE' ||
        paymentStatus === 'SUCCESS' ||
        paymentStatus === 'COMPLETED' ||
        paymentStatus === 'SUCCESSFUL' ||
        paymentStatus === 'PAID' ||
        paymentStatus === 'CONFIRMED'
      ) {
        setStatusMessage('Payment confirmed! Completing purchase...');

        // Payment completed, create purchase record
        await purchaseMovie(
          currentUser.uid,
          movie.id,
          movie.price,
          currentTranId
        );

        // Success
        setTimeout(() => {
          onSuccess();
          onClose();
          setStep('payment');
          setLoading(false);
          setPhoneNumber('');
          setTransactionId(null);
        }, 500);
      } else if (
        paymentStatus === 'FAILED' ||
        paymentStatus === 'CANCELLED' ||
        paymentStatus === 'CANCELED' ||
        paymentStatus === 'REJECTED' ||
        paymentStatus === 'DECLINED'
      ) {
        setError('Payment was cancelled or failed. Please try again.');
        setStep('payment');
      } else if (paymentStatus === 'PENDING') {
        setStatusMessage('Payment is still pending. If you just confirmed, please wait 15 seconds for the gateway to process, then check again.');
        setError('');
      } else {
        setStatusMessage(`Payment status: ${paymentStatus}. If you've approved the payment, please wait 15 seconds for the gateway to process, then check again.`);
        setError('');
      }
    } catch (err) {
      console.error('Manual status check error:', err);
      setError(err.message || 'Failed to check payment status. Please try again.');
      setStatusMessage('If you just confirmed the payment, please wait 15 seconds and try again.');
    } finally {
      setCheckingStatus(false);
    }
  };

  const handlePurchase = async () => {
    if (!currentUser) {
      setError('You must be logged in to purchase movies');
      return;
    }

    // Validate phone number
    const validatedPhone = validatePhoneNumber(phoneNumber);
    if (!validatedPhone) {
      setError('Please enter a valid phone number (e.g., 0793710144)');
      return;
    }

    setLoading(true);
    setError('');
    setStep('processing');
    setTimeRemaining(120);
    setStatusMessage('Creating payment request...');
    setTransactionId(null);
    transactionIdRef.current = null;

    try {
      // Get customer name
      const customerName = currentUser.displayName || currentUser.email?.split('@')[0] || 'Customer';

      // Create payment process promise
      const paymentPromise = processFastLipaPayment(
        validatedPhone,
        movie.price,
        customerName,
        handleStatusUpdate
      );

      paymentProcessRef.current = paymentPromise;

      // Process payment via FastLipa
      const paymentResult = await paymentPromise;

      if (!paymentResult.success) {
        throw new Error('Payment failed. Please try again.');
      }

      // Create purchase record with transaction ID
      await purchaseMovie(
        currentUser.uid,
        movie.id,
        movie.price,
        paymentResult.transactionId
      );

      // Clear interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // Success
      setTimeout(() => {
        onSuccess();
        onClose();
        setStep('payment');
        setLoading(false);
        setPhoneNumber('');
        setTransactionId(null);
        transactionIdRef.current = null;
        paymentProcessRef.current = null;
      }, 1000);
    } catch (err) {
      console.error('Purchase error:', err);

      // If we have a transaction ID, allow manual check
      const currentTranId = transactionIdRef.current || transactionId;
      if (currentTranId && !err.message.includes('timeout')) {
        setError(err.message || 'Payment is still processing. Click "Check Status" if you have approved the payment.');
        setStep('ussd-pushed');
      } else {
        setError(err.message || 'Failed to process purchase. Please try again.');
        setStep('payment');
      }

      setLoading(false);

      // Clear interval on error
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setTimeRemaining(120);
      paymentProcessRef.current = null;
    }
  };

  const handleClose = () => {
    // Allow closing even if loading, cleanup will handle it
    setError('');
    setStep('payment');
    setLoading(false);
    onClose();
  };

  return (
    <div className="purchase-modal-overlay" onClick={handleClose}>
      <div className="purchase-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={handleClose} disabled={loading}>
          ✕
        </button>

        {step === 'payment' ? (
          <>
            <div className="purchase-modal-header">
              <h2>Purchase Movie</h2>
              <p className="movie-name">{movie.movieName}</p>
            </div>

            <div className="purchase-details">
              {movie.posterImage && (
                <img src={movie.posterImage} alt={movie.movieName} className="purchase-poster" />
              )}
              <div className="purchase-info">
                <div className="price-display">
                  <span className="price-label">Price:</span>
                  <span className="price-amount">{formatPrice(movie.price || 0)}</span>
                </div>
                <p className="purchase-description">
                  By purchasing this movie, you'll get unlimited access to download and watch it anytime.
                </p>
              </div>
            </div>

            <div className="phone-input-section">
              <label htmlFor="phone-number" className="phone-label">
                Phone Number (M-Pesa/Tigo Pesa/Airtel Money)
              </label>
              <input
                id="phone-number"
                type="tel"
                placeholder="e.g., 0793710144"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="phone-input"
                disabled={loading}
                maxLength={10}
              />
              <p className="phone-hint">Enter your mobile money phone number (10 digits starting with 0)</p>
            </div>

            {error && (
              <div className="purchase-error">{error}</div>
            )}

            <div className="purchase-actions">
              <button
                onClick={handlePurchase}
                disabled={loading || !phoneNumber.trim()}
                className="purchase-btn"
              >
                {loading ? 'Processing...' : `Pay ${formatPrice(movie.price || 0)}`}
              </button>
              <button
                onClick={handleClose}
                className="cancel-purchase-btn"
              >
                Cancel
              </button>
            </div>

            <div className="payment-note">
              <p>🔒 Secure payment via FastLipa</p>
              <p className="note-text">You will receive a payment request on your phone. Please approve to complete the purchase.</p>
            </div>
          </>
        ) : step === 'ussd-pushed' ? (
          <div className="processing-view">
            <div className="ussd-sent-icon">📱</div>
            <h3>Payment Request Sent!</h3>
            <p className="status-message">{statusMessage || 'Please check your phone and approve the payment request.'}</p>

            {transactionId && (
              <div className="transaction-info">
                <p className="transaction-id">Transaction ID: <code>{transactionId}</code></p>
              </div>
            )}

            <div className="timeout-indicator">
              <p className="time-remaining">Time remaining: {formatTime(timeRemaining)}</p>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${(timeRemaining / 120) * 100}%` }}
                ></div>
              </div>
            </div>

            {error && (
              <div className="purchase-error">{error}</div>
            )}

            <div className="manual-check-section">
              <button
                onClick={handleManualCheckStatus}
                disabled={checkingStatus || !transactionId}
                className="check-status-btn"
              >
                {checkingStatus ? 'Checking...' : 'Check Payment Status'}
              </button>
              <p className="check-hint">If you've approved the payment, wait 15 seconds for the gateway to process, then click to check status</p>
            </div>

            {timeRemaining <= 0 && (
              <p className="timeout-message">Payment request has expired. Please try again.</p>
            )}
          </div>
        ) : (
          <div className="processing-view">
            <div className="processing-spinner"></div>
            <h3>Creating Payment Request...</h3>
            <p>{statusMessage || 'Please wait while we create your payment request...'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseModal;

