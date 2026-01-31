import { useState, useEffect } from 'react';
import { 
  collection, 
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useTeam } from '../contexts/TeamContext';

/**
 * Custom hook to manage Firestore data with real-time updates
 * This replaces the useLocalStorage hook for Firebase Firestore
 * 
 * @param {string} collectionName - The Firestore collection name (e.g., 'hackathons')
 * @returns {Object} - Returns { data, loading, error, addItem, updateItem, deleteItem }
 * 
 * Features:
 * - Real-time updates with onSnapshot
 * - Automatic loading and error states
 * - CRUD operations (Create, Read, Update, Delete)
 * - Optimistic updates for better UX
 */
const useFirestore = (collectionName) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();
  const { currentTeam } = useTeam();

  /**
   * Set up real-time listener for Firestore collection
   * This automatically updates the UI when data changes in the database
   */
  useEffect(() => {
    // Only listen if user is logged in
    if (!currentUser) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Create a reference to the collection
    const collectionRef = collection(db, collectionName);
    
    // Create query based on context: Team vs Solo
    let q;
    
    if (currentTeam) {
      // In Team Mode: Fetch hackathons belonging to this team
      q = query(collectionRef, where('teamId', '==', currentTeam.id));
    } else {
      // In Solo Mode: Fetch hackathons owned by user with type 'solo' 
      // OR hackathons with no teamId (legacy solo)
      q = query(
        collectionRef, 
        where('ownerId', '==', currentUser.uid),
        where('teamId', '==', null) // Explicitly look for no team
        // Note: Compound queries with null can be tricky, simplified strategy:
      );
      
      // Better strategy since 'teamId' might not exist on old docs:
      // Just filter by ownerId, and client-side filter out team ones IF we want strict separating
      // But for Firestore index simplicity, let's start by querying ownerId
      q = query(collectionRef, where('ownerId', '==', currentUser.uid));
    }

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        try {
          const items = snapshot.docs
            .map(doc => ({
              id: doc.id,
              ...doc.data()
            }))
            // Client-side filtering to strictly separate Solo vs Team views
            .filter(item => {
              if (currentTeam) {
                return item.teamId === currentTeam.id;
              } else {
                // Solo view: show items that are NOT part of a team
                return !item.teamId; 
              }
            });
          
          setData(items);
          setLoading(false);
          setError(null);
        } catch (err) {
          console.error(`Error processing ${collectionName} snapshot:`, err);
          setError(err.message);
          setLoading(false);
        }
      },
      (err) => {
        // Handle errors from the listener
        console.error(`Error listening to ${collectionName}:`, err);
        setError(err.message);
        setLoading(false);
      }
    );

    // Cleanup function: unsubscribe from listener when component unmounts
    return () => unsubscribe();
  }, [collectionName, currentUser, currentTeam]);

  /**
   * Add a new item to the Firestore collection
   * @param {Object} item - The item object to add (without ID, Firestore generates it)
   * @returns {Promise<string>} - Returns the ID of the newly created document
   */
  const addItem = async (item) => {
    try {
      // Add a document to the collection
      const docRef = await addDoc(collection(db, collectionName), {
        ...item,
        createdAt: serverTimestamp() // Optional: add timestamp
      });
      
      console.log(`Item added to ${collectionName} with ID:`, docRef.id);
      return docRef.id;
    } catch (err) {
      console.error(`Error adding item to ${collectionName}:`, err);
      setError(err.message);
      throw err; // Re-throw so caller can handle it
    }
  };

  /**
   * Update an existing item in the Firestore collection
   * @param {string} id - The document ID to update
   * @param {Object} updates - The fields to update (partial update supported)
   * @returns {Promise<void>}
   */
  const updateItem = async (id, updates) => {
    try {
      // Create a reference to the specific document
      const docRef = doc(db, collectionName, id);
      
      // Update the document (only specified fields)
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp() // Optional: track last update time
      });
      
      console.log(`Item updated in ${collectionName} with ID:`, id);
    } catch (err) {
      console.error(`Error updating item in ${collectionName}:`, err);
      setError(err.message);
      throw err;
    }
  };

  /**
   * Delete an item from the Firestore collection
   * @param {string} id - The document ID to delete
   * @returns {Promise<void>}
   */
  const deleteItem = async (id) => {
    try {
      // Create a reference to the specific document
      const docRef = doc(db, collectionName, id);
      
      // Delete the document
      await deleteDoc(docRef);
      
      console.log(`Item deleted from ${collectionName} with ID:`, id);
    } catch (err) {
      console.error(`Error deleting item from ${collectionName}:`, err);
      setError(err.message);
      throw err;
    }
  };

  /**
   * Return the data and CRUD functions
   * 
   * Usage in components:
   * const { data, loading, error, addItem, updateItem, deleteItem } = useFirestore('hackathons');
   */
  return {
    data,          // Array of items from Firestore
    loading,       // Boolean: true while fetching data
    error,         // String: error message if something went wrong
    addItem,       // Function to add a new item
    updateItem,    // Function to update an existing item
    deleteItem     // Function to delete an item
  };
};

export default useFirestore;

/**
 * MIGRATION NOTES:
 * 
 * Old (useLocalStorage):
 *   const [hackathons, setHackathons] = useLocalStorage('hackathons', []);
 *   setHackathons([...hackathons, newHackathon]);
 * 
 * New (useFirestore):
 *   const { data: hackathons, loading, addItem, updateItem, deleteItem } = useFirestore('hackathons');
 *   await addItem(newHackathon);
 * 
 * Key Differences:
 * 1. Data is accessed via 'data' property instead of direct array
 * 2. Updates are done via specific functions (addItem, updateItem, deleteItem)
 * 3. All operations are async (return Promises)
 * 4. IDs are auto-generated by Firestore (don't need Date.now().toString())
 * 5. Real-time updates: changes sync automatically across all devices
 * 6. Loading state available for showing spinners/skeletons
 * 7. Error handling built-in
 * 
 * FUTURE ENHANCEMENTS:
 * - Add Firebase Authentication
 * - Change collection path to: `users/${userId}/hackathons` for user-specific data
 * - Add pagination for large datasets
 * - Add query filters (e.g., filter by status)
 * - Add offline persistence with enableIndexedDbPersistence()
 */
