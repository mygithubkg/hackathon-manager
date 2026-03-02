import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    CheckSquare,
    Clipboard,
    Grid2x2,
    Users,
    BookOpen,
    Bell,
    ChevronRight
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const iconButtonClass = 'relative h-11 w-11 min-h-[44px] min-w-[44px] rounded-2xl flex items-center justify-center transition-colors';

const DockIcon = ({ icon: Icon, active, onClick }) => (
    <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={onClick}
        className={`${iconButtonClass} ${active ? 'text-indigo-300' : 'text-white/35 hover:text-white/60'}`}
        aria-label="Navigation action"
    >
        <motion.div
            animate={active ? { scale: [1, 1.2, 1] } : { scale: 1 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
        >
            <Icon size={22} strokeWidth={2.2} />
        </motion.div>
        <AnimatePresence>
            {active && (
                <motion.span
                    initial={{ opacity: 0, y: -2 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -2 }}
                    className="absolute -bottom-0.5 h-[3px] w-[3px] rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.95)]"
                />
            )}
        </AnimatePresence>
    </motion.button>
);

const MoreRow = ({ icon: Icon, label, description, onClick }) => (
    <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={onClick}
        className="w-full min-h-[56px] px-4 py-3 rounded-2xl bg-white/[0.02] border border-white/10 text-left flex items-center gap-3"
    >
        <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-indigo-300">
            <Icon size={18} />
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{label}</p>
            <p className="text-[11px] text-white/50 truncate">{description}</p>
        </div>
        <ChevronRight size={16} className="text-white/30" />
    </motion.button>
);

const MobileDock = ({ onTeamClick, renderNotifications }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [moreOpen, setMoreOpen] = useState(false);

    const notificationsNode = useMemo(
        () => (renderNotifications ? renderNotifications({ align: 'mobile-sheet' }) : null),
        [renderNotifications]
    );

    const isHome = location.pathname === '/';
    const isTodo = location.pathname === '/todo';
    const isSnippets = location.pathname === '/snippets';
    const isMore = ['/teams', '/resources'].includes(location.pathname);

    return (
        <>
            <div className="md:hidden fixed bottom-0 inset-x-0 z-50 pb-[env(safe-area-inset-bottom)] border-t border-white/5 bg-[#0a0a0f]/90 backdrop-blur-xl shadow-[0_-1px_0_rgba(99,102,241,0.15)]">
                <div className="h-16 px-4 flex items-center justify-around">
                    <DockIcon icon={LayoutDashboard} active={isHome} onClick={() => navigate('/')} />
                    <DockIcon icon={CheckSquare} active={isTodo} onClick={() => navigate('/todo')} />
                    <DockIcon icon={Clipboard} active={isSnippets} onClick={() => navigate('/snippets')} />
                    <DockIcon icon={Grid2x2} active={isMore || moreOpen} onClick={() => setMoreOpen(true)} />
                </div>
            </div>

            <AnimatePresence>
                {moreOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="md:hidden fixed inset-0 z-[60] bg-black/60 backdrop-blur-md"
                            onClick={() => setMoreOpen(false)}
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
                            className="md:hidden fixed inset-x-0 bottom-0 z-[70] rounded-t-3xl border-t border-white/10 bg-[#0c0c12]/95 backdrop-blur-2xl p-4 pb-[calc(env(safe-area-inset-bottom)+16px)]"
                        >
                            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/20" />
                            <div className="space-y-2">
                                <MoreRow
                                    icon={Users}
                                    label="Teams"
                                    description="Switch and manage team workspaces"
                                    onClick={() => {
                                        setMoreOpen(false);
                                        if (onTeamClick) {
                                            onTeamClick();
                                        } else {
                                            navigate('/teams');
                                        }
                                    }}
                                />
                                <MoreRow
                                    icon={BookOpen}
                                    label="Resources"
                                    description="Browse links, docs, and project assets"
                                    onClick={() => {
                                        setMoreOpen(false);
                                        navigate('/resources');
                                    }}
                                />

                                <div className="w-full min-h-[56px] px-4 py-3 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-indigo-300">
                                        <Bell size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-white truncate">Notifications</p>
                                        <p className="text-[11px] text-white/50 truncate">Open your inbox and alerts</p>
                                    </div>
                                    <div className="min-h-[44px] min-w-[44px] flex items-center justify-end">
                                        {notificationsNode}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

export default MobileDock;
