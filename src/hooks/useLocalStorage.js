import { useState, useEffect } from 'react';

/**
 * Custom hook to manage state with browser localStorage
 * This makes data persist even after page refresh
 * 
 * SECURITY ENHANCED: Added validation, sanitization, and size limits
 * 
 * @param {string} key - The localStorage key to store data under
 * @param {any} initialValue - The initial value if no data exists in localStorage
 * @returns {[any, function]} - Returns [storedValue, setValue] similar to useState
 */
const useLocalStorage = (key, initialValue) => {
  // SECURITY: Add prefix to prevent key collision attacks
  const STORAGE_PREFIX = 'hackathon_secure_';
  const MAX_STORAGE_SIZE = 5242880; // 5MB limit
  const secureKey = STORAGE_PREFIX + key;

  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState(() => {
    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(secureKey);
      
      // SECURITY: Validate JSON structure before parsing
      if (item) {
        // SECURITY: Size limit check (prevent storage exhaustion)
        if (item.length > MAX_STORAGE_SIZE) {
          console.error('Security: Data exceeds storage limit');
          window.localStorage.removeItem(secureKey);
          return initialValue;
        }

        const parsed = JSON.parse(item);
        
        // SECURITY: Type validation - ensure it matches expected structure
        if (key === 'hackathons' && !Array.isArray(parsed)) {
          console.error('Security: Invalid data type in localStorage');
          window.localStorage.removeItem(secureKey);
          return initialValue;
        }
        
        return parsed;
      }
      
      return initialValue;
    } catch (error) {
      console.error('Security: localStorage parsing error', error);
      // SECURITY: Clear corrupted data
      try {
        window.localStorage.removeItem(secureKey);
      } catch (e) {
        console.error('Security: Failed to remove corrupted data', e);
      }
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that
  // persists the new value to localStorage
  const setValue = (value) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // SECURITY: Validate before storing
      if (key === 'hackathons') {
        if (!Array.isArray(valueToStore)) {
          throw new Error('Invalid hackathons data type');
        }
        
        // SECURITY: Sanitize each hackathon object
        const sanitized = valueToStore.map(h => {
          // Prevent prototype pollution
          const safe = { ...h };
          delete safe.__proto__;
          delete safe.constructor;
          delete safe.prototype;
          
          // Limit string lengths
          if (safe.title) safe.title = String(safe.title).substring(0, 100);
          if (safe.description) safe.description = String(safe.description).substring(0, 1000);
          
          return safe;
        });
        
        const stringified = JSON.stringify(sanitized);
        
        // SECURITY: Check size before storing
        if (stringified.length > MAX_STORAGE_SIZE) {
          throw new Error('Data exceeds storage size limit');
        }
        
        setStoredValue(sanitized);
        window.localStorage.setItem(secureKey, stringified);
      } else {
        const stringified = JSON.stringify(valueToStore);
        
        // SECURITY: Check size before storing
        if (stringified.length > MAX_STORAGE_SIZE) {
          throw new Error('Data exceeds storage size limit');
        }
        
        setStoredValue(valueToStore);
        window.localStorage.setItem(secureKey, stringified);
      }
    } catch (error) {
      console.error('Security: localStorage write error', error);
      alert('Failed to save data: ' + error.message);
    }
  };

  // SECURITY: Sync across tabs but validate incoming data
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === secureKey && e.newValue) {
        try {
          // SECURITY: Validate size
          if (e.newValue.length > MAX_STORAGE_SIZE) {
            console.error('Security: Incoming storage data exceeds limit');
            return;
          }
          
          const parsed = JSON.parse(e.newValue);
          
          // SECURITY: Type validation
          if (key === 'hackathons' && !Array.isArray(parsed)) {
            console.error('Security: Invalid incoming data type');
            return;
          }
          
          setStoredValue(parsed);
        } catch (error) {
          console.error('Security: Invalid storage sync data', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [secureKey, key]);

  return [storedValue, setValue];
};

export default useLocalStorage;
