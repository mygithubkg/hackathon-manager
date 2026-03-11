import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserProfile } from '../hooks/useUserProfile';
import { useAuth } from '../contexts/AuthContext';
import { useTeam } from '../contexts/TeamContext';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { Save, Plus, X, UserCircle, Briefcase, Mail, Phone, MapPin, Loader2, Link as LinkIcon } from 'lucide-react';

const ProfilePage = () => {
    const { publicProfile, privateProfile, loading, error, updatePublicProfile, updatePrivateProfile } = useUserProfile();
    const { currentUser, logout } = useAuth();
    const { currentTeam } = useTeam();
    const navigate = useNavigate();

    // Public Profile State
    const [displayName, setDisplayName] = useState('');
    const [bio, setBio] = useState('');
    const [skills, setSkills] = useState([]);
    const [skillInput, setSkillInput] = useState('');
    const [portfolioLinks, setPortfolioLinks] = useState([]);

    // Private Profile State
    const [phone, setPhone] = useState('');
    const [location, setLocation] = useState('');

    // UI State
    const [savingPublic, setSavingPublic] = useState(false);
    const [savingPrivate, setSavingPrivate] = useState(false);
    const [publicMsg, setPublicMsg] = useState({ text: '', type: '' });
    const [privateMsg, setPrivateMsg] = useState({ text: '', type: '' });

    useEffect(() => {
        if (publicProfile) {
            setDisplayName(publicProfile.displayName || '');
            setBio(publicProfile.bio || '');
            setSkills(publicProfile.skills || []);
            setPortfolioLinks(publicProfile.portfolioLinks || []);
        }
    }, [publicProfile]);

    useEffect(() => {
        if (privateProfile) {
            setPhone(privateProfile.phone || '');
            setLocation(privateProfile.location || '');
        }
    }, [privateProfile]);

    const handleSavePublic = async (e) => {
        e.preventDefault();
        setSavingPublic(true);
        setPublicMsg({ text: '', type: '' });
        try {
            await updatePublicProfile({
                displayName,
                bio,
                skills,
                portfolioLinks
            });
            setPublicMsg({ text: 'Public profile saved successfully!', type: 'success' });
        } catch (err) {
            setPublicMsg({ text: err.message, type: 'error' });
        } finally {
            setSavingPublic(false);
        }
    };

    const handleSavePrivate = async (e) => {
        e.preventDefault();
        setSavingPrivate(true);
        setPrivateMsg({ text: '', type: '' });
        try {
            await updatePrivateProfile({
                email: currentUser.email,
                phone,
                location
            });
            setPrivateMsg({ text: 'Private info saved successfully!', type: 'success' });
        } catch (err) {
            setPrivateMsg({ text: err.message, type: 'error' });
        } finally {
            setSavingPrivate(false);
        }
    };

    const handleAddSkill = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const val = skillInput.trim();
            if (val && skills.length < 10 && !skills.includes(val)) {
                setSkills([...skills, val]);
                setSkillInput('');
            }
        }
    };

    const currentDisplayAvatar = publicProfile?.avatarURL || currentUser?.photoURL;
    const currentInitial = (displayName || currentUser?.email || 'U').charAt(0).toUpperCase();

    if (loading) {
        return (
            <div className="flex-1 flex justify-center items-center py-20 min-h-screen">
                <Loader2 className="animate-spin text-indigo-500 w-8 h-8" />
            </div>
        );
    }

    return (
        <DashboardLayout
            user={currentUser}
            currentTeam={currentTeam}
            onLogout={logout}
            onTeamClick={() => navigate('/teams')}
        >
            <div className="max-w-4xl mx-auto space-y-8 mt-10 md:mt-2">
                <div className="flex flex-col md:flex-row items-center gap-6 mb-12 bg-black/40 p-6 rounded-2xl border border-white/10 backdrop-blur-sm">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl font-bold shadow-lg shadow-indigo-500/20 shrink-0">
                        {currentDisplayAvatar ? (
                            <img src={currentDisplayAvatar} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            currentInitial
                        )}
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight mb-2">User Profile</h1>
                        <p className="text-gray-400">Manage your identity globally across all command units.</p>
                    </div>
                </div>

                {/* SECTION 1 - PUBLIC PROFILE */}
                <section className="bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-white/10 pb-4">
                        <UserCircle className="text-indigo-400" />
                        Public Profile
                        <span className="text-sm font-normal text-gray-400 ml-auto">Visible to all teammates</span>
                    </h2>

                    <form onSubmit={handleSavePublic} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Display Name</label>
                            <input
                                value={displayName}
                                onChange={e => setDisplayName(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
                                placeholder="How teammates see you"
                                maxLength={40}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2 flex justify-between">
                                Bio <span>{bio.length}/300</span>
                            </label>
                            <textarea
                                value={bio}
                                onChange={e => setBio(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 transition-colors h-32 resize-none"
                                placeholder="Tell teammates a bit about your experiences and goals"
                                maxLength={300}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Skills (Max 10)
                            </label>
                            <div className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 min-h-[56px] flex flex-wrap gap-2 items-center focus-within:border-indigo-500/50 transition-colors">
                                <AnimatePresence>
                                    {skills.map((skill, index) => (
                                        <motion.span
                                            key={index}
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0.8, opacity: 0 }}
                                            className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                                        >
                                            {skill}
                                            <button type="button" onClick={() => setSkills(skills.filter((_, i) => i !== index))} className="hover:text-white transition-colors">
                                                <X size={14} />
                                            </button>
                                        </motion.span>
                                    ))}
                                </AnimatePresence>
                                {skills.length < 10 && (
                                    <input
                                        value={skillInput}
                                        onChange={e => setSkillInput(e.target.value)}
                                        onKeyDown={handleAddSkill}
                                        className="bg-transparent border-none focus:outline-none text-white text-sm flex-1 min-w-[120px]"
                                        placeholder="Type skill + Enter"
                                        maxLength={30}
                                    />
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-4">
                                Portfolio Links (Max 5)
                            </label>
                            <div className="space-y-3">
                                {portfolioLinks.map((link, index) => (
                                    <div key={index} className="flex gap-2 items-center">
                                        <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex-shrink-0">
                                            <LinkIcon size={18} className="text-gray-400" />
                                        </div>
                                        <input
                                            value={link.label}
                                            onChange={(e) => {
                                                const newLinks = [...portfolioLinks];
                                                newLinks[index].label = e.target.value;
                                                setPortfolioLinks(newLinks);
                                            }}
                                            placeholder="Label (e.g. GitHub)"
                                            className="w-1/3 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
                                            maxLength={50}
                                        />
                                        <input
                                            value={link.url}
                                            onChange={(e) => {
                                                const newLinks = [...portfolioLinks];
                                                newLinks[index].url = e.target.value;
                                                setPortfolioLinks(newLinks);
                                            }}
                                            placeholder="https://..."
                                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setPortfolioLinks(portfolioLinks.filter((_, i) => i !== index))}
                                            className="p-3 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl transition-colors border border-red-500/20"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                ))}
                                {portfolioLinks.length < 5 && (
                                    <button
                                        type="button"
                                        onClick={() => setPortfolioLinks([...portfolioLinks, { label: '', url: '' }])}
                                        className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors p-2"
                                    >
                                        <Plus size={16} /> Add Link
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-4 pt-4 border-t border-white/10">
                            <button
                                type="submit"
                                disabled={savingPublic}
                                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors disabled:opacity-50"
                            >
                                {savingPublic ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
                                Save Public Profile
                            </button>
                            {publicMsg.text && (
                                <span className={`text-sm ${publicMsg.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                                    {publicMsg.text}
                                </span>
                            )}
                        </div>
                    </form>
                </section>

                {/* SECTION 2 - PRIVATE PROFILE */}
                <section className="bg-gray-900/60 backdrop-blur-xl border border-red-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-[60px] pointer-events-none" />
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-white/10 pb-4">
                        <span className="bg-red-500/20 text-red-400 text-xs px-2 py-1 rounded font-bold uppercase tracking-wider border border-red-500/20">
                            Private
                        </span>
                        <span className="text-sm font-normal text-gray-400 ml-auto flex items-center gap-1">
                            Only visible to you
                        </span>
                    </h2>

                    <form onSubmit={handleSavePrivate} className="space-y-6 relative z-10">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                                <Mail size={16} /> Email Address (Read Only)
                            </label>
                            <input
                                value={currentUser?.email || ''}
                                readOnly
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-gray-500 cursor-not-allowed"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                                    <Phone size={16} /> Phone Number
                                </label>
                                <input
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 transition-colors"
                                    placeholder="+1..."
                                    maxLength={20}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                                    <MapPin size={16} /> Location
                                </label>
                                <input
                                    value={location}
                                    onChange={e => setLocation(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 transition-colors"
                                    placeholder="City, Country"
                                    maxLength={100}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-4 pt-4 border-t border-white/10">
                            <button
                                type="submit"
                                disabled={savingPrivate}
                                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-700 hover:bg-gray-600 border border-white/10 text-white font-medium transition-colors disabled:opacity-50"
                            >
                                {savingPrivate ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
                                Save Private Info
                            </button>
                            {privateMsg.text && (
                                <span className={`text-sm ${privateMsg.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                                    {privateMsg.text}
                                </span>
                            )}
                        </div>
                    </form>
                </section>
            </div>
        </DashboardLayout>
    );
};

export default ProfilePage;
