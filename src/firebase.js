// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyCMk--PVQJj1kUeolElaK1y-Rgf0DGUx2U",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "shoppin-9af74.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "shoppin-9af74",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "shoppin-9af74.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "616136920604",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:616136920604:web:1894fe3dc84f130ff4d9d9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;



