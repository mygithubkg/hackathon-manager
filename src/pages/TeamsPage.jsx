import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Key, ArrowRight, Shield, Globe, Cpu, LogOut, ArrowLeft, Copy, Check } from 'lucide-react';
import { useTeam } from '../contexts/TeamContext';
import { useNavigate } from 'react-router-dom';

/**
 * Modern, separate Teams Page as requested.
 * Uses a unique card-based layout with high-end visuals.
 */
const TeamsPage = () => {
    const { userTeams, currentTeam, switchTeam, createTeam, joinTeam } = useTeam();
    const navigate = useNavigate();
    const [mode, setMode] = useState('view'); // 'view' | 'create' | 'join'
    const [formData, setFormData] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [copiedId, setCopiedId] = useState(null);

    const handleTeamSelect = (teamId) => {
        switchTeam(teamId);
        navigate('/'); // Go to dashboard with new context
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await createTeam(formData);
            setMode('view');
            setFormData('');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await joinTeam(formData);
            setMode('view');
            setFormData('');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    }

    // --- Components ---

    const Background = () => (
        <div className="fixed inset-0 z-[-1] bg-[#030712] overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(79,70,229,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(79,70,229,0.1)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
            <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 8, repeat: Infinity }}
                className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px]"
            />
            <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 10, repeat: Infinity, delay: 1 }}
                className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px]"
            />
        </div>
    );

    const TeamCard = ({ team, isSolo = false }) => {
        const isActive = isSolo ? !currentTeam : currentTeam?.id === team.id;

        return (
            <motion.div
                layout
                whileHover={{ y: -5, scale: 1.02 }}
                onClick={() => handleTeamSelect(isSolo ? null : team.id)}
                className={`relative group cursor-pointer overflow-hidden rounded-2xl border transition-all duration-300 ${isActive
                        ? 'bg-indigo-900/20 border-indigo-500/50 shadow-[0_0_30px_rgba(79,70,229,0.3)]'
                        : 'bg-gray-900/40 border-white/10 hover:border-white/20 hover:bg-gray-900/60'
                    }`}
            >
                {/* Active Indicator Line */}
                {isActive && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />
                )}

                <div className="p-6 h-full flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-xl ${isSolo ? 'bg-blue-500/20 text-blue-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                            {isSolo ? <Shield size={24} /> : <Globe size={24} />}
                        </div>
                        {isActive && (
                            <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold uppercase tracking-wider rounded-full border border-green-500/20">
                                Active
                            </span>
                        )}
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">
                        {isSolo ? 'Solo Workspace' : team.name}
                    </h3>

                    <div className="mt-auto">
                        {!isSolo && (
                            <div className="flex items-center justify-between text-sm text-gray-400 mb-4 bg-black/20 p-2 rounded-lg">
                                <span className="font-mono">{team.inviteCode}</span>
                                <button
                                    onClick={(e) => { e.stopPropagation(); copyToClipboard(team.inviteCode, team.id); }}
                                    className="hover:text-white transition-colors"
                                >
                                    {copiedId === team.id ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                                </button>
                            </div>
                        )}

                        <div className="flex items-center text-sm text-gray-500 gap-4">
                            {!isSolo && (
                                <span className="flex items-center gap-1">
                                    <Users size={14} /> {team.members?.length || 1}
                                </span>
                            )}
                            <span className="ml-auto text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 font-medium">
                                Enter <ArrowRight size={14} />
                            </span>
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    };

    const ActionCard = ({ title, icon: Icon, onClick, colorClass }) => (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`w-full h-full min-h-[200px] flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-gray-700 hover:border-gray-500 bg-gray-900/20 hover:bg-gray-900/40 transition-all group ${colorClass}`}
        >
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Icon size={32} className="opacity-70 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-lg font-medium text-gray-400 group-hover:text-white transition-colors">
                {title}
            </span>
        </motion.button>
    );

    return (
        <div className="min-h-screen text-white font-sans selection:bg-indigo-500/30">
            <Background />

            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 px-8 py-6 flex items-center justify-between bg-gradient-to-b from-[#030712] to-transparent">
                <div onClick={() => navigate('/')} className="flex items-center gap-3 cursor-pointer group">
                    <div className="p-2 bg-white/5 rounded-lg group-hover:bg-white/10 transition-colors border border-white/10">
                        <ArrowLeft size={20} className="text-gray-400 group-hover:text-white" />
                    </div>
                    <span className="text-gray-400 group-hover:text-white font-medium transition-colors">Back to Dashboard</span>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-right hidden md:block">
                        <p className="text-xs text-gray-500 uppercase tracking-widest">Signed in as</p>
                        <p className="font-medium text-indigo-400">User</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20" />
                </div>
            </header>

            <main className="container mx-auto px-6 py-32 max-w-7xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12 text-center"
                >
                    <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-500 mb-6 tracking-tight">
                        Command Center
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Select an operational context or establish a new command unit.
                    </p>
                </motion.div>

                <AnimatePresence mode="wait">
                    {mode === 'view' && (
                        <motion.div
                            key="view"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                            {/* Solo Workspace */}
                            <TeamCard isSolo />

                            {/* User Teams */}
                            {userTeams.map(team => (
                                <TeamCard key={team.id} team={team} />
                            ))}

                            {/* Actions */}
                            <ActionCard
                                title="Initialize New Squad"
                                icon={Plus}
                                onClick={() => setMode('create')}
                                colorClass="hover:border-indigo-500/50 hover:text-indigo-400"
                            />
                            <ActionCard
                                title="Join Existing Unit"
                                icon={Key}
                                onClick={() => setMode('join')}
                                colorClass="hover:border-purple-500/50 hover:text-purple-400"
                            />
                        </motion.div>
                    )}

                    {(mode === 'create' || mode === 'join') && (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="max-w-md mx-auto bg-gray-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl"
                        >
                            <div className="flex items-center gap-4 mb-8">
                                <div className={`p-4 rounded-2xl ${mode === 'create' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-purple-500/20 text-purple-400'}`}>
                                    {mode === 'create' ? <Cpu size={32} /> : <Key size={32} />}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">
                                        {mode === 'create' ? 'Initialize Squad' : 'Access Unit'}
                                    </h2>
                                    <p className="text-sm text-gray-400">
                                        {mode === 'create' ? 'Establish a new command channel' : 'Enter security clearance code'}
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={mode === 'create' ? handleCreate : handleJoin} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        {mode === 'create' ? 'Squad Designation' : 'Access Code'}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData}
                                        onChange={(e) => setFormData(mode === 'join' ? e.target.value.toUpperCase() : e.target.value)}
                                        placeholder={mode === 'create' ? 'e.g. Cyber Punk Unit' : 'e.g. A1B2C3'}
                                        className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                                        autoFocus
                                        required
                                        maxLength={mode === 'join' ? 6 : 50}
                                    />
                                </div>

                                {error && (
                                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                                        {error}
                                    </div>
                                )}

                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => { setMode('view'); setError(null); }}
                                        className="flex-1 py-4 rounded-xl font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!formData || loading}
                                        className={`flex-1 py-4 rounded-xl font-bold text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98] ${mode === 'create'
                                                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 shadow-indigo-500/25 copy-create-btn'
                                                : 'bg-gradient-to-r from-purple-600 to-pink-600 shadow-purple-500/25 copy-join-btn'
                                            }`}
                                    >
                                        {loading ? <span className="animate-pulse">Processing...</span> : (mode === 'create' ? 'Launch' : 'Authenticate')}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

export default TeamsPage;
