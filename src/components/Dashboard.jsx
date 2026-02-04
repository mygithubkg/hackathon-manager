import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, Users, Trophy, Activity, FolderOpen, Flame, Archive, Zap } from 'lucide-react';
import HackathonCard from './HackathonCard';

// --- SUB-COMPONENT: HUD STAT CARD ---
const StatCard = ({ label, value, icon: Icon, colorClass, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="relative overflow-hidden bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl p-5 flex flex-col justify-between group hover:bg-white/5 transition-colors"
  >
    <div className="flex justify-between items-start mb-2">
      <div className={`p-2 rounded-lg bg-white/5 ${colorClass}`}>
        <Icon size={20} />
      </div>
      <span className="text-4xl font-heading font-bold text-white tracking-tight">
        {value}
      </span>
    </div>
    <p className="text-xs font-heading uppercase tracking-widest text-gray-500 font-bold group-hover:text-gray-400 transition-colors">
      {label}
    </p>
  </motion.div>
);

// --- MAIN COMPONENT ---
const Dashboard = ({ hackathons = [], onEdit, onDelete, onUpdate, isTeamView }) => {
  const [activeTab, setActiveTab] = useState('solo');

  // --- ANIMATION VARIANTS ---
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1, 
      transition: { type: 'spring', stiffness: 100, damping: 12 } 
    }
  };

  // --- SECURITY: DELETE WRAPPER ---
  const handleSecureDelete = (id) => {
    const isConfirmed = window.confirm("Security Alert: This action cannot be undone. Are you sure you want to delete this project?");
    if (isConfirmed && onDelete) onDelete(id);
  };

  // --- LOGIC: FILTER & SORT ---
  const filteredHackathons = useMemo(() => {
    if (!Array.isArray(hackathons)) return [];

    let filtered = [];
    if (isTeamView) {
      filtered = hackathons;
    } else {
      filtered = hackathons.filter(h => {
        const itemType = h.type ? h.type.toLowerCase() : 'unknown';
        return itemType === activeTab;
      });
    }

    const now = new Date().getTime();
    const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;

    return filtered.sort((a, b) => {
      const getPriority = (hackathon) => {
        if (hackathon.deadline) {
          const deadlineTime = new Date(hackathon.deadline).getTime();
          const timeUntilDeadline = deadlineTime - now;
          if (timeUntilDeadline > 0 && timeUntilDeadline < FIVE_DAYS_MS) return 3;
        }
        if (hackathon.status === 'Ongoing') return 2;
        if (hackathon.status === 'Planning' || hackathon.status === 'Upcoming') return 1;
        return 0;
      };

      const priorityA = getPriority(a);
      const priorityB = getPriority(b);
      
      if (priorityA !== priorityB) return priorityB - priorityA;
      if (a.deadline && b.deadline) return new Date(a.deadline) - new Date(b.deadline);
      if (a.deadline) return -1;
      if (b.deadline) return 1;
      return 0;
    });
  }, [hackathons, activeTab, isTeamView]);

  return (
    <div className="container mx-auto px-4 pb-20 max-w-7xl">
      
      {/* --- HEADER & CONTROLS --- */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
        <div>
          <h2 className="text-3xl font-heading font-bold text-white mb-2 flex items-center gap-3">
            {isTeamView ? <Users className="text-indigo-400" /> : <LayoutGrid className="text-indigo-400" />}
            {isTeamView ? 'Team Command' : 'My Projects'}
          </h2>
          <p className="text-gray-400 font-body text-sm">
            Overview of all active and archived protocols.
          </p>
        </div>

        {/* Liquid Tabs */}
        {!isTeamView && (
          <div className="flex bg-black/40 backdrop-blur-xl p-1.5 rounded-xl border border-white/10 relative">
            {['solo', 'team'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative z-10 px-6 py-2 rounded-lg text-sm font-heading font-bold transition-colors duration-200 flex items-center gap-2 ${
                  activeTab === tab ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {activeTab === tab && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-500/25"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  {tab === 'solo' ? '👤 Solo' : '👥 Team'}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* --- HUD STATS BAR --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        <StatCard 
          label="Total Protocols"
          value={filteredHackathons.length}
          icon={FolderOpen}
          colorClass="text-indigo-400"
          delay={0}
        />
        <StatCard 
          label="Active Sprints"
          value={filteredHackathons.filter(h => h.status === 'Ongoing').length}
          icon={Activity}
          colorClass="text-amber-400"
          delay={0.1}
        />
        <StatCard 
          label="Shipped"
          value={filteredHackathons.filter(h => h.status === 'Completed').length}
          icon={Trophy}
          colorClass="text-emerald-400"
          delay={0.2}
        />
      </div>

      {/* --- MAIN CONTENT GRID --- */}
      {filteredHackathons.length === 0 ? (
        /* Empty State */
        <motion.div
          key={isTeamView ? 'team-view' : activeTab}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center justify-center min-h-[400px] text-center bg-white/5 border border-white/5 rounded-3xl border-dashed"
        >
          <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mb-6">
            <Zap className="w-8 h-8 text-gray-600" />
          </div>
          <h3 className="text-2xl font-heading font-bold text-white mb-2">
            No signal detected
          </h3>
          <p className="text-gray-500 font-body max-w-sm">
            {isTeamView 
              ? 'No team operations found.' 
              : `Initialize your first ${activeTab} project above.`}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-12">
          {(() => {
            // SYSTEMATIC GROUPING: 48 hours critical, Active, Everything Else
            const now = new Date().getTime();
            const CRITICAL_THRESHOLD_MS = 48 * 60 * 60 * 1000; // 48 hours
            
            // Group 1: 🔥 Critical Attention - Deadline < 48 hours
            const critical = filteredHackathons.filter(h => {
              if (!h?.deadline) return false;
              const deadlineTime = new Date(h.deadline).getTime();
              const timeUntil = deadlineTime - now;
              return timeUntil > 0 && timeUntil < CRITICAL_THRESHOLD_MS;
            });
            
            // Group 2: 💻 Active Projects - Status is 'Ongoing' (not already in critical)
            const active = filteredHackathons.filter(h => 
              h.status === 'Ongoing' && !critical.includes(h)
            );
            
            // Group 3: 📅 Planned & Completed - Everything else
            const plannedAndCompleted = filteredHackathons.filter(h => 
              !critical.includes(h) && !active.includes(h)
            );
            
            return (
              <>
                {/* GROUP 1: CRITICAL ATTENTION */}
                {critical.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 font-heading font-bold text-sm uppercase tracking-wider">
                        <Flame size={14} />
                        <span>🔥 Critical Attention</span>
                      </div>
                      <div className="flex-1 h-px bg-gradient-to-r from-red-500/30 to-transparent"></div>
                    </div>
                    <motion.div 
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {critical.map((hackathon) => (
                        <motion.div key={hackathon.id} variants={itemVariants} layout>
                          <HackathonCard 
                            hackathon={hackathon} 
                            onEdit={onEdit} 
                            onUpdate={onUpdate}
                            onDelete={handleSecureDelete}
                          />
                        </motion.div>
                      ))}
                    </motion.div>
                  </div>
                )}

                {/* GROUP 2: ACTIVE PROJECTS */}
                {active.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                       <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-heading font-bold text-sm uppercase tracking-wider">
                        <Activity size={14} />
                        <span>💻 Active Projects</span>
                      </div>
                      <div className="flex-1 h-px bg-gradient-to-r from-amber-500/30 to-transparent"></div>
                    </div>
                    <motion.div 
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {active.map((hackathon) => (
                        <motion.div key={hackathon.id} variants={itemVariants} layout>
                          <HackathonCard 
                            hackathon={hackathon} 
                            onEdit={onEdit} 
                            onUpdate={onUpdate}
                            onDelete={handleSecureDelete}
                          />
                        </motion.div>
                      ))}
                    </motion.div>
                  </div>
                )}

                {/* GROUP 3: PLANNED & COMPLETED */}
                {plannedAndCompleted.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-500/10 border border-gray-500/20 text-gray-400 font-heading font-bold text-sm uppercase tracking-wider">
                        <Archive size={14} />
                        <span>📅 Planned & Completed</span>
                      </div>
                      <div className="flex-1 h-px bg-gradient-to-r from-gray-500/30 to-transparent"></div>
                    </div>
                    <motion.div 
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {plannedAndCompleted.map((hackathon) => (
                        <motion.div key={hackathon.id} variants={itemVariants} layout>
                          <HackathonCard 
                            hackathon={hackathon} 
                            onEdit={onEdit} 
                            onUpdate={onUpdate}
                            onDelete={handleSecureDelete}
                          />
                        </motion.div>
                      ))}
                    </motion.div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default Dashboard;