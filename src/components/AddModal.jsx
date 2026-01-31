import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Users, Type, List, Link as LinkIcon, Calendar } from 'lucide-react';
import ResourceManager from './ResourceManager';

// --- STYLED INPUT COMPONENT ---
const InputField = ({ label, icon: Icon, ...props }) => (
  <div className="space-y-2">
    <label className="text-xs font-heading font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
      {Icon && <Icon size={12} />}
      {label}
    </label>
    <div className="relative group">
      <input
        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white font-body placeholder:text-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-300"
        {...props}
      />
      {/* Subtle glow effect on focus/hover */}
      <div className="absolute inset-0 rounded-lg bg-indigo-500/5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300" />
    </div>
  </div>
);

// --- STYLED SELECT COMPONENT ---
const SelectField = ({ label, icon: Icon, children, ...props }) => (
  <div className="space-y-2">
    <label className="text-xs font-heading font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
      {Icon && <Icon size={12} />}
      {label}
    </label>
    <div className="relative">
      <select
        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white font-body appearance-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-300"
        {...props}
      >
        {children}
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  </div>
);

/**
 * AddModal Component - High Fidelity Edition
 */
const AddModal = ({ isOpen, onClose, onSave, editingHackathon }) => {
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    status: 'Upcoming',
    description: '',
    type: 'solo',
    resources: []
  });

  const statusOptions = ['Upcoming', 'Ongoing', 'Completed'];

  // Populate form
  useEffect(() => {
    if (editingHackathon) {
      setFormData({
        title: editingHackathon.title || '',
        status: editingHackathon.status || 'Upcoming',
        description: editingHackathon.description || '',
        type: editingHackathon.type || 'solo',
        resources: editingHackathon.resources || []
      });
    } else {
      setFormData({
        title: '',
        status: 'Upcoming',
        description: '',
        type: 'solo',
        resources: []
      });
    }
  }, [editingHackathon]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const hackathonData = {
      ...formData,
      title: formData.title.trim(),
      description: formData.description.trim()
    };

    if (editingHackathon) {
      hackathonData.id = editingHackathon.id;
    }

    onSave(hackathonData);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#000000]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Noise Texture Overlay */}
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none mix-blend-overlay"></div>

              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5 relative z-10">
                <div>
                  <h2 className="text-2xl font-heading font-bold text-white tracking-tight">
                    {editingHackathon ? 'Edit Protocol' : 'Initialize Project'}
                  </h2>
                  <p className="text-gray-400 text-xs font-body mt-1">
                    Configure your hackathon parameters.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 relative z-10 custom-scrollbar">
                <form id="hackathon-form" onSubmit={handleSubmit} className="space-y-8">
                  
                  {/* Project Type Selector */}
                  <div className="space-y-3">
                    <label className="text-xs font-heading font-bold text-gray-400 uppercase tracking-widest">
                      Operation Mode
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      {['solo', 'team'].map((type) => {
                        const isActive = formData.type === type;
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setFormData({ ...formData, type })}
                            className={`relative p-4 rounded-xl border transition-all duration-300 flex flex-col items-center gap-3 group overflow-hidden ${
                              isActive
                                ? 'bg-indigo-600/10 border-indigo-500'
                                : 'bg-white/5 border-white/5 hover:border-white/20'
                            }`}
                          >
                            {/* Active Glow */}
                            {isActive && <div className="absolute inset-0 bg-indigo-500/10 blur-xl"></div>}
                            
                            <div className={`relative z-10 p-3 rounded-full transition-colors ${
                              isActive ? 'bg-indigo-500 text-white' : 'bg-gray-800 text-gray-400 group-hover:bg-gray-700'
                            }`}>
                              {type === 'solo' ? <User size={20} /> : <Users size={20} />}
                            </div>
                            <div className="relative z-10 text-center">
                              <div className={`font-heading font-bold ${isActive ? 'text-white' : 'text-gray-300'}`}>
                                {type === 'solo' ? 'Solo Runner' : 'Team Squad'}
                              </div>
                              <div className="text-[10px] text-gray-500 mt-1 font-body">
                                {type === 'solo' ? 'Individual contributor' : 'Collaborative workspace'}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Core Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField 
                      label="Project Title" 
                      icon={Type}
                      placeholder="e.g. Neo-Tokyo Hack 2026" 
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                    <SelectField 
                      label="Current Status"
                      icon={Calendar}
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      {statusOptions.map(opt => (
                        <option key={opt} value={opt} className="bg-gray-900 text-white">
                          {opt}
                        </option>
                      ))}
                    </SelectField>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <label className="text-xs font-heading font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <List size={12} />
                      Briefing
                    </label>
                    <textarea
                      rows={4}
                      className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white font-body placeholder:text-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-300 resize-none"
                      placeholder="Outline your project goals and tech stack..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  {/* Resources (Wrapped) */}
                  <div className="space-y-3">
                     <label className="text-xs font-heading font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <LinkIcon size={12} />
                      Attached Assets
                    </label>
                    <div className="border border-white/10 rounded-xl bg-black/20 p-4">
                      <ResourceManager
                        resources={formData.resources}
                        onChange={(newResources) =>
                          setFormData({ ...formData, resources: newResources })
                        }
                      />
                    </div>
                  </div>

                </form>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-white/5 bg-white/5 flex justify-end gap-3 relative z-10">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-lg text-sm font-heading font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="hackathon-form"
                  className="px-6 py-2.5 rounded-lg text-sm font-heading font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 transition-all transform hover:scale-105"
                >
                  {editingHackathon ? 'Update Data' : 'Launch Project'}
                </button>
              </div>

            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AddModal;