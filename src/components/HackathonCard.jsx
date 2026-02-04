import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Edit2, Trash2, ExternalLink, 
  Github, FileText, Palette, FolderOpen, Link as LinkIcon,
  Clock, CheckSquare, Plus, Check, X, Sparkles, LayoutGrid, ListTodo, Bookmark
} from 'lucide-react';
import { sanitizeText, validateLength, isInputSafe } from '../utils/security';

/**
 * 🎨 GLASSMORPHIC PREMIUM WITH TABBED NAVIGATION
 * Ultra-modern card with fixed height and internal tab system
 * Features: Tab-based content switching, consistent card height, professional animations
 */
const HackathonCard = ({ hackathon, onEdit, onDelete, onUpdate, updateHackathon }) => {
  const [activeTab, setActiveTab] = useState('overview'); // overview, tasks, resources, checklist
  const [newTask, setNewTask] = useState('');
  const [newTaskItem, setNewTaskItem] = useState('');
  const [newTaskDeadline, setNewTaskDeadline] = useState('');
  const [timeLeft, setTimeLeft] = useState(null);
  const [isUrgent, setIsUrgent] = useState(false);
  const [isOverdue, setIsOverdue] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const saveToFirebase = updateHackathon || onUpdate;

  // Enhanced status styling
  const statusStyles = {
    'Upcoming': 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-cyan-300 border border-cyan-400/30 backdrop-blur-xl shadow-lg shadow-cyan-500/10',
    'Ongoing': 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-yellow-300 border border-yellow-400/30 backdrop-blur-xl shadow-lg shadow-yellow-500/10',
    'Planning': 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-pink-300 border border-pink-400/30 backdrop-blur-xl shadow-lg shadow-purple-500/10',
    'Completed': 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-300 border border-emerald-400/30 backdrop-blur-xl shadow-lg shadow-emerald-500/10'
  };

  useEffect(() => {
    const calculateTime = () => {
      if (!hackathon.deadline) return null;
      
      const targetDate = new Date(hackathon.deadline);
      if (isNaN(targetDate.getTime())) return null;

      const now = new Date();
      const difference = targetDate - now;

      if (difference <= 0) {
        setIsOverdue(true);
        return 'Overdue';
      }

      setIsOverdue(false);
      setIsUrgent(difference < 432000000);

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);

      if (days > 0) return `${days}d ${hours}h ${minutes}m`;
      return `${hours}h ${minutes}m`;
    };

    const timer = calculateTime();
    setTimeLeft(timer);
    const interval = setInterval(() => setTimeLeft(calculateTime()), 60000);
    return () => clearInterval(interval);
  }, [hackathon.deadline]);

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTask.trim() || !onUpdate) return;

    const sanitizedTask = validateLength(newTask.trim(), 200);
    if (!isInputSafe(sanitizedTask)) {
      alert('Security: Invalid characters detected in task.');
      return;
    }

    const currentChecklist = hackathon.checklist || [];
    if (currentChecklist.length >= 50) {
      alert('Maximum 50 tasks allowed per hackathon.');
      return;
    }

    const updatedChecklist = [...currentChecklist, { id: Date.now(), text: sanitizedTask, completed: false }];
    onUpdate(hackathon.id, { checklist: updatedChecklist });
    setNewTask('');
  };

  const toggleTask = (taskId) => {
    if (!onUpdate) return;
    const currentChecklist = hackathon.checklist || [];
    const updatedChecklist = currentChecklist.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    onUpdate(hackathon.id, { checklist: updatedChecklist });
  };
  
  const removeTask = (taskId) => {
     if (!onUpdate) return;
     const currentChecklist = hackathon.checklist || [];
     const updatedChecklist = currentChecklist.filter(task => task.id !== taskId);
     onUpdate(hackathon.id, { checklist: updatedChecklist });
  };

  const handleAddTaskItem = async (e) => {
    e.preventDefault();
    if (!newTaskItem.trim() || !saveToFirebase) return;

    const sanitizedTask = validateLength(newTaskItem.trim(), 200);
    if (!isInputSafe(sanitizedTask)) {
      alert('Security: Invalid characters detected in task.');
      return;
    }

    const currentTasks = hackathon.tasks || [];
    if (currentTasks.length >= 50) {
      alert('Maximum 50 tasks allowed per hackathon.');
      return;
    }

    const newTaskObj = { 
      id: Date.now(), 
      text: sanitizedTask, 
      done: false,
      deadline: newTaskDeadline || null
    };

    const updatedTasks = [...currentTasks, newTaskObj];

    try {
      await saveToFirebase(hackathon.id, { tasks: updatedTasks });
      setNewTaskItem('');
      setNewTaskDeadline('');
    } catch (error) {
      console.error('❌ Failed to save task to Firebase:', error);
      alert('Failed to save task. Please try again.');
    }
  };

  const toggleTaskItem = async (taskId) => {
    if (!saveToFirebase) return;
    const currentTasks = hackathon.tasks || [];
    const updatedTasks = currentTasks.map(task => 
      task.id === taskId ? { ...task, done: !task.done } : task
    );
    
    try {
      await saveToFirebase(hackathon.id, { tasks: updatedTasks });
    } catch (error) {
      console.error('❌ Failed to toggle task:', error);
    }
  };
  
  const removeTaskItem = async (taskId) => {
     if (!saveToFirebase) return;
     const currentTasks = hackathon.tasks || [];
     const updatedTasks = currentTasks.filter(task => task.id !== taskId);
     
     try {
       await saveToFirebase(hackathon.id, { tasks: updatedTasks });
     } catch (error) {
       console.error('❌ Failed to delete task:', error);
     }
  };

  const totalChecklistTasks = hackathon.checklist?.length || 0;
  const completedChecklistTasks = hackathon.checklist?.filter(t => t.completed).length || 0;
  const totalTasks = (hackathon.tasks?.length || 0) + totalChecklistTasks;
  const completedTasks = (hackathon.tasks?.filter(t => t.done).length || 0) + completedChecklistTasks;
  const progressPercent = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const getResourceIcon = (type) => {
    const iconProps = { size: 18, strokeWidth: 2 };
    switch (type?.toLowerCase()) {
      case 'github': return <Github {...iconProps} />;
      case 'canva': return <Palette {...iconProps} />;
      case 'ppt':
      case 'presentation': return <FileText {...iconProps} />;
      case 'drive':
      case 'folder': return <FolderOpen {...iconProps} />;
      default: return <LinkIcon {...iconProps} />;
    }
  };

  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutGrid, count: null },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, count: hackathon.tasks?.length || 0 },
    { id: 'resources', label: 'Resources', icon: Bookmark, count: hackathon.resources?.length || 0 },
    { id: 'checklist', label: 'Quick Tasks', icon: ListTodo, count: hackathon.checklist?.length || 0 }
  ];

  // Tab content variants for smooth transitions
  const tabContentVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
    exit: { opacity: 0, x: 20, transition: { duration: 0.2 } }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group relative h-full"
    >
      {/* Glowing border effect */}
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br from-primary-500/20 via-purple-500/20 to-pink-500/20 blur-xl transition-opacity duration-500 ${
        isHovered ? 'opacity-100' : 'opacity-0'
      }`} />
      
      {/* Main card with fixed height and internal scrolling */}
      <div className={`relative h-full flex flex-col rounded-2xl backdrop-blur-2xl bg-gradient-to-br from-gray-800/90 to-gray-900/90 border transition-all duration-500 overflow-hidden ${
        isOverdue 
          ? 'border-red-500/50 shadow-2xl shadow-red-500/20' 
          : isHovered
            ? 'border-gray-600/60 shadow-2xl shadow-primary-500/10'
            : 'border-gray-700/50 shadow-xl'
      }`}>
        
        {/* Decorative gradient orbs */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-primary-500/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-purple-500/10 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        {/* Fixed Header */}
        <div className="relative z-10 p-6 border-b border-gray-700/50 backdrop-blur-xl bg-gray-900/30">
          {/* Title & Actions */}
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <motion.h3 
                className="text-xl font-bold bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent leading-tight"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                {sanitizeText(hackathon.title)}
              </motion.h3>
            </div>
            
            {/* Floating glass action buttons */}
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onEdit(hackathon)}
                className="p-2 rounded-xl backdrop-blur-xl bg-gray-700/40 border border-gray-600/30 hover:bg-primary-600/40 hover:border-primary-500/50 transition-all duration-300 text-gray-300 hover:text-white shadow-lg hover:shadow-primary-500/20"
                title="Edit hackathon"
              >
                <Edit2 size={15} />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onDelete(hackathon.id)}
                className="p-2 rounded-xl backdrop-blur-xl bg-gray-700/40 border border-gray-600/30 hover:bg-red-600/40 hover:border-red-500/50 transition-all duration-300 text-gray-300 hover:text-white shadow-lg hover:shadow-red-500/20"
                title="Delete hackathon"
              >
                <Trash2 size={15} />
              </motion.button>
            </div>
          </div>

          {/* Status badges */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <motion.span 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide ${statusStyles[hackathon.status] || statusStyles['Upcoming']}`}
            >
              <Sparkles size={11} />
              {hackathon.status}
            </motion.span>
            
            {timeLeft && (
               <motion.div 
                 initial={{ scale: 0.8, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 transition={{ delay: 0.25 }}
                 className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl backdrop-blur-xl border shadow-lg ${
                     isOverdue
                       ? 'bg-red-500/20 text-red-200 border-red-400/50 shadow-red-500/20 animate-pulse'
                       : isUrgent 
                         ? 'bg-orange-500/20 text-orange-200 border-orange-400/40 shadow-orange-500/20' 
                         : 'bg-gray-700/40 text-gray-200 border-gray-600/30'
                 }`}
               >
                  <Clock size={12} />
                  <span className="tracking-wide">{timeLeft}</span>
               </motion.div>
            )}

            {/* Progress indicator in header */}
            {totalTasks > 0 && (
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl backdrop-blur-xl bg-gray-700/40 border border-gray-600/30"
              >
                <span className="text-xs font-bold bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent">
                  {progressPercent}%
                </span>
                <div className="w-16 h-1.5 bg-gray-600/50 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
                    className="h-full bg-gradient-to-r from-primary-500 to-purple-500 rounded-full"
                  />
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="relative z-10 px-6 pt-4 border-b border-gray-700/30 backdrop-blur-xl bg-gray-900/20 overflow-x-auto custom-scrollbar">
          <div className="flex gap-1 min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <motion.button
                  key={tab.id}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                    isActive
                      ? 'text-white bg-gray-800/60 border-t border-x border-gray-700/50'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/30'
                  }`}
                >
                  <Icon size={15} strokeWidth={2} />
                  <span>{tab.label}</span>
                  {tab.count !== null && tab.count > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                      isActive 
                        ? 'bg-primary-500/20 text-primary-300' 
                        : 'bg-gray-700/50 text-gray-400'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                  
                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-500 to-purple-500"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Tab Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto relative z-10">
          <AnimatePresence mode="wait">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                variants={tabContentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="p-6 space-y-6"
              >
                {/* Description */}
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Description</h4>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {sanitizeText(hackathon.description) || 'No description provided.'}
                  </p>
                </div>

                {/* Detailed Progress */}
                {totalTasks > 0 && (
                  <div className="p-5 rounded-xl backdrop-blur-xl bg-gradient-to-r from-gray-800/60 to-gray-900/60 border border-gray-700/50">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold text-gray-400 tracking-wider uppercase">Overall Progress</span>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-black bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent">
                          {progressPercent}%
                        </span>
                        <span className="text-xs text-gray-500 font-medium">({completedTasks}/{totalTasks})</span>
                      </div>
                    </div>
                    <div className="relative w-full h-3 bg-gray-700/50 rounded-full overflow-hidden backdrop-blur-sm">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500 rounded-full shadow-lg shadow-primary-500/50"
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent" />
                      </motion.div>
                    </div>
                  </div>
                )}

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl backdrop-blur-xl bg-gray-800/40 border border-gray-700/40">
                    <div className="text-xs text-gray-400 mb-1 font-medium">Tasks</div>
                    <div className="text-2xl font-bold text-white">{hackathon.tasks?.length || 0}</div>
                  </div>
                  <div className="p-4 rounded-xl backdrop-blur-xl bg-gray-800/40 border border-gray-700/40">
                    <div className="text-xs text-gray-400 mb-1 font-medium">Resources</div>
                    <div className="text-2xl font-bold text-white">{hackathon.resources?.length || 0}</div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Tasks Tab */}
            {activeTab === 'tasks' && (
              <motion.div
                key="tasks"
                variants={tabContentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="p-6"
              >
                <div className="space-y-3 mb-5 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  {(!hackathon.tasks || hackathon.tasks.length === 0) && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 rounded-full bg-gray-800/60 border border-gray-700/50 flex items-center justify-center mx-auto mb-3">
                        <CheckSquare size={28} className="text-gray-600" />
                      </div>
                      <p className="text-sm text-gray-500 font-medium">No tasks yet</p>
                      <p className="text-xs text-gray-600 mt-1">Add your first task below ✨</p>
                    </div>
                  )}
                  
                  {hackathon.tasks?.map((task, index) => {
                    const isTaskOverdue = task.deadline && new Date(task.deadline) < new Date();
                    
                    return (
                    <motion.div 
                      key={task.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-start gap-3 group p-3 rounded-xl hover:bg-gray-800/60 transition-all duration-200 border border-transparent hover:border-gray-700/40"
                    >
                      <button 
                        onClick={() => toggleTaskItem(task.id)}
                        className={`flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 mt-0.5 ${
                          task.done 
                            ? 'bg-gradient-to-br from-emerald-500 to-green-600 border-emerald-400 text-white shadow-lg shadow-emerald-500/30' 
                            : 'bg-gray-800/60 border-gray-600 text-transparent hover:border-emerald-500/50 hover:bg-gray-700/60'
                        }`}
                      >
                        <Check size={14} strokeWidth={3} />
                      </button>
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm block break-words font-medium ${
                          task.done ? 'text-gray-500 line-through' : 'text-gray-200'
                        }`}>
                          {sanitizeText(task.text)}
                        </span>
                        {task.deadline && (
                          <div className={`flex items-center gap-1.5 text-xs mt-2 font-bold ${
                            isTaskOverdue 
                              ? 'text-red-400' 
                              : 'text-gray-500'
                          }`}>
                            <Clock size={11} />
                            <span>
                              {new Date(task.deadline).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                year: new Date(task.deadline).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                              })}
                            </span>
                            {isTaskOverdue && <span className="ml-1">⚠️ OVERDUE</span>}
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={() => removeTaskItem(task.id)}
                        className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all duration-200 p-1.5 rounded-lg hover:bg-red-500/10"
                      >
                        <X size={15} />
                      </button>
                    </motion.div>
                    );
                  })}
                </div>

                {/* Add Task Form */}
                <form onSubmit={handleAddTaskItem} className="space-y-3 pt-4 border-t border-gray-700/50">
                  <input
                    type="text"
                    value={newTaskItem}
                    onChange={(e) => setNewTaskItem(e.target.value)}
                    placeholder="✨ Add a new task..."
                    className="w-full bg-gray-800/60 border border-gray-700/50 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 focus:bg-gray-800/80 transition-all duration-200 backdrop-blur-xl font-medium"
                  />
                  <div className="flex gap-3">
                    <input
                      type="date"
                      value={newTaskDeadline}
                      onChange={(e) => setNewTaskDeadline(e.target.value)}
                      className="flex-1 bg-gray-800/60 border border-gray-700/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 focus:bg-gray-800/80 transition-all duration-200 backdrop-blur-xl font-medium"
                    />
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={!newTaskItem.trim()}
                      className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white px-6 py-3 rounded-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-sm shadow-lg shadow-emerald-500/30 disabled:shadow-none"
                    >
                      Add
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Resources Tab */}
            {activeTab === 'resources' && (
              <motion.div
                key="resources"
                variants={tabContentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="p-6"
              >
                {(!hackathon.resources || hackathon.resources.length === 0) ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-gray-800/60 border border-gray-700/50 flex items-center justify-center mx-auto mb-3">
                      <Bookmark size={28} className="text-gray-600" />
                    </div>
                    <p className="text-sm text-gray-500 font-medium">No resources added</p>
                    <p className="text-xs text-gray-600 mt-1">Add resources via the edit menu</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                    {hackathon.resources.map((resource, index) => (
                      <motion.a
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        href={resource.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-800/60 transition-all duration-200 group border border-transparent hover:border-gray-700/50 backdrop-blur-sm"
                      >
                        <div className="p-3 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 group-hover:from-primary-600/20 group-hover:to-purple-600/20 transition-all duration-300 text-gray-400 group-hover:text-primary-400 border border-gray-700/50 group-hover:border-primary-500/30 shadow-lg">
                          {getResourceIcon(resource.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-gray-200 group-hover:text-white transition-colors truncate mb-1">
                            {sanitizeText(resource.title || resource.label)}
                          </h4>
                          <p className="text-xs text-gray-500 truncate font-medium">{sanitizeText(resource.type)}</p>
                        </div>
                        <ExternalLink size={16} className="text-gray-600 group-hover:text-primary-400 transition-colors flex-shrink-0" />
                      </motion.a>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Checklist Tab */}
            {activeTab === 'checklist' && (
              <motion.div
                key="checklist"
                variants={tabContentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="p-6"
              >
                <div className="space-y-3 mb-5 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  {(!hackathon.checklist || hackathon.checklist.length === 0) && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 rounded-full bg-gray-800/60 border border-gray-700/50 flex items-center justify-center mx-auto mb-3">
                        <ListTodo size={28} className="text-gray-600" />
                      </div>
                      <p className="text-sm text-gray-500 font-medium">No quick tasks</p>
                      <p className="text-xs text-gray-600 mt-1">Add a quick task below 📝</p>
                    </div>
                  )}
                  
                  {hackathon.checklist?.map((task, index) => (
                    <motion.div 
                      key={task.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-3 group p-3 rounded-xl hover:bg-gray-800/60 transition-all duration-200 border border-transparent hover:border-gray-700/40"
                    >
                      <button 
                        onClick={() => toggleTask(task.id)}
                        className={`flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                          task.completed 
                            ? 'bg-gradient-to-br from-pink-500 to-rose-600 border-pink-400 text-white shadow-lg shadow-pink-500/30' 
                            : 'bg-gray-800/60 border-gray-600 text-transparent hover:border-pink-500/50 hover:bg-gray-700/60'
                        }`}
                      >
                        <Check size={14} strokeWidth={3} />
                      </button>
                      <span className={`text-sm flex-1 break-words font-medium ${task.completed ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
                        {sanitizeText(task.text)}
                      </span>
                      <button 
                        onClick={() => removeTask(task.id)}
                        className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all duration-200 p-1.5 rounded-lg hover:bg-red-500/10"
                      >
                        <X size={15} />
                      </button>
                    </motion.div>
                  ))}
                </div>

                {/* Add Quick Task Form */}
                <form onSubmit={handleAddTask} className="flex gap-3 pt-4 border-t border-gray-700/50">
                  <input
                    type="text"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder="📝 Add a quick task..."
                    className="flex-1 bg-gray-800/60 border border-gray-700/50 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50 focus:bg-gray-800/80 transition-all duration-200 backdrop-blur-xl font-medium"
                  />
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={!newTask.trim()}
                    className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white p-3 rounded-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-pink-500/30 disabled:shadow-none"
                  >
                    <Plus size={20} />
                  </motion.button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(31, 41, 55, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(107, 114, 128, 0.4);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(107, 114, 128, 0.6);
        }
      `}</style>
    </motion.div>
  );
};

export default HackathonCard;