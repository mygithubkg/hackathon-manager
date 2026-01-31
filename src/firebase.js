import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

/**
 * Firebase Configuration
 * Replace the values below with your actual Firebase project credentials
 * 
 * To get your config:
 * 1. Go to Firebase Console (https://console.firebase.google.com/)
 * 2. Select your project (or create a new one)
 * 3. Go to Project Settings > General
 * 4. Scroll down to "Your apps" and click the web icon (</>)
 * 5. Copy the firebaseConfig object
 */

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Validate Firebase configuration
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
  console.error('❌ Firebase configuration is incomplete. Check your .env file.');
  console.error('Missing values:', {
    apiKey: !firebaseConfig.apiKey ? 'MISSING' : 'OK',
    authDomain: !firebaseConfig.authDomain ? 'MISSING' : 'OK',
    projectId: !firebaseConfig.projectId ? 'MISSING' : 'OK',
  });
}

/**
 * Initialize Firebase
 * This creates a Firebase app instance using your configuration
 */
const app = initializeApp(firebaseConfig);

/**
 * Initialize Firestore
 * This creates a Firestore database instance
 * 
 * Firestore is a NoSQL cloud database that stores data in documents and collections
 * For this app, we'll use a 'hackathons' collection to store all hackathon data
 */
export const db = getFirestore(app);

/**
 * Initialize Authentication
 * Used for user sign-in and management
 */
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

/**
 * Export the app instance for other Firebase services (Auth, Storage, etc.)
 */
export default app;

/**
 * Helper function to check if Firebase is properly configured
 */
export function checkFirebaseConfig() {
  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  };
  
  return Object.entries(config).every(([key, value]) => {
    if (!value) {
      console.error(`❌ ${key} is not set in .env file`);
      return false;
    }
    return true;
  });
}

/**
 * Firestore Database Structure:
 * 
 * hackathons (collection)
 *   └── [document_id] (auto-generated)
 *       ├── title: string
 *       ├── status: string
 *       ├── description: string
 *       ├── resources: array
 *       │   └── [resource_object]
 *       │       ├── id: string
 *       │       ├── label: string
 *       │       ├── url: string
 *       │       └── type: string
 *       └── createdAt: timestamp (optional)
 * 
 * FUTURE ENHANCEMENT:
 * If you add user authentication, you can make the structure user-specific:
 * 
 * users (collection)
 *   └── [user_id]
 *       └── hackathons (subcollection)
 *           └── [document_id]
 *               └── ... (same fields as above)
 */
