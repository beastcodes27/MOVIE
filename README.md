# MOVIEHUB 🎬

A modern e-commerce movie platform built with React and Firebase, featuring separate admin and user interfaces.

## Features

### User Features
- 🔐 User authentication with email/password and Google Sign-In
- 📝 User registration with username, email, and password
- 🎥 Browse available movies
- ▶️ Watch movie trailers (YouTube embeds)
- ⬇️ Download movies via provided links

### Admin Features
- 🛡️ Protected admin dashboard
- ➕ Add new movies with:
  - Movie name
  - Trailer link (YouTube URL)
  - Download link
- 🗑️ Delete movies from the database
- 📊 View all movies in the system

## Tech Stack

- **React** - Frontend framework
- **Firebase Authentication** - User authentication
- **Firebase Firestore** - Database for storing movies
- **React Router** - Client-side routing
- **CSS3** - Modern styling with solid colors

## Setup Instructions

### 1. Install Dependencies

```bash
cd shopping
npm install
```

### 2. Firebase Configuration

The Firebase configuration is already set up in `src/firebase.js` with your provided credentials. Make sure to:

1. Enable **Authentication** in Firebase Console:
   - Go to Firebase Console → Authentication → Sign-in method
   - Enable **Email/Password** authentication
   - Enable **Google** authentication provider

2. Enable **Firestore Database**:
   - Go to Firebase Console → Firestore Database
   - Create a database in production mode
   - Set up security rules (see below)

### 3. Firebase Security Rules

Add these rules to your Firestore Database:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Movies collection - readable by authenticated users, writable by admins
    match /movies/{movieId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        request.auth.token.email in ['imanibraah@gmail.com'];
    }
  }
}
```

### 4. Set Admin Email

Update the admin email in the following files:
- `src/components/Navbar.js` - Line 15
- `src/components/ProtectedRoute.js` - Line 8
- `src/components/AdminDashboard.js` - (if needed)

Admin email is set to `imanibraah@gmail.com`. Update if needed.

### 5. Run the Application

```bash
npm start
```

The app will open at `http://localhost:3000`

## Project Structure

```
shopping/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── AdminDashboard.js      # Admin interface
│   │   ├── AdminDashboard.css
│   │   ├── Home.js                # User movie browsing
│   │   ├── Home.css
│   │   ├── Login.js               # Authentication page
│   │   ├── Login.css
│   │   ├── Navbar.js              # Navigation bar
│   │   ├── Navbar.css
│   │   └── ProtectedRoute.js      # Route protection
│   ├── contexts/
│   │   └── AuthContext.js         # Authentication context
│   ├── firebase.js                # Firebase configuration
│   ├── App.js                     # Main app component
│   ├── App.css
│   └── index.js                   # Entry point
├── package.json
└── README.md
```

## Usage

### For Users

1. **Register/Login**: 
   - Navigate to the login page
   - Sign up with username, email, and password, OR
   - Use Google Sign-In for quick access

2. **Browse Movies**:
   - View all available movies on the home page
   - Watch trailers embedded from YouTube
   - Download movies using the provided download links

### For Admins

1. **Access Admin Dashboard**:
   - Log in with the admin email address
   - Click "Admin Dashboard" in the navigation bar

2. **Add Movies**:
   - Click "+ Add New Movie"
   - Fill in:
     - Movie Name
     - Trailer Link (YouTube URL)
     - Download Link
   - Click "Add Movie"

3. **Delete Movies**:
   - View all movies in the admin dashboard
   - Click "Delete" on any movie to remove it

## Color Scheme

The app uses a beautiful gradient color scheme:
- **Primary**: `#667eea` (Purple-blue)
- **Secondary**: `#764ba2` (Deep purple)
- **Background**: Gradient from purple-blue to deep purple
- **Text**: White on dark backgrounds, dark on light backgrounds

## Important Notes

- Make sure Firebase Authentication and Firestore are enabled in your Firebase Console
- Update the admin email address to match your Firebase user email
- The app uses Firestore for storing movie data - ensure your database is set up correctly
- Google authentication requires proper OAuth setup in Firebase Console

## Future Enhancements

Potential features to add:
- Movie categories/genres
- Search functionality
- User favorites/watchlist
- Movie ratings and reviews
- User profiles
- Payment integration for premium movies
- Movie posters/thumbnails

## Support

For issues or questions, please check:
- Firebase Console for authentication and database setup
- Browser console for error messages
- Firebase documentation: https://firebase.google.com/docs

---

Built with ❤️ using React and Firebase
# MOVIE
