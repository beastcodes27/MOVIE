import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { addToFavorites, removeFromFavorites, isFavorite } from '../services/favoritesService';
import { addReview, getMovieReviews } from '../services/reviewsService';
import { hasUserPurchased } from '../services/purchaseService';
import { incrementMovieViews, incrementMovieDownloads } from '../services/movieTrackingService';
import PurchaseModal from './PurchaseModal';
import TrailerModal from './TrailerModal';
import { formatPrice } from '../utils/currency';
import './MovieDetails.css';

const MovieDetails = ({ movie, onClose, onPurchaseSuccess }) => {
  const { currentUser } = useAuth();
  const [isFav, setIsFav] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [hasPurchased, setHasPurchased] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showTrailerModal, setShowTrailerModal] = useState(false);

  useEffect(() => {
    if (movie && currentUser) {
      checkFavorite();
      checkPurchase();
      fetchReviews();
      // Track view when movie details are opened
      incrementMovieViews(movie.id);
    }
  }, [movie, currentUser]);

  const checkFavorite = async () => {
    if (!currentUser || !movie) return;
    try {
      const favorite = await isFavorite(currentUser.uid, movie.id);
      setIsFav(favorite);
    } catch (error) {
      console.error('Error checking favorite:', error);
    }
  };

  const checkPurchase = async () => {
    if (!currentUser || !movie) return;
    try {
      const purchased = await hasUserPurchased(currentUser.uid, movie.id);
      setHasPurchased(purchased);
    } catch (error) {
      console.error('Error checking purchase:', error);
    }
  };

  const fetchReviews = async () => {
    if (!movie) return;
    try {
      const movieReviews = await getMovieReviews(movie.id);
      setReviews(movieReviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleToggleFavorite = async () => {
    if (!currentUser || !movie) return;

    setLoading(true);
    try {
      if (isFav) {
        await removeFromFavorites(currentUser.uid, movie.id);
        setIsFav(false);
      } else {
        await addToFavorites(currentUser.uid, movie.id);
        setIsFav(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      alert('Failed to update favorite. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setReviewError('');
    setReviewSuccess('');
    
    if (!currentUser) {
      setReviewError('You must be logged in to submit a review.');
      return;
    }
    
    if (!movie || !movie.id) {
      setReviewError('Movie information is missing.');
      return;
    }
    
    if (!reviewText || !reviewText.trim()) {
      setReviewError('Please write a review comment before submitting.');
      return;
    }

    setSubmittingReview(true);
    try {
      const userProfile = currentUser.displayName || currentUser.email?.split('@')[0] || 'User';
      const userAvatar = currentUser.photoURL || null;

      console.log('Submitting review:', {
        userId: currentUser.uid,
        movieId: movie.id,
        hasComment: !!reviewText.trim(),
        rating: reviewRating
      });

      const result = await addReview(
        currentUser.uid,
        userProfile,
        userAvatar,
        movie.id,
        reviewText,
        reviewRating
      );

      if (!result || !result.success) {
        throw new Error(result?.message || 'Failed to submit review');
      }

      setReviewText('');
      setReviewRating(5);
      setReviewSuccess('Review submitted successfully!');
      
      // Fetch reviews after a short delay
      setTimeout(async () => {
        await fetchReviews();
        setReviewSuccess('');
      }, 500);
      
    } catch (error) {
      console.error('Error submitting review:', error);
      
      // Provide more detailed error message
      let errorMessage = 'Failed to submit review. ';
      if (error.message) {
        errorMessage += error.message;
      } else if (error.code) {
        errorMessage += `Error: ${error.code}`;
      } else {
        errorMessage += 'Please check your connection and try again.';
      }
      
      // Check for specific Firebase errors
      if (error.code === 'permission-denied') {
        errorMessage = 'Permission denied. You may not have permission to submit reviews. Please check Firebase security rules.';
      } else if (error.code === 'unavailable') {
        errorMessage = 'Service unavailable. Please check your internet connection and try again.';
      } else if (error.code === 'failed-precondition') {
        errorMessage = 'Database error. Please refresh the page and try again.';
      }
      
      setReviewError(errorMessage);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDownloadClick = (e) => {
    if (movie.movieType === 'premium' && !hasPurchased) {
      e.preventDefault();
      setShowPurchaseModal(true);
    } else if (movie.downloadLink) {
      // Track download
      incrementMovieDownloads(movie.id);
      window.open(movie.downloadLink, '_blank');
    }
  };

  const handleTrailerClick = () => {
    if (movie.trailerLink) {
      setShowTrailerModal(true);
    }
  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating || 0);
    const hasHalfStar = (rating || 0) % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="rating-stars">
        {[...Array(fullStars)].map((_, i) => (
          <svg key={`full-${i}`} className="star-icon full" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        ))}
        {hasHalfStar && (
          <svg className="star-icon half" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <svg key={`empty-${i}`} className="star-icon empty" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        ))}
      </div>
    );
  };

  const renderRatingSelector = () => {
    return (
      <div className="rating-selector">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            className={`rating-star-btn ${reviewRating >= rating ? 'active' : ''}`}
            onClick={() => setReviewRating(rating)}
          >
            <svg viewBox="0 0 24 24" fill={reviewRating >= rating ? 'currentColor' : 'none'} stroke="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </button>
        ))}
      </div>
    );
  };

  if (!movie) return null;

  const isAccessible = movie.movieType === 'free' || hasPurchased;
  const displayRating = movie.rating || 5.0;

  return (
    <>
      <div className="movie-details-overlay" onClick={onClose}>
        <div className="movie-details-container" onClick={(e) => e.stopPropagation()}>
          <button className="movie-details-close" onClick={onClose}>✕</button>

          {/* Movie Header */}
          <div className="movie-details-header">
            {movie.posterImage && (
              <div className="movie-details-poster">
                <img src={movie.posterImage} alt={movie.movieName} />
              </div>
            )}
            <div className="movie-details-info">
              <h1 className="movie-details-title">{movie.movieName}</h1>
              <div className="movie-details-meta">
                {movie.category && (
                  <span className="movie-details-category">{movie.category}</span>
                )}
                {movie.views && (
                  <span className="movie-details-views">• {movie.views} views</span>
                )}
              </div>
              <div className="movie-details-rating-display">
                {renderStars(displayRating)}
                <span className="rating-value">{displayRating}</span>
              </div>
              {movie.description && (
                <p className="movie-details-description">{movie.description}</p>
              )}
              <div className="movie-details-actions">
                <button
                  className={`favorite-btn ${isFav ? 'active' : ''}`}
                  onClick={handleToggleFavorite}
                  disabled={loading}
                >
                  <svg viewBox="0 0 24 24" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                  {isFav ? 'Remove from Favorites' : 'Add to Favorites'}
                </button>
                <button className="trailer-details-btn" onClick={handleTrailerClick}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                  Watch Trailer
                </button>
                <button
                  className={`download-details-btn ${!isAccessible ? 'premium' : ''}`}
                  onClick={handleDownloadClick}
                >
                  {movie.movieType === 'premium' && !hasPurchased ? (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M12 2v20M2 12h20"/>
                      </svg>
                      Buy {formatPrice(movie.price || 0)}
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                      </svg>
                      Download
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="movie-details-reviews">
            <h2 className="reviews-title">Reviews ({reviews.length})</h2>
            
            {/* Add Review Form */}
            {currentUser && (
              <form className="review-form" onSubmit={handleSubmitReview}>
                {reviewError && (
                  <div className="review-error-message">{reviewError}</div>
                )}
                {reviewSuccess && (
                  <div className="review-success-message">{reviewSuccess}</div>
                )}
                <div className="review-form-group">
                  <label>Your Rating</label>
                  {renderRatingSelector()}
                </div>
                <div className="review-form-group">
                  <textarea
                    value={reviewText}
                    onChange={(e) => {
                      setReviewText(e.target.value);
                      setReviewError(''); // Clear error when user types
                    }}
                    placeholder="Write your review..."
                    className="review-textarea"
                    rows="4"
                    required
                  />
                </div>
                <button type="submit" className="submit-review-btn" disabled={submittingReview}>
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            )}

            {/* Reviews List */}
            <div className="reviews-list">
              {reviews.length === 0 ? (
                <p className="no-reviews">No reviews yet. Be the first to review!</p>
              ) : (
                reviews.map((review) => (
                  <div key={review.id} className="review-item">
                    <div className="review-header">
                      <div className="review-user">
                        {review.userAvatar ? (
                          <img src={review.userAvatar} alt={review.userName} className="review-avatar" />
                        ) : (
                          <div className="review-avatar-placeholder">
                            {review.userName?.charAt(0).toUpperCase() || 'U'}
                          </div>
                        )}
                        <div>
                          <div className="review-user-name">{review.userName}</div>
                          <div className="review-date">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      {review.rating && (
                        <div className="review-rating">
                          {renderStars(review.rating)}
                        </div>
                      )}
                    </div>
                    <p className="review-comment">{review.comment}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Purchase Modal */}
      <PurchaseModal
        movie={movie}
        isOpen={showPurchaseModal}
        onClose={() => {
          setShowPurchaseModal(false);
        }}
        onSuccess={() => {
          setShowPurchaseModal(false);
          checkPurchase();
          // Track download after purchase
          incrementMovieDownloads(movie.id);
          if (onPurchaseSuccess) onPurchaseSuccess();
        }}
      />

      {/* Trailer Modal */}
      {showTrailerModal && (
        <TrailerModal
          trailerUrl={movie.trailerLink}
          movieName={movie.movieName}
          isOpen={showTrailerModal}
          onClose={() => setShowTrailerModal(false)}
        />
      )}
    </>
  );
};

export default MovieDetails;

