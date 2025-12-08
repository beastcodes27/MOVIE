# 🔥 Trending Section Feature

## Overview
A trending section has been added to the home page that displays the most popular movies based on downloads, views, and searches. Admins can also manually promote movies to appear in the trending section.

## Features Implemented

### 1. Trending Section on Home Page
- **Location**: Displayed at the top of the home page, right after the search and category filters
- **Display**: Shows top 10 trending movies
- **Visual Design**: 
  - Eye-catching header with trending icon and animation
  - Special "TRENDING" badge on admin-promoted movies
  - Shows download count instead of views
  - Styled to stand out from regular movie sections

### 2. Trending Calculation Algorithm
The trending score is calculated using a weighted system:
- **Downloads**: 3 points each (most important)
- **Views**: 1 point each
- **Searches**: 2 points each
- **Admin Promotion**: +1000 bonus points (ensures promoted movies stay at top)

### 3. Admin Features
- **Promote to Trending**: Admins can click a "Promote" button on any movie card in the Admin Dashboard
- **Remove from Trending**: Click the same button again to remove promotion
- **Visual Indicator**: Promoted movies show a "🔥 Trending" badge in the admin panel
- **Real-time Updates**: Changes are immediately reflected in the trending section

### 4. Automatic Tracking
The system automatically tracks:
- **Views**: When users open movie details
- **Downloads**: When users download movies (both free and after purchase)
- **Searches**: When movies appear in search results (debounced to avoid spam)

## Files Modified/Created

### New Files
1. `src/services/movieTrackingService.js` - Service for tracking views, downloads, and searches

### Modified Files
1. `src/components/Home.js`
   - Added trending section component
   - Added trending movies calculation
   - Added tracking for views and searches

2. `src/components/Home.css`
   - Added styles for trending section
   - Added trending badge styles
   - Added animations for trending icon

3. `src/components/AdminDashboard.js`
   - Added `handleToggleTrending()` function
   - Added trending toggle button in movie actions
   - Added trending badge display

4. `src/components/AdminDashboard.css`
   - Added styles for trending toggle button
   - Added styles for trending badge
   - Updated movie header layout

5. `src/components/MovieDetails.js`
   - Added view tracking when movie details are opened
   - Added download tracking when movies are downloaded

## Database Fields Added

### Movies Collection
- `isTrending` (boolean) - Whether movie is admin-promoted to trending
- `downloads` (number) - Count of downloads
- `views` (number) - Count of views (already existed, now tracked)
- `searchCount` (number) - Count of times movie appeared in searches
- `trendingUpdatedAt` (timestamp) - When trending status was last updated

## Usage

### For Users
1. The trending section automatically appears at the top of the home page
2. Movies are sorted by popularity based on real engagement metrics
3. Promoted movies (marked with "TRENDING" badge) are always shown first

### For Admins
1. Go to Admin Dashboard
2. Find the movie you want to promote
3. Click the "📈 Promote" button (or "🔥 Trending" if already promoted)
4. The movie will immediately appear in the trending section

## Future Enhancements
- Add time-based trending (trending in last 24 hours, week, month)
- Add trending analytics/charts for admins
- Add trending notifications for users
- Add category-based trending sections






