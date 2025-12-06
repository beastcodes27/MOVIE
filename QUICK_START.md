# Quick Start Guide - MOVIEHUB

## 🚀 How to Start the Server

### Step 1: Navigate to Project Directory
```bash
cd /home/syntaxbeast/Desktop/shopping/shopping
```

### Step 2: Install Dependencies (First Time Only)
```bash
npm install
```

This will install all required packages including:
- React
- Firebase
- React Router DOM
- Other dependencies

**Note:** This step only needs to be done once, or when you add new packages.

### Step 3: Start the Development Server
```bash
npm start
```

The app will automatically open in your browser at:
- **URL:** http://localhost:3000

If it doesn't open automatically, manually navigate to that URL.

---

## 📋 Complete Commands

### One-time setup:
```bash
cd /home/syntaxbeast/Desktop/shopping/shopping
npm install
```

### Start server (every time):
```bash
npm start
```

### Stop server:
Press `Ctrl + C` in the terminal

---

## ⚠️ Before Starting - Make Sure:

1. ✅ **Firebase is configured** - Already done in `src/firebase.js`
2. ✅ **Dependencies are installed** - Run `npm install` if not done
3. ⚠️ **Firebase Authentication enabled** - Check Firebase Console
4. ⚠️ **Firestore Database created** - Check Firebase Console
5. ⚠️ **Security rules set up** - See `FIREBASE_SETUP.md`

---

## 🐛 Troubleshooting

### "command not found: npm"
- Install Node.js: https://nodejs.org/
- Restart your terminal after installation

### Port 3000 already in use
- The terminal will ask if you want to use a different port (usually 3001)
- Type `Y` and press Enter

### Firebase errors
- Make sure Authentication and Firestore are enabled in Firebase Console
- Check that your Firebase config is correct

### Module not found errors
- Run `npm install` again to ensure all dependencies are installed

---

## 📝 Available Scripts

- `npm start` - Start development server
- `npm build` - Create production build
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App (not recommended)

---

## ✅ Success Indicators

When the server starts successfully, you should see:
```
Compiled successfully!

You can now view shopping in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000
```

Then the browser should open automatically showing the MOVIEHUB login page!



