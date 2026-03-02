import React from 'react';
import { motion } from 'framer-motion';
import { Command } from 'lucide-react';
import DesktopSidebar from './DesktopSidebar';
import MobileDock from './MobileDock';

const DashboardLayout = ({
    children,
    user,
    currentTeam,
    onLogout,
    onAddClick,
    onTeamClick,
    renderNotifications
}) => {
    const AmbientBackground = () => (
        <div className="fixed inset-0 z-[-1] overflow-hidden bg-[#050505] pointer-events-none">
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: 'linear-gradient(#4f46e5 1px, transparent 1px), linear-gradient(to right, #4f46e5 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}
            />
            <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-indigo-600/20 rounded-full blur-[120px]"
            />
            <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-purple-600/20 rounded-full blur-[100px]"
            />
            <div className="absolute inset-0 bg-radial-gradient from-transparent to-[#050505] opacity-80" />
        </div>
    );

    return (
        <div className="min-h-screen text-gray-100 font-body overflow-x-hidden">
            <AmbientBackground />

            <DesktopSidebar
                user={user}
                currentTeam={currentTeam}
                onLogout={onLogout}
                onAddClick={onAddClick}
                onTeamClick={onTeamClick}
                renderNotifications={renderNotifications}
            />

            <div className="md:hidden sticky top-0 z-40 pt-[env(safe-area-inset-top)] border-b border-white/10 bg-[#0a0a0f]/80 backdrop-blur-2xl shadow-[0_1px_0_rgba(99,102,241,0.12)]">
                <div className="h-12 px-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="h-8 w-8 rounded-xl bg-indigo-600/80 border border-indigo-400/30 flex items-center justify-center shadow-[0_0_12px_rgba(99,102,241,0.35)]">
                            <Command className="w-4 h-4 text-white" />
                        </div>
                        <p className="text-sm font-heading font-bold tracking-tight text-white truncate">HackManager</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center">
                            {renderNotifications && renderNotifications({ align: 'mobile-header' })}
                        </div>
                        <button
                            onClick={onLogout}
                            className="min-h-[44px] min-w-[44px] rounded-xl border border-white/10 bg-white/5 flex items-center justify-center"
                            aria-label="Account menu"
                        >
                            {user?.photoURL ? (
                                <img src={user.photoURL} alt="Profile" className="w-7 h-7 rounded-full" />
                            ) : (
                                <span className="text-[11px] font-semibold text-white/90">
                                    {user?.displayName?.[0] || 'U'}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <MobileDock
                user={user}
                onLogout={onLogout}
                onAddClick={onAddClick}
                onTeamClick={onTeamClick}
                renderNotifications={renderNotifications}
            />

            <main className="md:pl-[100px] transition-all duration-300 min-h-screen">
                <div className="container mx-auto px-3 py-4 md:p-8 md:pt-8 pt-4 pb-24 md:pb-8">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
