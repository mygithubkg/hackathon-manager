import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckSquare,
  X,
  FolderPlus,
  Edit,
  Trash2,
  Link,
  CheckCircle,
  Calendar,
  Clipboard
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getRelativeTime } from '../utils/relativeTime';

const actionMap = {
  task_added: { icon: CheckSquare, color: 'text-emerald-300', bg: 'bg-emerald-500/15' },
  task_completed: { icon: CheckSquare, color: 'text-emerald-300', bg: 'bg-emerald-500/15' },
  task_uncompleted: { icon: X, color: 'text-red-300', bg: 'bg-red-500/15' },
  task_deleted: { icon: X, color: 'text-red-300', bg: 'bg-red-500/15' },
  project_created: { icon: FolderPlus, color: 'text-indigo-300', bg: 'bg-indigo-500/15' },
  project_updated: { icon: Edit, color: 'text-amber-300', bg: 'bg-amber-500/15' },
  project_status_changed: { icon: Edit, color: 'text-amber-300', bg: 'bg-amber-500/15' },
  project_deleted: { icon: Trash2, color: 'text-red-300', bg: 'bg-red-500/15' },
  resource_added: { icon: Link, color: 'text-purple-300', bg: 'bg-purple-500/15' },
  resource_deleted: { icon: Trash2, color: 'text-red-300', bg: 'bg-red-500/15' },
  checklist_item_checked: { icon: CheckCircle, color: 'text-emerald-300', bg: 'bg-emerald-500/15' },
  checklist_item_unchecked: { icon: CheckCircle, color: 'text-red-300', bg: 'bg-red-500/15' },
  todo_created: { icon: Calendar, color: 'text-indigo-300', bg: 'bg-indigo-500/15' },
  todo_completed: { icon: Calendar, color: 'text-indigo-300', bg: 'bg-indigo-500/15' },
  todo_deleted: { icon: Trash2, color: 'text-red-300', bg: 'bg-red-500/15' },
  snippet_created: { icon: Clipboard, color: 'text-purple-300', bg: 'bg-purple-500/15' },
  snippet_edited: { icon: Clipboard, color: 'text-purple-300', bg: 'bg-purple-500/15' },
  snippet_deleted: { icon: Trash2, color: 'text-red-300', bg: 'bg-red-500/15' }
};

export const getActivityDescription = (log) => {
  switch (log.type) {
    case 'project_created':
      return `created project "${log.projectTitle || 'Untitled'}"`;
    case 'project_updated':
      return `updated project "${log.projectTitle || 'Untitled'}"`;
    case 'project_deleted':
      return `deleted project "${log.projectTitle || 'Untitled'}"`;
    case 'project_status_changed':
      return `changed "${log.projectTitle || 'Untitled'}" status from ${log.meta?.from || 'Unknown'} to ${log.meta?.to || 'Unknown'}`;
    case 'task_added':
      return `added task "${log.entityTitle || 'Untitled Task'}" to ${log.projectTitle || 'project'}`;
    case 'task_completed':
      return `completed "${log.entityTitle || 'Untitled Task'}" in ${log.projectTitle || 'project'}`;
    case 'task_uncompleted':
      return `reopened "${log.entityTitle || 'Untitled Task'}" in ${log.projectTitle || 'project'}`;
    case 'task_deleted':
      return `deleted task "${log.entityTitle || 'Untitled Task'}" from ${log.projectTitle || 'project'}`;
    case 'resource_added':
      return `added resource "${log.entityTitle || 'Untitled Resource'}" to ${log.projectTitle || 'project'}`;
    case 'resource_deleted':
      return `removed resource "${log.entityTitle || 'Untitled Resource'}" from ${log.projectTitle || 'project'}`;
    case 'todo_created':
      return `created todo "${log.entityTitle || 'Untitled Todo'}"`;
    case 'todo_completed':
      return `completed todo "${log.entityTitle || 'Untitled Todo'}"`;
    case 'snippet_created':
      return `saved a new snippet "${log.entityTitle || 'Untitled Snippet'}"`;
    case 'snippet_edited':
      return `edited snippet "${log.entityTitle || 'Untitled Snippet'}"`;
    case 'snippet_deleted':
      return `deleted snippet "${log.entityTitle || 'Untitled Snippet'}"`;
    case 'checklist_item_checked':
      return `checked "${log.entityTitle || 'Checklist item'}" in ${log.projectTitle || 'project'}`;
    case 'checklist_item_unchecked':
      return `unchecked "${log.entityTitle || 'Checklist item'}" in ${log.projectTitle || 'project'}`;
    default:
      return 'did something';
  }
};

const getInitials = (name) => {
  const value = String(name || '').trim();
  if (!value) return 'U';
  const parts = value.split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || 'U';
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
};

function ActivityFeed({ logs, showProject = false, emptyMessage = 'No activity yet for this project.' }) {
  const { currentUser } = useAuth();

  const sortedLogs = useMemo(() => {
    return [...(logs || [])].sort((first, second) => {
      const firstTime = first?.createdAt?.toDate?.()?.getTime?.() || new Date(first?.createdAt || 0).getTime() || 0;
      const secondTime = second?.createdAt?.toDate?.()?.getTime?.() || new Date(second?.createdAt || 0).getTime() || 0;
      return secondTime - firstTime;
    });
  }, [logs]);

  if (!sortedLogs.length) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-center text-xs text-gray-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.06 } }
      }}
      initial="hidden"
      animate="visible"
      className="space-y-2"
    >
      <AnimatePresence initial={false}>
        {sortedLogs.map((log) => {
          const meta = actionMap[log.type] || { icon: Clipboard, color: 'text-indigo-300', bg: 'bg-indigo-500/15' };
          const Icon = meta.icon;
          const isMe = log.ownerId === currentUser?.uid;

          return (
            <motion.div
              key={log.id}
              layout
              initial={{ opacity: 0, y: -10, backgroundColor: 'rgba(99,102,241,0.20)' }}
              animate={{ opacity: 1, y: 0, backgroundColor: 'rgba(0,0,0,0.20)' }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28 }}
              className="rounded-2xl border border-white/10 bg-black/20 p-3"
            >
              <div className="flex items-start gap-3">
                <div className="relative">
                  {log.ownerPhoto ? (
                    <img src={log.ownerPhoto} alt={log.ownerName || 'User'} className="w-8 h-8 rounded-full border border-white/15" />
                  ) : (
                    <div className="w-8 h-8 rounded-full border border-white/15 bg-white/10 flex items-center justify-center text-[11px] font-semibold text-gray-200">
                      {getInitials(log.ownerName || 'User')}
                    </div>
                  )}
                  <div className={`absolute -right-1 -bottom-1 w-4 h-4 rounded-full border border-black/40 ${meta.bg} ${meta.color} flex items-center justify-center`}>
                    <Icon size={10} />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white/90 leading-relaxed">
                    <span className="font-semibold">{isMe ? 'You' : (log.ownerName || 'Someone')}</span>{' '}
                    {getActivityDescription(log)}
                  </p>
                  <p className="mt-1 text-[11px] text-white/50 truncate">
                    {getRelativeTime(log.createdAt)}
                    {showProject && log.projectTitle ? ` · ${log.projectTitle}` : ''}
                  </p>
                </div>

                <div className={`mt-0.5 ${meta.color}`}>
                  <Icon size={14} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
}

export default ActivityFeed;
