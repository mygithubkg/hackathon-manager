import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  Pin,
  Trash2,
  Pencil,
  Copy,
  Check,
  X,
  Loader2,
  Code2,
  ChevronDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  collection,
  query,
  where,
  orderBy,
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
import { sanitizeText, RateLimiter } from '../utils/security';
import { getRelativeTime } from '../utils/relativeTime';
import { logActivity } from '../utils/logActivity';

const addSnippetLimiter = new RateLimiter(8, 60000);
const updateSnippetLimiter = new RateLimiter(20, 60000);
const deleteSnippetLimiter = new RateLimiter(6, 60000);

const languageOptions = [
  { value: 'plaintext', label: 'Plain Text', dot: 'bg-gray-400', badge: 'bg-gray-500/10 text-gray-200 border-gray-400/30' },
  { value: 'javascript', label: 'JavaScript', dot: 'bg-amber-400', badge: 'bg-amber-500/10 text-amber-200 border-amber-400/30' },
  { value: 'typescript', label: 'TypeScript', dot: 'bg-blue-400', badge: 'bg-blue-500/10 text-blue-200 border-blue-400/30' },
  { value: 'python', label: 'Python', dot: 'bg-blue-500', badge: 'bg-blue-500/10 text-blue-200 border-blue-500/30' },
  { value: 'json', label: 'JSON', dot: 'bg-emerald-400', badge: 'bg-emerald-500/10 text-emerald-200 border-emerald-400/30' },
  { value: 'html', label: 'HTML', dot: 'bg-orange-400', badge: 'bg-orange-500/10 text-orange-200 border-orange-400/30' },
  { value: 'css', label: 'CSS', dot: 'bg-pink-400', badge: 'bg-pink-500/10 text-pink-200 border-pink-400/30' },
  { value: 'bash', label: 'Bash', dot: 'bg-gray-500', badge: 'bg-gray-500/10 text-gray-300 border-gray-400/30' },
  { value: 'sql', label: 'SQL', dot: 'bg-violet-400', badge: 'bg-violet-500/10 text-violet-200 border-violet-400/30' },
  { value: 'other', label: 'Other', dot: 'bg-indigo-400', badge: 'bg-indigo-500/10 text-indigo-200 border-indigo-400/30' }
];

const getLanguageMeta = (language) => {
  const found = languageOptions.find((entry) => entry.value === String(language || '').toLowerCase());
  return found || languageOptions[0];
};

const toDate = (value) => {
  if (!value) return null;
  if (typeof value?.toDate === 'function') return value.toDate();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const hasEditedLabel = (createdAt, updatedAt) => {
  const createdDate = toDate(createdAt);
  const updatedDate = toDate(updatedAt);
  if (!createdDate || !updatedDate) return false;
  return updatedDate.getTime() - createdDate.getTime() > 60000;
};

const getInitials = (name) => {
  const value = String(name || '').trim();
  if (!value) return 'U';
  const parts = value.split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || 'U';
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
};

const getReadableFirestoreError = (listenerError) => {
  const code = listenerError?.code || '';
  if (code === 'permission-denied') {
    return 'Missing or insufficient permissions for snippets. Update Firestore Rules for authenticated solo/team snippet reads and writes.';
  }
  return listenerError?.message || 'Something went wrong while loading snippets.';
};

const SnippetModal = ({
  isOpen,
  onClose,
  onSubmit,
  loading,
  error,
  formData,
  setFormData,
  isEditing
}) => {
  const [languageOpen, setLanguageOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setLanguageOpen(false);
    }
  }, [isOpen]);

  const languageMeta = getLanguageMeta(formData.language);
  const charCount = formData.content.length;
  const charCountClass = charCount >= 9500 ? 'text-red-400' : charCount >= 8000 ? 'text-amber-400' : 'text-gray-500';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <div className="fixed inset-0 z-[80] flex items-end md:items-center justify-center p-0 md:p-4">
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 60 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-2xl rounded-t-3xl md:rounded-2xl border border-white/15 bg-gray-900/90 backdrop-blur-2xl shadow-2xl shadow-indigo-500/10 p-4 md:p-5 max-h-[85vh] overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+16px)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="md:hidden mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/20" />

              <div className="flex items-center justify-between gap-3 mb-4">
                <h3 className="text-base md:text-xl font-heading font-bold text-white">
                  {isEditing ? 'Edit Snippet' : 'New Snippet'}
                </h3>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={onClose}
                  className="min-h-[44px] min-w-[44px] p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Close snippet modal"
                >
                  <X size={18} />
                </motion.button>
              </div>

              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] md:text-xs uppercase tracking-wider text-gray-400 mb-2">Title</label>
                  <input
                    type="text"
                    maxLength={100}
                    value={formData.title}
                    onChange={(event) => setFormData((previous) => ({ ...previous, title: event.target.value }))}
                    placeholder="Give this snippet a name... (optional)"
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>

                <div className="relative">
                  <label className="block text-[11px] md:text-xs uppercase tracking-wider text-gray-400 mb-2">Language</label>
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    type="button"
                    onClick={() => setLanguageOpen((previous) => !previous)}
                    className="w-full min-h-[44px] rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white flex items-center justify-between gap-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  >
                    <span className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${languageMeta.dot}`} />
                      {languageMeta.label}
                    </span>
                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${languageOpen ? 'rotate-180' : ''}`} />
                  </motion.button>

                  <AnimatePresence>
                    {languageOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="absolute mt-2 z-20 w-full rounded-xl border border-white/10 bg-gray-950/95 backdrop-blur-xl shadow-2xl overflow-hidden"
                      >
                        {languageOptions.map((option) => (
                          <motion.button
                            whileTap={{ scale: 0.96 }}
                            key={option.value}
                            type="button"
                            onClick={() => {
                              setFormData((previous) => ({ ...previous, language: option.value }));
                              setLanguageOpen(false);
                            }}
                            className="w-full min-h-[44px] px-4 py-2.5 text-left text-sm text-gray-200 hover:bg-white/5 flex items-center gap-2"
                          >
                            <span className={`h-2.5 w-2.5 rounded-full ${option.dot}`} />
                            <span>{option.label}</span>
                          </motion.button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="relative">
                  <label className="block text-[11px] md:text-xs uppercase tracking-wider text-gray-400 mb-2">Content</label>
                  <textarea
                    value={formData.content}
                    onChange={(event) => setFormData((previous) => ({ ...previous, content: event.target.value.slice(0, 10000) }))}
                    placeholder="Paste or type your text here..."
                    className="w-full min-h-[180px] resize-y rounded-xl border border-white/10 bg-black/45 px-4 py-3 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 font-mono"
                  />
                  <div className={`absolute bottom-3 right-3 text-xs ${charCountClass}`}>
                    {charCount}/10000
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                    {error}
                  </div>
                )}

                <motion.button
                  whileTap={{ scale: 0.96 }}
                  type="submit"
                  disabled={loading || !formData.content.trim()}
                  className="w-full min-h-[44px] rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-2.5 text-white font-semibold hover:from-indigo-500 hover:to-purple-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : null}
                  {loading ? 'Saving...' : 'Save Snippet'}
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  onClick={onClose}
                  className="w-full min-h-[44px] text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </motion.button>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

function SnippetsPage() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { currentTeam } = useTeam();

  const [snippets, setSnippets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [successToast, setSuccessToast] = useState('');
  const [editingSnippet, setEditingSnippet] = useState(null);

  const [copiedSnippetId, setCopiedSnippetId] = useState('');
  const [flashSnippetId, setFlashSnippetId] = useState('');
  const [expandedSnippets, setExpandedSnippets] = useState({});
  const [deleteSheetSnippet, setDeleteSheetSnippet] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    language: 'plaintext',
    content: ''
  });

  useEffect(() => {
    if (!currentUser) {
      setSnippets([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const snippetsRef = collection(db, 'snippets');
    const snippetsQuery = currentTeam
      ? query(
        snippetsRef,
        where('teamId', '==', currentTeam.id),
        orderBy('pinned', 'desc'),
        orderBy('createdAt', 'desc')
      )
      : query(
        snippetsRef,
        where('ownerId', '==', currentUser.uid),
        orderBy('pinned', 'desc'),
        orderBy('createdAt', 'desc')
      );

    const unsubscribe = onSnapshot(
      snippetsQuery,
      (snapshot) => {
        try {
          const items = snapshot.docs
            .map((entry) => ({ id: entry.id, ...entry.data() }))
            .filter((item) => {
              if (currentTeam) return item.teamId === currentTeam.id;
              return !item.teamId;
            });

          setSnippets(items);
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
    if (!successToast) return undefined;
    const timer = setTimeout(() => setSuccessToast(''), 3000);
    return () => clearTimeout(timer);
  }, [successToast]);

  useEffect(() => {
    if (!copiedSnippetId) return undefined;
    const timer = setTimeout(() => setCopiedSnippetId(''), 2000);
    return () => clearTimeout(timer);
  }, [copiedSnippetId]);

  useEffect(() => {
    if (!flashSnippetId) return undefined;
    const timer = setTimeout(() => setFlashSnippetId(''), 1000);
    return () => clearTimeout(timer);
  }, [flashSnippetId]);

  const filteredSnippets = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return snippets;

    return snippets.filter((snippet) => {
      const haystack = `${snippet.title || ''} ${snippet.content || ''}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [snippets, searchTerm]);

  const resetModalForm = () => {
    setFormData({ title: '', language: 'plaintext', content: '' });
    setEditingSnippet(null);
    setSubmitError('');
    setIsSubmitting(false);
  };

  const openCreateModal = () => {
    setSubmitError('');
    setEditingSnippet(null);
    setFormData({ title: '', language: 'plaintext', content: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (snippet) => {
    setSubmitError('');
    setEditingSnippet(snippet);
    setFormData({ title: snippet.title || '', language: snippet.language || 'plaintext', content: snippet.content || '' });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetModalForm();
  };

  const handleSubmitSnippet = async (event) => {
    event.preventDefault();

    if (!currentUser) {
      setSubmitError('You must be logged in to save snippets.');
      return;
    }

    const trimmedContent = formData.content.trim();
    const trimmedTitle = formData.title.trim();

    if (!trimmedContent) {
      setSubmitError('Content is required.');
      return;
    }

    const safeTitle = sanitizeText(trimmedTitle).slice(0, 100);
    const safeContent = sanitizeText(trimmedContent).slice(0, 10000);

    if (!safeContent.trim()) {
      setSubmitError('Content is required.');
      return;
    }

    const actionKey = editingSnippet ? 'snippet-update' : 'snippet-add';
    const limiter = editingSnippet ? updateSnippetLimiter : addSnippetLimiter;
    if (!limiter.canProceed(actionKey)) {
      setSubmitError('Too many requests. Please wait and try again.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      if (editingSnippet) {
        await updateDoc(doc(db, 'snippets', editingSnippet.id), {
          ownerId: currentUser.uid,
          title: safeTitle,
          content: safeContent,
          language: formData.language || 'plaintext',
          updatedAt: serverTimestamp()
        });

        await logActivity({
          currentUser,
          currentTeam,
          type: 'snippet_edited',
          entityId: editingSnippet.id,
          entityTitle: safeTitle || 'Untitled Snippet',
          meta: { language: formData.language || 'plaintext' }
        });

        setSuccessToast('Snippet updated! ✓');
      } else {
        const snippetRef = await addDoc(collection(db, 'snippets'), {
          ownerId: currentUser.uid,
          ownerName: currentUser.displayName || currentUser.email || 'Unknown User',
          ownerPhoto: currentUser.photoURL || null,
          teamId: currentTeam ? currentTeam.id : null,
          type: currentTeam ? 'team' : 'solo',
          title: safeTitle,
          content: safeContent,
          language: formData.language || 'plaintext',
          pinned: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        await logActivity({
          currentUser,
          currentTeam,
          type: 'snippet_created',
          entityId: snippetRef.id,
          entityTitle: safeTitle || 'Untitled Snippet',
          meta: { language: formData.language || 'plaintext' }
        });

        setSuccessToast('Snippet saved! ✓');
      }

      setIsModalOpen(false);
      resetModalForm();
    } catch (submitFirestoreError) {
      console.error('Failed to save snippet:', submitFirestoreError);
      setSubmitError('Failed to save snippet. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleTogglePinned = async (snippet) => {
    if (!currentUser || snippet.ownerId !== currentUser.uid) return;

    sanitizeText(snippet.title || '');
    sanitizeText(snippet.content || '');

    if (!updateSnippetLimiter.canProceed('snippet-pin-toggle')) {
      setError('Too many update requests. Please wait a moment.');
      return;
    }

    try {
      await updateDoc(doc(db, 'snippets', snippet.id), {
        ownerId: currentUser.uid,
        pinned: !snippet.pinned,
        updatedAt: serverTimestamp()
      });
    } catch (updateError) {
      console.error('Failed to toggle pin:', updateError);
      setError('Failed to update snippet pin state.');
    }
  };

  const handleDeleteSnippet = async (snippet) => {
    if (!currentUser || snippet.ownerId !== currentUser.uid) return;

    sanitizeText(snippet.title || '');
    sanitizeText(snippet.content || '');

    if (!deleteSnippetLimiter.canProceed('snippet-delete')) {
      setError('Too many delete requests. Please wait a moment.');
      return;
    }

    try {
      await deleteDoc(doc(db, 'snippets', snippet.id));

      await logActivity({
        currentUser,
        currentTeam,
        type: 'snippet_deleted',
        entityId: snippet.id,
        entityTitle: snippet.title || 'Untitled Snippet',
        meta: { language: snippet.language || 'plaintext' }
      });

      setDeleteSheetSnippet(null);
      setSuccessToast('Snippet deleted.');
    } catch (deleteError) {
      console.error('Failed to delete snippet:', deleteError);
      setError('Failed to delete snippet.');
    }
  };

  const handleCopy = async (snippet) => {
    try {
      await navigator.clipboard.writeText(snippet.content || '');
      setCopiedSnippetId(snippet.id);
      setFlashSnippetId(snippet.id);
    } catch (clipboardError) {
      console.error('Clipboard write failed:', clipboardError);
      setError('Clipboard permission denied.');
    }
  };

  const toggleExpanded = (snippetId) => {
    setExpandedSnippets((previous) => ({ ...previous, [snippetId]: !previous[snippetId] }));
  };

  const renderContentBlock = (snippet) => {
    const fullContent = snippet.content || '';
    const lines = fullContent.split('\n');
    const isLong = lines.length > 3;
    const expanded = !!expandedSnippets[snippet.id];
    const preview = isLong && !expanded ? `${lines.slice(0, 3).join('\n')}\n…` : fullContent;

    return (
      <>
        <motion.pre
          layout
          className="rounded-lg border border-white/10 bg-black/55 p-3 text-[11px] md:text-xs text-gray-200 font-mono whitespace-pre-wrap break-words overflow-hidden"
        >
          {preview}
        </motion.pre>

        {isLong && (
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => toggleExpanded(snippet.id)}
            className="mt-2 min-h-[44px] text-xs text-indigo-300 hover:text-indigo-200"
          >
            {expanded ? 'Show less' : 'Show more'}
          </motion.button>
        )}
      </>
    );
  };

  return (
    <DashboardLayout
      user={currentUser}
      currentTeam={currentTeam}
      onLogout={logout}
      onAddClick={openCreateModal}
      onTeamClick={() => navigate('/teams')}
    >
      <div className="space-y-5 md:space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3 md:gap-4"
        >
          <div>
            <h1 className="text-xl md:text-3xl font-heading font-bold text-white tracking-tight">Snippets</h1>
            <div className="mt-2">
              {currentTeam ? (
                <span className="inline-flex items-center rounded-full border border-indigo-400/30 bg-indigo-500/15 px-3 py-1 text-[11px] md:text-xs text-indigo-200">
                  Team: {currentTeam.name}
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] md:text-xs text-gray-300">
                  Solo Workspace
                </span>
              )}
            </div>
          </div>

          <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-2 md:gap-3">
            <div className="relative w-full sm:w-[320px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search snippets"
                className="w-full rounded-xl border border-white/10 bg-black/30 py-2.5 pl-9 pr-3 text-xs md:text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
            </div>

            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={openCreateModal}
              className="min-h-[44px] rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-white text-xs md:text-sm font-semibold hover:from-indigo-500 hover:to-purple-500 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              New Snippet
            </motion.button>
          </div>
        </motion.div>

        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 md:p-4 text-red-300 text-xs md:text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-[110px] rounded-2xl border border-white/10 bg-white/5 overflow-hidden relative">
                <div className="absolute inset-0 shimmer" />
              </div>
            ))}
          </div>
        ) : filteredSnippets.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-10 text-center">
            {snippets.length === 0 ? (
              <>
                <div className="text-6xl mb-3">📋</div>
                <p className="text-gray-300 text-xs md:text-sm">
                  {currentTeam
                    ? 'No snippets yet. Be the first to share something with your team! ✦'
                    : 'Nothing saved yet. Paste something you want to keep handy. ✦'}
                </p>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={openCreateModal}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-xs md:text-sm font-semibold text-white hover:from-indigo-500 hover:to-purple-500"
                >
                  <Plus size={15} />
                  New Snippet
                </motion.button>
              </>
            ) : (
              <p className="text-gray-400 text-xs md:text-sm">No snippets match your search.</p>
            )}
          </div>
        ) : (
          <motion.div
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 } } }}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 xl:grid-cols-2 gap-2 md:gap-4"
          >
            {filteredSnippets.map((snippet) => {
              const isOwner = snippet.ownerId === currentUser?.uid;
              const languageMeta = getLanguageMeta(snippet.language);
              const copied = copiedSnippetId === snippet.id;

              return (
                <motion.article
                  key={snippet.id}
                  variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }}
                  className={`rounded-2xl border backdrop-blur-xl p-3 md:p-4 transition-all ${flashSnippetId === snippet.id
                    ? 'bg-emerald-500/10 border-emerald-400/40 shadow-[0_0_24px_rgba(16,185,129,0.28)]'
                    : 'bg-black/30'
                    } ${snippet.pinned
                      ? 'border-indigo-400/40 shadow-[0_0_25px_rgba(99,102,241,0.18)]'
                      : 'border-white/10'
                    }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-sm md:text-base text-white font-semibold truncate">
                        {(snippet.title || '').trim() || 'Untitled Snippet'}
                      </h3>
                      <span className={`mt-2 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${languageMeta.badge}`}>
                        <Code2 size={12} className="mr-1" />
                        {languageMeta.label}
                      </span>
                    </div>

                    {isOwner && (
                      <div className="flex items-center gap-1">
                        <motion.button
                          whileTap={{ scale: 0.96 }}
                          onClick={() => handleTogglePinned(snippet)}
                          className={`min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 p-2 rounded-lg transition-colors ${snippet.pinned
                            ? 'text-indigo-300 bg-indigo-500/20 hover:bg-indigo-500/30'
                            : 'text-gray-500 hover:text-indigo-300 hover:bg-white/5'
                            }`}
                          aria-label={snippet.pinned ? 'Unpin snippet' : 'Pin snippet'}
                        >
                          <Pin size={15} className={snippet.pinned ? 'fill-current' : ''} />
                        </motion.button>

                        <motion.button
                          whileTap={{ scale: 0.96 }}
                          onClick={() => openEditModal(snippet)}
                          className="min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 p-2 rounded-lg text-gray-500 hover:text-gray-200 hover:bg-white/5 transition-colors"
                          aria-label="Edit snippet"
                        >
                          <Pencil size={15} />
                        </motion.button>

                        <motion.button
                          whileTap={{ scale: 0.96 }}
                          onClick={() => setDeleteSheetSnippet(snippet)}
                          className="min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 p-2 rounded-lg text-gray-500 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                          aria-label="Delete snippet"
                        >
                          <Trash2 size={15} />
                        </motion.button>
                      </div>
                    )}
                  </div>

                  <div className="mt-3">{renderContentBlock(snippet)}</div>

                  <div className="mt-4 pt-3 border-t border-white/10 flex items-end justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      {snippet.ownerPhoto ? (
                        <img src={snippet.ownerPhoto} alt={snippet.ownerName || 'User'} className="w-8 h-8 rounded-full border border-white/15" />
                      ) : (
                        <div className="w-8 h-8 rounded-full border border-white/15 bg-white/10 flex items-center justify-center text-xs font-semibold text-gray-200">
                          {getInitials(snippet.ownerName || snippet.ownerId)}
                        </div>
                      )}

                      <div className="min-w-0">
                        <p className="text-[11px] md:text-xs text-gray-300 truncate">{snippet.ownerName || 'Unknown User'}</p>
                        <div className="flex items-center gap-2 text-[10px] md:text-[11px] text-gray-500">
                          <span>{getRelativeTime(snippet.createdAt)}</span>
                          {hasEditedLabel(snippet.createdAt, snippet.updatedAt) ? <span>edited</span> : null}
                        </div>
                      </div>
                    </div>

                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={() => handleCopy(snippet)}
                      className={`min-h-[44px] rounded-lg border px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-all ${copied
                        ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300'
                        : 'border-indigo-400/30 bg-indigo-500/10 text-indigo-200 hover:bg-indigo-500/20'
                        }`}
                    >
                      <AnimatePresence mode="wait" initial={false}>
                        {copied ? (
                          <motion.span
                            key="copied"
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            className="inline-flex items-center gap-1.5"
                          >
                            <Check size={14} />
                            Copied!
                          </motion.span>
                        ) : (
                          <motion.span
                            key="copy"
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            className="inline-flex items-center gap-1.5"
                          >
                            <Copy size={14} />
                            Copy
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  </div>
                </motion.article>
              );
            })}
          </motion.div>
        )}
      </div>

      <SnippetModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handleSubmitSnippet}
        loading={isSubmitting}
        error={submitError}
        formData={formData}
        setFormData={setFormData}
        isEditing={!!editingSnippet}
      />

      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-24 md:bottom-8 right-4 z-[90] rounded-xl border border-emerald-400/30 bg-emerald-500/15 backdrop-blur-xl px-4 py-2 text-sm text-emerald-200"
          >
            {successToast}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!!deleteSheetSnippet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[95] bg-black/70 backdrop-blur-sm"
              onClick={() => setDeleteSheetSnippet(null)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              className="fixed inset-x-0 bottom-0 z-[100] rounded-t-3xl border border-white/10 bg-gray-900/95 p-4 pb-[calc(env(safe-area-inset-bottom)+16px)]"
            >
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/20" />
              <p className="text-sm font-semibold text-white">Delete this snippet?</p>
              <p className="mt-1 text-xs text-white/50">This action cannot be undone.</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setDeleteSheetSnippet(null)}
                  className="min-h-[44px] rounded-xl border border-white/10 bg-white/5 text-white/80 text-sm"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleDeleteSnippet(deleteSheetSnippet)}
                  className="min-h-[44px] rounded-xl bg-red-600/90 text-white text-sm font-semibold"
                >
                  Delete
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}

export default SnippetsPage;
