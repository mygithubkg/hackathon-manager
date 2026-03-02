import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutGrid,
    Users,
    CheckSquare,
    BookOpen,
    Plus,
    LogOut,
    Command
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const NavItem = ({ icon: Icon, label, active, onClick, badge, collapsed }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center p-3 rounded-xl transition-all group relative min-h-[52px] ${active ? 'bg-indigo-600/10 text-indigo-400' : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
    >
        <div className="w-[24px] flex justify-center shrink-0">
            <Icon size={22} strokeWidth={2} />
        </div>
        <AnimatePresence>
            {!collapsed && (
                <motion.span
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -5 }}
                    className="ml-3 font-medium whitespace-nowrap overflow-hidden"
                >
                    {label}
                </motion.span>
            )}
        </AnimatePresence>
        {active && (
            <motion.div
                layoutId="activeNavIndicator"
                className="absolute left-0 w-1 h-6 bg-indigo-500 rounded-r-full"
            />
        )}
        {badge && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
        )}
    </button>
);

const DesktopSidebar = ({
    user,
    currentTeam,
    onLogout,
    onAddClick,
    onTeamClick,
    renderNotifications
}) => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    const handleTeamsClick = () => {
        if (onTeamClick) {
            onTeamClick();
            return;
        }
        navigate('/teams');
    };

    return (
        <motion.aside
            className="hidden md:flex flex-col fixed left-4 top-4 bottom-4 z-40 bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            initial={{ width: 80 }}
            animate={{ width: isSidebarCollapsed ? 80 : 260 }} // Slightly wider for better text fit
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onMouseEnter={() => setIsSidebarCollapsed(false)}
            onMouseLeave={() => setIsSidebarCollapsed(true)}
        >
            {/* Logo Area */}
            <div className="h-20 flex items-center px-5 border-b border-white/5 relative overflow-hidden shrink-0">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0 z-10">
                    <Command className="text-white w-6 h-6" />
                </div>
                <AnimatePresence>
                    {!isSidebarCollapsed && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="ml-4 whitespace-nowrap overflow-hidden"
                        >
                            <h1 className="font-heading font-bold text-lg text-white tracking-tight">Hack<span className="text-indigo-400">Manager</span></h1>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 py-6 flex flex-col gap-2 px-3 overflow-y-auto no-scrollbar">
                <NavItem
                    icon={LayoutGrid}
                    label="Dashboard"
                    active={location.pathname === '/'}
                    onClick={() => navigate('/')}
                    collapsed={isSidebarCollapsed}
                />
                <NavItem
                    icon={Users}
                    label="Teams"
                    active={location.pathname === '/teams'}
                    onClick={handleTeamsClick}
                    badge={currentTeam ? 'Active' : ''}
                    collapsed={isSidebarCollapsed}
                />
                <NavItem
                    icon={CheckSquare}
                    label="Todo"
                    active={location.pathname === '/todo'}
                    onClick={() => navigate('/todo')}
                    collapsed={isSidebarCollapsed}
                />
                <NavItem
                    icon={BookOpen}
                    label="Resources"
                    active={location.pathname === '/resources'}
                    onClick={() => navigate('/resources')}
                    collapsed={isSidebarCollapsed}
                />

                {/* Notification Component Wrapper */}
                <div className="relative group flex items-center p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer min-h-[52px]">
                    <div className="w-[24px] flex justify-center shrink-0">
                        {renderNotifications && renderNotifications({ align: 'sidebar' })}
                    </div>
                    <AnimatePresence>
                        {!isSidebarCollapsed && (
                            <motion.span
                                initial={{ opacity: 0, x: -5 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -5 }}
                                className="ml-3 font-medium text-gray-300 whitespace-nowrap overflow-hidden"
                            >
                                Notifications
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>
            </nav>

            {/* Add Button (Floating Action Style) */}
            <div className="p-3 shrink-0">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onAddClick}
                    className={`w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl shadow-lg shadow-indigo-500/25 flex items-center transition-all overflow-hidden ${isSidebarCollapsed ? 'p-3 justify-center aspect-square' : 'py-3 px-4 justify-start'
                        }`}
                >
                    <div className="shrink-0">
                        <Plus className="w-6 h-6" />
                    </div>

                    <AnimatePresence>
                        {!isSidebarCollapsed && (
                            <motion.span
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 'auto' }}
                                exit={{ opacity: 0, width: 0 }}
                                className="ml-3 font-bold font-heading whitespace-nowrap"
                            >
                                New Project
                            </motion.span>
                        )}
                    </AnimatePresence>
                </motion.button>
            </div>

            {/* User Profile Section */}
            <div className="p-3 mt-auto border-t border-white/5 shrink-0">
                <div className="flex items-center p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group overflow-hidden min-h-[56px]">
                    <div className="relative shrink-0">
                        {user?.photoURL ? (
                            <img src={user.photoURL} alt="User" className="w-10 h-10 rounded-full border border-gray-600" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center border border-gray-600">
                                <span className="text-sm font-bold">{user?.displayName?.[0] || 'U'}</span>
                            </div>
                        )}
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-gray-900 rounded-full"></div>
                    </div>

                    <AnimatePresence>
                        {!isSidebarCollapsed && (
                            <motion.div
                                initial={{ opacity: 0, x: -5 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -5 }}
                                className="flex-1 ml-3 min-w-0"
                            >
                                <p className="text-sm font-bold text-white truncate">{user?.displayName}</p>
                                <p className="text-xs text-gray-500 truncate">{currentTeam ? currentTeam.name : 'Solo Workspace'}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {!isSidebarCollapsed && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                whileHover={{ scale: 1.1, color: '#ef4444' }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onLogout();
                                }}
                                className="text-gray-500 p-2 ml-1 shrink-0"
                            >
                                <LogOut size={18} />
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.aside>
    );
};

export default DesktopSidebar;
