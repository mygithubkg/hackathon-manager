import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Loader2, LogOut, Users, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Dashboard from '../components/Dashboard';
import AddModal from '../components/AddModal';
import NotificationBell from '../components/NotificationBell';
import NotificationModal from '../components/NotificationModal';
import DashboardLayout from '../components/DashboardLayout';
import useFirestore from '../hooks/useFirestore';
import useNotifications from '../hooks/useNotifications';
import { useAuth } from '../contexts/AuthContext';
import { useTeam } from '../contexts/TeamContext';
import { sanitizeObject, addHackathonLimiter, updateHackathonLimiter } from '../utils/security';

/**
 * Main Dashboard Page
 * Manages the core dashboard view and application state
 */
function DashboardPage() {
    const navigate = useNavigate();
    const { currentUser, logout } = useAuth();
    const { currentTeam } = useTeam();

    // State management using Firestore
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
    // TeamManager is replaced by TeamsPage routing, but keeping state just in case we need it for something else
    // or removing if we fully replace. Let's keep the hook for now but handle navigation.
    const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
    const [editingHackathon, setEditingHackathon] = useState(null);
    // Login state handled by parent App router usually, but here we can keep it if needed
    // actually App handles auth check before rendering DashboardPage, so we can simplify.

    // Notification Hook
    const {
        notifications,
        deadlineAlerts,
        unreadCount,
        totalCount,
        hasAlerts,
        markAllRead,
        deleteNotification,
        clearAllNotifications
    } = useNotifications(hackathons);

    // Navigate to Teams Page instead of opening modal
    const handleTeamClick = () => {
        navigate('/teams');
    };

    /**
     * Add a new hackathon to Firestore
     */
    const handleAddHackathon = async (hackathon) => {
        if (!addHackathonLimiter.canProceed('add')) {
            alert('Security: Too many requests. Please wait a moment.');
            return;
        }

        try {
            const allowedKeys = ['title', 'status', 'description', 'type', 'resources', 'checklist', 'startDate', 'endDate', 'deadline', 'notes'];
            const sanitizedHackathon = sanitizeObject(hackathon, allowedKeys);

            const hackathonData = {
                ...sanitizedHackathon,
                resources: sanitizedHackathon.resources || [],
                ownerId: currentUser.uid,
                teamId: currentTeam ? currentTeam.id : null,
                type: currentTeam ? 'team' : 'solo'
            };

            await addHackathon(hackathonData);
            setIsModalOpen(false);
        } catch (error) {
            console.error('Error adding hackathon:', error);
            alert('Failed to add hackathon. Please try again.');
        }
    };

    /**
     * Update an existing hackathon
     */
    const handleUpdateHackathon = async (id, updatedData) => {
        if (!updateHackathonLimiter.canProceed('update')) {
            alert('Security: Too many requests. Please wait a moment.');
            return;
        }

        try {
            const allowedKeys = [
                'id', 'title', 'description', 'status', 'startDate', 'endDate', 'deadline', 'tasks',
                'resources', 'checklist', 'timers', 'links', 'notes', 'type', 'teamId'
            ];

            const sanitizedUpdates = sanitizeObject(updatedData, allowedKeys);

            await updateHackathon(id, sanitizedUpdates);
            setIsModalOpen(false);
            setEditingHackathon(null);
        } catch (error) {
            console.error('Error updating hackathon:', error);
            alert('Failed to update hackathon. Please try again.');
        }
    };

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

    const handleEditClick = (hackathon) => {
        setEditingHackathon(hackathon);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingHackathon(null);
    };

    return (
        <DashboardLayout
            user={currentUser}
            currentTeam={currentTeam}
            onLogout={logout}
            onAddClick={() => setIsModalOpen(true)}
            onTeamClick={handleTeamClick}
            renderNotifications={(props) => (
                <NotificationBell
                    {...props}
                    unreadCount={unreadCount}
                    totalCount={totalCount}
                    hasAlerts={hasAlerts}
                    onBellClick={() => setIsNotificationModalOpen(true)}
                />
            )}
        >
            {/* Team Manager Dropdown - Removed or minimal since we navigate away */}
            {/* Keeping AnimatePresence for modal or other transitions */}

            {/* Error Banner */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl mb-6"
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
                    isTeamView={!!currentTeam}
                />
            )}

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

            {/* Notification Modal */}
            <NotificationModal
                isOpen={isNotificationModalOpen}
                onClose={() => setIsNotificationModalOpen(false)}
                notifications={notifications}
                deadlineAlerts={deadlineAlerts}
                unreadCount={unreadCount}
                totalCount={totalCount}
                onMarkRead={markAllRead}
                onClearAll={clearAllNotifications}
                onDelete={deleteNotification}
            />
        </DashboardLayout>
    );
}

export default DashboardPage;
