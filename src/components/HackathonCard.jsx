import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Edit2, Trash2, ExternalLink, ChevronDown, ChevronUp, 
  Github, FileText, Palette, FolderOpen, Link as LinkIcon,
  Clock, CheckSquare, Plus, Check, Square, AlertCircle, X
} from 'lucide-react';

/**
 * HackathonCard Component
 * Displays individual hackathon information with edit/delete actions
 * Includes expandable resource section, countdown timer, and mini-task checklist
 * 
 * @param {Object} hackathon - The hackathon object to display
 * @param {Function} onEdit - Callback when edit button is clicked
 * @param {Function} onDelete - Callback when delete button is clicked
 * @param {Function} onUpdate - Callback when hackathon data needs update
 */
const HackathonCard = ({ hackathon, onEdit, onDelete, onUpdate }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [checklistExpanded, setChecklistExpanded] = useState(false);
  const [newTask, setNewTask] = useState('');
  const [timeLeft, setTimeLeft] = useState(null);
  const [isUrgent, setIsUrgent] = useState(false);

  // Status color mapping
  const statusColors = {
    'Upcoming': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    'Ongoing': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    'Completed': 'bg-green-500/10 text-green-400 border-green-500/30'
  };

  /**
   * Calculate time remaining until deadline
   */
  useEffect(() => {
    const calculateTime = () => {
      // Use deadline if available, otherwise just use 'date'
      // Requires date format to be parseable (YYYY-MM-DD or ISO)
      const targetDate = new Date(hackathon.deadline || hackathon.date);
      
      // If invalid date, return null
      if (isNaN(targetDate.getTime())) return null;

      const now = new Date();
      const difference = targetDate - now;

      if (difference <= 0) {
        return 'Ended';
      }

      // 24 hours in milliseconds = 24 * 60 * 60 * 1000 = 86400000
      setIsUrgent(difference < 86400000);

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);

      // Format string
      if (days > 0) {
        return `${days}d ${hours}h ${minutes}m`;
      }
      return `${hours}h ${minutes}m`;
    };

    // Calculate immediately
    const timer = calculateTime();
    setTimeLeft(timer);

    // Update every minute to save performance
    const interval = setInterval(() => {
      setTimeLeft(calculateTime());
    }, 60000);

    return () => clearInterval(interval);
  }, [hackathon.deadline, hackathon.date]);

  /**
   * Handle Checklist Updates
   */
  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    if (!onUpdate) {
        console.error("onUpdate prop missing in HackathonCard");
        return;
    }

    const currentChecklist = hackathon.checklist || [];
    const updatedChecklist = [
      ...currentChecklist, 
      { id: Date.now(), text: newTask, completed: false }
    ];

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

  // Calculate Progress
  const totalTasks = hackathon.checklist?.length || 0;
  const completedTasks = hackathon.checklist?.filter(t => t.completed).length || 0;
  const progressPercent = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  // Get icon for resource type
  const getResourceIcon = (type) => {
    const iconProps = { size: 16, className: "flex-shrink-0" };
    switch (type?.toLowerCase()) {
      case 'github':
        return <Github {...iconProps} />;
      case 'canva':
        return <Palette {...iconProps} />;
      case 'ppt':
      case 'presentation':
        return <FileText {...iconProps} />;
      case 'drive':
      case 'folder':
        return <FolderOpen {...iconProps} />;
      default:
        return <LinkIcon {...iconProps} />;
    }
  };

  return (
    <motion.div
      layout
      className="card h-full flex flex-col relative overflow-hidden bg-gray-800 border border-gray-700 rounded-xl hover:border-gray-600 transition-colors"
    >
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* Card Header */}
      <div className="relative z-10 p-5">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl font-bold text-gray-100 flex-1 pr-2 line-clamp-2">
            {hackathon.title}
          </h3>
          <div className="flex gap-2">
            {/* Edit Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onEdit(hackathon)}
              className="p-1.5 bg-gray-700 hover:bg-primary-600 rounded-lg transition-colors text-gray-300"
              title="Edit hackathon"
            >
              <Edit2 size={16} />
            </motion.button>
            
            {/* Delete Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onDelete(hackathon.id)}
              className="p-1.5 bg-gray-700 hover:bg-red-600 rounded-lg transition-colors text-gray-300"
              title="Delete hackathon"
            >
              <Trash2 size={16} />
            </motion.button>
          </div>
        </div>

        {/* Status Badge & Countdown */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[hackathon.status] || statusColors['Upcoming']}`}>
            {hackathon.status}
          </span>
          
          {/* Countdown Display */}
          {timeLeft && timeLeft !== 'Ended' && (
             <div className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md border ${
                 isUrgent 
                   ? 'bg-red-500/10 text-red-400 border-red-500/30 animate-pulse' 
                   : 'bg-gray-700 text-gray-300 border-gray-600'
             }`}>
                <Clock size={12} />
                <span>{timeLeft}</span>
             </div>
          )}
        </div>

        {/* Description */}
        <p className="text-gray-400 text-sm mb-4 line-clamp-2">
          {hackathon.description || 'No description provided.'}
        </p>

        {/* Progress Bar (Visible if tasks exist) */}
        {totalTasks > 0 && (
           <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                 <span>Progress</span>
                 <span>{completedTasks}/{totalTasks}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-1.5">
                 <div 
                    className="bg-primary-500 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                 ></div>
              </div>
           </div>
        )}

        {/* Action Buttons: Expand Resources / Checklist */}
        <div className="flex gap-2 mt-auto">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  isExpanded ? 'bg-gray-700 text-white' : 'bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
            >
                {hackathon.resources?.length > 0 ? (
                   <>
                     <span>Resources ({hackathon.resources.length})</span>
                     {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                   </>
                ) : (
                   <span className="opacity-50">No Resources</span>
                )}
            </button>

            <button
                onClick={() => setChecklistExpanded(!checklistExpanded)}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  checklistExpanded ? 'bg-gray-700 text-white' : 'bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
            >
                <CheckSquare size={16} />
                {checklistExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
        </div>
      </div>

      {/* Expanded Sections */}
      <AnimatePresence>
        {/* Resources Section */}
        {isExpanded && hackathon.resources && hackathon.resources.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-gray-900/50 border-t border-gray-700"
          >
            <div className="p-4 space-y-2">
              {hackathon.resources.map((resource, index) => (
                <a
                  key={index}
                  href={resource.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800 transition-colors group"
                >
                  <div className="p-2 rounded bg-gray-800 group-hover:bg-gray-700 transition-colors text-gray-400 group-hover:text-primary-400">
                    {getResourceIcon(resource.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-300 group-hover:text-white truncate">
                      {resource.title}
                    </h4>
                    <p className="text-xs text-gray-500 truncate">{resource.type}</p>
                  </div>
                  <ExternalLink size={14} className="text-gray-600 group-hover:text-gray-400" />
                </a>
              ))}
            </div>
          </motion.div>
        )}

        {/* Checklist Section */}
        {checklistExpanded && (
           <motion.div
             initial={{ height: 0, opacity: 0 }}
             animate={{ height: 'auto', opacity: 1 }}
             exit={{ height: 0, opacity: 0 }}
             className="bg-gray-900/50 border-t border-gray-700"
           >
              <div className="p-4">
                 <h4 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
                    <CheckSquare size={14} className="text-primary-400" />
                    Tasks & To-Dos
                 </h4>
                 
                 {/* Task List */}
                 <div className="space-y-2 mb-3">
                    {(!hackathon.checklist || hackathon.checklist.length === 0) && (
                       <p className="text-xs text-gray-500 italic text-center py-2">No tasks yet. Add one!</p>
                    )}
                    
                    {hackathon.checklist?.map((task) => (
                       <div key={task.id} className="flex items-center gap-2 group">
                          <button 
                             onClick={() => toggleTask(task.id)}
                             className={`flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-all ${
                                task.completed 
                                   ? 'bg-primary-600 border-primary-600 text-white' 
                                   : 'bg-gray-800 border-gray-600 text-transparent hover:border-gray-500'
                             }`}
                          >
                             <Check size={12} strokeWidth={3} />
                          </button>
                          <span className={`text-sm flex-1 break-words ${task.completed ? 'text-gray-500 line-through' : 'text-gray-300'}`}>
                             {task.text}
                          </span>
                          <button 
                             onClick={() => removeTask(task.id)}
                             className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                          >
                             <X size={14} />
                          </button>
                       </div>
                    ))}
                 </div>

                 {/* Add Task Input */}
                 <form onSubmit={handleAddTask} className="flex gap-2">
                    <input
                       type="text"
                       value={newTask}
                       onChange={(e) => setNewTask(e.target.value)}
                       placeholder="Add a task..."
                       className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-primary-500 placeholder-gray-600"
                    />
                    <button 
                       type="submit"
                       disabled={!newTask.trim()}
                       className="bg-primary-600 hover:bg-primary-500 text-white p-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                       <Plus size={16} />
                    </button>
                 </form>
              </div>
           </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default HackathonCard;
