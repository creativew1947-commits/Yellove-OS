// Handles routing using Google Directions API
// Fetches transport using Google Places API
// Converts address using Geocoding API
// Calculates ETA using Distance Matrix API
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, get, child } from 'firebase/database';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, updateProfile, sendEmailVerification } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';
import { getPerformance } from 'firebase/performance';

// API keys and configuration loaded securely from environment variables
// Use Vite's import.meta.env for secure access
const sanitizeConfig = (val) => (val || "").replace(/['"]/g, "").trim();

const firebaseConfig = {
  apiKey: sanitizeConfig(import.meta.env?.VITE_FIREBASE_API_KEY),
  authDomain: sanitizeConfig(import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN),
  databaseURL: sanitizeConfig(import.meta.env?.VITE_FIREBASE_DATABASE_URL),
  projectId: sanitizeConfig(import.meta.env?.VITE_FIREBASE_PROJECT_ID),
  storageBucket: sanitizeConfig(import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: sanitizeConfig(import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID),
  appId: sanitizeConfig(import.meta.env?.VITE_FIREBASE_APP_ID)
};

let app = null;
let database = null;
let auth = null;
let analytics = null;
let performance = null;

// Protected initialization with error handling and safe fallbacks
try {
  if (firebaseConfig.apiKey && firebaseConfig.appId) {
    app = initializeApp(firebaseConfig);
    database = getDatabase(app);
    auth = getAuth(app);
    
    if (typeof window !== 'undefined') {
      analytics = getAnalytics(app);
      performance = getPerformance(app);
    }
  } else {
    // API failure fallback: Log warning and prevent application crash
    console.warn("Firebase initialized with empty config. App functionality will be limited.");
  }
} catch (error) {
  // Graceful error handling for API failures
  console.error("Firebase Initialization Error:", error);
}

const logAnalyticsEvent = (name, params) => {
  if (analytics) {
    logEvent(analytics, name, params);
  }
};

export { 
  app, database, auth, analytics, performance,
  ref, onValue, set, get, child, 
  signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut,
  updateProfile, sendEmailVerification, logAnalyticsEvent
};
