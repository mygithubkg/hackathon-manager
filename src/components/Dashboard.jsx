import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import HackathonCard from './HackathonCard';

/**
 * Dashboard Component
 * Displays all hackathons in a responsive grid layout with staggered animations
 * 
 * @param {Array} hackathons - Array of hackathon objects
 * @param {Function} onEdit - Callback function when edit button is clicked
 * @param {Function} onUpdate - Callback function when item is updated (for checklist/timers)
 * @param {Function} onDelete - Callback function when delete button is clicked
 */
const Dashboard = ({ hackathons = [], onEdit, onDelete, onUpdate, isTeamView }) => {
  const [activeTab, setActiveTab] = useState('solo');

  // Animation variants for staggered card entrance
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1 // Stagger each card by 0.1s
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 12
      }
    }
  };

  // SECURITY: Secure wrapper for Delete to prevent accidental data loss or click-jacking
  const handleSecureDelete = (id) => {
    const isConfirmed = window.confirm("Security Alert: This action cannot be undone. Are you sure you want to delete this project?");
    if (isConfirmed && onDelete) {
      onDelete(id);
    }
  };

  // Filter hackathons based on active tab
  const filteredHackathons = useMemo(() => {
    // SECURITY DEFENSE: Input Validation
    // Ensure hackathons is truly an array to prevent "undefined is not a function" crashes (Availability)
    if (!Array.isArray(hackathons)) {
      console.warn("Security Warning: Dashboard received invalid hackathons prop", hackathons);
      return [];
    }

    // If we are in specific Team View (controlled by parent), show all hackathons
    // (The parent App.jsx has already filtered them by teamId via useFirestore)
    if (isTeamView) {
      return hackathons;
    }

    // Otherwise, we are in Solo View (or unfiltered view)
    // Filter locally by tab
    return hackathons.filter(h => {
        // SECURITY LOOPHOLE FIX: Insecure Default
        // Old code: (h.type || 'solo') === activeTab
        // Risk: If 'type' is missing/null on a sensitive item, it defaulted to public/solo view.
        // Fix: Explicitly check type. If type is missing, it fails validation (fails closed).
        const itemType = h.type ? h.type.toLowerCase() : 'unknown';
        return itemType === activeTab;
    });
  }, [hackathons, activeTab, isTeamView]);

  return (
    <div className="container mx-auto px-4 pb-20">
      
      {/* Tabs - Only show if NOT in Team View */}
      {!isTeamView && (
        <div className="flex justify-center mb-8">
          <div className="flex bg-gray-800/50 p-1 rounded-xl border border-gray-700">
            <button
              onClick={() => setActiveTab('solo')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 'solo' 
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              👤 Solo Projects
            </button>
            <button
              onClick={() => setActiveTab('team')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 'team' 
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
               👥 Team Projects
            </button>
          </div>
        </div>
      )}

      {/* Statistics Bar (Filtered) */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
          <div className="text-gray-400 text-sm">Total {isTeamView ? 'Team Hackathons' : (activeTab === 'solo' ? 'Solo Projects' : 'Team Projects')}</div>
          <div className="text-3xl font-bold text-primary-400 mt-1">
            {filteredHackathons.length}
          </div>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
          <div className="text-gray-400 text-sm">Ongoing</div>
          <div className="text-3xl font-bold text-yellow-400 mt-1">
            {filteredHackathons.filter(h => h.status === 'Ongoing').length}
          </div>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
          <div className="text-gray-400 text-sm">Completed</div>
          <div className="text-3xl font-bold text-green-400 mt-1">
            {filteredHackathons.filter(h => h.status === 'Completed').length}
          </div>
        </div>
      </motion.div>

      {/* Empty state when no hackathons exist in this category */}
      {filteredHackathons.length === 0 ? (
        <motion.div
           key={isTeamView ? 'team-view' : activeTab} // Force re-render on tab change for animation
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ duration: 0.5 }}
           className="flex flex-col items-center justify-center min-h-[400px] text-center"
        >
          <div className="bg-gray-800/50 rounded-2xl p-12 border border-gray-700 max-w-md">
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 10, 0],
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3
              }}
              className="text-6xl mb-6 mx-auto w-fit"
            >
              {isTeamView || activeTab === 'team' ? '🤝' : '🚀'}
            </motion.div>
            <h3 className="text-2xl font-bold text-gray-100 mb-2">
              {isTeamView ? 'No team hackathons yet' : `No ${activeTab} projects yet`}
            </h3>
            <p className="text-gray-400">
              Start your first {isTeamView ? 'team' : activeTab} hackathon project by clicking the "Add Hackathon" button above.
            </p>
          </div>
        </motion.div>
      ) : (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          key={`grid-${isTeamView ? 'team' : activeTab}`} // Force re-render for stagger effect on tab change
        >
          <AnimatePresence mode="popLayout">
            {filteredHackathons.map((hackathon) => (
              <motion.div 
                key={hackathon.id}
                variants={itemVariants}
                layout
              >
                <HackathonCard 
                  hackathon={hackathon} 
                  onEdit={onEdit} 
                  onUpdate={onUpdate}
                  onDelete={handleSecureDelete}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};

export default Dashboard;