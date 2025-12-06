/**
 * Movie Genres
 * List of movie genres/types
 */

export const MOVIE_GENRES = [
  'Action',
  'Adventure',
  'Comedy',
  'Drama',
  'Horror',
  'Romance',
  'Thriller',
  'Sci-Fi',
  'Fantasy',
  'Crime',
  'Mystery',
  'Animation',
  'Documentary',
  'Family',
  'Musical',
  'War',
  'Western',
  'Superhero',
  'Sports',
  'Biography',
  'History',
  'Other'
];

/**
 * Get default genre
 */
export const DEFAULT_GENRE = 'Drama';

/**
 * Check if a genre is valid
 */
export const isValidGenre = (genre) => {
  return MOVIE_GENRES.includes(genre);
};

