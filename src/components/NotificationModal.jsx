import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Trash2, Bell, Clock, AlertTriangle, Info, Zap } from 'lucide-react';

/**
 * NotificationModal Component
 * 
 * A futuristic, centered "pop box" modal for notifications.
 * Designed to be displayed prominently in the web view.
 */
const NotificationModal = ({
    isOpen,
    onClose,
    notifications = [],
    deadlineAlerts = [],
    onMarkRead,
    onClearAll,
    onDelete,
    unreadCount,
    totalCount
}) => {
    const modalRef = useRef(null);

    // Handle outside click to close
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    // Format helper
    const getNotifStyle = (type) => {
        switch (type) {
            case 'success': return { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' };
            case 'urgent': return { icon: AlertTriangle, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' };
            case 'info': return { icon: Info, color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20' };
            default: return { icon: Zap, color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' };
        }
    };

    // Modal Variants
    const backdropVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
        exit: { opacity: 0 }
    };

    const modalVariants = {
        hidden: { scale: 0.9, opacity: 0, y: 20 },
        visible: {
            scale: 1,
            opacity: 1,
            y: 0,
            transition: { type: "spring", bounce: 0.4, duration: 0.6 }
        },
        exit: {
            scale: 0.95,
            opacity: 0,
            y: 10,
            transition: { duration: 0.2 }
        }
    };

    const listVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.05, delayChildren: 0.2 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0 }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        variants={backdropVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    />

                    {/* Modal Container */}
                    <motion.div
                        ref={modalRef}
                        className="relative w-full max-w-2xl bg-gray-900/90 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
                                    <Bell className="w-6 h-6 text-indigo-400" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                                        Notifications
                                        {unreadCount > 0 && (
                                            <span className="px-2 py-0.5 text-xs font-bold bg-indigo-500 text-white rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]">
                                                {unreadCount} New
                                            </span>
                                        )}
                                    </h2>
                                    <p className="text-sm text-gray-400">Stay updated with your hackathon progress</p>
                                </div>
                            </div>

                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Actions Bar */}
                        {(notifications.length > 0 || deadlineAlerts.length > 0) && (
                            <div className="flex items-center justify-between px-6 py-3 bg-indigo-900/10 border-b border-white/5">
                                <span className="text-xs font-mono text-indigo-300 uppercase tracking-wider">
                                    {totalCount} Total Alerts
                                </span>
                                <div className="flex gap-3">
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={onMarkRead}
                                            className="text-xs font-bold text-indigo-300 hover:text-indigo-200 flex items-center gap-1 transition-colors"
                                        >
                                            <CheckCircle size={14} /> Mark all read
                                        </button>
                                    )}
                                    <button
                                        onClick={onClearAll}
                                        className="text-xs font-bold text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
                                    >
                                        <Trash2 size={14} /> Clear list
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto p-6 min-h-[300px] custom-scrollbar">
                            {/* Empty State */}
                            {totalCount === 0 && (
                                <div className="flex flex-col items-center justify-center h-full py-12 text-center opacity-60">
                                    <div className="relative mb-6">
                                        <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full" />
                                        <Bell size={64} className="relative text-indigo-300" strokeWidth={1} />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">All Caught Up!</h3>
                                    <p className="text-gray-400 max-w-xs">You have no new notifications or alerts at this moment.</p>
                                </div>
                            )}

                            <motion.div variants={listVariants} initial="hidden" animate="visible" className="space-y-3">
                                {/* Deadline Alerts Section */}
                                {deadlineAlerts.map(alert => (
                                    <motion.div
                                        key={alert.id}
                                        variants={itemVariants}
                                        className="relative group p-4 bg-gradient-to-r from-red-500/10 to-transparent border-l-4 border-red-500 rounded-r-xl overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-red-500/5 group-hover:bg-red-500/10 transition-colors" />
                                        <div className="relative flex justify-between items-start">
                                            <div>
                                                <h4 className="font-bold text-red-200 text-sm flex items-center gap-2 mb-1">
                                                    <Clock size={16} className="animate-pulse" />
                                                    Urgent Deadline: {alert.title}
                                                </h4>
                                                <p className="text-xs text-red-300/80 font-mono">
                                                    Due in <span className="text-white font-bold">{alert.hoursLeft}h {alert.minutesLeft}m</span>
                                                </p>
                                            </div>
                                            <div className="px-2 py-1 bg-red-500/20 rounded text-xs font-bold text-red-400 uppercase tracking-widest border border-red-500/20">
                                                Urgent
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}

                                {/* General Notifications */}
                                {notifications.map((n) => {
                                    const { icon: Icon, color, bg, border } = getNotifStyle(n.type);
                                    return (
                                        <motion.div
                                            key={n.id}
                                            variants={itemVariants}
                                            layout
                                            className={`group relative p-4 rounded-xl border transition-all duration-200 ${!n.read
                                                    ? 'bg-white/5 border-white/10 hover:border-indigo-500/30'
                                                    : 'bg-transparent border-transparent hover:bg-white/5'
                                                }`}
                                        >
                                            <div className="flex gap-4">
                                                {/* Icon */}
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${bg} ${border} shadow-lg shadow-black/20`}>
                                                    <Icon size={24} className={color} />
                                                </div>

                                                {/* Text content */}
                                                <div className="flex-1 min-w-0 pt-1">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <p className={`text-sm leading-snug pr-8 ${!n.read ? 'text-white font-medium' : 'text-gray-400'}`}>
                                                            {n.message}
                                                        </p>

                                                        {/* Delete Action */}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onDelete(n.id);
                                                            }}
                                                            className="opacity-0 group-hover:opacity-100 absolute top-4 right-4 p-1.5 hover:bg-red-500/20 text-gray-500 hover:text-red-400 rounded-lg transition-all"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        {!n.read && (
                                                            <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                                                        )}
                                                        <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">
                                                            {n.createdAt?.toDate ? n.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just Now'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default NotificationModal;
