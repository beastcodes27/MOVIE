# 🔒 Updated Firebase Security Rules - MOVIEHUB

## 📋 Ready-to-Copy Rules

Copy and paste the code block below directly into Firebase Console:

---

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

## 📝 How to Apply These Rules

### Step 1: Open Firebase Console
1. Go to: https://console.firebase.google.com/
2. Select your project: **shoppin-9af74**

### Step 2: Navigate to Firestore Rules
1. Click **Firestore Database** in the left sidebar
2. Click the **Rules** tab at the top of the page

### Step 3: Replace Existing Rules
1. **DELETE** all existing rules in the editor
2. **COPY** the rules from the code block above
3. **PASTE** them into the rules editor

### Step 4: Publish
1. Click the **Publish** button
2. Wait for confirmation: "Rules published successfully"

✅ **Done!** Your rules are now active.

---

## 🔑 What These Rules Do

### ✅ Movies Collection (`/movies`)
- **Read**: Any authenticated user can view movies
- **Create/Update/Delete**: Only admin (`imanibraah@gmail.com`) can add, edit, or remove movies

### ✅ Users Collection (`/users`) - Optional
- **Read**: Users can only read their own profile
- **Create/Update**: Users can create and update their own profile
- **Delete**: Only admin can delete user profiles

### ❌ Other Collections
- All other collections are denied by default (security best practice)

---

## ⚠️ Important Notes

### Admin Email
- **Current Admin**: `imanibraah@gmail.com`
- This email is hardcoded in the rules for security
- Only this email can add/delete movies

### Adding Multiple Admins
If you want to add more admin emails, update the `isAdmin()` function:

```javascript
function isAdmin() {
  return request.auth != null && 
         request.auth.token.email in [
           'imanibraah@gmail.com',
           'another-admin@example.com'
         ];
}
```

---

## 🧪 Testing the Rules

### Test as Admin:
1. Log in with `imanibraah@gmail.com`
2. Try adding a movie in Admin Dashboard
3. Should work ✅

### Test as Regular User:
1. Log in with a different email
2. Try adding a movie (should fail with permission error)
3. Should be able to view movies ✅

---

## 🚨 Troubleshooting

### "Permission Denied" Error?
- ✅ Check you're logged in as `imanibraah@gmail.com`
- ✅ Verify rules are published in Firebase Console
- ✅ Make sure Firestore database is created
- ✅ Check browser console for detailed error

### Rules Not Updating?
- Clear browser cache
- Wait a few minutes for rules to propagate
- Try logging out and back in

---

**Last Updated**: Rules configured with admin email: `imanibraah@gmail.com`



