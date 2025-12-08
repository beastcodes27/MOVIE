/**
 * Movie Industry Categories
 * List of movie categories based on film industries
 */

export const MOVIE_CATEGORIES = [
  'Hollywood',
  'Nollywood',
  'Bollywood',
  'K-Drama',
  'Anime',
  'Tollywood',
  'European Cinema',
  'African Cinema',
  'Asian Cinema',
  'Latin American Cinema',
  'Independent Films',
  'Documentary',
  'Animation',
  'Other'
];

/**
 * Get default category
 */
export const DEFAULT_CATEGORY = 'Hollywood';

/**
 * Check if a category is valid
 */
export const isValidCategory = (category) => {
  return MOVIE_CATEGORIES.includes(category);
};







