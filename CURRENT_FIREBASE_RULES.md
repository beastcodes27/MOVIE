# Current Firebase Security Rules - All Roles & Permissions

## 🔐 Complete Rules (Ready to Copy)

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

## 👥 Role Definitions

### 🔴 **Admin Role**
- **Email**: `imanibraah@gmail.com`
- **Status**: Full access to all operations

**Admin Permissions:**
- ✅ Can read all movies
- ✅ Can create new movies
- ✅ Can update existing movies
- ✅ Can delete movies
- ✅ Can read any user profile
- ✅ Can delete any user profile
- ✅ Access to Admin Dashboard (`/admin` route)

---

### 🟢 **Authenticated User Role**
- **Status**: Any logged-in user (except admin)
- **Includes**: 
  - Email/password users
  - Google Sign-In users

**User Permissions:**
- ✅ Can read all movies
- ❌ Cannot create movies
- ❌ Cannot update movies
- ❌ Cannot delete movies
- ✅ Can read own user profile (`/users/{userId}` where `userId` matches their UID)
- ✅ Can create own user profile
- ✅ Can update own user profile
- ❌ Cannot delete own profile (only admins can)
- ❌ Cannot read other users' profiles

---

### 🔵 **Unauthenticated/Guest Role**
- **Status**: Not logged in

**Guest Permissions:**
- ❌ Cannot read movies
- ❌ Cannot create movies
- ❌ Cannot update movies
- ❌ Cannot delete movies
- ❌ Cannot access user profiles
- ❌ Cannot access any Firestore data

---

## 📊 Permission Matrix

| Operation | Admin | Authenticated User | Guest |
|-----------|-------|-------------------|-------|
| **Movies Collection** | | | |
| Read movies | ✅ | ✅ | ❌ |
| Create movies | ✅ | ❌ | ❌ |
| Update movies | ✅ | ❌ | ❌ |
| Delete movies | ✅ | ❌ | ❌ |
| **Users Collection** | | | |
| Read own profile | ✅ | ✅ | ❌ |
| Read other profiles | ✅ | ❌ | ❌ |
| Create own profile | ✅ | ✅ | ❌ |
| Update own profile | ✅ | ✅ | ❌ |
| Delete own profile | ✅ | ❌ | ❌ |
| Delete other profiles | ✅ | ❌ | ❌ |

---

## 📁 Collection Rules Breakdown

### 🎬 Movies Collection (`/movies/{movieId}`)

**Read Access:**
- ✅ All authenticated users (admin + regular users)
- ❌ Unauthenticated users

**Write Access (Create/Update/Delete):**
- ✅ Only admin (`imanibraah@gmail.com`)
- ❌ All other users (including authenticated non-admin users)

**Example Operations:**
```javascript
// ✅ Admin can do:
- addDoc(collection(db, 'movies'), {...})  // CREATE
- updateDoc(doc(db, 'movies', movieId), {...})  // UPDATE
- deleteDoc(doc(db, 'movies', movieId))  // DELETE
- getDoc(doc(db, 'movies', movieId))  // READ

// ✅ Regular authenticated user can do:
- getDoc(doc(db, 'movies', movieId))  // READ only
- getDocs(collection(db, 'movies'))  // READ all

// ❌ Regular user cannot:
- addDoc(...)  // Will get permission denied
- updateDoc(...)  // Will get permission denied
- deleteDoc(...)  // Will get permission denied
```

---

### 👤 Users Collection (`/users/{userId}`)

**Read Access:**
- ✅ Users can read their own profile only (`userId == request.auth.uid`)
- ✅ Admin can read any user profile
- ❌ Users cannot read other users' profiles

**Create/Update Access:**
- ✅ Users can create/update their own profile only
- ✅ Admin can create/update any profile

**Delete Access:**
- ✅ Only admin can delete profiles
- ❌ Users cannot delete their own profile

**Example Operations:**
```javascript
// ✅ User can do:
- setDoc(doc(db, 'users', currentUser.uid), {...})  // CREATE own
- updateDoc(doc(db, 'users', currentUser.uid), {...})  // UPDATE own
- getDoc(doc(db, 'users', currentUser.uid))  // READ own

// ✅ Admin can do (all of the above +):
- deleteDoc(doc(db, 'users', anyUserId))  // DELETE any
- getDoc(doc(db, 'users', anyUserId))  // READ any

// ❌ User cannot:
- getDoc(doc(db, 'users', otherUserId))  // READ others - denied
- deleteDoc(doc(db, 'users', currentUser.uid))  // DELETE own - denied
```

---

### 🚫 Other Collections

**Default Rule:**
- ❌ All other collections are denied by default
- This is a security best practice to prevent unauthorized access

**What this means:**
- If you create a new collection (e.g., `/reviews`, `/comments`, etc.), you must add rules for it
- Without explicit rules, all operations will be denied

---

## 🔑 Admin Configuration

### Current Admin Email
```javascript
'imanibraah@gmail.com'
```

### Adding More Admins

To add additional admin emails, update the `isAdmin()` function:

```javascript
function isAdmin() {
  return request.auth != null && 
         request.auth.token.email in [
           'imanibraah@gmail.com',
           'admin2@example.com',
           'admin3@example.com'
         ];
}
```

### Where Admin is Configured

1. **Firestore Rules** (`firestore.rules`):
   - Controls Firestore database access
   - Located in: `firestore.rules` file

2. **Protected Routes** (`src/components/ProtectedRoute.js`):
   - Controls route access in React app
   - Line 9: `const adminEmails = ['imanibraah@gmail.com'];`

3. **Navigation** (`src/components/Navbar.js`):
   - Shows/hides Admin Dashboard link
   - Line 10: `const adminEmails = ['imanibraah@gmail.com'];`

---

## 🔒 Security Features

### ✅ Authentication Required
- All operations require authentication (except login/signup)
- Unauthenticated users cannot access any data

### ✅ User Isolation
- Users can only access their own profile data
- Users cannot see other users' information

### ✅ Admin Privileges
- Admin has elevated permissions
- Admin can manage all movies and users

### ✅ Default Deny
- Collections without explicit rules are denied
- Prevents accidental data exposure

---

## 🧪 Testing Permissions

### Test as Admin (`imanibraah@gmail.com`)
1. Log in with admin email
2. Should be able to:
   - ✅ View movies (Home page)
   - ✅ Add movies (Admin Dashboard)
   - ✅ Delete movies (Admin Dashboard)
   - ✅ See "Admin Dashboard" link in navigation
   - ✅ Access `/admin` route

### Test as Regular User
1. Log in with non-admin email
2. Should be able to:
   - ✅ View movies (Home page)
   - ✅ Update own profile
   - ❌ Cannot access Admin Dashboard
   - ❌ Cannot add/delete movies (will get permission error)

### Test as Guest (Not Logged In)
1. Try to access app
2. Should be:
   - ❌ Redirected to login page
   - ❌ Cannot access any data

---

## 📝 Notes

- **Admin email is case-sensitive** in Firebase rules
- **UID-based access** is used for user profiles (more secure than email)
- **Email-based admin check** is used for admin role (can be changed to UID-based if needed)
- Rules are evaluated **client-side** but enforced **server-side** by Firebase

---

## 🔄 Updating Rules

To update rules in Firebase Console:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **shoppin-9af74**
3. Navigate to **Firestore Database** → **Rules** tab
4. Paste the rules above
5. Click **Publish**

Rules take effect immediately after publishing.

---

**Last Updated**: Current rules with admin email: `imanibraah@gmail.com`
**Rules Version**: 2










