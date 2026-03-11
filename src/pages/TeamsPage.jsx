import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Plus, Key, ArrowRight, Shield, Globe, Cpu,
    ArrowLeft, Copy, Check, Pencil, X, Trash2,
    Loader2, User, Crown, ChevronDown, ChevronUp, Clock, CheckCircle, XCircle
} from 'lucide-react';
import { useTeam } from '../contexts/TeamContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import DeleteTeamModal from '../components/DeleteTeamModal';
import MemberProfileModal from '../components/MemberProfileModal';
import { getRelativeTime } from '../utils/relativeTime';

const MAX_AUTO_APPROVE_HOURS = 48; // Aligning with Cloud Function

const TeamsPage = () => {
    const {
        userTeams, currentTeam, switchTeam, createTeam, joinTeam, deleteTeam,
        updateTeamName, isAdmin, promotesToAdmin, promoteToAdmin,
        approveJoinRequest, rejectJoinRequest, pendingMembers, pendingCount, fetchMemberProfiles
    } = useTeam();

    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [mode, setMode] = useState('view');
    const [formData, setFormData] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [copiedId, setCopiedId] = useState(null);

    // Modals & Edits
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [teamToDelete, setTeamToDelete] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const [editingTeamId, setEditingTeamId] = useState(null);
    const [editNameValue, setEditNameValue] = useState('');
    const [editLoading, setEditLoading] = useState(false);

    // expanded list of profiles
    const [expandedTeamId, setExpandedTeamId] = useState(null);
    const [teamProfiles, setTeamProfiles] = useState({});

    // Member Profile Modal
    const [profileModalOpen, setProfileModalOpen] = useState(false);
    const [profileModalUid, setProfileModalUid] = useState(null);

    const [toastMessage, setToastMessage] = useState(null);

    // Process actions
    const [actionLoading, setActionLoading] = useState({});

    useEffect(() => {
        if (toastMessage) {
            const timer = setTimeout(() => setToastMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toastMessage]);

    useEffect(() => {
        // Fetch profiles when a team is expanded
        if (expandedTeamId) {
            fetchMemberProfiles(expandedTeamId).then(profiles => {
                setTeamProfiles(prev => ({ ...prev, [expandedTeamId]: profiles }));
            });
        }
    }, [expandedTeamId, fetchMemberProfiles]);

    const handleTeamSelect = (teamId) => {
        switchTeam(teamId);
        navigate('/');
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setLoading(true); setError(null);
        try {
            await createTeam(formData);
            setMode('view'); setFormData('');
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    };

    const handleJoin = async (e) => {
        e.preventDefault();
        setLoading(true); setError(null);
        try {
            await joinTeam(formData);
            setMode('view'); setFormData('');
            setToastMessage("Join request sent to admins.");
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    };

    const copyToClipboard = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    }

    const handleDeleteClick = (e, team) => {
        e.stopPropagation();
        setTeamToDelete({ id: team.id, name: team.name });
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        setDeleteLoading(true);
        try {
            await deleteTeam(teamToDelete.id);
            setToastMessage(`Team ${teamToDelete.name} deleted successfully`);
            setDeleteModalOpen(false); setTeamToDelete(null);
        } catch (err) { alert(err.message); }
        finally { setDeleteLoading(false); }
    };

    const handleEditStart = (e, team) => {
        e.stopPropagation();
        setEditingTeamId(team.id);
        setEditNameValue(team.name);
    };

    const handleEditSave = async (teamId) => {
        setEditLoading(true);
        try {
            await updateTeamName(teamId, editNameValue);
            setEditingTeamId(null);
        } catch (err) { alert(err.message); }
        finally { setEditLoading(false); }
    };

    const handleAction = async (actionFn, uid, actionName, explicitTeamId = null) => {
        setActionLoading(prev => ({ ...prev, [uid]: actionName }));
        try {
            const targetTeamId = explicitTeamId || currentTeam?.id;
            if (!targetTeamId) throw new Error("No active team selected for this action.");
            await actionFn(targetTeamId, uid);
        } catch (err) {
            alert(err.message);
        } finally {
            setActionLoading(prev => ({ ...prev, [uid]: null }));
        }
    };

    const Background = () => (
        <div className="fixed inset-0 z-[-1] bg-[#030712] overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(79,70,229,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(79,70,229,0.1)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
            <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 8, repeat: Infinity }} className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px]" />
            <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 10, repeat: Infinity, delay: 1 }} className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px]" />
        </div>
    );

    const TeamCard = ({ team, isSolo = false }) => {
        const isActive = isSolo ? !currentTeam : currentTeam?.id === team?.id;
        const isTeamAdmin = !isSolo && team?.admins?.includes?.(currentUser?.uid);
        const thisTeamPendingCount = isSolo ? 0 : (team?.pendingMembers?.length || 0);
        const isExpanded = expandedTeamId === team?.id;

        return (
            <motion.div layout className={`relative flex flex-col group overflow-hidden rounded-2xl border transition-all duration-300 ${isActive ? 'bg-indigo-900/20 shadow-[0_0_30px_rgba(79,70,229,0.3)] border-indigo-500/50' : 'bg-gray-900/60 border-white/10'}`}>
                {isActive && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />}

                <div className="p-6 cursor-pointer" onClick={(e) => { if (editingTeamId !== team?.id && !isExpanded) handleTeamSelect(isSolo ? null : team?.id) }}>
                    <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-xl ${isSolo ? 'bg-blue-500/20 text-blue-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                            {isSolo ? <Shield size={24} /> : <Globe size={24} />}
                        </div>
                        <div className="flex gap-2">
                            {thisTeamPendingCount > 0 && isTeamAdmin && (
                                <span className="px-3 py-1 bg-amber-500/20 text-amber-500 text-xs font-bold uppercase tracking-wider rounded-full border border-amber-500/20">
                                    {thisTeamPendingCount} Pending
                                </span>
                            )}
                            {isTeamAdmin && (
                                <span className="flex items-center gap-1 px-3 py-1 bg-amber-500/10 text-amber-400 text-xs font-bold uppercase tracking-wider rounded-full border border-amber-500/20">
                                    <Crown size={12} /> Admin
                                </span>
                            )}
                            {isActive && (
                                <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold uppercase tracking-wider rounded-full border border-green-500/20">
                                    Active
                                </span>
                            )}
                            {isTeamAdmin && (
                                <button onClick={(e) => handleDeleteClick(e, team)} className="p-1 px-2.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-full transition-colors border border-red-500/20 ml-2">
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                    </div>

                    {!isSolo && team && editingTeamId === team.id ? (
                        <div className="mb-2" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center gap-2">
                                <input value={editNameValue} onChange={e => setEditNameValue(e.target.value)} autoFocus onKeyDown={e => { if (e.key === 'Enter') handleEditSave(team.id); if (e.key === 'Escape') handleEditCancel(); }} className="flex-1 bg-white/10 border border-indigo-500/50 rounded px-2 py-1 text-white text-xl font-bold focus:outline-none" />
                                {editLoading ? <Loader2 size={20} className="animate-spin text-indigo-400" /> : (
                                    <>
                                        <button onClick={() => handleEditSave(team.id)} className="text-green-400 hover:bg-green-400/20 p-1 rounded"><Check size={20} /></button>
                                        <button onClick={() => setEditingTeamId(null)} className="text-red-400 hover:bg-red-400/20 p-1 rounded"><X size={20} /></button>
                                    </>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 mb-2 group/title" onClick={(e) => { e.stopPropagation(); if (editingTeamId !== team?.id) handleTeamSelect(isSolo ? null : team?.id) }}>
                            <h3 className="text-xl font-bold text-white group-hover/title:text-indigo-400 transition-colors">
                                {isSolo ? 'Solo Workspace' : team?.name}
                            </h3>
                            {!isSolo && team && (
                                <button onClick={(e) => handleEditStart(e, team)} className="opacity-0 group-hover/title:opacity-100 text-gray-400 hover:text-white p-1 rounded transition-opacity"><Pencil size={14} /></button>
                            )}
                        </div>
                    )}

                    <div className="mt-4">
                        <div className="flex items-center justify-between text-sm">
                            {!isSolo && team && (
                                <span className="flex items-center gap-1 text-gray-400">
                                    <Users size={14} /> {team.members?.length || 1} members
                                </span>
                            )}
                            {!isSolo && team && (
                                <button
                                    onClick={e => { e.stopPropagation(); setExpandedTeamId(isExpanded ? null : team.id); }}
                                    className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-500/10 px-3 py-1.5 rounded-lg ml-auto"
                                >
                                    {isExpanded ? <><ChevronUp size={16} /> Hide</> : <><ChevronDown size={16} /> View Members</>}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Collapsible Member List & Pending Requests */}
                <AnimatePresence>
                    {isExpanded && !isSolo && team && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-black/30 border-t border-white/5 overflow-hidden"
                        >
                            <div className="p-4 space-y-4">

                                <div className="space-y-2">
                                    {teamProfiles[team.id]?.map((m, idx) => {
                                        const isMemberAdmin = team.admins?.includes(m.uid);
                                        return (
                                            <motion.div key={m.uid} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="flex flex-wrap items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden">
                                                        {m.publicProfile.avatarURL ? <img src={m.publicProfile.avatarURL} className="w-full h-full object-cover" /> : m.publicProfile.displayName.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium text-white flex items-center gap-2">
                                                            {m.publicProfile.displayName}
                                                            {isMemberAdmin && <Crown size={14} className="text-amber-400" />}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 ml-auto">
                                                    <button onClick={() => { setProfileModalUid(m.uid); setProfileModalOpen(true); }} className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors">
                                                        View Profile
                                                    </button>
                                                    {isTeamAdmin && !isMemberAdmin && (
                                                        <button onClick={() => handleAction(promoteToAdmin, m.uid, 'promote', team.id)} disabled={actionLoading[m.uid] === 'promote'} className="text-xs border border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50">
                                                            {actionLoading[m.uid] === 'promote' ? <Loader2 size={12} className="animate-spin" /> : 'Make Admin'}
                                                        </button>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )
                                    })}
                                </div>

                                {isTeamAdmin && thisTeamPendingCount > 0 && (
                                    <div className="pt-4 mt-4 border-t border-white/10 border-dashed">
                                        <h4 className="text-sm font-bold text-amber-400 mb-3 flex items-center gap-2">
                                            <Shield size={16} /> Pending Requests ({thisTeamPendingCount})
                                        </h4>
                                        <div className="space-y-2">
                                            <AnimatePresence>
                                                {team.pendingMembers.map((p, idx) => {
                                                    const autoApproveTime = p.autoApproveAt?.toDate?.() || new Date(p.requestedAt?.toDate?.()?.getTime() + MAX_AUTO_APPROVE_HOURS * 60 * 60 * 1000);
                                                    const hoursLeft = Math.max(0, Math.round((autoApproveTime - new Date()) / (1000 * 60 * 60)));

                                                    return (
                                                        <motion.div key={p.uid} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9, x: -20 }} className="flex flex-wrap items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 gap-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold text-sm">
                                                                    {p.displayName?.charAt(0) || p.email?.charAt(0) || '?'}
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm font-medium text-white">{p.displayName || p.email}</span>
                                                                    <span className="text-[10px] text-amber-500/70 flex items-center gap-1">
                                                                        <Clock size={10} /> Requested {getRelativeTime(p.requestedAt)} • Auto-approves in ~{hoursLeft}h
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2 ml-auto">
                                                                <button onClick={() => handleAction(approveJoinRequest, p.uid, 'approve', team.id)} disabled={actionLoading[p.uid]} className="p-2 border border-green-500/30 text-green-400 bg-green-500/10 hover:bg-green-500/20 rounded-lg transition-colors flex items-center gap-1">
                                                                    {actionLoading[p.uid] === 'approve' ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                                                                </button>
                                                                <button onClick={() => handleAction(rejectJoinRequest, p.uid, 'reject', team.id)} disabled={actionLoading[p.uid]} className="p-2 border border-red-500/30 text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors flex items-center gap-1">
                                                                    {actionLoading[p.uid] === 'reject' ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                                                                </button>
                                                            </div>
                                                        </motion.div>
                                                    )
                                                })}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {!isSolo && isTeamAdmin && (
                                <div className="px-4 py-3 bg-black/40 border-t border-white/5 flex items-center justify-between text-xs text-gray-500">
                                    <span>Team Invite Code:</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono bg-white/5 px-2 py-1 rounded">{team.inviteCode}</span>
                                        <button onClick={(e) => { e.stopPropagation(); copyToClipboard(team.inviteCode, team.id); }} className="hover:text-white">
                                            {copiedId === team.id ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

            </motion.div>
        );
    };

    const ActionCard = ({ title, icon: Icon, onClick, colorClass }) => (
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onClick} className={`w-full min-h-[200px] flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-gray-700 hover:border-gray-500 bg-gray-900/20 hover:bg-gray-900/40 transition-all group ${colorClass}`}>
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform"><Icon size={32} className="opacity-70 group-hover:opacity-100" /></div>
            <span className="text-lg font-medium text-gray-400 group-hover:text-white transition-colors">{title}</span>
        </motion.button>
    );

    return (
        <div className="min-h-[100vh] text-white font-sans selection:bg-indigo-500/30 overflow-y-auto">
            <Background />

            {toastMessage && (
                <div className="fixed bottom-6 right-6 z-50 bg-green-500/10 backdrop-blur-md text-white px-6 py-3 rounded-xl shadow-[0_4px_30px_rgba(0,0,0,0.5)] font-medium border border-green-500/30 flex items-center gap-3">
                    <div className="p-1 rounded-full bg-green-500/20 text-green-400"><Check size={16} /></div>
                    {toastMessage}
                </div>
            )}

            <DeleteTeamModal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} onConfirm={confirmDelete} teamName={teamToDelete?.name} isLoading={deleteLoading} />
            <MemberProfileModal isOpen={profileModalOpen} onClose={() => setProfileModalOpen(false)} uid={profileModalUid} teamId={currentTeam?.id} teamMembers={expandedTeamId ? teamProfiles[expandedTeamId] : []} teamAdmins={currentTeam?.admins || []} />

            <header className="fixed top-0 left-0 right-0 z-40 px-8 py-6 flex items-center justify-between bg-gradient-to-b from-[#030712] to-transparent pointer-events-none">
                <div onClick={() => navigate('/')} className="flex items-center gap-3 cursor-pointer group pointer-events-auto">
                    <div className="p-2 bg-white/5 rounded-lg group-hover:bg-white/10 transition-colors border border-white/10"><ArrowLeft size={20} className="text-gray-400 group-hover:text-white" /></div>
                    <span className="text-gray-400 group-hover:text-white font-medium transition-colors hidden md:block">Back to Dashboard</span>
                </div>
            </header>

            <main className="container mx-auto px-4 py-32 max-w-7xl relative z-10 w-[95vw] md:w-full">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 text-center">
                    <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-100 to-indigo-300 mb-6 tracking-tight drop-shadow-lg">
                        Command Center
                    </h1>
                    <p className="text-xl text-indigo-200/60 max-w-2xl mx-auto">
                        Manage your teams, access levels, and organizational hierarchy.
                    </p>
                </motion.div>

                <AnimatePresence mode="wait">
                    {mode === 'view' && (
                        <motion.div key="view" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <TeamCard isSolo />
                            {userTeams.map(team => <TeamCard key={team.id} team={team} />)}
                            <ActionCard title="Initialize New Squad" icon={Plus} onClick={() => setMode('create')} colorClass="hover:border-indigo-500/50 hover:text-indigo-400 text-indigo-400/50" />
                            <ActionCard title="Join Existing Unit" icon={Key} onClick={() => setMode('join')} colorClass="hover:border-purple-500/50 hover:text-purple-400 text-purple-400/50" />
                        </motion.div>
                    )}

                    {(mode === 'create' || mode === 'join') && (
                        <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-md mx-auto bg-gray-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                            <div className="flex items-center gap-4 mb-8">
                                <div className={`p-4 rounded-2xl ${mode === 'create' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-purple-500/20 text-purple-400'}`}>
                                    {mode === 'create' ? <Cpu size={32} /> : <Key size={32} />}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">{mode === 'create' ? 'Initialize Squad' : 'Access Unit'}</h2>
                                    <p className="text-sm text-gray-400">{mode === 'create' ? 'Establish a new command channel' : 'Enter security clearance code'}</p>
                                </div>
                            </div>
                            <form onSubmit={mode === 'create' ? handleCreate : handleJoin} className="space-y-6">
                                <div>
                                    <input type="text" value={formData} onChange={(e) => setFormData(mode === 'join' ? e.target.value.toUpperCase() : e.target.value)} placeholder={mode === 'create' ? 'e.g. Cyber Punk Unit' : 'e.g. A1B2C3'} className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50" autoFocus required maxLength={mode === 'join' ? 6 : 50} />
                                </div>
                                {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{error}</div>}
                                <div className="flex gap-4">
                                    <button type="button" onClick={() => { setMode('view'); setError(null); }} className="flex-1 py-4 rounded-xl font-medium text-gray-400 hover:text-white hover:bg-white/5">Cancel</button>
                                    <button type="submit" disabled={!formData || loading} className={`flex-1 py-4 rounded-xl font-bold text-white shadow-lg disabled:opacity-50 ${mode === 'create' ? 'bg-gradient-to-r from-indigo-600 to-blue-600' : 'bg-gradient-to-r from-purple-600 to-pink-600'}`}>
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
