// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCMk--PVQJj1kUeolElaK1y-Rgf0DGUx2U",
  authDomain: "shoppin-9af74.firebaseapp.com",
  projectId: "shoppin-9af74",
  storageBucket: "shoppin-9af74.firebasestorage.app",
  messagingSenderId: "616136920604",
  appId: "1:616136920604:web:1894fe3dc84f130ff4d9d9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;



