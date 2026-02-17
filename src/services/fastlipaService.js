/**
 * FastLipa Payment Gateway Service
 * Handles payment transactions via FastLipa API
 */

const FASTLIPA_API_BASE_URL = process.env.REACT_APP_FASTLIPA_API_BASE_URL || 'https://api.fastlipa.com/api';
const FASTLIPA_API_TOKEN = process.env.REACT_APP_FASTLIPA_API_TOKEN || 'FastLipa_JRyIKYbzS9ZdCQRN3cUtEQ';
const PAYMENT_TIMEOUT = 2 * 60 * 1000; // 2 minutes in milliseconds
const POLL_INTERVAL_INITIAL = 3000; // Poll every 3 seconds
const POLL_INTERVAL_AFTER_CONFIRM = 3000; // Poll every 3 seconds
const INITIAL_FAST_POLLS = 5;
const INITIAL_DELAY = 5000; // Wait 5 seconds before first poll (give gateway time to push USSD)

/**
 * Create a payment transaction
 * @param {string} phoneNumber - Phone number (format: 0793710144)
 * @param {number} amount - Payment amount
 * @param {string} name - Customer name
 * @returns {Promise<Object>} - Transaction response with tranID
 */
export const createTransaction = async (phoneNumber, amount, name) => {
  try {
    // Validate inputs
    if (!phoneNumber || !amount || !name) {
      throw new Error('Phone number, amount, and name are required');
    }

    // Format phone number for Tanzania (format: 0793710144 or 255793710144)
    let formattedNumber = phoneNumber.trim().replace(/[\s\-()]/g, '');

    // Convert to format expected by API: 255XXXXXXXXX
    if (formattedNumber.startsWith('0')) {
      // Remove leading 0 and add 255
      formattedNumber = '255' + formattedNumber.substring(1);
    } else if (formattedNumber.startsWith('255')) {
      // Already has country code
    } else if (formattedNumber.length === 9) {
      // 9 digits without leading 0, add 255
      formattedNumber = '255' + formattedNumber;
    } else {
      throw new Error('Invalid phone number format. Please use format: 0793710144');
    }

    const response = await fetch(`${FASTLIPA_API_BASE_URL}/create-transaction`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FASTLIPA_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        number: formattedNumber,
        amount: Math.round(amount), // Ensure integer amount
        name: name.trim()
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== 'success') {
      throw new Error(data.message || 'Failed to create transaction');
    }

    return {
      success: true,
      transactionId: data.data.tranID,
      amount: data.data.amount,
      phoneNumber: data.data.number,
      status: data.data.status,
      message: data.message
    };
  } catch (error) {
    console.error('FastLipa create transaction error:', error);
    throw new Error(error.message || 'Failed to create payment transaction. Please try again.');
  }
};

/**
 * Check transaction status
 * @param {string} transactionId - Transaction ID (tranID)
 * @returns {Promise<Object>} - Transaction status
 */
export const checkTransactionStatus = async (transactionId) => {
  try {
    if (!transactionId) {
      throw new Error('Transaction ID is required');
    }

    const response = await fetch(
      `${FASTLIPA_API_BASE_URL}/status-transaction?tranid=${encodeURIComponent(transactionId)}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${FASTLIPA_API_TOKEN}`,
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== 'success') {
      throw new Error(data.message || 'Failed to check transaction status');
    }

    // Handle different response formats - check both payment_status and status fields
    const paymentStatus = data.data?.payment_status || data.data?.status || data.payment_status || 'UNKNOWN';
    const resultTransactionId = data.data?.tranid || data.data?.tranID || data.tranid || data.tranID;

    return {
      success: true,
      transactionId: resultTransactionId,
      paymentStatus: paymentStatus,
      amount: data.data?.amount || data.amount,
      network: data.data?.network || data.network,
      message: data.message,
      rawData: data // Include raw data for debugging
    };
  } catch (error) {
    console.error('FastLipa check status error:', error);
    throw new Error(error.message || 'Failed to check payment status. Please try again.');
  }
};

/**
 * Poll transaction status until completion or timeout
 * @param {string} transactionId - Transaction ID to poll
 * @param {number} timeout - Timeout in milliseconds (default: 2 minutes)
 * @param {Function} onStatusUpdate - Optional callback for status updates
 * @returns {Promise<Object>} - Final transaction status
 */
export const pollTransactionStatus = async (transactionId, timeout = PAYMENT_TIMEOUT, onStatusUpdate = null) => {
  const startTime = Date.now();

  return new Promise(async (resolve, reject) => {
    let attempts = 0;
    let pollInterval = POLL_INTERVAL_INITIAL; // Start with initial polling

    const poll = async () => {
      try {
        attempts++;
        const elapsedTime = Date.now() - startTime;

        // Check timeout
        if (elapsedTime >= timeout) {
          reject(new Error('Payment request timeout. Please check your phone for payment confirmation or try again.'));
          return;
        }

        // Check transaction status
        const statusResult = await checkTransactionStatus(transactionId);
        const paymentStatus = (statusResult.paymentStatus || '').toUpperCase();

        // Log status for debugging
        console.log(`[FastLipa] Poll attempt ${attempts} (${Math.floor(elapsedTime / 1000)}s elapsed): Status = ${paymentStatus}`, statusResult);

        // Call status update callback if provided
        if (onStatusUpdate) {
          onStatusUpdate({
            status: paymentStatus,
            attempt: attempts,
            elapsedTime: Math.floor(elapsedTime / 1000)
          });
        }

        // Check if payment is completed - check multiple possible success statuses
        if (
          paymentStatus === 'COMPLETE' ||
          paymentStatus === 'SUCCESS' ||
          paymentStatus === 'COMPLETED' ||
          paymentStatus === 'SUCCESSFUL' ||
          paymentStatus === 'PAID' ||
          paymentStatus === 'CONFIRMED'
        ) {
          resolve({
            success: true,
            transactionId: statusResult.transactionId,
            status: statusResult.paymentStatus,
            amount: statusResult.amount,
            message: 'Payment completed successfully'
          });
          return;
        }

        // Check if payment failed
        if (
          paymentStatus === 'FAILED' ||
          paymentStatus === 'CANCELLED' ||
          paymentStatus === 'CANCELED' ||
          paymentStatus === 'REJECTED' ||
          paymentStatus === 'DECLINED' ||
          paymentStatus === 'FAIL'
        ) {
          reject(new Error('Payment failed or was cancelled. Please try again.'));
          return;
        }

        // If status is PENDING or anything else unknown, continue polling
        console.log(`[FastLipa] Transaction is still ${paymentStatus || 'PENDING'}, continuing to poll...`);


        // Switch to longer polling interval after initial fast polls
        // This gives the gateway time to process after user confirms payment
        if (attempts >= INITIAL_FAST_POLLS) {
          pollInterval = POLL_INTERVAL_AFTER_CONFIRM;
          console.log(`[FastLipa] Switching to 15-second polling interval (attempt ${attempts})`);
        }

        // If still pending or unknown status, continue polling
        setTimeout(poll, pollInterval);
      } catch (error) {
        console.error(`[FastLipa] Poll error on attempt ${attempts}:`, error);

        // If error occurs, check if we've exceeded timeout
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime >= timeout) {
          reject(new Error('Payment request timeout. Please check your phone for payment confirmation or try again.'));
        } else {
          // Retry after the current interval (use longer interval if we've passed initial polls)
          const retryInterval = attempts >= INITIAL_FAST_POLLS ? POLL_INTERVAL_AFTER_CONFIRM : pollInterval;
          setTimeout(poll, retryInterval);
        }
      }
    };

    // Start polling after initial delay to allow USSD to be pushed and gateway to initialize
    console.log(`[FastLipa] Starting status polling for transaction ${transactionId} after ${INITIAL_DELAY}ms delay`);
    setTimeout(poll, INITIAL_DELAY);
  });
};

/**
 * Process payment via FastLipa
 * @param {string} phoneNumber - Phone number
 * @param {number} amount - Payment amount
 * @param {string} customerName - Customer name
 * @param {Function} onStatusUpdate - Optional callback for status updates
 * @returns {Promise<Object>} - Payment result
 */
export const processFastLipaPayment = async (phoneNumber, amount, customerName, onStatusUpdate = null) => {
  try {
    // Create transaction
    const transaction = await createTransaction(phoneNumber, amount, customerName);

    if (!transaction.success) {
      throw new Error(transaction.message || 'Failed to create payment transaction');
    }

    // Notify that USSD has been pushed
    if (onStatusUpdate) {
      onStatusUpdate({
        status: 'USSD_PUSHED',
        transactionId: transaction.transactionId,
        message: 'Payment request sent to your phone'
      });
    }

    // Delay to allow USSD to be pushed to user's phone and gateway to process
    // The polling will start after INITIAL_DELAY (5 seconds) from when polling begins
    console.log('[FastLipa] Transaction created, USSD push initiated. Starting status polling...');

    // Poll for payment status
    const paymentResult = await pollTransactionStatus(
      transaction.transactionId,
      PAYMENT_TIMEOUT,
      onStatusUpdate
    );

    return {
      success: true,
      transactionId: paymentResult.transactionId,
      amount: paymentResult.amount,
      message: paymentResult.message
    };
  } catch (error) {
    console.error('FastLipa payment processing error:', error);
    throw error;
  }
};

