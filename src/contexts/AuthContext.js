import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { auth, googleProvider, db } from '../firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const signup = async (email, password, username) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;

      // Update auth profile
      if (username) {
        await updateProfile(user, { displayName: username });
      }

      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: username || user.email.split('@')[0],
        photoURL: user.photoURL || '',
        role: 'user',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return result;
    } catch (error) {
      throw error;
    }
  };

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check if user document exists
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // Create new user document
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email.split('@')[0],
          photoURL: user.photoURL || '',
          role: 'user',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      return result;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    return signOut(auth);
  };

  const updateUserProfile = (data) => {
    if (!auth.currentUser) {
      throw new Error('No user is currently signed in');
    }
    // Support both string (for backward compatibility) and object payloads
    if (typeof data === 'string') {
      return updateProfile(auth.currentUser, { displayName: data });
    }

    const payload = {};
    if (data?.displayName !== undefined) {
      payload.displayName = data.displayName;
    }
    if (data?.photoURL !== undefined) {
      payload.photoURL = data.photoURL;
    }

    return updateProfile(auth.currentUser, payload);
  };

  const changePassword = async (currentPassword, newPassword) => {
    if (!auth.currentUser || !auth.currentUser.email) {
      throw new Error('No user is currently signed in');
    }

    // Re-authenticate user
    const credential = EmailAuthProvider.credential(
      auth.currentUser.email,
      currentPassword
    );

    await reauthenticateWithCredential(auth.currentUser, credential);

    // Update password
    return updatePassword(auth.currentUser, newPassword);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    signup,
    login,
    loginWithGoogle,
    logout,
    updateUserProfile,
    changePassword
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};



