import React from 'react';
import { motion } from 'framer-motion';
import DesktopSidebar from './DesktopSidebar';
import MobileDock from './MobileDock';

/**
 * 🪐 DashboardLayout - Orbital Navigation System
 * 
 * A futuristic, glassmorphic layout wrapper that replaces traditional top-heavy navigation.
 * Features:
 * - Desktop: "Command Rail" (Collapsible Sidebar)
 * - Mobile: "Glass Dock" (Floating Bottom Navigation)
 * - Background: "Deep Space" Ambient System
 */
const DashboardLayout = ({
    children,
    user,
    currentTeam,
    onLogout,
    onAddClick,
    onTeamClick,
    renderNotifications // Render prop for dynamic positioning of NotificationBell
}) => {

    // --- BACKGROUND SYSTEM ---
    const AmbientBackground = () => (
        <div className="fixed inset-0 z-[-1] overflow-hidden bg-[#050505] pointer-events-none">
            {/* 1. Base Grid Pattern */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `linear-gradient(#4f46e5 1px, transparent 1px), linear-gradient(to right, #4f46e5 1px, transparent 1px)`,
                    backgroundSize: '40px 40px'
                }}
            />

            {/* 2. Radial Gradient Orbs (Animated) */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3]
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-indigo-600/20 rounded-full blur-[120px]"
            />
            <motion.div
                animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.2, 0.4, 0.2]
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-purple-600/20 rounded-full blur-[100px]"
            />

            {/* 3. Vignette Overlay */}
            <div className="absolute inset-0 bg-radial-gradient from-transparent to-[#050505] opacity-80" />
        </div>
    );

    return (
        <div className="min-h-screen text-gray-100 font-body">
            <AmbientBackground />

            {/* Desktop Navigation */}
            <DesktopSidebar
                user={user}
                currentTeam={currentTeam}
                onLogout={onLogout}
                onAddClick={onAddClick}
                onTeamClick={onTeamClick}
                renderNotifications={renderNotifications}
            />

            {/* Mobile Navigation */}
            <MobileDock
                user={user}
                onLogout={onLogout}
                onAddClick={onAddClick}
                onTeamClick={onTeamClick}
                renderNotifications={renderNotifications}
            />

            {/* Main Content Area */}
            <main className="md:pl-[100px] transition-all duration-300 min-h-screen">
                <div className="container mx-auto p-4 md:p-8 pt-20 md:pt-8 pb-32 md:pb-8">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
