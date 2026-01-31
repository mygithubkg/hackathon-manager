import { useState, useEffect } from 'react';

/**
 * Custom hook to manage state with browser localStorage
 * This makes data persist even after page refresh
 * 
 * @param {string} key - The localStorage key to store data under
 * @param {any} initialValue - The initial value if no data exists in localStorage
 * @returns {[any, function]} - Returns [storedValue, setValue] similar to useState
 * 
 * FIREBASE MIGRATION NOTE:
 * When migrating to Firebase, replace this hook with a custom hook that:
 * 1. Uses Firebase Realtime Database or Firestore
 * 2. Listens to real-time updates with onSnapshot (Firestore) or on() (RTDB)
 * 3. Updates Firebase when setValue is called
 * 4. Handles authentication and user-specific data
 */
const useLocalStorage = (key, initialValue) => {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState(() => {
    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // If error also return initialValue
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that
  // persists the new value to localStorage
  const setValue = (value) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // Save to local storage
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
      
      // FIREBASE MIGRATION NOTE:
      // Replace localStorage.setItem with:
      // await setDoc(doc(db, 'users', userId, 'hackathons', hackathonId), valueToStore)
      // or
      // await set(ref(database, `users/${userId}/hackathons/${hackathonId}`), valueToStore)
    } catch (error) {
      // A more advanced implementation would handle the error case
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  // Listen for changes to localStorage from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          console.error(`Error parsing storage change for key "${key}":`, error);
        }
      }
    };

    // Listen to storage events (from other tabs)
    window.addEventListener('storage', handleStorageChange);
    
    // FIREBASE MIGRATION NOTE:
    // Replace storage event listener with Firebase real-time listener:
    // const unsubscribe = onSnapshot(
    //   collection(db, 'users', userId, 'hackathons'),
    //   (snapshot) => {
    //     const hackathons = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    //     setStoredValue(hackathons);
    //   }
    // );

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      // FIREBASE MIGRATION NOTE: Call unsubscribe() here
    };
  }, [key]);

  return [storedValue, setValue];
};

export default useLocalStorage;
