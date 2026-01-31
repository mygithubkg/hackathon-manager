import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Loader2, LogOut, Users, ArrowLeft } from 'lucide-react';
import Dashboard from './components/Dashboard';
import AddModal from './components/AddModal';
import Login from './components/Login';
import LandingPage from './components/LandingPage';
import TeamManager from './components/TeamManager';
import useFirestore from './hooks/useFirestore';
import { useAuth } from './contexts/AuthContext';
import { useTeam } from './contexts/TeamContext';

/**
 * Main App Component
 * Manages the overall state and orchestrates the Hackathon Command Center
 */
function App() {
  const { currentUser, logout } = useAuth();
  const { currentTeam } = useTeam();
  
  // State management using Firestore
  // This persists data across devices with real-time sync
  const { 
    data: hackathons, 
    loading, 
    error, 
    addItem: addHackathon, 
    updateItem: updateHackathon, 
    deleteItem: deleteHackathonFromDb 
  } = useFirestore('hackathons');
  
  // Modal state for add/edit functionality
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTeamManagerOpen, setIsTeamManagerOpen] = useState(false);
  const [editingHackathon, setEditingHackathon] = useState(null);
  const [showLogin, setShowLogin] = useState(false);

  /**
   * Add a new hackathon to Firestore
   * @param {Object} hackathon - The hackathon object to add
   */
  const handleAddHackathon = async (hackathon) => {
    try {
      // No need to generate ID - Firestore does this automatically
      // But we need to add ownerId for ownership and TeamId if in team mode
      const hackathonData = {
        ...hackathon,
        resources: hackathon.resources || [],
        ownerId: currentUser.uid,
        // If currentTeam is selected, associate with teamId, else null
        teamId: currentTeam ? currentTeam.id : null, 
        // Type is 'team' if in team context, else 'solo'
        type: currentTeam ? 'team' : 'solo'
      };
      
      // Add to Firestore
      await addHackathon(hackathonData);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error adding hackathon:', error);
      alert('Failed to add hackathon. Please try again.');
    }
  };

  /**
   * Update an existing hackathon in Firestore
   * @param {string} id - The ID of the hackathon to update
   * @param {Object} updatedData - The new data
   */
  const handleUpdateHackathon = async (id, updatedData) => {
    try {
      await updateHackathon(id, updatedData);
      setIsModalOpen(false);
      setEditingHackathon(null);
    } catch (error) {
      console.error('Error updating hackathon:', error);
      alert('Failed to update hackathon. Please try again.');
    }
  };

  /**
   * Delete a hackathon from Firestore
   * @param {string} id - The ID of the hackathon to delete
   */
  const handleDeleteHackathon = async (id) => {
    if (window.confirm('Are you sure you want to delete this hackathon?')) {
      try {
        await deleteHackathonFromDb(id);
      } catch (error) {
        console.error('Error deleting hackathon:', error);
        alert('Failed to delete hackathon. Please try again.');
      }
    }
  };

  /**
   * Open modal for editing
   * @param {Object} hackathon - The hackathon to edit
   */
  const handleEditClick = (hackathon) => {
    setEditingHackathon(hackathon);
    setIsModalOpen(true);
  };

  /**
   * Close modal and reset editing state
   */
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingHackathon(null);
  };

  // If user is not logged in, handle routing between Landing Page and Login
  if (!currentUser) {
    if (showLogin) {
      return (
        <div className="relative">
          <button 
            onClick={() => setShowLogin(false)} 
            className="absolute top-6 left-6 z-50 p-2 bg-white/10 rounded-full hover:bg-white/20 text-white transition-colors"
            title="Back to Home"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <Login />
        </div>
      );
    }
    return <LandingPage onGetStarted={() => setShowLogin(true)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800">
      {/* Header */}
      <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
                  {currentTeam ? currentTeam.name : '🚀 Hackathon Command Center'}
                </h1>
                {currentTeam && (
                  <span className="px-2 py-1 bg-green-900/40 border border-green-700/50 text-green-400 text-xs rounded uppercase tracking-wider font-bold">
                    TEAM VIEW
                  </span>
                )}
              </div>
              <p className="text-gray-400 text-sm mt-1">
                {currentTeam 
                  ? 'Collaborating with your squad' 
                  : 'Organize, manage, and track all your solo hackathon projects'}
              </p>
            </motion.div>
            
            {/* Actions Area */}
            <motion.div 
              className="flex items-center gap-2 md:gap-3 flex-wrap"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
               <button
                  onClick={() => setIsTeamManagerOpen(!isTeamManagerOpen)}
                  className={`p-2.5 border rounded-xl transition-all flex items-center gap-2 ${
                    isTeamManagerOpen || currentTeam
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                  title="Team Manager"
               >
                 <Users size={18} />
                 <span className="text-sm font-medium hidden sm:inline">
                   {currentTeam ? 'Switch Team' : 'Teams'}
                 </span>
               </button>

               {/* User Info */}
               <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 bg-gray-800/80 rounded-full border border-gray-700/50 mr-2">
                  {currentUser?.photoURL && (
                    <img 
                      src={currentUser.photoURL} 
                      alt="Profile" 
                      className="w-6 h-6 rounded-full border border-gray-600"
                    />
                  )}
                  <span className="text-sm text-gray-300 font-medium pr-1">
                    {currentUser?.displayName?.split(' ')[0]}
                  </span>
               </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={logout}
                  className="p-2.5 bg-gray-800 border border-gray-700 rounded-xl text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                  title="Sign Out"
                >
                  <LogOut size={18} />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsModalOpen(true)}
                  className="btn-primary flex items-center gap-2 shadow-lg shadow-primary-500/20 ml-2"
                  disabled={loading}
                >
                  <Plus size={20} />
                  <span className="hidden sm:inline">Add Hackathon</span>
                </motion.button>
            </motion.div>
          </div>
          
          {/* Team Manager Dropdown/Collapse */}
          <AnimatePresence>
            {isTeamManagerOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0, marginTop: 0 }}
                animate={{ height: 'auto', opacity: 1, marginTop: 24 }}
                exit={{ height: 0, opacity: 0, marginTop: 0 }}
                className="overflow-hidden"
              >
                <TeamManager onClose={() => setIsTeamManagerOpen(false)} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Error Banner */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl mb-6 mx-4"
          >
            {error}
          </motion.div>
        )}

        {/* Loading State or Dashboard */}
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <Loader2 className="w-12 h-12 text-primary-500 animate-spin mb-4" />
            <p className="text-gray-400">Loading hackathons...</p>
          </div>
        ) : (
          <Dashboard 
            hackathons={hackathons} 
            onEdit={handleEditClick}
            onUpdate={handleUpdateHackathon}
            onDelete={handleDeleteHackathon}
            // Pass currentTeam to Dashboard to hide generic tabs if in team mode
            isTeamView={!!currentTeam}
          />
        )}
      </main>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <AddModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            onSave={editingHackathon ? 
              (data) => handleUpdateHackathon(editingHackathon.id, data) : 
              handleAddHackathon
            }
            editingHackathon={editingHackathon}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
