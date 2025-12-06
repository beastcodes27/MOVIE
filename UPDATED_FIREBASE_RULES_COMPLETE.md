# 🔐 Updated Firebase Security Rules - Complete

## ⚠️ IMPORTANT: Copy these rules to Firebase Console

These rules include all collections used in MOVIEHUB:
- ✅ Movies (with premium/free types)
- ✅ Users (with admin read access for User Management)
- ✅ Purchases (premium movie purchases)
- ✅ UserPurchases (quick lookup collection)

---

## 📋 Complete Rules (Ready to Copy)

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
    
    // Helper function to check if user owns the resource
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // ========================================
    // MOVIES COLLECTION
    // ========================================
    match /movies/{movieId} {
      // Anyone authenticated can read movies
      allow read: if isAuthenticated();
      
      // Only admins can create, update, or delete movies
      allow create: if isAdmin();
      allow update: if isAdmin();
      allow delete: if isAdmin();
    }
    
    // ========================================
    // USERS COLLECTION
    // ========================================
    match /users/{userId} {
      // Users can read their own data
      // Admins can read any user's data (for User Management)
      allow read: if isAuthenticated() && (isOwner(userId) || isAdmin());
      
      // Users can create and update their own profile
      allow create: if isAuthenticated() && isOwner(userId);
      allow update: if isAuthenticated() && isOwner(userId);
      
      // Only admins can delete user profiles
      allow delete: if isAdmin();
    }
    
    // ========================================
    // PURCHASES COLLECTION
    // ========================================
    // Document ID format: {userId}_{movieId}
    match /purchases/{purchaseId} {
      // Helper to extract userId from purchaseId
      function getPurchaseUserId() {
        return purchaseId.split('_')[0];
      }
      
      // Users can read their own purchases
      // Admins can read all purchases
      allow read: if isAuthenticated() && (
        getPurchaseUserId() == request.auth.uid || 
        isAdmin()
      );
      
      // Users can create their own purchases
      // Purchase ID must start with their user ID
      allow create: if isAuthenticated() && 
                    getPurchaseUserId() == request.auth.uid;
      
      // No updates or deletes for purchases (immutable)
      allow update: if false;
      allow delete: if false;
    }
    
    // ========================================
    // USER PURCHASES COLLECTION
    // ========================================
    // Document ID format: {userId}
    match /userPurchases/{userId} {
      // Users can read their own purchase list
      // Admins can read any user's purchase list
      allow read: if isAuthenticated() && (isOwner(userId) || isAdmin());
      
      // Users can create and update their own purchase list
      allow create: if isAuthenticated() && isOwner(userId);
      allow update: if isAuthenticated() && isOwner(userId);
      
      // No deletes (keep purchase history)
      allow delete: if false;
    }
    
    // ========================================
    // DEFAULT: DENY ALL OTHER COLLECTIONS
    // ========================================
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## 📊 Collection Permissions Breakdown

### 🎬 Movies Collection (`/movies/{movieId}`)

| Operation | Admin | Authenticated User | Guest |
|-----------|-------|-------------------|-------|
| Read | ✅ | ✅ | ❌ |
| Create | ✅ | ❌ | ❌ |
| Update | ✅ | ❌ | ❌ |
| Delete | ✅ | ❌ | ❌ |

**Fields:**
- `movieName` (string)
- `trailerLink` (string)
- `downloadLink` (string)
- `category` (string)
- `posterImage` (string)
- `movieType` (string: 'free' or 'premium')
- `price` (number, only for premium)
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

---

### 👥 Users Collection (`/users/{userId}`)

| Operation | Admin | Own Profile | Other Users | Guest |
|-----------|-------|-------------|-------------|-------|
| Read | ✅ All | ✅ | ❌ | ❌ |
| Create | ✅ | ✅ Own | ❌ | ❌ |
| Update | ✅ | ✅ Own | ❌ | ❌ |
| Delete | ✅ Any | ❌ | ❌ | ❌ |

**Fields:**
- `displayName` (string)
- `email` (string)
- `profilePicture` (string - imgBB URL)
- `uid` (string)
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

**New in Updated Rules:**
- ✅ Admins can read ALL users (for User Management page)

---

### 💳 Purchases Collection (`/purchases/{userId}_{movieId}`)

| Operation | Admin | Owner | Other Users | Guest |
|-----------|-------|-------|-------------|-------|
| Read | ✅ All | ✅ Own | ❌ | ❌ |
| Create | ✅ | ✅ Own | ❌ | ❌ |
| Update | ❌ | ❌ | ❌ | ❌ |
| Delete | ❌ | ❌ | ❌ | ❌ |

**Document ID Format:** `{userId}_{movieId}`

**Fields:**
- `userId` (string)
- `movieId` (string)
- `price` (number)
- `purchasedAt` (timestamp)
- `status` (string: 'completed')

**Note:** Purchases are immutable (no updates/deletes) to maintain purchase history.

---

### 📦 UserPurchases Collection (`/userPurchases/{userId}`)

| Operation | Admin | Owner | Other Users | Guest |
|-----------|-------|-------|-------------|-------|
| Read | ✅ All | ✅ Own | ❌ | ❌ |
| Create | ✅ | ✅ Own | ❌ | ❌ |
| Update | ✅ | ✅ Own | ❌ | ❌ |
| Delete | ❌ | ❌ | ❌ | ❌ |

**Document ID Format:** `{userId}`

**Fields:**
- `movieIds` (array of strings)
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

**Purpose:** Quick lookup for user's purchased movies list.

---

## 🛡️ Security Features

### ✅ Protected Operations

1. **Movies Management**
   - Only admin can add/edit/delete movies
   - All authenticated users can view movies

2. **User Profiles**
   - Users can only manage their own profile
   - Admins can view all users (for User Management)
   - Only admins can delete users

3. **Purchase Protection**
   - Users can only create purchases for themselves
   - Purchase document ID must match user ID pattern
   - Purchases cannot be modified or deleted (maintains history)

4. **Purchase List**
   - Users can only read/update their own purchase list
   - Admins can view any user's purchases

---

## 🔧 How to Apply These Rules

### Step 1: Copy the Rules
Copy the complete rules block from above (everything between the ```javascript markers).

### Step 2: Go to Firebase Console
1. Visit: https://console.firebase.google.com/
2. Select your project: **shoppin-9af74**
3. Navigate to **Firestore Database** in the left sidebar
4. Click on the **Rules** tab

### Step 3: Paste and Publish
1. Replace all existing rules with the new rules
2. Click **Publish** button
3. Wait for confirmation message

### Step 4: Verify
After publishing, test:
- ✅ Admin can add/edit/delete movies
- ✅ Users can view movies
- ✅ Users can purchase premium movies
- ✅ Admin can view all users
- ✅ Users can only see their own purchases

---

## ⚠️ Important Notes

1. **Admin Email:** Make sure `imanibraah@gmail.com` is correct in the `isAdmin()` function
2. **Testing:** Use Firebase Console Simulator to test rules before publishing
3. **Backup:** Consider backing up your current rules before updating
4. **Purchase IDs:** Purchase documents must follow format `{userId}_{movieId}`

---

## 🧪 Testing Rules

### Test Cases:

1. **Movies Access:**
   - ✅ Admin can create movies
   - ✅ All users can read movies
   - ❌ Regular users cannot create/update movies

2. **User Management:**
   - ✅ Admin can read all users
   - ✅ Users can read only their own profile
   - ✅ Admin can delete users

3. **Purchases:**
   - ✅ Users can create purchases with their own ID
   - ❌ Users cannot create purchases with other user IDs
   - ❌ Purchases cannot be updated/deleted

---

## 📝 Changelog

### Version 2.0 (Current)
- ✅ Added `purchases` collection rules
- ✅ Added `userPurchases` collection rules
- ✅ Updated `users` collection to allow admin read access
- ✅ Added purchase ID pattern validation
- ✅ Made purchases immutable (no updates/deletes)

### Version 1.0 (Previous)
- Basic movies and users collections
- Admin-only movie management
- User profile management

---

**Last Updated:** December 2024

