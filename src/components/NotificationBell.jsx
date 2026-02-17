import React from 'react';
import { motion } from 'framer-motion';
import { Bell } from 'lucide-react';

/**
 * NotificationBell Component
 * 
 * Simply renders the Bell icon with a notification badge.
 * Trigger logic is handled by the parent via onBellClick.
 */
const NotificationBell = ({
  unreadCount = 0,
  totalCount = 0,
  hasAlerts = false,
  onBellClick,
  className = ""
}) => {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onBellClick}
      className={`relative p-3 rounded-xl transition-all duration-300 ${hasAlerts
        ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30'
        : 'bg-white/5 hover:bg-white/10 text-gray-400 border border-white/10'
        } ${className}`}
    >
      <Bell size={20} className={hasAlerts ? 'animate-pulse' : ''} />
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
  );
};

export default NotificationBell;