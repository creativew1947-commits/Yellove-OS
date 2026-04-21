// Handles routing using Google Directions API
// Fetches transport using Google Places API
// Converts address using Geocoding API
// Calculates ETA using Distance Matrix API
import { useState, useEffect, useCallback } from 'react';
import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, updateProfile, sendEmailVerification } from '../../services';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe = () => { };
    try {
      unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        if (currentUser) {
           setUser({
             uid: currentUser.uid,
             email: currentUser.email,
             displayName: currentUser.displayName,
             emailVerified: currentUser.emailVerified,
             photoURL: currentUser.photoURL
           });
        } else {
           setUser(null);
        }
        setLoading(false);
      });
    } catch (e) {
      console.warn("Auth not configured", e);
      setTimeout(() => setLoading(false), 0);
    }
    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      if (!email) return { success: false, message: "Email is required." };
      if (!password || password.length < 6) return { success: false, message: "Password must be at least 6 characters." };
      
      if (!auth) {
        return { success: false, message: "Firebase Auth not initialized. Ensure VITE_FIREBASE_API_KEY is set in your .env file." };
      }

      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (error) {
      console.error("Login failed", error);
      
      let errMsg = "Access denied. Please check your credentials.";
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
          errMsg = "Incorrect password or email combination.";
      } else if (error.code === 'auth/user-not-found') {
          errMsg = "User does not exist.";
      } else if (error.code === 'auth/invalid-email') {
          errMsg = "The email address is not valid.";
      } else if (error.code === 'auth/invalid-api-key' || error.code === 'auth/configuration-not-found') {
          errMsg = "Firebase config error. Please enable 'Email/Password' in Firebase Console > Authentication.";
      }
      return { success: false, message: errMsg };
    }
  }, []);

  const register = useCallback(async (email, password, name) => {
    try {
      if (!name) return { success: false, message: "Full Name is required." };
      if (!email) return { success: false, message: "Email is required." };
      if (!password || password.length < 6) return { success: false, message: "Password must be at least 6 characters." };
      
      if (!auth) {
        return { success: false, message: "Firebase Auth not initialized. Check your .env file." };
      }

      // 1. Create the user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // 2. Immediately update the profile while we have the user object
      await updateProfile(user, { displayName: name });
      
      // 3. Attempt verification but don't let it block the success return
      try {
        await sendEmailVerification(user);
      } catch (verifyError) {
        console.warn("Verification email skip: ", verifyError.code);
      }

      // 4. Manually update state with the known name to avoid race conditions with onAuthStateChanged
      setUser({
        uid: user.uid,
        email: user.email,
        displayName: name,
        emailVerified: user.emailVerified
      });

      return { success: true, message: "Success! Account created and stored in Firebase. You can now login any time." };
    } catch (error) {
      console.error("Registration Error:", error.code, error.message);

      let errMsg = `Registration failed (${error.code}).`;
      
      if (error.code === 'auth/email-already-in-use') {
          errMsg = "An account with this email already exists.";
      } else if (error.code === 'auth/weak-password') {
          errMsg = "Password is too weak.";
      } else if (error.code === 'auth/invalid-email') {
          errMsg = "The email address is not valid.";
      } else if (error.code === 'auth/operation-not-allowed') {
          errMsg = "Registration blocked. You MUST enable 'Email/Password' in Firebase Console > Authentication.";
      } else if (error.code === 'auth/configuration-not-found') {
          errMsg = "Configuration Not Found. IMPORTANT: Go to Firebase Console > Authentication and click the 'Get Started' button to activate the service.";
      } else if (error.code === 'auth/invalid-api-key') {
          errMsg = "API Key Error. Please check your .env configuration.";
      }
      
      return { success: false, message: errMsg };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
    setUser(null);
  }, []);

  return { user, loading, login, register, logout };
};
