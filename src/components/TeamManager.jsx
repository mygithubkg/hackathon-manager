import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Copy, Check, ArrowRight, UserPlus } from 'lucide-react';
import { useTeam } from '../contexts/TeamContext';

export default function TeamManager({ onClose }) {
  const { currentTeam, userTeams, createTeam, joinTeam, switchTeam } = useTeam();
  const [mode, setMode] = useState('list'); // list, create, join
  const [teamName, setTeamName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await createTeam(teamName);
      setMode('list');
      setTeamName('');
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
      await joinTeam(inviteCode);
      setMode('list');
      setInviteCode('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    if (currentTeam?.inviteCode) {
      navigator.clipboard.writeText(currentTeam.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-xl overflow-hidden w-full max-w-md mx-auto">
      <div className="p-6 border-b border-gray-700 flex justify-between items-center">
        <h3 className="text-xl font-bold font-mono">
          {mode === 'list' && 'Team Command'}
          {mode === 'create' && 'Create Squad'}
          {mode === 'join' && 'Join Squad'}
        </h3>
        {mode !== 'list' && (
          <button 
            onClick={() => { setMode('list'); setError(null); }}
            className="text-gray-400 hover:text-white text-sm"
          >
            Back
          </button>
        )}
      </div>

      <div className="p-6">
        {mode === 'list' && (
          <div className="space-y-6">
             {/* Current Team Status */}
            <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/50">
               <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Active Context</div>
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <div className={`w-3 h-3 rounded-full ${currentTeam ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]'}`} />
                   <span className="font-medium text-lg">
                     {currentTeam ? currentTeam.name : 'Solo Workspace'}
                   </span>
                 </div>
                 {currentTeam && (
                   <div className="flex items-center gap-2 bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-700">
                     <span className="font-mono text-sm text-gray-300">{currentTeam.inviteCode}</span>
                     <button onClick={copyCode} className="text-gray-400 hover:text-white transition-colors">
                       {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                     </button>
                   </div>
                 )}
               </div>
            </div>

            {/* Team List */}
            <div>
              <div className="text-sm text-gray-400 mb-3">Available Squads</div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                <button
                  onClick={() => switchTeam(null)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                    !currentTeam 
                      ? 'bg-blue-600/20 border border-blue-500/50 text-white' 
                      : 'bg-gray-800/50 hover:bg-gray-800 border-transparent hover:border-gray-700 text-gray-400'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-lg">👤</span> Solo Workspace
                  </span>
                  {!currentTeam && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                </button>

                {userTeams.map(team => (
                  <button
                    key={team.id}
                    onClick={() => switchTeam(team.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                      currentTeam?.id === team.id
                        ? 'bg-green-600/20 border border-green-500/50 text-white' 
                        : 'bg-gray-800/50 hover:bg-gray-800 border-transparent hover:border-gray-700 text-gray-400'
                    }`}
                  >
                    <span className="font-medium">{team.name}</span>
                    <span className="text-xs text-gray-500 font-mono bg-black/20 px-2 py-1 rounded">
                      {team.members.length} members
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <button
                onClick={() => setMode('create')}
                className="flex flex-col items-center justify-center p-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl transition-all gap-2 group"
              >
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center group-hover:bg-indigo-500/30 transition-colors">
                  <Plus className="text-indigo-400" />
                </div>
                <span className="text-sm font-medium">Create Team</span>
              </button>

              <button
                onClick={() => setMode('join')}
                className="flex flex-col items-center justify-center p-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl transition-all gap-2 group"
              >
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                  <UserPlus className="text-purple-400" />
                </div>
                <span className="text-sm font-medium">Join Team</span>
              </button>
            </div>
          </div>
        )}

        {mode === 'create' && (
          <form onSubmit={handleCreate} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Team Name</label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g., Code Ninjas"
                className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                autoFocus
              />
            </div>
            {error && <p className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg">{error}</p>}
            <button
              type="submit"
              disabled={!teamName.trim() || loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Squad'}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>
        )}

        {mode === 'join' && (
          <form onSubmit={handleJoin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Enter Invite Code</label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="e.g., A1B2C3"
                className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white font-mono uppercase text-center text-lg focus:outline-none focus:border-purple-500 transition-colors"
                maxLength={6}
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-2 text-center">Ask your team lead for the 6-character code</p>
            </div>
            {error && <p className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg">{error}</p>}
            <button
              type="submit"
              disabled={inviteCode.length < 6 || loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Joining...' : 'Join Squad'}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
