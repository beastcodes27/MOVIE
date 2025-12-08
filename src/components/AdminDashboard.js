import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { uploadImageToImgBB } from '../services/imgbbService';
import { formatPrice } from '../utils/currency';
import { MOVIE_CATEGORIES, DEFAULT_CATEGORY } from '../constants/movieCategories';
import { MOVIE_GENRES, DEFAULT_GENRE } from '../constants/movieGenres';
import { getAllTransactions, getTransactionStats } from '../services/purchaseService';
import TrailerModal from './TrailerModal';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { currentUser } = useAuth();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    movieName: '',
    trailerLink: '',
    downloadLink: '',
    category: DEFAULT_CATEGORY,
    genre: DEFAULT_GENRE,
    posterImage: '',
    movieType: 'free',
    price: 0,
    description: ''
  });
  const [posterFile, setPosterFile] = useState(null);
  const [posterPreview, setPosterPreview] = useState('');
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [trailerMovie, setTrailerMovie] = useState(null);
  const [showTrailerModal, setShowTrailerModal] = useState(false);
  const [stats, setStats] = useState({
    totalMovies: 0,
    categories: {},
    recentMovies: 0
  });
  const [transactions, setTransactions] = useState([]);
  const [transactionStats, setTransactionStats] = useState({
    totalTransactions: 0,
    totalRevenue: 0,
    totalUsers: 0
  });
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);

  useEffect(() => {
    fetchMovies();
    fetchTransactionData();
  }, []);

  const fetchTransactionData = async () => {
    setLoadingTransactions(true);
    try {
      const [allTransactions, stats] = await Promise.all([
        getAllTransactions(),
        getTransactionStats()
      ]);
      setTransactions(allTransactions);
      setTransactionStats(stats);
    } catch (error) {
      console.error('Error fetching transaction data:', error);
      setError('Error loading transaction data');
    } finally {
      setLoadingTransactions(false);
    }
  };

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'movies'));
      const moviesList = [];
      const categoriesCount = {};
      
      querySnapshot.forEach((doc) => {
        const movie = { id: doc.id, ...doc.data() };
        moviesList.push(movie);
        
        // Count categories
        const category = movie.category || DEFAULT_CATEGORY;
        categoriesCount[category] = (categoriesCount[category] || 0) + 1;
      });
      
      // Calculate recent movies (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentCount = moviesList.filter(movie => {
        if (movie.createdAt) {
          return new Date(movie.createdAt) >= sevenDaysAgo;
        }
        return false;
      }).length;
      
      setMovies(moviesList);
      setStats({
        totalMovies: moviesList.length,
        categories: categoriesCount,
        recentMovies: recentCount
      });
    } catch (error) {
      console.error('Error fetching movies:', error);
      setError('Error loading movies. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.movieName || !formData.trailerLink || !formData.downloadLink) {
      setError('Please fill in all required fields');
      return;
    }

    if (!currentUser) {
      setError('You must be logged in to add/edit movies. Please log in again.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Upload poster if file is selected
      let posterImageUrl = formData.posterImage;
      if (posterFile) {
        const uploadResult = await uploadImageToImgBB(posterFile);
        if (uploadResult.success) {
          posterImageUrl = uploadResult.imageUrl;
        } else {
          throw new Error('Failed to upload poster image');
        }
      }

      const movieData = {
        movieName: formData.movieName,
        trailerLink: formData.trailerLink,
        downloadLink: formData.downloadLink,
        category: formData.category || DEFAULT_CATEGORY,
        posterImage: posterImageUrl || '',
        movieType: formData.movieType || 'free',
        price: formData.movieType === 'premium' ? parseFloat(formData.price) || 0 : 0,
        description: formData.description || '',
      };

      if (editingMovie) {
        // Update existing movie
        await updateDoc(doc(db, 'movies', editingMovie.id), {
          ...movieData,
          updatedAt: new Date().toISOString()
        });
        setSuccess('Movie updated successfully!');
      } else {
        // Add new movie
        await addDoc(collection(db, 'movies'), {
          ...movieData,
          createdAt: new Date().toISOString()
        });
        setSuccess('Movie added successfully!');
      }
      
      // Reset form
      setFormData({ movieName: '', trailerLink: '', downloadLink: '', category: DEFAULT_CATEGORY, posterImage: '', movieType: 'free', price: 0, description: '' });
      setPosterFile(null);
      setPosterPreview('');
      setEditingMovie(null);
      setShowForm(false);
      await fetchMovies();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error saving movie:', error);
      
      // More specific error messages
      let errorMessage = '';
      if (error.code === 'permission-denied') {
        errorMessage = 'Permission denied. Make sure you are logged in as admin (imanibraah@gmail.com) and Firebase security rules are configured correctly.';
      } else if (error.code === 'unavailable') {
        errorMessage = 'Firestore is unavailable. Please check your internet connection.';
      } else if (error.code === 'unauthenticated') {
        errorMessage = 'You are not authenticated. Please log in again.';
      } else {
        errorMessage = error.message || 'Unknown error occurred. Please try again.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (movie) => {
    setEditingMovie(movie);
      setFormData({
        movieName: movie.movieName || '',
        trailerLink: movie.trailerLink || '',
        downloadLink: movie.downloadLink || '',
        category: movie.category || DEFAULT_CATEGORY,
        posterImage: movie.posterImage || '',
        movieType: movie.movieType || 'free',
        price: movie.price || 0,
        description: movie.description || ''
      });
    setPosterPreview(movie.posterImage || '');
    setPosterFile(null);
    setShowForm(true);
    setError('');
    setSuccess('');
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingMovie(null);
    setFormData({ movieName: '', trailerLink: '', downloadLink: '', category: DEFAULT_CATEGORY, posterImage: '', movieType: 'free', price: 0, description: '' });
    setPosterFile(null);
    setPosterPreview('');
    setShowForm(false);
    setError('');
    setSuccess('');
  };

  const handlePosterFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setError('Invalid image type. Please upload JPEG, PNG, GIF, or WebP images.');
        return;
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        setError('Image size too large. Maximum size is 10MB.');
        return;
      }

      setPosterFile(file);
      setError('');

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPosterPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePosterUpload = async () => {
    if (!posterFile) {
      return formData.posterImage || '';
    }

    setUploadingPoster(true);
    try {
      const uploadResult = await uploadImageToImgBB(posterFile);
      if (uploadResult.success) {
        setFormData(prev => ({ ...prev, posterImage: uploadResult.imageUrl }));
        setPosterPreview(uploadResult.imageUrl);
        return uploadResult.imageUrl;
      }
    } catch (error) {
      console.error('Poster upload error:', error);
      throw new Error(error.message || 'Failed to upload poster image');
    } finally {
      setUploadingPoster(false);
    }
  };

  const handleDelete = async (movieId) => {
    if (!window.confirm('Are you sure you want to delete this movie? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      await deleteDoc(doc(db, 'movies', movieId));
      setSuccess('Movie deleted successfully!');
      await fetchMovies();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error deleting movie:', error);
      setError('Error deleting movie. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTrending = async (movie) => {
    try {
      setLoading(true);
      const movieRef = doc(db, 'movies', movie.id);
      const newTrendingStatus = !movie.isTrending;
      
      await updateDoc(movieRef, {
        isTrending: newTrendingStatus,
        trendingUpdatedAt: new Date().toISOString()
      });
      
      setSuccess(newTrendingStatus 
        ? `"${movie.movieName}" promoted to trending!` 
        : `"${movie.movieName}" removed from trending.`);
      await fetchMovies();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error updating trending status:', error);
      setError('Error updating trending status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter and search movies
  const filteredMovies = movies.filter(movie => {
    const matchesSearch = movie.movieName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         movie.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || movie.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories for filter
  const categories = ['All', ...new Set(movies.map(m => m.category || DEFAULT_CATEGORY).filter(Boolean))];

  return (
    <div className="admin-dashboard">
      <div className="admin-container">
        {/* Header with Logo */}
        <div className="admin-header">
          <div className="admin-logo-container">
            <img 
              src={encodeURI("/Black and White Filmstrip Modern Logo.png")} 
              alt="MOVIEHUB Logo" 
              className="admin-logo"
            />
          </div>
          <h1 className="admin-title">Admin Dashboard</h1>
          {currentUser && (
            <p className="admin-email">Logged in as: <strong>{currentUser.email}</strong></p>
          )}
        </div>

        {/* Statistics Cards */}
        <div className="admin-stats">
          <div className="stat-card">
            <div className="stat-icon">🎬</div>
            <div className="stat-content">
              <h3>{stats.totalMovies}</h3>
              <p>Total Movies</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📁</div>
            <div className="stat-content">
              <h3>{Object.keys(stats.categories).length}</h3>
              <p>Categories</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✨</div>
            <div className="stat-content">
              <h3>{stats.recentMovies}</h3>
              <p>Recent (7 days)</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <h3>{transactionStats.totalTransactions}</h3>
              <p>Total Transactions</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💵</div>
            <div className="stat-content">
              <h3>{formatPrice(transactionStats.totalRevenue)}</h3>
              <p>Total Revenue</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3>{transactionStats.totalUsers}</h3>
              <p>Purchasing Users</p>
            </div>
          </div>
        </div>

        {/* Transaction History Button */}
        <div className="admin-actions">
          <button
            onClick={() => setShowTransactions(!showTransactions)}
            className="transactions-toggle-btn"
          >
            {showTransactions ? '✕ Hide' : '📊 View'} Transaction History
          </button>
        </div>

        {/* Transaction History Section */}
        {showTransactions && (
          <div className="admin-transactions-section">
            <h2 className="section-title">Transaction History</h2>
            {loadingTransactions ? (
              <div className="loading">Loading transactions...</div>
            ) : transactions.length === 0 ? (
              <div className="no-transactions">
                <p>No transactions yet.</p>
              </div>
            ) : (
              <>
                <div className="transactions-summary">
                  <div className="summary-item">
                    <span className="summary-label">Total Transactions:</span>
                    <span className="summary-value">{transactionStats.totalTransactions}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Total Revenue:</span>
                    <span className="summary-value">{formatPrice(transactionStats.totalRevenue)}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Unique Users:</span>
                    <span className="summary-value">{transactionStats.totalUsers}</span>
                  </div>
                </div>
                <div className="admin-transactions-table-container">
                  <table className="admin-transactions-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>User</th>
                        <th>Movie</th>
                        <th>Amount</th>
                        <th>Transaction ID</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((transaction) => (
                        <tr key={transaction.id}>
                          <td>
                            {new Date(transaction.purchasedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td>
                            <div className="transaction-user">
                              {transaction.user?.profilePicture ? (
                                <img 
                                  src={transaction.user.profilePicture} 
                                  alt={transaction.user.displayName || 'User'} 
                                  className="user-avatar-small"
                                />
                              ) : (
                                <div className="user-avatar-placeholder-small">
                                  {(transaction.user?.displayName || transaction.user?.email || 'U').charAt(0).toUpperCase()}
                                </div>
                              )}
                              <span>{transaction.user?.displayName || transaction.user?.email || 'Unknown User'}</span>
                            </div>
                          </td>
                          <td>
                            <div className="transaction-movie">
                              {transaction.movie?.posterImage && (
                                <img 
                                  src={transaction.movie.posterImage} 
                                  alt={transaction.movie.movieName || 'Movie'} 
                                  className="movie-poster-small"
                                />
                              )}
                              <span>{transaction.movie?.movieName || 'Movie Deleted'}</span>
                            </div>
                          </td>
                          <td className="transaction-amount">{formatPrice(transaction.price || 0)}</td>
                          <td>
                            <code className="transaction-id-code">{transaction.transactionId || 'N/A'}</code>
                          </td>
                          <td>
                            <span className={`status-badge ${transaction.status || 'completed'}`}>
                              {transaction.status || 'Completed'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* Action Button */}
        <div className="admin-actions">
          <button 
            onClick={() => {
              if (showForm) {
                handleCancelEdit();
              } else {
                setShowForm(true);
                setError('');
                setSuccess('');
              }
            }}
            className="add-movie-btn"
          >
            {showForm ? '✕ Cancel' : '+ Add New Movie'}
          </button>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="success-message">{success}</div>
        )}
        {error && (
          <div className="error-message">{error}</div>
        )}

        {/* Movie Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="movie-form">
            <h2>{editingMovie ? 'Edit Movie' : 'Add New Movie'}</h2>
            <input
              type="text"
              placeholder="Movie Name"
              value={formData.movieName}
              onChange={(e) => setFormData({ ...formData, movieName: e.target.value })}
              className="form-input"
              required
            />
            <input
              type="url"
              placeholder="Trailer Link (YouTube URL)"
              value={formData.trailerLink}
              onChange={(e) => setFormData({ ...formData, trailerLink: e.target.value })}
              className="form-input"
              required
            />
            <input
              type="url"
              placeholder="Download Link"
              value={formData.downloadLink}
              onChange={(e) => setFormData({ ...formData, downloadLink: e.target.value })}
              className="form-input"
              required
            />
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="form-input"
              required
            >
              {MOVIE_CATEGORIES.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <textarea
              placeholder="Movie Description (optional)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="form-input"
              rows="4"
            />
            {/* Poster Upload */}
            <div className="poster-upload-section">
              <label className="form-label">Movie Poster</label>
              <div className="poster-upload-container">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePosterFileChange}
                  className="file-input"
                  id="poster-upload"
                  disabled={uploadingPoster}
                />
                <label htmlFor="poster-upload" className="file-input-label">
                  {uploadingPoster ? 'Uploading...' : 'Choose Poster Image'}
                </label>
                {posterPreview && (
                  <div className="poster-preview-container">
                    <img src={posterPreview} alt="Poster preview" className="poster-preview" />
                    <button
                      type="button"
                      onClick={() => {
                        setPosterFile(null);
                        setPosterPreview('');
                        setFormData(prev => ({ ...prev, posterImage: '' }));
                      }}
                      className="remove-poster-btn"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
              <p className="form-hint">Or enter URL below</p>
              <input
                type="url"
                placeholder="Poster Image URL (optional)"
                value={formData.posterImage}
                onChange={(e) => {
                  setFormData({ ...formData, posterImage: e.target.value });
                  if (e.target.value) {
                    setPosterPreview(e.target.value);
                  }
                }}
                className="form-input"
              />
            </div>

            {/* Movie Type */}
            <div className="form-group-row">
              <div className="form-group-half">
                <label className="form-label">Movie Type</label>
                <select
                  value={formData.movieType}
                  onChange={(e) => {
                    const movieType = e.target.value;
                    setFormData({ 
                      ...formData, 
                      movieType,
                      price: movieType === 'free' ? 0 : formData.price
                    });
                  }}
                  className="form-input"
                  required
                >
                  <option value="free">Free</option>
                  <option value="premium">Premium</option>
                </select>
              </div>

              {/* Price (only for premium) */}
              {formData.movieType === 'premium' && (
                <div className="form-group-half">
                  <label className="form-label">Price (TSHS)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="form-input"
                    required
                  />
                </div>
              )}
            </div>

            <div className="form-actions">
              <button type="submit" disabled={loading} className="submit-btn">
                {loading ? 'Saving...' : (editingMovie ? 'Update Movie' : 'Add Movie')}
              </button>
              {editingMovie && (
                <button 
                  type="button" 
                  onClick={handleCancelEdit}
                  className="cancel-btn"
                  disabled={loading}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        )}

        {/* Search and Filter */}
        <div className="movies-list">
          <div className="movies-list-header">
            <h2>All Movies ({filteredMovies.length})</h2>
            <div className="search-filter-container">
              <input
                type="text"
                placeholder="Search movies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="filter-select"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
          {loading && movies.length === 0 ? (
            <div className="loading-movies">Loading movies...</div>
          ) : filteredMovies.length === 0 ? (
            <p className="no-movies">
              {movies.length === 0 
                ? 'No movies added yet. Add your first movie above!' 
                : 'No movies match your search criteria.'}
            </p>
          ) : (
            <div className="movies-grid">
              {filteredMovies.map((movie) => (
                <div key={movie.id} className="movie-card-admin">
                  {movie.posterImage && (
                    <img src={movie.posterImage} alt={movie.movieName} className="admin-poster-preview" />
                  )}
                  <div className="movie-header-admin">
                    <h3>{movie.movieName}</h3>
                    <div className="movie-badges">
                      <span className={`movie-type-badge ${movie.movieType || 'free'}`}>
                        {movie.movieType === 'premium' ? '⭐ Premium' : '🆓 Free'}
                      </span>
                      {movie.isTrending && (
                        <span className="trending-badge-admin">🔥 Trending</span>
                      )}
                    </div>
                  </div>
                  {movie.category && (
                    <p className="movie-category-admin">Category: {movie.category}</p>
                  )}
                  {movie.movieType === 'premium' && movie.price && (
                    <p className="movie-price-admin">Price: {formatPrice(movie.price)}</p>
                  )}
                  <div className="movie-links-admin">
                    <button
                      onClick={() => {
                        setTrailerMovie(movie);
                        setShowTrailerModal(true);
                      }}
                      className="link-btn"
                    >
                      View Trailer
                    </button>
                    <a href={movie.downloadLink} target="_blank" rel="noopener noreferrer" className="link-btn">
                      Download
                    </a>
                  </div>
                  <div className="movie-actions">
                    <button 
                      onClick={() => handleToggleTrending(movie)}
                      className={`trending-toggle-btn ${movie.isTrending ? 'active' : ''}`}
                      title={movie.isTrending ? 'Remove from trending' : 'Promote to trending'}
                    >
                      {movie.isTrending ? '🔥 Trending' : '📈 Promote'}
                    </button>
                    <button 
                      onClick={() => handleEdit(movie)}
                      className="edit-btn"
                    >
                      ✏️ Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(movie.id)}
                      className="delete-btn"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                  {movie.createdAt && (
                    <p className="movie-date">
                      Added: {new Date(movie.createdAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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
    </div>
  );
};

export default AdminDashboard;

