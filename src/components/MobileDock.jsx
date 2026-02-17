import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutGrid,
    Users,
    Plus,
    LogOut
} from 'lucide-react';

const MobileNavItem = ({ icon: Icon, label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`flex flex-col items-center justify-center w-12 gap-1 ${active ? 'text-indigo-400' : 'text-gray-400'}`}
    >
        <Icon size={20} strokeWidth={2.5} />
        <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    </button>
);

const MobileProfileItem = ({ user, onLogout }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex flex-col items-center justify-center w-12 gap-1"
            >
                <div className="w-6 h-6 rounded-full overflow-hidden border border-gray-600">
                    {user?.photoURL ? (
                        <img src={user.photoURL} alt="Profile" />
                    ) : (
                        <div className="w-full h-full bg-gray-700" />
                    )}
                </div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Me</span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 10 }}
                            className="absolute bottom-full right-0 mb-4 w-48 bg-gray-900 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
                        >
                            <div className="p-3 border-b border-white/5">
                                <p className="text-sm font-bold text-white truncate">{user?.displayName}</p>
                                <p className="text-xs text-gray-500">Online</p>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onLogout();
                                }}
                                className="w-full text-left p-3 text-red-400 hover:bg-white/5 text-sm font-medium flex items-center gap-2"
                            >
                                <LogOut size={16} /> Sign Out
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

const MobileDock = ({
    user,
    onLogout,
    onAddClick,
    onTeamClick,
    renderNotifications
}) => {
    return (
        <div className="md:hidden fixed bottom-6 left-4 right-4 z-50">
            <div className="glass-panel backdrop-blur-2xl bg-gray-900/80 border border-white/10 rounded-2xl shadow-2xl flex items-center justify-between p-2 px-6 relative">
                {/* Navigation Items */}
                <MobileNavItem icon={LayoutGrid} label="Home" active />
                <MobileNavItem icon={Users} label="Teams" onClick={onTeamClick} />

                {/* Floating Add Button (Center) */}
                <div className="relative -top-8">
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={onAddClick}
                        className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 border-4 border-[#050505] shadow-lg shadow-indigo-500/40 flex items-center justify-center text-white"
                    >
                        <Plus size={28} />
                    </motion.button>
                </div>

                {/* Right Side Items */}
                <div className="flex flex-col items-center justify-center w-10">
                    {renderNotifications && renderNotifications({ align: 'dock' })}
                    <span className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider font-bold">Alerts</span>
                </div>

                <MobileProfileItem user={user} onLogout={onLogout} />
            </div>
        </div>
    );
};

export default MobileDock;
