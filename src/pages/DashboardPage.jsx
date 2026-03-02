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
import { logActivity } from '../utils/logActivity';

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

            const createdId = await addHackathon(hackathonData);
            await logActivity({
                currentUser,
                currentTeam,
                type: 'project_created',
                projectId: createdId,
                projectTitle: hackathonData.title,
                entityId: createdId,
                entityTitle: hackathonData.title,
                meta: { status: hackathonData.status }
            });
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

            const existingProject = hackathons.find((entry) => entry.id === id);

            await updateHackathon(id, sanitizedUpdates);

            const projectLevelKeys = ['title', 'description', 'status', 'startDate', 'endDate', 'deadline', 'notes', 'type'];
            const hasProjectLevelChange = Object.keys(sanitizedUpdates).some((key) => projectLevelKeys.includes(key));

            if (hasProjectLevelChange) {
                await logActivity({
                    currentUser,
                    currentTeam,
                    type: 'project_updated',
                    projectId: id,
                    projectTitle: sanitizedUpdates.title || existingProject?.title || 'Untitled Project',
                    entityId: id,
                    entityTitle: sanitizedUpdates.title || existingProject?.title || 'Untitled Project',
                    meta: { fields: Object.keys(sanitizedUpdates) }
                });

                if (sanitizedUpdates.status && existingProject?.status && sanitizedUpdates.status !== existingProject.status) {
                    await logActivity({
                        currentUser,
                        currentTeam,
                        type: 'project_status_changed',
                        projectId: id,
                        projectTitle: sanitizedUpdates.title || existingProject?.title || 'Untitled Project',
                        entityId: id,
                        entityTitle: sanitizedUpdates.title || existingProject?.title || 'Untitled Project',
                        meta: { from: existingProject.status, to: sanitizedUpdates.status }
                    });
                }
            }

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
                const deletedProject = hackathons.find((entry) => entry.id === id);
                await deleteHackathonFromDb(id);
                await logActivity({
                    currentUser,
                    currentTeam,
                    type: 'project_deleted',
                    projectId: id,
                    projectTitle: deletedProject?.title || 'Untitled Project',
                    entityId: id,
                    entityTitle: deletedProject?.title || 'Untitled Project',
                    meta: { status: deletedProject?.status || 'Unknown' }
                });
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
            <div className="md:hidden mb-3">
                <div className="h-[2px] w-24 mx-auto rounded-full bg-gradient-to-r from-transparent via-indigo-400/70 to-transparent" />
                <p className="mt-1 text-center text-[10px] uppercase tracking-[0.16em] text-white/35">↓ Pull to refresh</p>
            </div>

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
                <div className="space-y-2 md:space-y-0 md:flex md:flex-col md:items-center md:justify-center min-h-[400px]">
                    <div className="md:hidden space-y-2">
                        {[1, 2, 3].map((entry) => (
                            <div key={entry} className="h-[86px] rounded-2xl border border-white/10 bg-white/5 overflow-hidden relative">
                                <div className="absolute inset-0 shimmer" />
                            </div>
                        ))}
                    </div>
                    <div className="hidden md:flex flex-col items-center justify-center">
                        <Loader2 className="w-12 h-12 text-primary-500 animate-spin mb-4" />
                        <p className="text-gray-400">Loading hackathons...</p>
                    </div>
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

            <motion.button
                whileTap={{ scale: 0.96 }}
                animate={hackathons?.length === 0 ? { boxShadow: ['0 0 0 0 rgba(99,102,241,0.35)', '0 0 0 10px rgba(99,102,241,0)', '0 0 0 0 rgba(99,102,241,0)'] } : {}}
                transition={hackathons?.length === 0 ? { duration: 1.8, repeat: Infinity, ease: 'easeOut' } : {}}
                onClick={() => setIsModalOpen(true)}
                className="md:hidden fixed z-40 right-4 bottom-[80px] h-14 w-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-[0_10px_30px_rgba(99,102,241,0.35)] flex items-center justify-center"
                aria-label="Add project"
            >
                <Plus size={24} />
            </motion.button>

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
