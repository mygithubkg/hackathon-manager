import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Loader2 } from 'lucide-react';

const DeleteTeamModal = ({ isOpen, onClose, onConfirm, teamName, isLoading, error }) => {
    const [inputValue, setInputValue] = useState('');

    useEffect(() => {
        if (isOpen) setInputValue('');
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#030712]/80 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-black/80 backdrop-blur-xl border border-red-500/40 rounded-3xl p-8 shadow-2xl shadow-red-500/10 max-w-md w-full mx-4"
                >
                    <div className="flex flex-col items-center text-center relative">
                        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
                            <AlertTriangle className="text-red-500" size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-red-500 mb-2">Delete Team</h2>
                        <p className="text-gray-400 text-sm mb-6">
                            This will permanently delete <strong className="text-white">{teamName}</strong> and all its projects. This cannot be undone.
                        </p>

                        {error && (
                            <div className="w-full bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-500 text-sm mb-4">
                                {error}
                            </div>
                        )}

                        <div className="w-full mb-6">
                            <input
                                type="text"
                                placeholder="Type submit to confirm"
                                value={inputValue}
                                onChange={e => setInputValue(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 transition-colors"
                            />
                        </div>

                        <div className="flex w-full gap-4">
                            <button
                                onClick={onClose}
                                className="flex-1 py-3 px-4 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors font-medium border border-transparent"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onConfirm}
                                disabled={inputValue.trim().toLowerCase() !== 'submit' || isLoading}
                                className="flex-1 py-3 px-4 rounded-xl bg-red-500 hover:bg-red-600 active:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold transition-all flex justify-center items-center"
                            >
                                {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Delete Team'}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default DeleteTeamModal;
