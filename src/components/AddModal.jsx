import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Users, Type, List, Link as LinkIcon, Calendar } from 'lucide-react';
import ResourceManager from './ResourceManager';
import { validateLength, isInputSafe } from '../utils/security';
import { useAuth } from '../contexts/AuthContext';
import { useTeam } from '../contexts/TeamContext';
import { notifyUsers, getProjectRecipients } from '../utils/notifications';

const InputField = ({ label, icon: Icon, ...props }) => (
  <div className="space-y-2">
    <label className="text-[11px] md:text-xs font-heading font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
      {Icon && <Icon size={12} />}
      {label}
    </label>
    <div className="relative group">
      <input
        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white text-sm font-body placeholder:text-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-300"
        {...props}
      />
      <div className="absolute inset-0 rounded-lg bg-indigo-500/5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300" />
    </div>
  </div>
);

const SelectField = ({ label, icon: Icon, children, ...props }) => (
  <div className="space-y-2">
    <label className="text-[11px] md:text-xs font-heading font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
      {Icon && <Icon size={12} />}
      {label}
    </label>
    <div className="relative">
      <select
        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-sm text-white font-body appearance-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-300"
        {...props}
      >
        {children}
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  </div>
);

const AddModal = ({ isOpen, onClose, onSave, editingHackathon }) => {
  const { currentUser } = useAuth();
  const { currentTeam } = useTeam();

  const [formData, setFormData] = useState({
    title: '',
    status: 'Upcoming',
    description: '',
    type: 'solo',
    resources: [],
    deadline: ''
  });

  const statusOptions = ['Upcoming', 'Ongoing', 'Planning', 'Completed'];

  useEffect(() => {
    if (editingHackathon) {
      setFormData({
        title: editingHackathon.title || '',
        status: editingHackathon.status || 'Upcoming',
        description: editingHackathon.description || '',
        type: editingHackathon.type || 'solo',
        resources: editingHackathon.resources || [],
        deadline: editingHackathon.deadline || ''
      });
    } else {
      setFormData({
        title: '',
        status: 'Upcoming',
        description: '',
        type: 'solo',
        resources: [],
        deadline: ''
      });
    }
  }, [editingHackathon]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = [];
    if (!formData.title.trim()) errors.push('Title is required');
    else if (formData.title.length > 100) errors.push('Title must be less than 100 characters');
    else if (!isInputSafe(formData.title)) errors.push('Title contains invalid characters');

    if (formData.description && formData.description.length > 1000) errors.push('Description must be less than 1000 characters');
    else if (formData.description && !isInputSafe(formData.description)) errors.push('Description contains invalid characters');

    if (!['solo', 'team'].includes(formData.type)) errors.push('Invalid project type');

    const validStatuses = ['Upcoming', 'Ongoing', 'Completed'];
    if (!validStatuses.includes(formData.status)) errors.push('Invalid status');

    if (errors.length > 0) {
      alert('Validation Errors:\n' + errors.join('\n'));
      return;
    }

    const hackathonData = {
      ...formData,
      title: validateLength(formData.title.trim(), 100),
      description: validateLength(formData.description.trim(), 1000),
      __proto__: undefined,
      constructor: undefined
    };

    if (editingHackathon) hackathonData.id = editingHackathon.id;

    try {
      await onSave(hackathonData);

      if (!editingHackathon) {
        const tempHackathon = {
          ...hackathonData,
          type: currentTeam ? 'team' : 'solo',
          teamId: currentTeam ? currentTeam.id : null,
          ownerId: currentUser.uid
        };

        const recipients = await getProjectRecipients(tempHackathon);

        const emailData = {
          headline: 'New Project Started',
          message: `New hackathon protocol initialized: "${hackathonData.title}"`,
          type_color: '#22C55E',
          btn_text: 'Open Project',
          btn_link: `${window.location.origin}/project/${hackathonData.title.replace(/\s+/g, '-').toLowerCase()}`
        };

        const notificationData = {
          type: 'success',
          relatedId: hackathonData.id || null
        };

        await notifyUsers(recipients, emailData, notificationData);
      }
    } catch (error) {
      console.error('Failed to save or notify:', error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#000000]/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
            <motion.div
              initial={{ opacity: 0, y: 80 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 80 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-[#0a0a0a] border border-white/10 rounded-t-3xl md:rounded-2xl w-full max-w-2xl max-h-[85vh] md:max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative pb-[calc(env(safe-area-inset-bottom)+8px)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="md:hidden mx-auto mt-3 mb-1 h-1.5 w-12 rounded-full bg-white/20" />
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none mix-blend-overlay" />

              <div className="flex items-center justify-between p-4 md:p-6 border-b border-white/5 bg-white/5 relative z-10">
                <div>
                  <h2 className="text-lg md:text-2xl font-heading font-bold text-white tracking-tight">
                    {editingHackathon ? 'Edit Protocol' : 'Initialize Project'}
                  </h2>
                  <p className="text-gray-400 text-[11px] md:text-xs font-body mt-1">Configure your hackathon parameters.</p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={onClose}
                  className="min-h-[44px] min-w-[44px] p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={20} />
                </motion.button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 md:p-6 relative z-10 custom-scrollbar">
                <form id="hackathon-form" onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
                  <div className="space-y-3">
                    <label className="text-[11px] md:text-xs font-heading font-bold text-gray-400 uppercase tracking-widest">Operation Mode</label>
                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                      {['solo', 'team'].map((type) => {
                        const isActive = formData.type === type;
                        return (
                          <motion.button
                            whileTap={{ scale: 0.96 }}
                            key={type}
                            type="button"
                            onClick={() => setFormData({ ...formData, type })}
                            className={`relative p-3 md:p-4 rounded-xl border transition-all duration-300 flex flex-col items-center gap-2 md:gap-3 group overflow-hidden ${isActive ? 'bg-indigo-600/10 border-indigo-500' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                          >
                            {isActive && <div className="absolute inset-0 bg-indigo-500/10 blur-xl" />}
                            <div className={`relative z-10 p-2.5 md:p-3 rounded-full transition-colors ${isActive ? 'bg-indigo-500 text-white' : 'bg-gray-800 text-gray-400 group-hover:bg-gray-700'}`}>
                              {type === 'solo' ? <User size={18} /> : <Users size={18} />}
                            </div>
                            <div className="relative z-10 text-center">
                              <div className={`font-heading text-sm md:text-base font-bold ${isActive ? 'text-white' : 'text-gray-300'}`}>
                                {type === 'solo' ? 'Solo Runner' : 'Team Squad'}
                              </div>
                              <div className="text-[10px] text-gray-500 mt-1 font-body">
                                {type === 'solo' ? 'Individual contributor' : 'Collaborative workspace'}
                              </div>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <InputField
                      label="Project Title"
                      icon={Type}
                      placeholder="e.g. Neo-Tokyo Hack 2026"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                    <SelectField label="Current Status" icon={Calendar} value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                      {statusOptions.map((opt) => (
                        <option key={opt} value={opt} className="bg-gray-900 text-white">{opt}</option>
                      ))}
                    </SelectField>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] md:text-xs font-heading font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <Calendar size={12} />
                      Deadline (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.deadline}
                      onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                      className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-sm text-white font-body focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-300"
                    />
                    <p className="text-xs text-gray-500">Set a deadline to prioritize this project</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] md:text-xs font-heading font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <List size={12} />
                      Briefing
                    </label>
                    <textarea
                      rows={4}
                      className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-sm text-white font-body placeholder:text-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-300 resize-none"
                      placeholder="Outline your project goals and tech stack..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[11px] md:text-xs font-heading font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <LinkIcon size={12} />
                      Attached Assets
                    </label>
                    <div className="border border-white/10 rounded-xl bg-black/20 p-3 md:p-4">
                      <ResourceManager
                        resources={formData.resources}
                        onChange={(newResources) => setFormData({ ...formData, resources: newResources })}
                      />
                    </div>
                  </div>
                </form>
              </div>

              <div className="p-4 md:p-6 border-t border-white/5 bg-white/5 flex justify-end gap-3 relative z-10">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  onClick={onClose}
                  className="min-h-[44px] px-5 md:px-6 py-2.5 rounded-lg text-sm font-heading font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  type="submit"
                  form="hackathon-form"
                  className="min-h-[44px] px-5 md:px-6 py-2.5 rounded-lg text-sm font-heading font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 transition-all"
                >
                  {editingHackathon ? 'Update Data' : 'Launch Project'}
                </motion.button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AddModal;
