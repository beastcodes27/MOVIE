# Firebase Security Rules for MOVIEHUB

## Firestore Security Rules

Copy and paste these rules into your Firebase Console:

### Step-by-Step Instructions:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **shoppin-9af74**
3. Navigate to **Firestore Database** in the left sidebar
4. Click on the **Rules** tab
5. Replace the existing rules with the rules below
6. Click **Publish**

---

## Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is admin
    function isAdmin() {
      return request.auth != null && 
             request.auth.token.email in ['imanibraah@gmail.com'];
    }
    
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Movies collection - accessible to all authenticated users
    match /movies/{movieId} {
      // Anyone authenticated can read movies
      allow read: if isAuthenticated();
      
      // Only admins can create, update, or delete movies
      allow create: if isAdmin();
      allow update: if isAdmin();
      allow delete: if isAdmin();
    }
    
    // Users collection (if you want to store user profiles)
    match /users/{userId} {
      // Users can only read their own data
      allow read: if isAuthenticated() && request.auth.uid == userId;
      
      // Users can create and update their own profile
      allow create: if isAuthenticated() && request.auth.uid == userId;
      allow update: if isAuthenticated() && request.auth.uid == userId;
      
      // Only admins can delete user profiles
      allow delete: if isAdmin();
    }
    
    // Deny all other collections
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## Important Notes

### ⚠️ Update Admin Email

**Before deploying these rules**, make sure to update the admin email:

In the `isAdmin()` function, change:
```javascript
request.auth.token.email in ['admin@moviehub.com']
```

To your actual admin email:
```javascript
request.auth.token.email in ['your-admin-email@example.com']
```

You can add multiple admin emails:
```javascript
request.auth.token.email in ['admin1@example.com', 'admin2@example.com']
```

---

## What These Rules Do

### Movies Collection (`/movies`)
- ✅ **Read**: Any authenticated user can view movies
- ✅ **Create/Update/Delete**: Only admins can add, modify, or remove movies

### Users Collection (`/users`) - Optional
- ✅ **Read**: Users can only read their own profile
- ✅ **Create/Update**: Users can create and update their own profile
- ✅ **Delete**: Only admins can delete user profiles

### Other Collections
- ❌ **All other collections**: Denied by default (security best practice)

---

## Testing Your Rules

### Test as Regular User:
1. Log in with a non-admin account
2. Should be able to:
   - ✅ View movies
   - ❌ Add/edit/delete movies (will be blocked)

### Test as Admin:
1. Log in with your admin email
2. Should be able to:
   - ✅ View movies
   - ✅ Add new movies
   - ✅ Edit existing movies
   - ✅ Delete movies

---

## Alternative: More Flexible Admin Check

If you want to store admin status in the database instead of hardcoding emails:

```javascript
function isAdmin() {
  return request.auth != null && 
         exists(/databases/$(database)/documents/admins/$(request.auth.uid));
}
```

Then create an `admins` collection with documents using user UIDs as document IDs.

---

## Need Help?

If you encounter issues:
1. Check the browser console for error messages
2. Verify your admin email matches in:
   - Security rules
   - `src/components/Navbar.js`
   - `src/components/ProtectedRoute.js`
3. Make sure Authentication and Firestore are enabled in Firebase Console

