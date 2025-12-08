/**
 * Currency Utility
 * Formats prices in Tanzanian Shillings (TSHS)
 */

/**
 * Format price to TSHS currency
 * @param {number} amount - The price amount
 * @returns {string} - Formatted price string
 */
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) {
    return '0 TSHS';
  }
  
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount)) {
    return '0 TSHS';
  }
  
  // Format with commas for thousands
  return `${numAmount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} TSHS`;
};

/**
 * Format price to TSHS currency (simplified, no decimals for TSHS)
 * @param {number} amount - The price amount
 * @returns {string} - Formatted price string
 */
export const formatPrice = (amount) => {
  return formatCurrency(amount);
};









