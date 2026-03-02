import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  FolderOpen,
  CheckSquare,
  Link,
  Calendar,
  Clipboard,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ActivityFeed from './ActivityFeed';

const typeMeta = {
  Project: { icon: FolderOpen, badge: 'bg-indigo-500/15 text-indigo-200 border-indigo-400/30' },
  Task: { icon: CheckSquare, badge: 'bg-emerald-500/15 text-emerald-200 border-emerald-400/30' },
  Resource: { icon: Link, badge: 'bg-purple-500/15 text-purple-200 border-purple-400/30' },
  Todo: { icon: Calendar, badge: 'bg-indigo-500/15 text-indigo-200 border-indigo-400/30' },
  Snippet: { icon: Clipboard, badge: 'bg-purple-500/15 text-purple-200 border-purple-400/30' }
};

const highlightMatch = (text, query) => {
  const value = String(text || '');
  if (!query) return value;
  const index = value.toLowerCase().indexOf(query.toLowerCase());
  if (index < 0) return value;

  const start = value.slice(0, index);
  const match = value.slice(index, index + query.length);
  const end = value.slice(index + query.length);

  return (
    <>
      {start}
      <span className="bg-indigo-500/30 text-white rounded px-0.5">{match}</span>
      {end}
    </>
  );
};

function GlobalSearch({ hackathons = [], todos = [], snippets = [], activityLogs = [] }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [debouncing, setDebouncing] = useState(false);

  useEffect(() => {
    const handleShortcut = (event) => {
      const isK = event.key.toLowerCase() === 'k';
      if ((event.ctrlKey || event.metaKey) && isK) {
        event.preventDefault();
        setIsOpen(true);
      }
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
    return () => clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    setDebouncing(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(query.trim());
      setDebouncing(false);
      setSelectedIndex(0);
    }, 200);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const resultsByType = useMemo(() => {
    const value = debouncedQuery.toLowerCase();
    if (!value) return { Project: [], Task: [], Resource: [], Todo: [], Snippet: [] };

    const projects = hackathons
      .filter((project) => {
        const stack = `${project.title || ''} ${project.description || ''} ${project.status || ''}`.toLowerCase();
        return stack.includes(value);
      })
      .slice(0, 5)
      .map((project) => ({
        resultType: 'Project',
        id: `project-${project.id}`,
        title: project.title || 'Untitled Project',
        subtitle: `${project.status || 'Unknown'}${project.deadline ? ` · Due ${project.deadline}` : ''}`,
        exact: (project.title || '').toLowerCase() === value,
        onSelect: () => navigate('/', { state: { projectId: project.id, focusType: 'project' } })
      }));

    const tasks = hackathons
      .flatMap((project) => (project.tasks || []).map((task) => ({ project, task })))
      .filter(({ task }) => (task.text || '').toLowerCase().includes(value))
      .slice(0, 5)
      .map(({ project, task }) => ({
        resultType: 'Task',
        id: `task-${project.id}-${task.id}`,
        title: task.text || 'Untitled Task',
        subtitle: `${project.title || 'Unknown Project'} · ${task.done ? 'Completed' : 'Pending'}`,
        exact: (task.text || '').toLowerCase() === value,
        onSelect: () => navigate('/', { state: { projectId: project.id, focusType: 'tasks' } })
      }));

    const resources = hackathons
      .flatMap((project) => (project.resources || []).map((resource) => ({ project, resource })))
      .filter(({ resource }) => {
        const stack = `${resource.label || resource.title || ''} ${resource.url || resource.link || ''} ${resource.type || ''}`.toLowerCase();
        return stack.includes(value);
      })
      .slice(0, 5)
      .map(({ project, resource }, index) => ({
        resultType: 'Resource',
        id: `resource-${project.id}-${resource.id || index}`,
        title: resource.label || resource.title || 'Untitled Resource',
        subtitle: `${project.title || 'Unknown Project'} · ${resource.type || 'Link'}`,
        exact: (resource.label || resource.title || '').toLowerCase() === value,
        onSelect: () => navigate('/resources', { state: { projectId: project.id } })
      }));

    const todoResults = todos
      .filter((todo) => `${todo.title || ''} ${todo.description || ''}`.toLowerCase().includes(value))
      .slice(0, 5)
      .map((todo) => ({
        resultType: 'Todo',
        id: `todo-${todo.id}`,
        title: todo.title || 'Untitled Todo',
        subtitle: `${todo.priority || 'medium'} priority${todo.dueDate ? ` · Due ${todo.dueDate}` : ''}`,
        exact: (todo.title || '').toLowerCase() === value,
        onSelect: () => navigate('/todo', { state: { dueDate: todo.dueDate, todoId: todo.id } })
      }));

    const snippetResults = snippets
      .filter((snippet) => {
        const title = snippet.title || '';
        const content = (snippet.content || '').slice(0, 500);
        return `${title} ${content}`.toLowerCase().includes(value);
      })
      .slice(0, 5)
      .map((snippet) => ({
        resultType: 'Snippet',
        id: `snippet-${snippet.id}`,
        title: snippet.title || 'Untitled Snippet',
        subtitle: `${(snippet.content || '').slice(0, 80)}${(snippet.content || '').length > 80 ? '…' : ''}`,
        exact: (snippet.title || '').toLowerCase() === value,
        onSelect: () => navigate('/snippets', { state: { snippetId: snippet.id } })
      }));

    return {
      Project: projects.sort((a, b) => Number(b.exact) - Number(a.exact)),
      Task: tasks.sort((a, b) => Number(b.exact) - Number(a.exact)),
      Resource: resources.sort((a, b) => Number(b.exact) - Number(a.exact)),
      Todo: todoResults.sort((a, b) => Number(b.exact) - Number(a.exact)),
      Snippet: snippetResults.sort((a, b) => Number(b.exact) - Number(a.exact))
    };
  }, [debouncedQuery, hackathons, todos, snippets, navigate]);

  const flattened = useMemo(() => {
    return ['Project', 'Task', 'Resource', 'Todo', 'Snippet']
      .flatMap((type) => resultsByType[type])
      .slice(0, 20);
  }, [resultsByType]);

  useEffect(() => {
    if (!isOpen) return;

    const handleNav = (event) => {
      if (!flattened.length) return;

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelectedIndex((previous) => (previous + 1) % flattened.length);
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelectedIndex((previous) => (previous - 1 + flattened.length) % flattened.length);
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        const selected = flattened[selectedIndex];
        if (selected?.onSelect) {
          selected.onSelect();
          setIsOpen(false);
        }
      }

      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleNav);
    return () => window.removeEventListener('keydown', handleNav);
  }, [isOpen, flattened, selectedIndex]);

  const groupedSections = ['Project', 'Task', 'Resource', 'Todo', 'Snippet']
    .map((type) => ({ type, items: resultsByType[type] }))
    .filter((entry) => entry.items.length > 0);

  const recentLogs = useMemo(() => {
    return [...activityLogs].slice(0, 5);
  }, [activityLogs]);

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={() => setIsOpen(true)}
        className="fixed right-16 md:right-6 top-[calc(env(safe-area-inset-top)+8px)] md:top-5 z-50 h-10 w-10 rounded-xl border border-white/10 bg-black/40 backdrop-blur-xl text-white/70 hover:text-white"
        aria-label="Open global search"
      >
        <Search size={18} className="mx-auto" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />

            <div className="fixed inset-0 z-[130] p-4 flex items-start md:items-center justify-center pt-[calc(env(safe-area-inset-top)+56px)] md:pt-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ type: 'spring', damping: 24, stiffness: 280 }}
                className="w-full max-w-2xl rounded-2xl border border-white/10 bg-gray-900/90 backdrop-blur-2xl shadow-2xl overflow-hidden"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3">
                  <Search size={18} className="text-indigo-300" />
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search projects, tasks, todos, snippets, resources..."
                    className="flex-1 bg-transparent text-lg text-white placeholder:text-gray-500 focus:outline-none"
                  />
                  <span className="px-2 py-1 rounded-md border border-white/10 text-[10px] text-gray-400">ESC</span>
                  <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
                    <X size={16} />
                  </button>
                </div>

                <div className="max-h-[70vh] overflow-y-auto p-3 space-y-4">
                  {!debouncedQuery && (
                    <div className="space-y-3">
                      <p className="text-xs text-gray-400 px-1">Start typing to search across all your content...</p>
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-white/40 mb-2 px-1">Recent Activity</p>
                        <ActivityFeed logs={recentLogs} showProject emptyMessage="No recent activity yet." />
                      </div>
                    </div>
                  )}

                  {!!debouncedQuery && debouncing && (
                    <div className="space-y-2">
                      {[1, 2, 3].map((entry) => (
                        <div key={entry} className="h-14 rounded-xl border border-white/10 bg-white/5 overflow-hidden relative">
                          <div className="absolute inset-0 shimmer" />
                        </div>
                      ))}
                    </div>
                  )}

                  {!!debouncedQuery && !debouncing && groupedSections.length === 0 && (
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-8 text-center">
                      <Search size={24} className="mx-auto text-gray-500 mb-2" />
                      <p className="text-sm text-gray-300">No results for "{debouncedQuery}"</p>
                      <p className="text-xs text-gray-500 mt-1">Try searching for a project title or task name</p>
                    </div>
                  )}

                  {!!debouncedQuery && !debouncing && groupedSections.map((section) => (
                    <div key={section.type} className="space-y-2">
                      <p className="text-[11px] uppercase tracking-wider text-white/40 px-1">
                        {section.type}s ({section.items.length})
                      </p>
                      {section.items.map((item) => {
                        const globalIndex = flattened.findIndex((entry) => entry.id === item.id);
                        const isSelected = globalIndex === selectedIndex;
                        const meta = typeMeta[item.resultType];
                        const Icon = meta.icon;

                        return (
                          <motion.button
                            whileTap={{ scale: 0.98 }}
                            key={item.id}
                            onClick={() => {
                              item.onSelect();
                              setIsOpen(false);
                            }}
                            className={`w-full text-left rounded-xl border p-3 transition-colors ${isSelected
                              ? 'border-indigo-400/40 bg-indigo-500/10'
                              : 'border-white/10 bg-black/20 hover:bg-white/5'
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-indigo-300">
                                <Icon size={16} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white truncate">{highlightMatch(item.title, debouncedQuery)}</p>
                                <p className="text-xs text-gray-400 truncate">{item.subtitle}</p>
                              </div>
                              <span className={`text-[10px] px-2 py-1 rounded-full border ${meta.badge}`}>{item.resultType}</span>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default GlobalSearch;
