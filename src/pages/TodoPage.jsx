import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Plus, Trash2, CheckSquare, CalendarDays, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { useTeam } from '../contexts/TeamContext';
import { db } from '../firebase';
import {
  sanitizeObject,
  sanitizeText,
  validateLength,
  isInputSafe,
  addHackathonLimiter,
  updateHackathonLimiter,
  deleteHackathonLimiter
} from '../utils/security';

const priorityStyles = {
  low: 'border-l-gray-500 bg-gray-800/40 text-gray-200',
  medium: 'border-l-amber-500 bg-amber-500/10 text-amber-200',
  high: 'border-l-red-500 bg-red-500/10 text-red-200'
};

const formatDateKey = (dateValue) => {
  const date = new Date(dateValue);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isOverdue = (dueDate, completed) => {
  if (!dueDate || completed) return false;
  const today = formatDateKey(new Date());
  return dueDate < today;
};

const getReadableFirestoreError = (listenerError) => {
  const code = listenerError?.code || '';
  if (code === 'permission-denied') {
    return 'Missing or insufficient permissions for todos. Update Firestore Rules to allow authenticated users to read/write their own todos (and team members for team todos).';
  }
  return listenerError?.message || 'Something went wrong while loading todos.';
};

function TodoPage() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { currentTeam } = useTeam();

  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: formatDateKey(new Date()),
    priority: 'medium'
  });

  useEffect(() => {
    if (!currentUser) {
      setTodos([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const todosRef = collection(db, 'todos');
    const todoQuery = currentTeam
      ? query(todosRef, where('teamId', '==', currentTeam.id))
      : query(todosRef, where('ownerId', '==', currentUser.uid));

    const unsubscribe = onSnapshot(
      todoQuery,
      (snapshot) => {
        try {
          const items = snapshot.docs
            .map((entry) => ({ id: entry.id, ...entry.data() }))
            .filter((item) => {
              if (currentTeam) return item.teamId === currentTeam.id;
              return !item.teamId;
            });

          setTodos(items);
          setLoading(false);
        } catch (processingError) {
          setError(processingError.message);
          setLoading(false);
        }
      },
      (listenerError) => {
        setError(getReadableFirestoreError(listenerError));
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [currentUser, currentTeam]);

  useEffect(() => {
    setFormData((prev) => ({ ...prev, dueDate: formatDateKey(selectedDate) }));
  }, [selectedDate]);

  const selectedDateKey = useMemo(() => formatDateKey(selectedDate), [selectedDate]);

  const todosByDate = useMemo(() => {
    const grouped = new Map();

    todos.forEach((todo) => {
      if (!todo.dueDate) return;
      if (!grouped.has(todo.dueDate)) {
        grouped.set(todo.dueDate, []);
      }
      grouped.get(todo.dueDate).push(todo);
    });

    return grouped;
  }, [todos]);

  const selectedTodos = useMemo(() => {
    const list = todosByDate.get(selectedDateKey) || [];
    return [...list].sort((a, b) => {
      const priorityRank = { high: 3, medium: 2, low: 1 };
      const aRank = priorityRank[a.priority] || 0;
      const bRank = priorityRank[b.priority] || 0;
      if (aRank !== bRank) return bRank - aRank;
      return 0;
    });
  }, [todosByDate, selectedDateKey]);

  const handleAddTodo = async (event) => {
    event.preventDefault();

    if (!addHackathonLimiter.canProceed('todo-add')) {
      alert('Security: Too many requests. Please wait a moment.');
      return;
    }

    const rawTitle = formData.title.trim();
    const rawDescription = formData.description.trim();

    if (!rawTitle) {
      alert('Title is required.');
      return;
    }

    if (!isInputSafe(rawTitle) || (rawDescription && !isInputSafe(rawDescription))) {
      alert('Security: Invalid characters detected.');
      return;
    }

    const safeTitle = sanitizeText(validateLength(rawTitle, 200));
    const safeDescription = sanitizeText(validateLength(rawDescription, 1000));

    const sanitizedPayload = sanitizeObject(
      {
        title: safeTitle,
        description: safeDescription,
        dueDate: formData.dueDate,
        priority: formData.priority,
        completed: false,
        ownerId: currentUser.uid,
        teamId: currentTeam ? currentTeam.id : null,
        type: currentTeam ? 'team' : 'solo'
      },
      ['title', 'description', 'dueDate', 'priority', 'completed', 'ownerId', 'teamId', 'type']
    );

    try {
      await addDoc(collection(db, 'todos'), {
        ...sanitizedPayload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setFormData((prev) => ({
        ...prev,
        title: '',
        description: '',
        dueDate: selectedDateKey,
        priority: 'medium'
      }));
      setIsAddOpen(false);
    } catch (addError) {
      console.error('Error adding todo:', addError);
      alert('Failed to add task. Please try again.');
    }
  };

  const handleToggleCompleted = async (todo) => {
    if (!updateHackathonLimiter.canProceed('todo-update')) {
      alert('Security: Too many update requests. Please wait a moment.');
      return;
    }

    try {
      await updateDoc(doc(db, 'todos', todo.id), {
        completed: !todo.completed,
        updatedAt: serverTimestamp()
      });
    } catch (updateError) {
      console.error('Error updating todo:', updateError);
      alert('Failed to update task status.');
    }
  };

  const handleDeleteTodo = async (todoId) => {
    if (!deleteHackathonLimiter.canProceed('todo-delete')) {
      alert('Security: Too many delete requests. Please wait a moment.');
      return;
    }

    if (!window.confirm('Delete this task?')) return;

    try {
      await deleteDoc(doc(db, 'todos', todoId));
    } catch (deleteError) {
      console.error('Error deleting todo:', deleteError);
      alert('Failed to delete task.');
    }
  };

  const tileContent = ({ date, view }) => {
    if (view !== 'month') return null;

    const dateKey = formatDateKey(date);
    const dayTodos = todosByDate.get(dateKey) || [];

    if (dayTodos.length === 0) return null;

    const hasOverdue = dayTodos.some((todo) => isOverdue(todo.dueDate, todo.completed));

    return (
      <div className="mt-1 flex justify-center">
        <span
          className={`h-1.5 w-1.5 rounded-full ${hasOverdue ? 'bg-red-400' : 'bg-indigo-400'}`}
        />
      </div>
    );
  };

  return (
    <DashboardLayout
      user={currentUser}
      currentTeam={currentTeam}
      onLogout={logout}
      onAddClick={() => navigate('/')}
      onTeamClick={() => navigate('/teams')}
    >
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-heading font-bold text-white flex items-center gap-3">
              <CheckSquare className="text-indigo-400" />
              Todo Command Center
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              {currentTeam ? `Shared team tasks for ${currentTeam.name}` : 'Private solo task planning'}
            </p>
          </div>
        </motion.div>

        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-panel rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-4"
          >
            <div className="mb-4 flex items-center gap-2 text-gray-300 font-semibold">
              <CalendarDays size={18} className="text-indigo-400" />
              Calendar
            </div>
            <Calendar
              value={selectedDate}
              onChange={(value) => setSelectedDate(value)}
              className="react-calendar-dark"
              tileContent={tileContent}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-5 min-h-[420px]"
          >
            <div className="mb-5">
              <h2 className="text-xl font-heading font-bold text-white">
                Tasks for {new Date(selectedDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </h2>
            </div>

            {loading ? (
              <div className="text-gray-400">Loading tasks...</div>
            ) : selectedTodos.length === 0 ? (
              <div className="h-[300px] rounded-2xl border border-dashed border-white/10 bg-white/5 flex items-center justify-center text-center p-6">
                <p className="text-gray-400">No tasks scheduled for this day. Add one below ✦</p>
              </div>
            ) : (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
                }}
                className="space-y-3 pb-20"
              >
                {selectedTodos.map((todo) => (
                  <motion.div
                    key={todo.id}
                    variants={{ hidden: { opacity: 0, x: 20 }, visible: { opacity: 1, x: 0 } }}
                    className={`border border-white/10 border-l-4 rounded-xl p-4 ${priorityStyles[todo.priority] || priorityStyles.medium}`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={!!todo.completed}
                        onChange={() => handleToggleCompleted(todo)}
                        className="mt-1 h-4 w-4 rounded border-gray-500 bg-transparent text-indigo-500 focus:ring-indigo-500"
                      />

                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold ${todo.completed ? 'line-through text-gray-500' : 'text-white'}`}>
                          {todo.title}
                        </p>
                        {todo.description && (
                          <p className={`mt-1 text-sm ${todo.completed ? 'text-gray-600' : 'text-gray-400'}`}>
                            {todo.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-gray-200 capitalize">
                          {todo.priority || 'medium'}
                        </span>
                        <button
                          onClick={() => handleDeleteTodo(todo.id)}
                          className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10"
                          title="Delete task"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setIsAddOpen(true)}
              className="absolute bottom-5 right-5 inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold shadow-lg shadow-indigo-500/30"
            >
              <Plus size={18} />
              Add Task
            </motion.button>

            <AnimatePresence>
              {isAddOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/70 backdrop-blur-sm rounded-2xl flex items-center justify-center p-4"
                >
                  <motion.form
                    initial={{ opacity: 0, y: 15, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.98 }}
                    onSubmit={handleAddTodo}
                    className="w-full max-w-lg rounded-2xl border border-white/10 bg-gray-900/90 p-5 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-heading font-bold text-white">Add New Task</h3>
                      <button
                        type="button"
                        onClick={() => setIsAddOpen(false)}
                        className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div>
                      <label className="text-sm text-gray-300">Title</label>
                      <input
                        value={formData.title}
                        onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))}
                        className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Task title"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-sm text-gray-300">Description (optional)</label>
                      <textarea
                        rows={3}
                        value={formData.description}
                        onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
                        className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Notes"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm text-gray-300">Due Date</label>
                        <input
                          type="date"
                          value={formData.dueDate}
                          onChange={(event) => setFormData((prev) => ({ ...prev, dueDate: event.target.value }))}
                          className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-sm text-gray-300">Priority</label>
                        <select
                          value={formData.priority}
                          onChange={(event) => setFormData((prev) => ({ ...prev, priority: event.target.value }))}
                          className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setIsAddOpen(false)}
                        className="px-4 py-2 rounded-xl border border-white/10 text-gray-300 hover:bg-white/10"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold"
                      >
                        Save Task
                      </button>
                    </div>
                  </motion.form>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default TodoPage;
