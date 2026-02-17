import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Clock, AlertTriangle, CheckCircle, Info, FileText, Zap, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, orderBy, limit, onSnapshot, writeBatch, doc, deleteDoc } from 'firebase/firestore';

/**
 * NotificationBell Component
 * Fix: Aligned breakpoints to 'md' to match App.js layout changes.
 * Prevents dropdown clipping on tablet/intermediate screen sizes.
 */
const NotificationBell = ({ hackathons = [] }) => {
  const { currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [deadlineAlerts, setDeadlineAlerts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);

  // Calculate alerts whenever hackathons change
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
    const interval = setInterval(calculateAlerts, 60000);
    return () => clearInterval(interval);
  }, [hackathons]);

  // LISTEN TO FIRESTORE NOTIFICATIONS
  useEffect(() => {
    if (!currentUser) return;

    const notifRef = collection(db, 'notifications');

    console.log("🔔 NotificationBell: Setting up listener for user:", currentUser.uid);

    // Query: Get unread notifications for this user
    // Note: ordered by time descending is handled manually below as index fallback
    const q = query(
      notifRef,
      where('userId', '==', currentUser.uid),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log("🔔 NotificationBell: Snapshot received. Docs:", snapshot.docs.length);

      const newNotifs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data
        };
      });

      // Sort manually since we removed orderBy to avoid index issues during dev
      newNotifs.sort((a, b) => {
        const tA = a.createdAt?.toMillis() || 0;
        const tB = b.createdAt?.toMillis() || 0;
        return tB - tA;
      });

      setNotifications(newNotifs);

      // Play sound if new notification arrives
      if (newNotifs.length > 0) {
        const latest = newNotifs[0];
        if (!latest.read && latest.createdAt) {
          const now = new Date();
          const notifTime = latest.createdAt.toDate();
          // Only play if it arrived in the last 5 seconds (prevent sound on page load)
          if (now - notifTime < 5000) {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            audio.volume = 0.5;
            audio.play().catch(e => console.log("Audio play failed (user interaction needed first)"));
          }
        }
      }
    }, (error) => {
      console.error("🔔 NotificationBell: Firestore Error:", error);
    });

    return unsubscribe;
  }, [currentUser]);

  // Mark all as read function
  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.read);
    if (unread.length === 0) return;

    const batch = writeBatch(db);
    unread.forEach(n => {
      const ref = doc(db, 'notifications', n.id);
      batch.update(ref, { read: true });
    });

    try {
      await batch.commit();
    } catch (err) {
      console.error("Error marking read:", err);
    }
  };

  // Delete specific notification
  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  // Clear all notifications
  const handleClearAll = async () => {
    if (notifications.length === 0) return;

    // Firestore batch limit is 500, we limit query to 20 so this is safe
    const batch = writeBatch(db);
    notifications.forEach(n => {
      const ref = doc(db, 'notifications', n.id);
      batch.delete(ref);
    });

    try {
      await batch.commit();
    } catch (err) {
      console.error("Error clearing notifications:", err);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Calculate total badge count (Deadlines + Unread Notifications)
  const unreadCount = notifications.filter(n => !n.read).length;
  const totalCount = deadlineAlerts.length + unreadCount;
  const hasAlerts = totalCount > 0;
  const hasNotifications = notifications.length > 0;

  // Helper to get icon/color based on type
  const getNotifStyle = (type) => {
    switch (type) {
      case 'success': return { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' };
      case 'urgent': return { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' };
      case 'info': return { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' };
      default: return { icon: Zap, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' };
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-3 rounded-xl transition-all duration-300 ${hasAlerts
          ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30'
          : 'bg-white/5 hover:bg-white/10 text-gray-400 border border-white/10'
          }`}
        aria-label={`Notifications${hasAlerts ? ` (${totalCount})` : ''}`}
      >
        <Bell size={20} className={hasAlerts ? 'animate-pulse' : ''} />

        {/* Badge Count */}
        {hasAlerts && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-gradient-to-br from-red-500 to-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg shadow-red-500/50 border-2 border-gray-900"
          >
            {totalCount > 9 ? '9+' : totalCount}
          </motion.div>
        )}
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className={`
              z-50 bg-gray-900/95 backdrop-blur-2xl border border-white/10 shadow-2xl overflow-hidden rounded-2xl
              fixed left-4 right-4 top-20 w-auto 
              md:absolute md:top-full md:right-0 md:left-auto md:w-80 md:mt-3
            `}
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/10 bg-white/5">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-bold text-white text-sm flex items-center gap-2">
                  <Bell size={16} />
                  <span>Notifications</span>
                </h3>
                <div className="flex gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs font-bold text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 px-2 py-1 rounded-lg border border-indigo-500/20 transition-colors"
                    >
                      Mark read
                    </button>
                  )}
                  {hasNotifications && (
                    <button
                      onClick={handleClearAll}
                      className="text-xs font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 px-2 py-1 rounded-lg border border-red-500/20 transition-colors"
                    >
                      Clear all
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Alert List */}
            <div className="max-h-[60vh] md:max-h-96 overflow-y-auto custom-scrollbar">
              {!hasAlerts && !hasNotifications ? (
                /* Empty State */
                <div className="px-5 py-8 text-center">
                  <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Bell size={24} className="text-gray-600" />
                  </div>
                  <p className="text-sm text-gray-400 font-medium">
                    All caught up! 🎉
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    No new notifications
                  </p>
                </div>
              ) : (
                /* Alert Items */
                <div className="py-2 space-y-1">

                  {/* SECTION 1: Deadline Alerts (Always Top) */}
                  {deadlineAlerts.map((alert) => (
                    <motion.div
                      key={`deadline-${alert.id}`}
                      className="px-5 py-3 bg-red-500/5 border-l-4 border-red-500 hover:bg-red-500/10 transition-colors relative"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center mt-0.5">
                          <Clock size={16} className="text-red-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-red-100 mb-1 leading-tight">
                            {alert.title}
                          </p>
                          <div className="flex items-center gap-1.5 text-xs text-red-400 font-bold">
                            <span>Due in {alert.hoursLeft}h {alert.minutesLeft}m</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {/* SECTION 2: Firestore Notifications */}
                  {notifications.map((notif, index) => {
                    const style = getNotifStyle(notif.type);
                    const Icon = style.icon;
                    return (
                      <motion.div
                        key={notif.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`px-5 py-3 hover:bg-white/5 transition-colors border-l-4 ${notif.read ? 'border-gray-700 opacity-60' : 'border-indigo-500'} group relative`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Icon */}
                          <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5 ${style.bg}`}>
                            <Icon size={16} className={style.color} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0 pr-6">
                            <p className="text-sm font-medium text-gray-200 mb-1 leading-tight break-words">
                              {notif.message}
                            </p>
                            <span className="text-[10px] text-gray-500 font-mono">
                              {notif.createdAt?.toDate ? notif.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                            </span>
                          </div>

                          {/* Action Area: Dot (Default) vs Trash (Hover) */}
                          <div className="flex flex-col items-center gap-2 relative w-6 h-6">
                            {!notif.read && (
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-indigo-500 transition-opacity group-hover:opacity-0" />
                            )}

                            <button
                              onClick={(e) => handleDelete(notif.id, e)}
                              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-all opacity-0 group-hover:opacity-100 z-10"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {(hasAlerts || hasNotifications) && (
              <div className="px-5 py-3 border-t border-white/10 bg-white/5 text-center">
                <p className="text-xs text-gray-500 font-medium">
                  🔔 Alerts keep you updated
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(31, 41, 55, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(107, 114, 128, 0.4);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(107, 114, 128, 0.6);
        }
      `}</style>
    </div>
  );
};

export default NotificationBell;