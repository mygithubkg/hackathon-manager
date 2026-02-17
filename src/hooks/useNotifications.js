import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, limit, onSnapshot, writeBatch, doc, deleteDoc, updateDoc } from 'firebase/firestore';

/**
 * useNotifications Hook
 * 
 * Manages fetching notifications from Firestore and calculating deadline alerts locally.
 */
const useNotifications = (hackathons = []) => {
  const { currentUser } = useAuth();
  const [deadlineAlerts, setDeadlineAlerts] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // 1. Calculate Deadline Alerts
  useEffect(() => {
    const calculateAlerts = () => {
      const now = new Date().getTime();
      const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

      const urgentAlerts = (hackathons || [])
        .filter(h => {
          if (!h?.deadline) return false;
          if (h.status === 'Completed') return false;
          
          const deadlineTime = new Date(h.deadline).getTime();
          if (isNaN(deadlineTime)) return false;
          
          const timeUntil = deadlineTime - now;
          // Show alert if deadline is within 6 hours and hasn't passed (or passed recently?)
          // The original code was timeUntil > 0 && timeUntil < SIX_HOURS_MS
          return timeUntil > 0 && timeUntil < SIX_HOURS_MS;
        })
        .map(h => {
          const deadlineTime = new Date(h.deadline).getTime();
          const timeUntil = deadlineTime - now;
          const hoursLeft = Math.floor(timeUntil / (1000 * 60 * 60));
          const minutesLeft = Math.floor((timeUntil % (1000 * 60 * 60)) / (1000 * 60));

          return {
            id: h.id,
            title: h.title,
            deadline: h.deadline,
            hoursLeft,
            minutesLeft,
            timeUntil,
            type: 'urgent_deadline'
          };
        })
        .sort((a, b) => a.timeUntil - b.timeUntil);

      setDeadlineAlerts(urgentAlerts);
    };

    calculateAlerts();
    // Re-calculate every minute
    const interval = setInterval(calculateAlerts, 60000);
    return () => clearInterval(interval);
  }, [hackathons]);

  // 2. Listen to Firestore Notifications
  useEffect(() => {
    if (!currentUser) return;

    const notifRef = collection(db, 'notifications');
    const q = query(
      notifRef,
      where('userId', '==', currentUser.uid),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newNotifs = snapshot.docs.map(doc => {
        const data = doc.data();
        return { id: doc.id, ...data };
      });
      
      // Sort in memory (client-side) since we might not have a composite index for ordering
      newNotifs.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      
      setNotifications(newNotifs);

      // Sound effect logic for new unread notifications
      if (newNotifs.length > 0) {
        const latest = newNotifs[0];
        // If it's unread and created very recently (last 5 seconds), play sound
        if (!latest.read && latest.createdAt) {
          const now = new Date();
          // Check if createdAt is a Firestore Timestamp or Date (handle both if needed, but usually Timestamp)
          const createdAtDate = latest.createdAt.toDate ? latest.createdAt.toDate() : new Date(latest.createdAt);
          
          if (now - createdAtDate < 5000) {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            audio.volume = 0.5;
            audio.play().catch(() => { /* Ignore interaction errors */ });
          }
        }
      }
    }, (error) => {
      console.error("Error listening to notifications:", error);
    });

    return unsubscribe;
  }, [currentUser]);

  // Actions
  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.read);
    if (unread.length === 0) return;

    const batch = writeBatch(db);
    unread.forEach(n => {
      const docRef = doc(db, 'notifications', n.id);
      batch.update(docRef, { read: true });
    });

    try {
      await batch.commit();
    } catch (err) {
      console.error("Error marking all read:", err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  const clearAllNotifications = async () => {
    if (notifications.length === 0) return;
    
    const batch = writeBatch(db);
    notifications.forEach(n => {
      const docRef = doc(db, 'notifications', n.id);
      batch.delete(docRef);
    });

    try {
      await batch.commit();
    } catch (err) {
      console.error("Error clearing notifications:", err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const totalCount = deadlineAlerts.length + unreadCount;
  const hasAlerts = totalCount > 0;

  return {
    notifications,
    deadlineAlerts,
    unreadCount,
    totalCount,
    hasAlerts,
    markAllRead,
    deleteNotification,
    clearAllNotifications
  };
};

export default useNotifications;
