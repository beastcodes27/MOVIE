import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserPurchasedMovies } from '../services/purchaseService';
import { incrementMovieViews, incrementMovieSearchCount, calculateTrendingScore } from '../services/movieTrackingService';
import { formatPrice } from '../utils/currency';
import PurchaseModal from './PurchaseModal';
import TrailerModal from './TrailerModal';
import MovieDetails from './MovieDetails';
import LoginPrompt from './LoginPrompt';
import './Home.css';

const Home = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [purchasedMovies, setPurchasedMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [trailerMovie, setTrailerMovie] = useState(null);
  const [showTrailerModal, setShowTrailerModal] = useState(false);
  const [showMovieDetails, setShowMovieDetails] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    fetchMovies();
    if (currentUser) {
      fetchPurchasedMovies();
    }
  }, [currentUser]);

  const fetchPurchasedMovies = async () => {
    if (!currentUser) return;
    try {
      const purchased = await getUserPurchasedMovies(currentUser.uid);
      setPurchasedMovies(purchased);
    } catch (error) {
      console.error('Error fetching purchased movies:', error);
    }
  };

  const fetchMovies = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'movies'));
      const moviesList = [];
      querySnapshot.forEach((doc) => {
        moviesList.push({ id: doc.id, ...doc.data() });
      });
      setMovies(moviesList);
    } catch (error) {
      console.error('Error fetching movies:', error);
      alert('Error loading movies');
    } finally {
      setLoading(false);
    }
  };

  // Get unique categories from movies
  const categories = useMemo(() => {
    const cats = ['All'];
    movies.forEach(movie => {
      if (movie.category && !cats.includes(movie.category)) {
        cats.push(movie.category);
      }
    });
    return cats;
  }, [movies]);

  // Calculate trending movies
  const trendingMovies = useMemo(() => {
    return [...movies]
      .map(movie => ({
        ...movie,
        trendingScore: calculateTrendingScore(movie)
      }))
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, 10); // Top 10 trending movies
  }, [movies]);

  // Filter movies based on search and category
  const filteredMovies = useMemo(() => {
    return movies.filter(movie => {
      const matchesSearch = !searchQuery ||
        movie.movieName?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' ||
        movie.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [movies, searchQuery, selectedCategory]);

  // Track search counts separately to avoid performance issues (only for authenticated users)
  useEffect(() => {
    if (currentUser && searchQuery && searchQuery.trim() && filteredMovies.length > 0) {
      // Track search for movies that match search query (debounced)
      const timeoutId = setTimeout(() => {
        filteredMovies.forEach(movie => {
          incrementMovieSearchCount(movie.id);
        });
      }, 1000); // Wait 1 second after user stops typing

      return () => clearTimeout(timeoutId);
    }
  }, [currentUser, searchQuery, filteredMovies]);

  // Group movies by category
  const moviesByCategory = useMemo(() => {
    const grouped = {};
    filteredMovies.forEach(movie => {
      const category = movie.category || 'Uncategorized';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(movie);
    });
    return grouped;
  }, [filteredMovies]);

  const hasPurchased = (movieId) => {
    return purchasedMovies.includes(movieId);
  };

  const handleMovieCardClick = (movie) => {
    // Check if user is authenticated
    if (!currentUser) {
      setSelectedMovie(movie);
      setShowLoginPrompt(true);
      return;
    }

    // User is authenticated, show movie details
    setSelectedMovie(movie);
    setShowMovieDetails(true);
    incrementMovieViews(movie.id);
  };

  const handlePurchaseSuccess = () => {
    fetchPurchasedMovies();
  };

  if (loading) {
    return (
      <div className="home-container">
        <div className="loading">Loading movies...</div>
      </div>
    );
  }

  return (
    <div className="home-container">
      <div className="home-content">
        {/* Search Bar */}
        <div className="search-container">
          <div className="search-bar">
            <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              placeholder="Search movies/ TV Shows"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Category Filter */}
        <div className="category-filter">
          {categories.map(category => (
            <button
              key={category}
              className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Trending Section */}
        {trendingMovies.length > 0 && (
          <div className="trending-section">
            <div className="trending-header">
              <h2 className="trending-title">
                <svg className="trending-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                </svg>
                Trending Now
              </h2>
              <p className="trending-subtitle">Most downloaded and searched movies</p>
            </div>
            <div className="movies-row trending-movies-row">
              {trendingMovies.map((movie) => (
                <div
                  key={movie.id}
                  className="movie-card trending-movie-card"
                  onClick={() => {
                    handleMovieCardClick(movie);
                  }}
                >
                  {movie.isTrending && (
                    <div className="trending-badge">TRENDING</div>
                  )}
                  <div className="movie-poster-wrapper">
                    {movie.posterImage ? (
                      <img
                        src={movie.posterImage}
                        alt={movie.movieName}
                        className="movie-poster-img"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          if (e.target.nextSibling) {
                            e.target.nextSibling.style.display = 'flex';
                          }
                        }}
                      />
                    ) : (
                      <div className="movie-poster-placeholder">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="movie-card-info">
                    <p className="movie-card-category-views">
                      {movie.category || 'Movies'} • {movie.downloads || 0} downloads
                    </p>
                    <h3 className="movie-card-title">{movie.movieName}</h3>
                    <div className="movie-card-bottom">
                      <span className="movie-card-type">
                        {movie.movieType === 'premium' ? formatPrice(movie.price || 0) : 'Free Download'}
                      </span>
                      <div className="movie-card-rating">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="star-icon">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                        <span>{movie.rating || '5.0'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Movies by Category */}
        {Object.keys(moviesByCategory).length === 0 ? (
          <div className="no-movies-message">
            <p>No movies found. Try adjusting your search or category filter.</p>
          </div>
        ) : (
          <div className="movies-by-category">
            {Object.entries(moviesByCategory).map(([category, categoryMovies]) => (
              <div key={category} className="category-section">
                <h2 className="category-title">{category}</h2>
                <div className="movies-row">
                  {categoryMovies.map((movie) => (
                    <div
                      key={movie.id}
                      className="movie-card"
                      onClick={() => {
                        handleMovieCardClick(movie);
                      }}
                    >
                      <div className="movie-poster-wrapper">
                        {movie.posterImage ? (
                          <img
                            src={movie.posterImage}
                            alt={movie.movieName}
                            className="movie-poster-img"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              if (e.target.nextSibling) {
                                e.target.nextSibling.style.display = 'flex';
                              }
                            }}
                          />
                        ) : (
                          <div className="movie-poster-placeholder">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="movie-card-info">
                        <p className="movie-card-category-views">
                          {movie.category || 'Movies'} • {movie.views || 0} views
                        </p>
                        <h3 className="movie-card-title">{movie.movieName}</h3>
                        <div className="movie-card-bottom">
                          <span className="movie-card-type">
                            {movie.movieType === 'premium' ? formatPrice(movie.price || 0) : 'Free Download'}
                          </span>
                          <div className="movie-card-rating">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="star-icon">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                            <span>{movie.rating || '5.0'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Purchase Modal */}
      {selectedMovie && (
        <PurchaseModal
          movie={selectedMovie}
          isOpen={showPurchaseModal}
          onClose={() => {
            setShowPurchaseModal(false);
            setSelectedMovie(null);
          }}
          onSuccess={handlePurchaseSuccess}
        />
      )}

      {/* Trailer Modal */}
      {trailerMovie && (
        <TrailerModal
          trailerUrl={trailerMovie.trailerLink}
          movieName={trailerMovie.movieName}
          isOpen={showTrailerModal}
          onClose={() => {
            setShowTrailerModal(false);
            setTrailerMovie(null);
          }}
        />
      )}

      {/* Movie Details Modal */}
      {showMovieDetails && selectedMovie && (
        <MovieDetails
          movie={selectedMovie}
          onClose={() => {
            setShowMovieDetails(false);
            setSelectedMovie(null);
          }}
          onPurchaseSuccess={handlePurchaseSuccess}
        />
      )}

      {/* Login Prompt Modal */}
      <LoginPrompt
        isOpen={showLoginPrompt}
        onClose={() => {
          setShowLoginPrompt(false);
          setSelectedMovie(null);
        }}
        movieName={selectedMovie?.movieName}
      />
    </div>
  );
};

export default Home;



