# Troubleshooting Guide - Adding Movies Error

## Common Errors When Adding Movies

### ❌ Error: "Permission Denied"

**Causes:**
1. Not logged in as admin
2. Firebase security rules not updated
3. Firestore database not created

**Solutions:**

#### 1. Check You're Logged In as Admin
- Make sure you're logged in with: `imanibraah@gmail.com`
- Check the navbar shows your email
- You should see "Admin Dashboard" link in navbar

#### 2. Update Firebase Security Rules
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **shoppin-9af74**
3. Go to **Firestore Database** → **Rules** tab
4. Copy rules from `firestore.rules` file
5. Make sure it includes:
   ```javascript
   request.auth.token.email in ['imanibraah@gmail.com']
   ```
6. Click **Publish**

#### 3. Create Firestore Database
1. Go to Firebase Console → **Firestore Database**
2. If you see "Create database", click it
3. Start in **Production mode**
4. Choose a location close to you
5. Click **Enable**

---

### ❌ Error: "Firestore is unavailable"

**Causes:**
- No internet connection
- Firebase project not active
- Firestore not enabled

**Solutions:**
1. Check your internet connection
2. Verify Firebase project is active in Firebase Console
3. Make sure Firestore Database is enabled

---

### ❌ Error: "You are not authenticated"

**Causes:**
- Session expired
- Not logged in

**Solutions:**
1. Log out and log back in
2. Clear browser cache and cookies
3. Make sure Authentication is enabled in Firebase Console

---

### ❌ Error: "Unknown error"

**Check:**
1. Open browser console (F12)
2. Look for detailed error message
3. Check if all fields are filled correctly
4. Verify URLs are valid (trailer and download links)

---

## Step-by-Step Verification Checklist

### ✅ Pre-Flight Checks

- [ ] Dependencies installed (`npm install`)
- [ ] Server running (`npm start`)
- [ ] Logged in with admin email: `imanibraah@gmail.com`
- [ ] Firebase Authentication enabled in Console
- [ ] Firestore Database created in Console
- [ ] Security rules updated with admin email
- [ ] Can see "Admin Dashboard" link in navbar

### ✅ Firebase Console Setup

1. **Authentication:**
   - [ ] Go to Authentication → Sign-in method
   - [ ] Email/Password is **Enabled**
   - [ ] Google provider is **Enabled** (if using Google sign-in)

2. **Firestore Database:**
   - [ ] Database exists
   - [ ] Rules tab shows correct admin email
   - [ ] Rules are published

3. **Project Settings:**
   - [ ] Project is active
   - [ ] Billing enabled (if required for Firestore)

---

## Testing the Setup

### Test 1: Can you access Admin Dashboard?
- URL should be: `http://localhost:3000/admin`
- You should see "Admin Dashboard" page

### Test 2: Can you see existing movies?
- If movies exist, they should load
- If no movies, you'll see "No movies added yet"

### Test 3: Try adding a movie
1. Click "+ Add New Movie"
2. Fill in all fields:
   - Movie Name: Test Movie
   - Trailer Link: https://www.youtube.com/watch?v=dQw4w9WgXcQ
   - Download Link: https://example.com/download
3. Click "Add Movie"
4. Check for success message or error

---

## Debug Steps

### 1. Check Browser Console
- Press `F12` or right-click → Inspect
- Go to Console tab
- Look for red error messages
- Copy error code and message

### 2. Check Network Tab
- Open DevTools (F12)
- Go to Network tab
- Try adding a movie
- Look for failed requests (red)
- Click on failed request to see details

### 3. Verify Firebase Connection
- Open browser console
- Type: `firebase.apps`
- Should see Firebase app initialized

---

## Quick Fixes

### Fix 1: Re-login
```javascript
// Just log out and log back in
// Make sure to use: imanibraah@gmail.com
```

### Fix 2: Clear Browser Data
- Clear cache and cookies
- Restart browser
- Log in again

### Fix 3: Restart Server
```bash
# Stop server (Ctrl + C)
# Restart
npm start
```

### Fix 4: Check Firebase Config
- Verify `src/firebase.js` has correct config
- All fields should match Firebase Console

---

## Still Having Issues?

### Check These Files:
1. `src/components/AdminDashboard.js` - Error handling improved
2. `src/components/ProtectedRoute.js` - Admin email check
3. `firestore.rules` - Security rules
4. `src/firebase.js` - Firebase config

### Get Help:
- Check browser console for specific error codes
- Verify Firebase Console setup
- Make sure admin email matches everywhere:
  - `src/components/Navbar.js` (line 10)
  - `src/components/ProtectedRoute.js` (line 9)
  - `firestore.rules` (line 8)

---

## Common Error Codes

| Error Code | Meaning | Solution |
|------------|---------|----------|
| `permission-denied` | Security rules blocking | Update Firebase rules |
| `unavailable` | Firestore offline | Check internet/Firebase status |
| `unauthenticated` | Not logged in | Re-login |
| `failed-precondition` | Database not ready | Create Firestore database |

---

**Last Updated:** Improved error messages in AdminDashboard component



