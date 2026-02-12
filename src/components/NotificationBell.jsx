import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Clock, AlertTriangle } from 'lucide-react';

/**
 * NotificationBell Component
 * Fix: Aligned breakpoints to 'md' to match App.js layout changes.
 * Prevents dropdown clipping on tablet/intermediate screen sizes.
 */
const NotificationBell = ({ hackathons = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
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
            timeUntil
          };
        })
        .sort((a, b) => a.timeUntil - b.timeUntil);

      setAlerts(urgentAlerts);
    };

    calculateAlerts();
    const interval = setInterval(calculateAlerts, 60000);
    return () => clearInterval(interval);
  }, [hackathons]);

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

  const alertCount = alerts.length;
  const hasAlerts = alertCount > 0;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-3 rounded-xl transition-all duration-300 ${
          hasAlerts 
            ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30' 
            : 'bg-white/5 hover:bg-white/10 text-gray-400 border border-white/10'
        }`}
        aria-label={`Notifications${hasAlerts ? ` (${alertCount})` : ''}`}
      >
        <Bell size={20} className={hasAlerts ? 'animate-pulse' : ''} />
        
        {/* Badge Count */}
        {hasAlerts && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-gradient-to-br from-red-500 to-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg shadow-red-500/50 border-2 border-gray-900"
          >
            {alertCount > 9 ? '9+' : alertCount}
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
            // --- RESPONSIVE FIX ---
            // Changed 'sm:' to 'md:' to match the header layout shift.
            // On screens < md (where buttons are left-aligned), it stays fixed/centered.
            // On screens >= md (where buttons move right), it anchors to the button.
            className={`
              z-50 bg-gray-900/95 backdrop-blur-2xl border border-white/10 shadow-2xl overflow-hidden rounded-2xl
              
              /* Mobile & Tablet (< 768px): Fixed position, centered below header */
              fixed left-4 right-4 top-20 w-auto 
              
              /* Desktop (>= 768px): Absolute position, anchored to button */
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
                {hasAlerts && (
                  <span className="text-xs font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded-lg border border-red-500/20">
                    {alertCount} Alert{alertCount !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>

            {/* Alert List - Responsive max-height */}
            <div className="max-h-[60vh] md:max-h-96 overflow-y-auto custom-scrollbar">
              {!hasAlerts ? (
                /* Empty State */
                <div className="px-5 py-8 text-center">
                  <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Bell size={24} className="text-gray-600" />
                  </div>
                  <p className="text-sm text-gray-400 font-medium">
                    All caught up! 🎉
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    No upcoming deadlines in the next 6 hours
                  </p>
                </div>
              ) : (
                /* Alert Items */
                <div className="py-2">
                  {alerts.map((alert, index) => (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="px-5 py-3 hover:bg-white/5 transition-colors border-l-4 border-red-500"
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className="flex-shrink-0 w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center mt-0.5">
                          <AlertTriangle size={16} className="text-red-400" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white mb-1 leading-tight break-words">
                            {alert.title}
                          </p>
                          <div className="flex items-center gap-1.5 text-xs text-red-400 font-bold">
                            <Clock size={11} />
                            <span>
                              ⚠️ Due in {alert.hoursLeft}h {alert.minutesLeft}m
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer (if there are alerts) */}
            {hasAlerts && (
              <div className="px-5 py-3 border-t border-white/10 bg-white/5 text-center">
                <p className="text-xs text-gray-500 font-medium">
                  🔔 Alerts update every minute
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