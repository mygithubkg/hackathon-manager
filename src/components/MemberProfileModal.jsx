import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, X, UserCircle, Briefcase, ExternalLink, LinkIcon, Loader2 } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const MemberProfileModal = ({ isOpen, onClose, uid, teamId, teamMembers = [], teamAdmins = [] }) => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            setError(null);
            try {
                const docRef = doc(db, 'userProfiles', uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists() && docSnap.data().publicProfile) {
                    setProfile(docSnap.data().publicProfile);
                } else {
                    // Fallback to basic info if they haven't set up a profile yet
                    const basic = teamMembers.find(m => m.uid === uid);
                    setProfile({
                        displayName: basic?.displayName || basic?.email || 'Unknown User',
                        bio: 'No bio provided.',
                        skills: [],
                        portfolioLinks: []
                    });
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (isOpen && uid) {
            fetchProfile();
        } else {
            setProfile(null);
        }
    }, [isOpen, uid, teamMembers]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const isAdmin = teamAdmins.includes(uid);
    const displayInitial = profile?.displayName?.charAt(0)?.toUpperCase() || 'U';
    const avatar = profile?.avatarURL;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-[#030712]/80 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-lg bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden z-10"
                >
                    {/* Header Cover */}
                    <div className="h-32 bg-gradient-to-r from-indigo-600 to-purple-600 relative overflow-hidden">
                        <div className="absolute inset-0 bg-black/20" />
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] opacity-20" />
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors backdrop-blur-md"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="px-8 pb-8">
                        {/* Avatar Box */}
                        <div className="relative -mt-16 mb-4 flex justify-between items-end">
                            <div className="w-32 h-32 rounded-2xl bg-gray-800 border-4 border-gray-900 shadow-xl overflow-hidden flex items-center justify-center text-4xl font-bold bg-gradient-to-br from-gray-800 to-gray-900 text-white relative z-10">
                                {avatar ? (
                                    <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    displayInitial
                                )}
                            </div>
                            {isAdmin && (
                                <div className="mb-2 px-4 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full text-sm font-bold tracking-wide flex items-center gap-1.5 shadow-lg shadow-amber-500/10">
                                    <Shield size={16} /> Admin
                                </div>
                            )}
                        </div>

                        {loading ? (
                            <div className="py-12 flex justify-center">
                                <Loader2 className="animate-spin text-indigo-500" size={32} />
                            </div>
                        ) : error ? (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
                                Error loading profile: {error}
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-3xl font-bold text-white mb-1 tracking-tight">
                                        {profile?.displayName}
                                    </h2>
                                </div>

                                {profile?.bio && (
                                    <div className="p-4 bg-white/5 border border-white/5 rounded-2xl">
                                        <p className="text-gray-300 leading-relaxed text-sm">
                                            {profile.bio}
                                        </p>
                                    </div>
                                )}

                                {profile?.skills?.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Skills & Expertise</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {profile.skills.map((skill, i) => (
                                                <span key={i} className="px-3 py-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-full text-sm font-medium">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {profile?.portfolioLinks?.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Links & Portfolio</h3>
                                        <div className="space-y-2">
                                            {profile.portfolioLinks.map((link, i) => (
                                                <a
                                                    key={i}
                                                    href={link.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="group flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-black/20 flex items-center justify-center text-gray-400 group-hover:text-indigo-400 transition-colors">
                                                            <Briefcase size={16} />
                                                        </div>
                                                        <span className="text-gray-200 font-medium group-hover:text-white transition-colors">{link.label}</span>
                                                    </div>
                                                    <ExternalLink size={16} className="text-gray-500 group-hover:text-indigo-400 transition-colors" />
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default MemberProfileModal;
